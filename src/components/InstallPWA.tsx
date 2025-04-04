import React, { useState, useEffect } from "react";
import {
  Button,
  Snackbar,
  Alert,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, GetApp as GetAppIcon } from "@mui/icons-material";

// PWA 설치 이벤트를 관리하는 인터페이스
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallMessage, setShowInstallMessage] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 설치 여부 확인
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      // 브라우저 기본 설치 프롬프트 방지
      e.preventDefault();
      // 이벤트 저장
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 사용자에게 설치 메시지 표시
      setShowInstallMessage(true);
    };

    // 앱이 성공적으로 설치되면 설치 버튼 숨기기
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallMessage(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 설치 프롬프트 표시
    deferredPrompt.prompt();

    // 사용자 응답 대기
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("사용자가 앱 설치에 동의했습니다");
    } else {
      console.log("사용자가 앱 설치를 거부했습니다");
    }

    // 프롬프트 재사용 불가
    setDeferredPrompt(null);
    setShowInstallMessage(false);
  };

  const handleClose = () => {
    setShowInstallMessage(false);
  };

  // 이미 설치된 경우 아무것도 표시하지 않음
  if (isInstalled) return null;

  return (
    <Snackbar
      open={showInstallMessage}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ mb: 2 }}
    >
      <Alert
        severity="info"
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
        }}
        action={
          <>
            <Button
              color="primary"
              size="small"
              startIcon={<GetAppIcon />}
              onClick={handleInstallClick}
              sx={{ mr: 1 }}
            >
              설치하기
            </Button>
            <IconButton size="small" color="inherit" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        <Typography variant="body2">
          앱을 홈 화면에 설치해서 더 편리하게 이용하세요!
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default InstallPWA;
