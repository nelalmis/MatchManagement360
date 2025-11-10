// src/store/slices/authSlice.ts - Expo Firebase JS SDK Version
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  reload,
  User as FirebaseUser,
  updatePassword,
  validatePassword,
  verifyPasswordResetCode,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../../config/firebase.config';
import { IPlayer, SportType } from '../../types/entity/types';
import PlayerService from '../../services/serviceLayer/playerService';
import { emailService } from '../../services/serviceLayer/emailService';

interface AuthState {
  user: IPlayer | null;
  loading: boolean;
  error: string | null;
  message: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  message: null,
  isAuthenticated: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Login işlemi - Firebase JS SDK + PlayerService
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      // Firebase Auth ile giriş
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );

      // PlayerService ile kullanıcı bilgilerini getir
      const playerResult = await PlayerService.getPlayer('player_1761610022065_inbvfcqla');

      let userData: IPlayer = null as any;

      if (!playerResult.success || !playerResult.data) {
        // Veritabanında yoksa oluştur (migration durumu)
        // const [name, surname] = userCredential.user.displayName
        //   ? userCredential.user.displayName.split(' ')
        //   : ['', ''];

        // const registerResult = await PlayerService.registerPlayer({
        //   id: userCredential.user.uid,
        //   email: userCredential.user.email!,
        //   name: name || 'User',
        //   surname: surname || '',
        //   displayName: userCredential.user.displayName || '',
        //   emailVerified: userCredential.user.emailVerified,
        //   authProviders: ['email'],
        //   language: 'tr',
        // });

        // if (!registerResult.success || !registerResult.data) {
        //   await userCredential.user.delete(); // Temizleme
        //   throw new Error('Kullanıcı oluşturulamadı');
        // }

        // userData = registerResult.data;
      } else {
        userData = playerResult.data;
      }

      // Last login güncelle
      await PlayerService.recordLogin(userCredential.user.uid);

      // Email verified durumunu güncelle (Firebase Auth'dan)
      if (userData.emailVerified !== userCredential.user.emailVerified) {
        await PlayerService.updateEmailVerification(
          userCredential.user.uid,
          userCredential.user.emailVerified
        );
        userData = { ...userData, emailVerified: userCredential.user.emailVerified };
      }

      return userData;
    } catch (error: any) {
      let errorMessage = 'Giriş yapılamadı';
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi';
          break;
          break;
        case 'auth/user-not-found':
          errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı. Lütfen kayıt olun.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Yanlış şifre. Lütfen tekrar deneyin.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          // ✅ BU SIZIN DURUMUNUZ!
          errorMessage = 'Email veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Bu hesap devre dışı bırakılmış';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'İnternet bağlantınızı kontrol edin.';
          break;
        default:
          errorMessage = error.message || 'Giriş yapılamadı';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Kayıt işlemi - Firebase JS SDK + PlayerService
 */
export const signUpUser = createAsyncThunk(
  'auth/signup',
  async (
    {
      email,
      password,
      name,
      surname,
      // phone,
    }: {
      email: string;
      password: string;
      name: string;
      surname: string;
      // phone?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      if (email === 'elalmis.ne@gmail.com') { //TODO Test kullanıcısı varsa sil
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        if (signInMethods.length > 0) {
          const testUserCredential = await signInWithEmailAndPassword(
            auth,
            'elalmis.ne@gmail.com',
            signInMethods[0] === 'google.com' ? 'GoogleSignInDummyPassword' : 'Test123!'
          );
          await testUserCredential.user.delete();

          // Kullanıcıyı sil
          await PlayerService.deletePlayer(testUserCredential.user.uid);
        }
      }
      // Firebase Auth'da kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );

      const displayName = `${name} ${surname}`.trim();

      // Firebase Auth profile güncelle
      await updateProfile(userCredential.user, { displayName });

      // PlayerService ile veritabanına kaydet
      const registerResult = await PlayerService.registerPlayer({
        id: userCredential.user.uid,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        surname: surname.trim(),
        displayName,
        // phone,
        emailVerified: false,
        authProviders: ['email'],
        language: 'tr',
      });

      console.log('Register result:', registerResult);

      if (!registerResult.success || !registerResult.data) {
        console.error('PlayerService register failed:', registerResult.error);
        // Kayıt başarısızsa Firebase Auth kullanıcısını sil
        try {
          await userCredential.user.delete();
          console.log('Firebase user deleted after failed registration');
        } catch (deleteError) {
          console.error('Error deleting user:', deleteError);
        }
        throw new Error(registerResult.error?.message || 'Kayıt oluşturulamadı');
      }

      // Email verification gönder
      try {
        // 2. Verification token oluştur
        // const verificationToken = btoa(
        //   userCredential.user.uid + ':' + Date.now()
        // );
        // const verificationLink = `https://yourapp.com/verify-email?token=${verificationToken}`;
        // await emailService.getVerificationTemplate(email, name, verificationLink);
        await firebaseSendEmailVerification(userCredential.user);
      } catch (verifyError) {
        console.warn('Email verification gönderilirken hata:', verifyError);
        // Email gönderilemese bile kayıt devam etsin
      }

      return registerResult.data;
    } catch (error: any) {
      let errorMessage = 'Kayıt oluşturulamadı';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Bu e-posta adresi zaten kullanımda';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi';
          break;
        case 'auth/weak-password':
          errorMessage = 'Şifre en az 6 karakter olmalıdır';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'E-posta/şifre girişi etkin değil';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'İnternet bağlantısı yok';
          break;
        default:
          errorMessage = error.message || 'Bir hata oluştu';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Şifre sıfırlama
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      return 'Şifre sıfırlama e-postası gönderildi';
    } catch (error: any) {
      let errorMessage = 'E-posta gönderilemedi';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Bu e-posta adresine kayıtlı kullanıcı bulunamadı';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'İnternet bağlantısı yok';
          break;
        default:
          errorMessage = error.message || 'Bir hata oluştu';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Çıkış işlemi
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Çıkış yapılamadı');
    }
  }
);

/**
 * Profil güncelleme
 */
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates: Partial<IPlayer>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;

      if (!currentUser) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Firebase Auth profil güncelle (displayName, photoURL)
      const authUser = auth.currentUser;
      if (authUser) {
        const authUpdates: any = {};
        if (updates.displayName) authUpdates.displayName = updates.displayName;
        if (updates.profilePhoto) authUpdates.photoURL = updates.profilePhoto;

        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(authUser, authUpdates);
        }
      }

      // PlayerService ile güncelle
      const updateResult = await PlayerService.updateProfile(currentUser.id, {
        name: updates.name,
        surname: updates.surname,
        displayName: updates.displayName,
        profilePhoto: updates.profilePhoto,
        jerseyNumber: updates.jerseyNumber,
        birthDate: updates.birthDate,
        phone: updates.phone,
        language: updates.language,
        timezone: updates.timezone,
        favoriteSports: updates.favoriteSports,
        sportPositions: updates.sportPositions,
      });

      if (!updateResult.success || !updateResult.data) {
        throw new Error(updateResult.error?.message || 'Profil güncellenemedi');
      }

      return updateResult.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Profil güncellenemedi');
    }
  }
);

/**
 * Email doğrulama gönder
 */
export const sendEmailVerification = createAsyncThunk(
  'auth/sendEmailVerification',
  async (_, { rejectWithValue }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      await firebaseSendEmailVerification(user);
      return 'Doğrulama e-postası gönderildi';
    } catch (error: any) {
      return rejectWithValue(error.message || 'E-posta gönderilemedi');
    }
  }
);
export const changeUserPassword = createAsyncThunk(
  'auth/changeUserPassword',
  async (
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;

      if (!currentUser) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const authUser = auth.currentUser;
      if (!authUser || !authUser.email) {
        throw new Error('Kullanıcı oturumu geçersiz');
      }

      // 🔐 Eski şifreyle re-authenticate
      const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
      await reauthenticateWithCredential(authUser, credential);

      // 🔄 Yeni şifreyi güncelle
      await updatePassword(authUser, newPassword);

      // Eğer backend’de de güncellenmesi gerekiyorsa buraya ekle:
      // const updateResult = await PlayerService.updatePassword(currentUser.id, newPassword);
      // if (!updateResult.success) throw new Error(updateResult.error?.message || 'Şifre güncellenemedi');

      return true; // Başarılı sonucu döndür
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        'Şifre güncellenemedi. Lütfen mevcut şifrenizi kontrol edin.';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Email doğrulama durumunu kontrol et
 */
export const checkEmailVerification = createAsyncThunk(
  'auth/checkEmailVerification',
  async (_, { getState, rejectWithValue }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Firebase Auth kullanıcısını yeniden yükle
      await reload(user);
      const emailVerified = user.emailVerified;

      // PlayerService ile güncelle
      const state = getState() as { auth: AuthState };
      if (state.auth.user) {
        await PlayerService.updateEmailVerification(
          state.auth.user.id,
          emailVerified
        );
      }

      return emailVerified;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Kontrol edilemedi');
    }
  }
);

/**
 * Kullanıcıyı yeniden yükle
 */
export const reloadUserData = createAsyncThunk(
  'auth/reloadUserData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;

      if (!currentUser) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const playerResult = await PlayerService.getPlayer(currentUser.id);

      if (!playerResult.success || !playerResult.data) {
        throw new Error('Kullanıcı verisi bulunamadı');
      }

      return playerResult.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Veri yüklenemedi');
    }
  }
);

/**
 * Favori spor ekle
 */
export const addFavoriteSport = createAsyncThunk(
  'auth/addFavoriteSport',
  async (
    { sportType }: { sportType: SportType },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;

      if (!currentUser) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const result = await PlayerService.addFavoriteSport(
        currentUser.id,
        sportType
      );

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Favori spor eklenemedi');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Favori spor eklenemedi');
    }
  }
);

/**
 * Spor pozisyonları güncelle
 */
export const updateSportPositions = createAsyncThunk(
  'auth/updateSportPositions',
  async (
    { sportType, positions }: { sportType: SportType; positions: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;

      if (!currentUser) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const result = await PlayerService.updateSportPositions(
        currentUser.id,
        sportType,
        positions
      );

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Pozisyonlar güncellenemedi');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Pozisyonlar güncellenemedi');
    }
  }
);

// ============================================
// SLICE
// ============================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    setUser: (state, action: PayloadAction<IPlayer | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    resetAuthState: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.message = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Sign Up
    builder
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
        state.isAuthenticated = true;
        //state.message = 'Kayıt başarılı! Lütfen e-postanızı doğrulayın.';
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.error = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
        state.message = 'Profil güncellendi';
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Send Email Verification
    builder
      .addCase(sendEmailVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendEmailVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(sendEmailVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Check Email Verification
    builder
      .addCase(checkEmailVerification.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkEmailVerification.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.emailVerified = action.payload;
        }
      })
      .addCase(checkEmailVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Reload User Data
    builder
      .addCase(reloadUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(reloadUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(reloadUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add Favorite Sport
    builder
      .addCase(addFavoriteSport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFavoriteSport.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.message = 'Favori spor eklendi';
      })
      .addCase(addFavoriteSport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Sport Positions
    builder
      .addCase(updateSportPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSportPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.message = 'Pozisyonlar güncellendi';
      })
      .addCase(updateSportPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

      // Change User Password
    builder
      .addCase(changeUserPassword.pending, (state) => { 
        state.loading = true;
        state.error = null;
      })
      .addCase(changeUserPassword.fulfilled, (state) => {
        state.loading = false;
        state.message = 'Şifre güncellendi';
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearMessage, setUser, resetAuthState } =
  authSlice.actions;

export default authSlice.reducer;