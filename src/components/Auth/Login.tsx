import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

interface LoginProps {
  open: boolean;
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ open, onClose }) => {
  const { signInWithGoogle, signInWithGithub, isLoading, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (provider: "google" | "github") => {
    setIsLoggingIn(true);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      onClose();
    } catch (error) {
      console.error("로그인 오류:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoggingIn ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">로그인</Typography>
        <IconButton onClick={onClose} disabled={isLoggingIn}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
            계정에 로그인하고 플레이리스트와 음악을 동기화하세요.
          </Typography>

          {error && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 2, textAlign: "center" }}
            >
              {error}
            </Typography>
          )}

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={() => handleLogin("google")}
              disabled={isLoggingIn}
              sx={{ mb: 2 }}
            >
              Google로 로그인
            </Button>

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<GitHubIcon />}
              onClick={() => handleLogin("github")}
              disabled={isLoggingIn}
            >
              GitHub로 로그인
            </Button>
          </Box>

          {isLoggingIn && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            로그인하면 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Login;
