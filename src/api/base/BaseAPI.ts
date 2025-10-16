// ============================================
// api/base/BaseAPI.ts
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
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

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
  };
}

// ============================================
// BASE API CLASS
// ============================================
export class BaseAPI<T extends { id?: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // ============================================
  // HELPER: Convert Firestore timestamp to ISO string
  // ============================================
  protected convertTimestamps(data: any): any {
    if (!data) return data;

    const converted = { ...data };

    Object.keys(converted).forEach((key) => {
      const value = converted[key];

      // Timestamp conversion
      if (value instanceof Timestamp) {
        converted[key] = value.toDate().toISOString();
      }
      // Date conversion
      else if (value instanceof Date) {
        converted[key] = value.toISOString();
      }
      // Nested object
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[key] = this.convertTimestamps(value);
      }
      // Array
      else if (Array.isArray(value)) {
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

    // Where clauses
    if (options.where) {
      options.where.forEach((w) => {
        constraints.push(where(w.field, w.operator, w.value));
      });
    }

    // Order by
    if (options.orderBy) {
      options.orderBy.forEach((o) => {
        constraints.push(orderBy(o.field, o.direction || 'asc'));
      });
    }

    // Limit
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    // Pagination
    if (options.startAfter) {
      constraints.push(startAfter(options.startAfter));
    }

    if (options.endBefore) {
      constraints.push(endBefore(options.endBefore));
    }

    return constraints;
  }

  // ============================================
  // CREATE
  // ============================================
  async create(data: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    try {
      const collectionRef = collection(db, this.collectionName);
      
      // Add timestamps
      const dataWithTimestamps = {
        ...data,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collectionRef, dataWithTimestamps);
      
      // Get the created document
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document created but not found');
      }

      const createdData = {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as T;

      return {
        success: true,
        data: createdData,
      };
    } catch (error: any) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'CREATE_ERROR',
          message: error.message || 'Failed to create document',
          details: error,
        },
      };
    }
  }

  // ============================================
  // CREATE WITH CUSTOM ID
  // ============================================
  async createWithId(id: string, data: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      const dataWithTimestamps = {
        ...data,
        createdAt: serverTimestamp(),
      };

      await setDoc(docRef, dataWithTimestamps);
      
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document created but not found');
      }

      const createdData = {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as T;

      return {
        success: true,
        data: createdData,
      };
    } catch (error: any) {
      console.error(`Error creating document with ID in ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'CREATE_WITH_ID_ERROR',
          message: error.message || 'Failed to create document with custom ID',
          details: error,
        },
      };
    }
  }

  // ============================================
  // GET BY ID
  // ============================================
  async getById(id: string): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Document with ID ${id} not found`,
          },
        };
      }

      const data = {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as T;

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error(`Error getting document from ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'GET_ERROR',
          message: error.message || 'Failed to get document',
          details: error,
        },
      };
    }
  }

  // ============================================
  // GET ALL
  // ============================================
  async getAll(options?: QueryOptions): Promise<ApiResponse<T[]>> {
    try {
      const collectionRef = collection(db, this.collectionName);
      const constraints = this.buildQueryConstraints(options);
      const q = query(collectionRef, ...constraints);

      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as T[];

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error(`Error getting documents from ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'GET_ALL_ERROR',
          message: error.message || 'Failed to get documents',
          details: error,
        },
      };
    }
  }

  // ============================================
  // GET WITH PAGINATION
  // ============================================
  async getPaginated(
    queryOptions: QueryOptions,
    paginationOptions: PaginationOptions
  ): Promise<ApiResponse<PaginatedResult<T>>> {
    try {
      const collectionRef = collection(db, this.collectionName);
      
      // Build base query
      const constraints = this.buildQueryConstraints({
        ...queryOptions,
        limit: paginationOptions.pageSize + 1, // +1 to check if there's more
      });

      // Add pagination cursor
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

      // Remove extra doc used for hasMore check
      const datadocs = hasMore ? docs.slice(0, -1) : docs;

      const data = datadocs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as T[];

      return {
        success: true,
        data: {
          data,
          lastDoc: datadocs[datadocs.length - 1],
          firstDoc: datadocs[0],
          hasMore,
        },
      };
    } catch (error: any) {
      console.error(`Error getting paginated documents from ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'PAGINATION_ERROR',
          message: error.message || 'Failed to get paginated documents',
          details: error,
        },
      };
    }
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(db, this.collectionName, id);

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Document with ID ${id} not found`,
          },
        };
      }

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      // Get updated document
      const updatedSnap = await getDoc(docRef);
      const updatedData = {
        id: updatedSnap.id,
        ...this.convertTimestamps(updatedSnap.data()),
      } as T;

      return {
        success: true,
        data: updatedData,
      };
    } catch (error: any) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'UPDATE_ERROR',
          message: error.message || 'Failed to update document',
          details: error,
        },
      };
    }
  }

  // ============================================
  // DELETE
  // ============================================
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Document with ID ${id} not found`,
          },
        };
      }

      await deleteDoc(docRef);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'DELETE_ERROR',
          message: error.message || 'Failed to delete document',
          details: error,
        },
      };
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================
  createBatch(): WriteBatch {
    return writeBatch(db);
  }

  async executeBatch(batch: WriteBatch): Promise<ApiResponse<void>> {
    try {
      await batch.commit();
      return {
        success: true,
      };
    } catch (error: any) {
      console.error(`Error executing batch operation:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'BATCH_ERROR',
          message: error.message || 'Failed to execute batch operation',
          details: error,
        },
      };
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
      console.error(`Error checking document existence in ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'EXISTS_CHECK_ERROR',
          message: error.message || 'Failed to check document existence',
          details: error,
        },
      };
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
      console.error(`Error counting documents in ${this.collectionName}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'COUNT_ERROR',
          message: error.message || 'Failed to count documents',
          details: error,
        },
      };
    }
  }
}