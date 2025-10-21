// src/hooks/useAuthListener.ts - Expo Firebase JS SDK Version
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { setUser, resetAuthState } from '../store/slices/authSlice';

import type { AppDispatch } from '../store';
import type { IPlayer } from '../types/entity/types';
import PlayerService from '../services/serviceLayer/playerService';

/**
 * Firebase Authentication durumunu dinleyen hook (Expo uyumlu)
 * - Firebase Auth state değişikliklerini izler
 * - Firestore'dan kullanıcı bilgilerini real-time olarak dinler
 * - Redux store'u günceller
 * 
 * Uygulama başlangıcında App.tsx veya root component'te kullanılmalı
 */
export const useAuthListener = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    let firestoreUnsubscribe: (() => void) | null = null;

    // Firebase auth state değişikliklerini dinle
    const authUnsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        // Önceki Firestore listener'ı temizle
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }

        if (firebaseUser) {
          // Kullanıcı giriş yapmış - Firestore'dan real-time dinle
          const userDocRef = doc(db, 'users', firebaseUser.uid);

          firestoreUnsubscribe = onSnapshot(
            userDocRef,
            async (documentSnapshot) => {
              if (documentSnapshot.exists()) {
                // PlayerService kullanarak kullanıcı bilgilerini al
                const playerResult = await PlayerService.getPlayer(
                  firebaseUser.uid
                );

                if (playerResult.success && playerResult.data) {
                  // Firebase Auth'dan emailVerified durumunu güncelle
                  const updatedUser: IPlayer = {
                    ...playerResult.data,
                    emailVerified: firebaseUser.emailVerified,
                  };

                  dispatch(setUser(updatedUser));
                } else {
                  // playerService'den alınamazsa temel bilgilerle oluştur
                  console.warn(
                    'User data not found via PlayerService, using basic info'
                  );

                  const basicUser: Partial<IPlayer> = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    emailVerified: firebaseUser.emailVerified,
                    displayName: firebaseUser.displayName || '',
                    profilePhoto: firebaseUser.photoURL || undefined,
                    name: '',
                    surname: '',
                    authProviders: ['email'],
                    favoriteSports: [],
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    isBanned: false,
                  };

                  dispatch(setUser(basicUser as IPlayer));
                }
              } else {
                // Firestore'da kullanıcı bulunamadı
                console.warn(
                  'User document not found in Firestore, creating basic user data'
                );

                const basicUser: Partial<IPlayer> = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  emailVerified: firebaseUser.emailVerified,
                  displayName: firebaseUser.displayName || '',
                  profilePhoto: firebaseUser.photoURL || undefined,
                  name: '',
                  surname: '',
                  authProviders: ['email'],
                  favoriteSports: [],
                  createdAt: new Date().toISOString(),
                  isActive: true,
                  isBanned: false,
                };

                dispatch(setUser(basicUser as IPlayer));
              }
            },
            (error) => {
              console.error('Firestore listener error:', error);
              // Hata durumunda sadece Firebase Auth bilgilerini kullan
              const basicUser: Partial<IPlayer> = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                emailVerified: firebaseUser.emailVerified,
                displayName: firebaseUser.displayName || '',
                profilePhoto: firebaseUser.photoURL || undefined,
                name: '',
                surname: '',
                authProviders: ['email'],
                favoriteSports: [],
                createdAt: new Date().toISOString(),
                isActive: true,
                isBanned: false,
              };

              dispatch(setUser(basicUser as IPlayer));
            }
          );
        } else {
          // Kullanıcı çıkış yapmış
          dispatch(resetAuthState());
        }
      }
    );

    // Cleanup
    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  }, [dispatch]);
};

/**
 * Kullanım örneği:
 * 
 * // App.tsx
 * import { useAuthListener } from './hooks/useAuthListener';
 * 
 * function App() {
 *   useAuthListener(); // Firebase auth state'i ve kullanıcı verilerini dinle
 *   
 *   return (
 *     <NavigationContainer>
 *       <RootNavigator />
 *     </NavigationContainer>
 *   );
 * }
 */