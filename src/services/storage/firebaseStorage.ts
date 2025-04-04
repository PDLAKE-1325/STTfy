import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../auth/firebase";

// Firebase 스토리지 초기화
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * 이미지 파일을 Firebase Storage에 업로드
 * @param file 업로드할 이미지 파일
 * @param userId 사용자 ID (폴더 경로로 사용)
 * @param fileName 파일 이름 (기본값: 타임스탬프 기반 생성)
 * @returns 업로드된 이미지의 다운로드 URL
 */
export const uploadImage = async (
  file: File,
  userId: string,
  fileName?: string
): Promise<string> => {
  try {
    // 파일 확장자 추출
    const fileExtension = file.name.split(".").pop() || "jpg";

    // 파일 이름이 제공되지 않은 경우 타임스탬프 기반으로 생성
    const finalFileName = fileName || `${Date.now()}.${fileExtension}`;

    // 스토리지 경로 생성 (users/{userId}/profile/{fileName})
    const storageRef = ref(storage, `users/${userId}/profile/${finalFileName}`);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);

    // 업로드된 파일의 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    throw new Error("이미지 업로드에 실패했습니다.");
  }
};

/**
 * Firebase Storage에서 이미지 삭제
 * 참고: 이 기능은 Firebase Storage 보안 규칙에 따라 제한될 수 있습니다.
 * @param imageUrl 삭제할 이미지 URL
 */
// export const deleteImage = async (imageUrl: string): Promise<void> => {
//   try {
//     // URL에서 참조 경로 추출 (Firebase 스토리지 URL 형식에 따름)
//     const storageRef = ref(storage, getPathFromURL(imageUrl));
//     await deleteObject(storageRef);
//   } catch (error) {
//     console.error("이미지 삭제 오류:", error);
//     throw new Error("이미지 삭제에 실패했습니다.");
//   }
// };

/**
 * URL에서 Firebase Storage 참조 경로 추출
 * 참고: 현재는 구현되지 않음
 */
// const getPathFromURL = (url: string): string => {
//   // Firebase Storage URL에서 경로를 추출하는 로직
//   // 이 함수는 URL 형식에 따라 구현이 필요함
//   return "";
// };
