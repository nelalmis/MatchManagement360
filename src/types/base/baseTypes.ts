import { IPlayer } from "../types";

export interface AppContextType {
  user: IPlayer | null;
  setUser: (user: IPlayer | null) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  countdown: number;
  setCountdown: (count: number) => void;
  rememberDevice: boolean;
  setRememberDevice: (remember: boolean) => void;
  isVerified: boolean;
  setIsVerified: (isVerified: boolean) => void;
}

export interface NavigationContextType {
  currentPage: string;
  params?: any;
  navigate: (currentScreen: string, params?: any) => void;
  goBack: (returnParams?: any) => void; // 👈 returnParams eklendi
  setMenuOpen: (menuOpen: boolean) => void;
  menuOpen: boolean;
  headerTitle?: string;
  setHeaderTitle: (title: string) => void;
}

export interface IResponseBase {
  success: boolean;
  id?: any;
 error?: string;
}