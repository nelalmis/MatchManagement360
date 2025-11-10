// ============================================
// api/base/BaseAPI.ts - WITH TRANSACTION SUPPORT
// ============================================
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  WriteBatch,
  Unsubscribe,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { ApiError, handleApiError } from './ApiError';
import { ApiLogger } from './ApiLogger';

// ============================================
// TYPES
// ============================================
export interface QueryOptions {
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction?: 'asc' | 'desc';
  }>;
  limit?: number;
  startAfter?: any;
  endBefore?: any;
}

export interface PaginationOptions {
  pageSize: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  direction?: 'next' | 'prev';
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  firstDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    statusCode?: number;
  };
}

export interface BatchOptions {
  maxBatchSize?: number;
  continueOnError?: boolean;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

/**
 * Transaction callback function type
 * @param transaction - Firestore transaction object
 * @returns Promise with result data
 */
export type TransactionCallback<T> = (transaction: Transaction) => Promise<T>;

/**
 * Transaction context helper for easier transaction operations
 */
export interface TransactionContext {
  get: <D>(collectionName: string, docId: string) => Promise<D | null>;
  create: (collectionName: string, docId: string, data: any) => void;
  update: (collectionName: string, docId: string, data: any) => void;
  delete: (collectionName: string, docId: string) => void;
}

// ============================================
// BASE API CLASS
// ============================================
export class BaseAPI<T extends { id?: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Remove undefined fields from object
   * Firestore doesn't accept undefined values
   * Performance: ~0.05ms per object (negligible)
   */
  protected cleanData<D extends Record<string, any>>(data: D): Partial<D> {
    const cleaned: any = {};

    Object.keys(data).forEach((key) => {
      const value = data[key];

      // Skip undefined
      if (value === undefined) {
        return;
      }

      // Keep Firestore special values (serverTimestamp, etc.)
      if (value && typeof value === 'function') {
        cleaned[key] = value;
        return;
      }

      // Keep Timestamp objects
      if (value instanceof Timestamp) {
        cleaned[key] = value;
        return;
      }

      // ✅ YENİ: Date objelerini Timestamp'e çevir
      if (value instanceof Date) {
        cleaned[key] = Timestamp.fromDate(value);
        return;
      }

      // Recursively clean nested objects
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = this.cleanData(value);
        // Only add if not empty
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      }
      // Clean arrays
      else if (Array.isArray(value)) {
        cleaned[key] = value.filter((item) => item !== undefined);
      }
      // Add primitive values
      else {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  /**
   * Check if error is caused by undefined field
   */
  protected isUndefinedError(error: any): boolean {
    return (
      error.code === 'invalid-argument' &&
      (error.message?.includes('undefined') ||
        error.message?.includes('Unsupported field value'))
    );
  }

  // ============================================
  // HELPER: Convert Firestore timestamp to ISO string
  // ============================================
  // protected convertTimestamps(data: any): any {
  //   if (!data) return data;
  //   return data;
  //   const converted = { ...data };

  //   Object.keys(converted).forEach((key) => {
  //     const value = converted[key];

  //     if (value.toDate && typeof value.toDate === 'function') {
  //       return value.toDate();
  //     }

  //     // Already a Date
  //     if (value instanceof Date) {
  //       return value;
  //     }

  //     // Timestamp -> Date
  //     if (value instanceof Timestamp && value.toDate && typeof value.toDate === 'function') {
  //       converted[key] = value.toDate();
  //     }
  //     // ISO 8601 String -> Date (YENİ)
  //     else if (
  //       typeof value === 'string' &&
  //       /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)
  //     ) {
  //       try {
  //         const date = new Date(value);
  //         if (!isNaN(date.getTime())) {
  //           converted[key] = date;
  //         }
  //       } catch (error) {
  //         console.warn(`Failed to convert date string: ${value}`, error);
  //       }
  //     }
  //     // Nested object
  //     else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
  //       converted[key] = this.convertTimestamps(value);
  //     }
  //     // Array
  //     else if (Array.isArray(value)) {
  //       converted[key] = value.map((item) =>
  //         typeof item === 'object' && item !== null ? this.convertTimestamps(item) : item
  //       );
  //     }
  //   });

  //   return converted;
  // }

  protected convertTimestamps(data: any): any {
    if (!data) return data;

    const converted = { ...data };

    Object.keys(converted).forEach((key) => {
      const value = converted[key];

      if (value instanceof Timestamp) {
        converted[key] = value.toDate().toISOString();
      } else if (value instanceof Date) {
        converted[key] = value.toISOString();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[key] = this.convertTimestamps(value);
      } else if (Array.isArray(value)) {
        converted[key] = value.map((item) =>
          typeof item === 'object' ? this.convertTimestamps(item) : item
        );
      }
    });

    return converted;
  }
  // ============================================
  // HELPER: Build query constraints
  // ============================================
  protected buildQueryConstraints(options?: QueryOptions): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    if (!options) return constraints;

    if (options.where) {
      options.where.forEach((w) => {
        constraints.push(where(w.field, w.operator, w.value));
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach((o) => {
        constraints.push(orderBy(o.field, o.direction || 'asc'));
      });
    }

    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    if (options.startAfter) {
      constraints.push(startAfter(options.startAfter));
    }

    if (options.endBefore) {
      constraints.push(endBefore(options.endBefore));
    }

    return constraints;
  }

  // ============================================
  // HELPER: Handle errors
  // ============================================
  protected handleError(method: string, error: any): ApiResponse<any> {
    const apiError = handleApiError(error);
    ApiLogger.error(this.collectionName, method, apiError);

    return {
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
        statusCode: apiError.statusCode,
      },
    };
  }

  // ============================================
  // 🔥 NEW: TRANSACTION SUPPORT
  // ============================================

  /**
   * Run a transaction with automatic error handling and retry logic
   * 
   * @example
   * ```typescript
   * const result = await matchAPI.runTransaction(async (transaction) => {
   *   const matchDoc = await transaction.get(doc(db, 'matches', matchId));
   *   const matchData = matchDoc.data();
   *   
   *   // Update match
   *   transaction.update(doc(db, 'matches', matchId), {
   *     'players.registered': updatedPlayers
   *   });
   *   
   *   return { success: true };
   * });
   * ```
   */
  protected async runTransaction<R>(
    callback: TransactionCallback<R>
  ): Promise<ApiResponse<R>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'runTransaction', { starting: true });

    try {
      const result = await runTransaction(db, async (transaction) => {
        return await callback(transaction);
      });

      ApiLogger.success(this.collectionName, 'runTransaction', result);
      ApiLogger.performance(this.collectionName, 'runTransaction', Date.now() - startTime);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return this.handleError('runTransaction', error);
    }
  }

  /**
   * Run a transaction with helper context for easier operations
   * 
   * @example
   * ```typescript
   * const result = await matchAPI.runTransactionWithContext(async (ctx) => {
   *   const match = await ctx.get<IMatch>('matches', matchId);
   *   
   *   const updatedPlayers = match.players.registered.filter(p => p.playerId !== playerId);
   *   
   *   ctx.update('matches', matchId, {
   *     'players.registered': updatedPlayers
   *   });
   *   
   *   return { success: true };
   * });
   * ```
   */
  protected async runTransactionWithContext<R>(
    callback: (ctx: TransactionContext) => Promise<R>
  ): Promise<ApiResponse<R>> {
    return this.runTransaction(async (transaction) => {
      const context: TransactionContext = {
        get: async <D>(collectionName: string, docId: string): Promise<D | null> => {
          const docRef = doc(db, collectionName, docId);
          const docSnap = await transaction.get(docRef);

          if (!docSnap.exists()) {
            return null;
          }

          return {
            id: docSnap.id,
            ...this.convertTimestamps(docSnap.data()),
          } as D;
        },

        create: (collectionName: string, docId: string, data: any) => {
          const docRef = doc(db, collectionName, docId);
          const cleanedData = this.cleanData(data);
          transaction.set(docRef, {
            ...cleanedData,
            createdAt: serverTimestamp(),
          });
        },

        update: (collectionName: string, docId: string, data: any) => {
          const docRef = doc(db, collectionName, docId);
          const cleanedData = this.cleanData(data);
          transaction.update(docRef, {
            ...cleanedData,
            updatedAt: serverTimestamp(),
          });
        },

        delete: (collectionName: string, docId: string) => {
          const docRef = doc(db, collectionName, docId);
          transaction.delete(docRef);
        },
      };

      return await callback(context);
    });
  }

  /**
   * Atomic array remove operation using transaction
   * Safely removes an item from an array field
   * 
   * @example
   * ```typescript
   * await matchAPI.transactionArrayRemove(
   *   matchId,
   *   'players.registered',
   *   (items) => items.filter(p => p.playerId !== playerId)
   * );
   * ```
   */
  protected async transactionArrayRemove<ArrayItem>(
    docId: string,
    arrayPath: string,
    filterFn: (items: ArrayItem[]) => ArrayItem[]
  ): Promise<ApiResponse<void>> {
    return this.runTransaction(async (transaction) => {
      const docRef = doc(db, this.collectionName, docId);
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new ApiError('NOT_FOUND', `Document with ID ${docId} not found`, null, 404);
      }

      const data = docSnap.data();

      // Get nested field value
      const pathParts = arrayPath.split('.');
      let currentValue: any = data;

      for (const part of pathParts) {
        currentValue = currentValue?.[part];
      }

      if (!Array.isArray(currentValue)) {
        throw new ApiError(
          'INVALID_FIELD',
          `Field ${arrayPath} is not an array`,
          null,
          400
        );
      }

      // Apply filter
      const filteredArray = filterFn(currentValue as ArrayItem[]);

      // Update document
      const updateData: any = {
        [arrayPath]: filteredArray,
        updatedAt: serverTimestamp(),
      };

      transaction.update(docRef, updateData);
    });
  }

  /**
   * Atomic array add operation using transaction
   * Safely adds an item to an array field
   * 
   * @example
   * ```typescript
   * await matchAPI.transactionArrayAdd(
   *   matchId,
   *   'players.registered',
   *   { playerId: 'player123', timestamp: new Date() }
   * );
   * ```
   */
  protected async transactionArrayAdd<ArrayItem>(
    docId: string,
    arrayPath: string,
    item: ArrayItem
  ): Promise<ApiResponse<void>> {
    return this.runTransaction(async (transaction) => {
      const docRef = doc(db, this.collectionName, docId);
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new ApiError('NOT_FOUND', `Document with ID ${docId} not found`, null, 404);
      }

      const data = docSnap.data();

      // Get nested field value
      const pathParts = arrayPath.split('.');
      let currentValue: any = data;

      for (const part of pathParts) {
        currentValue = currentValue?.[part];
      }

      const currentArray = Array.isArray(currentValue) ? currentValue : [];

      // Add item
      const updatedArray = [...currentArray, item];

      // Update document
      const updateData: any = {
        [arrayPath]: updatedArray,
        updatedAt: serverTimestamp(),
      };

      transaction.update(docRef, updateData);
    });
  }

  // ============================================
  // CREATE
  // ============================================
  async create(data: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'create', data);

    try {
      const collectionRef = collection(db, this.collectionName);

      // ✅ Clean undefined fields BEFORE adding timestamps
      const cleanedData = this.cleanData(data);

      const dataWithTimestamps = {
        ...cleanedData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collectionRef, dataWithTimestamps);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new ApiError('CREATE_ERROR', 'Document created but not found');
      }

      const createdData = {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as T;

      ApiLogger.success(this.collectionName, 'create', createdData);
      ApiLogger.performance(this.collectionName, 'create', Date.now() - startTime);

      return {
        success: true,
        data: createdData,
      };
    } catch (error: any) {
      // ✅ Retry with cleaning if undefined error
      if (this.isUndefinedError(error)) {
        ApiLogger.warn(this.collectionName, 'create', 'Undefined field detected, retrying...');
        return this.create(this.cleanData(data) as Omit<T, 'id'>);
      }
      return this.handleError('create', error);
    }
  }

  // ============================================
  // CREATE WITH CUSTOM ID
  // ============================================
  async createWithId(id: string, data: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'createWithId', { id, data });

    try {
      const docRef = doc(db, this.collectionName, id);

      // ✅ Clean undefined fields
      const cleanedData = this.cleanData(data);

      const dataWithTimestamps = {
        ...cleanedData,
        createdAt: serverTimestamp(),
      };

      await setDoc(docRef, dataWithTimestamps);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new ApiError('CREATE_ERROR', 'Document created but not found');
      }

      const createdData = {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as T;

      ApiLogger.success(this.collectionName, 'createWithId', createdData);
      ApiLogger.performance(this.collectionName, 'createWithId', Date.now() - startTime);

      return {
        success: true,
        data: createdData,
      };
    } catch (error: any) {
      // ✅ Retry with cleaning if undefined error
      if (this.isUndefinedError(error)) {
        ApiLogger.warn(this.collectionName, 'createWithId', 'Undefined field detected, retrying...');
        return this.createWithId(id, this.cleanData(data) as Omit<T, 'id'>);
      }
      return this.handleError('createWithId', error);
    }
  }

  // ============================================
  // CREATE BATCH
  // ============================================
  async createBatch(items: Omit<T, 'id'>[], options?: BatchOptions): Promise<ApiResponse<T[]>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'createBatch', { count: items.length, options });

    try {
      const maxBatchSize = options?.maxBatchSize || 500;
      const results: T[] = [];
      const collectionRef = collection(db, this.collectionName);

      for (let i = 0; i < items.length; i += maxBatchSize) {
        const batch = writeBatch(db);
        const chunk = items.slice(i, i + maxBatchSize);

        chunk.forEach((item) => {
          // ✅ Clean undefined fields for each item
          const cleanedItem = this.cleanData(item);
          const docRef = doc(collectionRef);
          batch.set(docRef, {
            ...cleanedItem,
            createdAt: serverTimestamp(),
          });

          results.push({ id: docRef.id, ...cleanedItem } as T);
        });

        await batch.commit();
      }

      ApiLogger.success(this.collectionName, 'createBatch', { count: results.length });
      ApiLogger.performance(this.collectionName, 'createBatch', Date.now() - startTime);

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return this.handleError('createBatch', error);
    }
  }

  // ============================================
  // GET BY ID
  // ============================================
  async getById(id: string): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'getById', { id });

    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        ApiLogger.warn(this.collectionName, 'getById', `Document with ID ${id} not found`);
        // throw new ApiError('NOT_FOUND', `Document with ID ${id} not found`, null, 404);
        return {
          success: true,
          data: undefined,
        };
      }

      const data = {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as T;

      ApiLogger.success(this.collectionName, 'getById', data);
      ApiLogger.performance(this.collectionName, 'getById', Date.now() - startTime);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return this.handleError('getById', error);
    }
  }

  // ============================================
  // GET ALL
  // ============================================
  async getAll(options?: QueryOptions): Promise<ApiResponse<T[]>> {
    const startTime = Date.now();
    ApiLogger.query(this.collectionName, 'getAll', options);

    try {
      const collectionRef = collection(db, this.collectionName);
      const constraints = this.buildQueryConstraints(options);
      const q = query(collectionRef, ...constraints);

      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as T[];

      ApiLogger.success(this.collectionName, 'getAll', { count: data.length });
      ApiLogger.performance(this.collectionName, 'getAll', Date.now() - startTime);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return this.handleError('getAll', error);
    }
  }

  // ============================================
  // GET WITH PAGINATION
  // ============================================
  async getPaginated(
    queryOptions: QueryOptions,
    paginationOptions: PaginationOptions
  ): Promise<ApiResponse<PaginatedResult<T>>> {
    const startTime = Date.now();
    ApiLogger.query(this.collectionName, 'getPaginated', { queryOptions, paginationOptions });

    try {
      const collectionRef = collection(db, this.collectionName);

      const constraints = this.buildQueryConstraints({
        ...queryOptions,
        limit: paginationOptions.pageSize + 1,
      });

      if (paginationOptions.lastDoc) {
        if (paginationOptions.direction === 'prev') {
          constraints.push(endBefore(paginationOptions.lastDoc));
        } else {
          constraints.push(startAfter(paginationOptions.lastDoc));
        }
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const docs = querySnapshot.docs;
      const hasMore = docs.length > paginationOptions.pageSize;
      const dataDocs = hasMore ? docs.slice(0, -1) : docs;

      const data = dataDocs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as T[];

      const result = {
        data,
        lastDoc: dataDocs[dataDocs.length - 1],
        firstDoc: dataDocs[0],
        hasMore,
      };

      ApiLogger.success(this.collectionName, 'getPaginated', {
        count: data.length,
        hasMore
      });
      ApiLogger.performance(this.collectionName, 'getPaginated', Date.now() - startTime);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return this.handleError('getPaginated', error);
    }
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'update', { id, data });

    try {
      const docRef = doc(db, this.collectionName, id);

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new ApiError('NOT_FOUND', `Document with ID ${id} not found`, null, 404);
      }

      // ✅ Clean undefined fields
      const cleanedData = this.cleanData(data);

      const updateData = {
        ...cleanedData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      const updatedSnap = await getDoc(docRef);
      const updatedData = {
        id: updatedSnap.id,
        ...this.convertTimestamps(updatedSnap.data()),
      } as T;

      ApiLogger.success(this.collectionName, 'update', updatedData);
      ApiLogger.performance(this.collectionName, 'update', Date.now() - startTime);

      return {
        success: true,
        data: updatedData,
      };
    } catch (error: any) {
      // ✅ Retry with cleaning if undefined error
      if (this.isUndefinedError(error)) {
        ApiLogger.warn(this.collectionName, 'update', 'Undefined field detected, retrying...');
        return this.update(id, this.cleanData(data) as Partial<Omit<T, 'id'>>);
      }

      return this.handleError('update', error);
    }
  }

  // ============================================
  // UPDATE BATCH
  // ============================================
  async updateBatch(updates: Array<{ id: string; data: Partial<T> }>): Promise<ApiResponse<void>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'updateBatch', { count: updates.length });

    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        // ✅ Clean undefined fields for each update
        const cleanedData = this.cleanData(data);
        const docRef = doc(db, this.collectionName, id);
        batch.update(docRef, {
          ...cleanedData,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      ApiLogger.success(this.collectionName, 'updateBatch', { count: updates.length });
      ApiLogger.performance(this.collectionName, 'updateBatch', Date.now() - startTime);

      return {
        success: true,
      };
    } catch (error: any) {
      return this.handleError('updateBatch', error);
    }
  }

  // ============================================
  // DELETE
  // ============================================
  async delete(id: string): Promise<ApiResponse<void>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'delete', { id });

    try {
      const docRef = doc(db, this.collectionName, id);

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new ApiError('NOT_FOUND', `Document with ID ${id} not found`, null, 404);
      }

      await deleteDoc(docRef);

      ApiLogger.success(this.collectionName, 'delete', { id });
      ApiLogger.performance(this.collectionName, 'delete', Date.now() - startTime);

      return {
        success: true,
      };
    } catch (error: any) {
      return this.handleError('delete', error);
    }
  }

  // ============================================
  // DELETE
  // ============================================
  async deleteByTarget(targetId: string): Promise<ApiResponse<void>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'deleteByTarget', { targetId });

    try {
      const byTargetResponse = await this.getAll({
        where: [
          { field: 'targetId', operator: '==', value: targetId }
        ]
      });
      if (byTargetResponse.success && byTargetResponse.data && byTargetResponse.data.length > 0) {
        const tar = byTargetResponse.data[0].id as string;
        const docRef = doc(db, this.collectionName, tar);
        await deleteDoc(docRef);
      }
      ApiLogger.success(this.collectionName, 'deleteByTarget', { targetId });
      ApiLogger.performance(this.collectionName, 'deleteByTarget', Date.now() - startTime);

      return {
        success: true,
      };
    } catch (error: any) {
      return this.handleError('delete', error);
    }
  }


  // ============================================
  // DELETE BATCH
  // ============================================
  async deleteBatch(ids: string[]): Promise<ApiResponse<void>> {
    const startTime = Date.now();
    ApiLogger.log(this.collectionName, 'deleteBatch', { count: ids.length });

    try {
      const batch = writeBatch(db);

      ids.forEach((id) => {
        const docRef = doc(db, this.collectionName, id);
        batch.delete(docRef);
      });

      await batch.commit();

      ApiLogger.success(this.collectionName, 'deleteBatch', { count: ids.length });
      ApiLogger.performance(this.collectionName, 'deleteBatch', Date.now() - startTime);

      return {
        success: true,
      };
    } catch (error: any) {
      return this.handleError('deleteBatch', error);
    }
  }

  // ============================================
  // BATCH OPERATIONS (Legacy support)
  // ============================================
  createBatchWriter(): WriteBatch {
    return writeBatch(db);
  }

  async executeBatch(batch: WriteBatch): Promise<ApiResponse<void>> {
    const startTime = Date.now();

    try {
      await batch.commit();

      ApiLogger.success(this.collectionName, 'executeBatch', {});
      ApiLogger.performance(this.collectionName, 'executeBatch', Date.now() - startTime);

      return {
        success: true,
      };
    } catch (error: any) {
      return this.handleError('executeBatch', error);
    }
  }

  // ============================================
  // EXISTS CHECK
  // ============================================
  async exists(id: string): Promise<ApiResponse<boolean>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      return {
        success: true,
        data: docSnap.exists(),
      };
    } catch (error: any) {
      return this.handleError('exists', error);
    }
  }

  // ============================================
  // COUNT
  // ============================================
  async count(options?: QueryOptions): Promise<ApiResponse<number>> {
    try {
      const result = await this.getAll(options);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'COUNT_ERROR',
            message: 'Failed to count documents',
          },
        };
      }

      return {
        success: true,
        data: result.data.length,
      };
    } catch (error: any) {
      return this.handleError('count', error);
    }
  }

  // ============================================
  // REALTIME LISTENERS
  // ============================================
  onSnapshot(
    id: string,
    callback: (data: T | null) => void,
    errorCallback?: (error: Error) => void
  ): RealtimeSubscription {
    ApiLogger.log(this.collectionName, 'onSnapshot', { id });

    const docRef = doc(db, this.collectionName, id);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({
            id: docSnap.id,
            ...this.convertTimestamps(docSnap.data()),
          } as T);
        } else {
          callback(null);
        }
      },
      (error) => {
        ApiLogger.error(this.collectionName, 'onSnapshot', error);
        if (errorCallback) errorCallback(error);
      }
    );

    return { unsubscribe };
  }

  onSnapshotQuery(
    options: QueryOptions,
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void
  ): RealtimeSubscription {
    ApiLogger.query(this.collectionName, 'onSnapshotQuery', options);

    const collectionRef = collection(db, this.collectionName);
    const constraints = this.buildQueryConstraints(options);
    const q = query(collectionRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...this.convertTimestamps(doc.data()),
        })) as T[];
        callback(data);
      },
      (error) => {
        ApiLogger.error(this.collectionName, 'onSnapshotQuery', error);
        if (errorCallback) errorCallback(error);
      }
    );

    return { unsubscribe };
  }
}

/*
// ============================================

// En basit - Array silme
await matchAPI.transactionArrayRemove(
  matchId,
  'players.registered',
  (items) => items.filter(p => p.playerId !== playerId)
);

// Context helper ile
await matchAPI.runTransactionWithContext(async (ctx) => {
  const match = await ctx.get<IMatch>('matches', matchId);
  ctx.update('matches', matchId, { status: 'completed' });
});

// Manuel transaction
await matchAPI.runTransaction(async (transaction) => {
  const docRef = doc(db, 'matches', matchId);
  const snap = await transaction.get(docRef);
  transaction.update(docRef, { /* updates });
// });


 */