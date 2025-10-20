// src/hooks/useAuth.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  setUser, 
  setLoading, 
  setError, 
  clearAuth 
} from '../store/slices/authSlice';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase.config';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        dispatch(setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
        }));

        return { success: true };
      } catch (error: any) {
        const errorMessage = getAuthErrorMessage(error.code);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update profile with display name
        await firebaseUpdateProfile(userCredential.user, { displayName });

        dispatch(setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName,
          photoURL: null,
        }));

        return { success: true };
      } catch (error: any) {
        const errorMessage = getAuthErrorMessage(error.code);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  /**
   * Sign out
   */
  const logout = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      await signOut(auth);
      dispatch(clearAuth());
      return { success: true };
    } catch (error: any) {
      const errorMessage = 'Çıkış yapılırken hata oluştu';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        await sendPasswordResetEmail(auth, email);

        return { success: true };
      } catch (error: any) {
        const errorMessage = getAuthErrorMessage(error.code);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  /**
   * Update profile
   */
  const updateProfile = useCallback(
    async (displayName?: string, photoURL?: string) => {
      try {
        if (!user) {
          throw new Error('Kullanıcı bulunamadı');
        }

        dispatch(setLoading(true));

        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Oturum bulunamadı');
        }

        const updates: any = {};
        if (displayName) updates.displayName = displayName;
        if (photoURL !== undefined) updates.photoURL = photoURL;

        await firebaseUpdateProfile(currentUser, updates);

        dispatch(setUser({
          ...user,
          ...updates,
        }));

        return { success: true };
      } catch (error: any) {
        const errorMessage = 'Profil güncellenirken hata oluştu';
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, user]
  );

  /**
   * Clear error
   */
  const clearAuthError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,

    // Actions
    signIn,
    signUp,
    logout,
    resetPassword,
    updateProfile,
    clearError: clearAuthError,
  };
};

/**
 * Get user-friendly error message
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Kullanıcı bulunamadı';
    case 'auth/wrong-password':
      return 'Hatalı şifre';
    case 'auth/email-already-in-use':
      return 'Bu email adresi zaten kullanılıyor';
    case 'auth/weak-password':
      return 'Şifre çok zayıf (en az 6 karakter)';
    case 'auth/invalid-email':
      return 'Geçersiz email adresi';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı hatası';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin';
    default:
      return 'Bir hata oluştu. Lütfen tekrar deneyin';
  }
}

export default useAuth;


/* 
// Component'te kullanım
import { useAuth, useLeague, useMatch, useDebounce } from '../hooks';

function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const { myLeagues, loadMyLeagues } = useLeague();
  const { upcomingMatches, loadUpcomingMatches } = useMatch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch) {
      // Search çalışır
    }
  }, [debouncedSearch]);

  return (
    <View>
      <Text>{user?.displayName}</Text>
      <FlatList data={myLeagues} />
    </View>
  );
}

*/