import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  signInWithGoogle,
  signInWithGithub,
  logout,
  onAuthChange,
  getCurrentUser,
} from "../services/auth/firebase";
import { User, AuthState } from "../types";

// 인증 컨텍스트의 타입 정의
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

// 기본 컨텍스트 값
const defaultAuthState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 사용자 정의 훅
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다");
  }

  return context;
};

// 컨텍스트 제공자 컴포넌트
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("저장된 사용자 정보 파싱 오류:", error);
      }
    }

    // Firebase 인증 상태 변경 리스너 설정
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        // 사용자 정보 로컬 스토리지에 저장
        localStorage.setItem("currentUser", JSON.stringify(user));
      } else {
        // 로그아웃 시 사용자 정보 제거
        localStorage.removeItem("currentUser");
      }

      setAuthState({
        user,
        isLoading: false,
        error: null,
      });
    });

    return () => unsubscribe();
  }, []);

  // Google 로그인 핸들러
  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const user = await signInWithGoogle();

      if (!user) {
        throw new Error("로그인 실패");
      }

      setAuthState((prev) => ({
        ...prev,
        user,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "로그인 중 오류가 발생했습니다",
      }));
    }
  };

  // GitHub 로그인 핸들러
  const handleGithubSignIn = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const user = await signInWithGithub();

      if (!user) {
        throw new Error("로그인 실패");
      }

      setAuthState((prev) => ({
        ...prev,
        user,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "로그인 중 오류가 발생했습니다",
      }));
    }
  };

  // 로그아웃 핸들러
  const handleLogout = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      await logout();

      setAuthState((prev) => ({
        user: null,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "로그아웃 중 오류가 발생했습니다",
      }));
    }
  };

  // 프로필 업데이트 함수
  const updateProfile = async (
    displayName?: string,
    photoURL?: string
  ): Promise<void> => {
    if (!authState.user) return;

    try {
      // 실제로는 Firebase Auth API를 통해 프로필 업데이트 구현
      // 여기서는 간단히 로컬 상태만 업데이트
      const updatedUser = {
        ...authState.user,
        displayName: displayName || authState.user.displayName,
        photoURL: photoURL || authState.user.photoURL,
      };

      // 로컬 상태 업데이트
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));

      // 로컬 스토리지 업데이트
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      console.log("프로필 업데이트 성공:", updatedUser);
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      throw error;
    }
  };

  // 컨텍스트 값 정의
  const contextValue: AuthContextType = {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signInWithGoogle: handleGoogleSignIn,
    signInWithGithub: handleGithubSignIn,
    logout: handleLogout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
