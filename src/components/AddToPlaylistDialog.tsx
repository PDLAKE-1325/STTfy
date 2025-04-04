import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  ListItemIcon,
} from "@mui/material";
import {
  Add as AddIcon,
  PlaylistAdd as PlaylistAddIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { Playlist, Video } from "../types";

interface AddToPlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  playlists: Playlist[];
  currentVideo: Video | null;
  onAddToPlaylist: (playlistId: string, video: Video) => void;
  onCreatePlaylist: (name: string, initialVideo?: Video) => void;
}

const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  open,
  onClose,
  playlists,
  currentVideo,
  onAddToPlaylist,
  onCreatePlaylist,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);

  const handleTogglePlaylist = (playlistId: string) => {
    if (selectedPlaylists.includes(playlistId)) {
      setSelectedPlaylists((prev) => prev.filter((id) => id !== playlistId));
    } else {
      setSelectedPlaylists((prev) => [...prev, playlistId]);
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() && currentVideo) {
      onCreatePlaylist(newPlaylistName.trim(), currentVideo);
      setNewPlaylistName("");
      setShowCreateForm(false);
    }
  };

  const handleSave = () => {
    if (currentVideo) {
      selectedPlaylists.forEach((playlistId) => {
        onAddToPlaylist(playlistId, currentVideo);
      });
    }
    onClose();
    setSelectedPlaylists([]);
  };

  const handleClose = () => {
    onClose();
    setShowCreateForm(false);
    setNewPlaylistName("");
    setSelectedPlaylists([]);
  };

  const isVideoInPlaylist = (playlist: Playlist, videoId: string) => {
    return playlist.videos.some((video) => video.id === videoId);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="add-to-playlist-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="add-to-playlist-dialog-title">
        플레이리스트에 추가
      </DialogTitle>
      <DialogContent dividers>
        {!currentVideo ? (
          <Typography variant="body1" color="text.secondary" align="center">
            선택된 음악이 없습니다.
          </Typography>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                {currentVideo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentVideo.channelTitle}
              </Typography>
            </Box>

            <Divider />

            <List sx={{ mb: 2 }}>
              <ListItemButton
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <ListItemIcon>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText primary="새 플레이리스트 만들기" />
              </ListItemButton>

              {showCreateForm && (
                <Box
                  sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    label="플레이리스트 이름"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    variant="outlined"
                    margin="dense"
                  />
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                  >
                    <Button
                      size="small"
                      onClick={() => setShowCreateForm(false)}
                      sx={{ mr: 1 }}
                    >
                      취소
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                    >
                      만들기
                    </Button>
                  </Box>
                </Box>
              )}
            </List>

            <Divider />

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              내 플레이리스트
            </Typography>

            <List>
              {playlists.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  플레이리스트가 없습니다.
                </Typography>
              ) : (
                playlists.map((playlist) => {
                  const isAlreadyInPlaylist = isVideoInPlaylist(
                    playlist,
                    currentVideo.id
                  );
                  const isSelected = selectedPlaylists.includes(playlist.id);

                  return (
                    <ListItemButton
                      key={playlist.id}
                      onClick={() =>
                        !isAlreadyInPlaylist &&
                        handleTogglePlaylist(playlist.id)
                      }
                      disabled={isAlreadyInPlaylist}
                      selected={isSelected}
                      sx={{
                        opacity: isAlreadyInPlaylist ? 0.6 : 1,
                        borderLeft: isSelected ? "4px solid #1DB954" : "none",
                        pl: isSelected ? 1 : 2,
                      }}
                    >
                      <ListItemIcon>
                        {isAlreadyInPlaylist ? (
                          <CheckIcon color="success" />
                        ) : (
                          <PlaylistAddIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={playlist.name}
                        secondary={`${playlist.videos.length}곡`}
                      />
                    </ListItemButton>
                  );
                })
              )}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>취소</Button>
        <Button
          onClick={handleSave}
          color="primary"
          disabled={!currentVideo || selectedPlaylists.length === 0}
        >
          추가
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddToPlaylistDialog;
