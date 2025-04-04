// src/services/auth/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { User } from "../../types";

// Firebase 구성 (실제 구성)
export const firebaseConfig = {
  apiKey: "AIzaSyCVBfD4ZD5KnjJPC1LRjgoYNDX_5BR4TDU",
  authDomain: "stafy-810b4.firebaseapp.com",
  projectId: "stafy-810b4",
  storageBucket: "stafy-810b4.firebasestorage.app",
  messagingSenderId: "263588267635",
  appId: "1:263588267635:web:283591d7e16d0be6b84c06",
  measurementId: "G-8816LP3QGK",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Firebase 사용자를 앱 사용자로 변환
const transformUser = (firebaseUser: FirebaseUser): User => {
  // 로컬 스토리지에서 로그인 제공자 정보 가져오기
  const provider = localStorage.getItem("authProvider") || "unknown";

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    photoURL: firebaseUser.photoURL || "",
    provider,
  };
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  return transformUser(firebaseUser);
};

// 인증 상태 변경 감지
export const onAuthChange = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(transformUser(firebaseUser));
    } else {
      callback(null);
    }
  });
};

// Google로 로그인
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // 로그인 제공자 정보 저장
    localStorage.setItem("authProvider", "google");
    return transformUser(result.user);
  } catch (error) {
    console.error("Google 로그인 오류:", error);
    return null;
  }
};

// GitHub로 로그인
export const signInWithGithub = async (): Promise<User | null> => {
  try {
    const provider = new GithubAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // 로그인 제공자 정보 저장
    localStorage.setItem("authProvider", "github");
    return transformUser(result.user);
  } catch (error) {
    console.error("GitHub 로그인 오류:", error);
    return null;
  }
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    localStorage.removeItem("authProvider");
    localStorage.removeItem("currentUser");
  } catch (error) {
    console.error("로그아웃 오류:", error);
    throw error;
  }
};

// 기기 ID 생성 또는 가져오기
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
};
