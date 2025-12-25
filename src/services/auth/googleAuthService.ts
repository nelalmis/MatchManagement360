// src/services/auth/googleAuthService.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export const signInWithGoogle = async () => {
  try {
    // 1. Google Sign-In
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    if (!userInfo || !userInfo.data) {
      throw new Error('Google Sign-In failed');
    }
    // 2. Get ID token
    const { idToken } = userInfo.data;

    if (!idToken) {
      throw new Error('Google ID token not found');
    }

    // 3. Firebase credential oluştur
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // 4. Firebase'e sign in
    const auth = getAuth();
    const result = await signInWithCredential(auth, googleCredential);

    console.log('✅ Firebase Google Sign-In successful:', result.user);

    return {
      success: true,
      user: result.user,
      idToken,
    };

  } catch (error: any) {
    console.error('❌ Google Sign-In error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Hook olarak kullanım
export const useGoogleAuth = () => {
  const signInWithGoogle = async () : Promise<any> => {
    try {
      const result = await signInWithGoogle();
      return result;
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      const auth = getAuth();
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    signInWithGoogle,
    signOut,
  };
};