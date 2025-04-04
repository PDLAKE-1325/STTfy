import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Person,
  Edit,
  DeleteForever,
  Logout,
  Warning,
  AddAPhoto,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onClearData: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  anchorEl,
  onClose,
  onClearData,
}) => {
  const { user, logout, updateProfile } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      if (file.type.startsWith("image/")) {
        setUploadedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadError("이미지 파일만 업로드할 수 있습니다.");
      }
    },
    [setUploadError, setUploadedFile, setPreviewUrl]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setUploadError(null);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile, setUploadError]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError(null);
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        handleFile(file);
      }
    },
    [handleFile, setUploadError]
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!user) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleOpenEditProfile = () => {
    setDisplayName(user.displayName);
    setPhotoURL(user.photoURL);
    setPreviewUrl(null);
    setUploadedFile(null);
    setUploadError(null);
    setEditProfileOpen(true);
    onClose();
  };

  const handleSaveProfile = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);

      let finalPhotoURL = photoURL;

      if (uploadedFile && previewUrl) {
        finalPhotoURL = previewUrl;
      }

      await updateProfile(displayName, finalPhotoURL);
      setEditProfileOpen(false);

      setSnackbar({
        open: true,
        message: "프로필이 성공적으로 업데이트되었습니다.",
        severity: "success",
      });
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      setUploadError("프로필 업데이트 중 오류가 발생했습니다.");

      setSnackbar({
        open: true,
        message: "프로필 업데이트 중 오류가 발생했습니다.",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetData = () => {
    setResetConfirmOpen(true);
    onClose();
  };

  const handleConfirmReset = () => {
    onClearData();
    setResetConfirmOpen(false);
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        PaperProps={{
          elevation: 3,
          sx: { width: 250, mt: 1 },
        }}
      >
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Avatar
            src={user.photoURL}
            alt={user.displayName}
            sx={{ width: 60, height: 60, mx: "auto", mb: 1 }}
          />
          <Typography variant="subtitle1">{user.displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleOpenEditProfile}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>프로필 편집</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleResetData}>
          <ListItemIcon>
            <DeleteForever fontSize="small" />
          </ListItemIcon>
          <ListItemText>계정 데이터 초기화</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>로그아웃</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={editProfileOpen}
        onClose={() => !isUploading && setEditProfileOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>프로필 편집</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Paper
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                position: "relative",
                mb: 2,
                overflow: "visible",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: isDragging
                  ? "2px dashed #00BFFF"
                  : "2px solid transparent",
                transition: "border 0.3s ease",
                bgcolor: "transparent",
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <CircularProgress size={40} />
              ) : (
                <>
                  <Avatar
                    src={previewUrl || photoURL}
                    alt={displayName}
                    sx={{ width: 120, height: 120, overflow: "hidden" }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <IconButton
                    aria-label="upload picture"
                    sx={{
                      position: "absolute",
                      bottom: -5,
                      right: -5,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
                      zIndex: 1,
                      width: 32,
                      height: 32,
                      boxShadow: "0 0 5px rgba(0,0,0,0.5)",
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <AddAPhoto fontSize="small" />
                  </IconButton>
                </>
              )}
            </Paper>

            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              이미지를 끌어다 놓거나 클릭하여 업로드하세요
            </Typography>

            {uploadError && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {uploadError}
              </Typography>
            )}

            {uploadedFile && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                선택된 파일: {uploadedFile.name} (
                {(uploadedFile.size / 1024).toFixed(1)} KB)
              </Typography>
            )}

            <TextField
              label="이름"
              variant="outlined"
              fullWidth
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              sx={{ mb: 2 }}
              disabled={isUploading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditProfileOpen(false)}
            disabled={isUploading}
          >
            취소
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            color="primary"
            disabled={isUploading}
          >
            {isUploading ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
      >
        <DialogTitle
          color="error"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Warning color="error" />
          데이터 초기화 확인
        </DialogTitle>
        <DialogContent>
          <Typography>
            플레이리스트, 시청 기록, 저장된 음악 등 모든 계정 데이터가
            삭제됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirmOpen(false)}>취소</Button>
          <Button
            onClick={handleConfirmReset}
            variant="contained"
            color="error"
          >
            초기화
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfileMenu;
