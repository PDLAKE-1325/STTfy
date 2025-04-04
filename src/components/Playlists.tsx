import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Divider,
  ListItemSecondaryAction,
  DialogContentText,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  QueueMusic as QueueMusicIcon,
} from "@mui/icons-material";
import { Playlist, Video } from "../types";

interface PlaylistsProps {
  playlists: Playlist[];
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRenamePlaylist: (playlistId: string, newName: string) => void;
  onPlayPlaylist: (playlistId: string) => void;
  onAddToQueue: (videos: Video[]) => void;
  onSelectPlaylist: (playlistId: string) => void;
  selectedPlaylistId: string | null;
}

const Playlists: React.FC<PlaylistsProps> = ({
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onPlayPlaylist,
  onAddToQueue,
  onSelectPlaylist,
  selectedPlaylistId,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );

  const handleCreateOpen = () => {
    setNewPlaylistName("");
    setCreateDialogOpen(true);
  };

  const handleCreateClose = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateSubmit = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setCreateDialogOpen(false);
      setNewPlaylistName("");
    }
  };

  const handleDeleteOpen = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setSelectedPlaylist(null);
  };

  const handleDeleteSubmit = () => {
    if (selectedPlaylist) {
      onDeletePlaylist(selectedPlaylist.id);
      setDeleteDialogOpen(false);
      setSelectedPlaylist(null);
    }
  };

  const handleRenameOpen = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setRenameDialogOpen(true);
  };

  const handleRenameClose = () => {
    setRenameDialogOpen(false);
    setSelectedPlaylist(null);
  };

  const handleRenameSubmit = () => {
    if (selectedPlaylist && newPlaylistName.trim()) {
      onRenamePlaylist(selectedPlaylist.id, newPlaylistName.trim());
      setRenameDialogOpen(false);
      setSelectedPlaylist(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">내 플레이리스트</Typography>
        <IconButton color="primary" onClick={handleCreateOpen}>
          <AddIcon />
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ width: "100%" }}>
        {playlists.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              아직 플레이리스트가 없습니다. 새 플레이리스트를 만들어보세요!
            </Typography>
          </Box>
        ) : (
          playlists.map((playlist) => (
            <ListItemButton
              key={playlist.id}
              selected={selectedPlaylistId === playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
              sx={{
                borderLeft:
                  selectedPlaylistId === playlist.id
                    ? "4px solid #1DB954"
                    : "none",
                pl: selectedPlaylistId === playlist.id ? 2 : 3,
              }}
            >
              <ListItemText
                primary={playlist.name}
                secondary={`${playlist.videos.length}곡 • ${formatDate(
                  playlist.createdAt
                )}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => onPlayPlaylist(playlist.id)}
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => onAddToQueue(playlist.videos)}
                >
                  <QueueMusicIcon fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleRenameOpen(playlist)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteOpen(playlist)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItemButton>
          ))
        )}
      </List>

      {/* 플레이리스트 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onClose={handleCreateClose}>
        <DialogTitle>새 플레이리스트 만들기</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="플레이리스트 이름"
            type="text"
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose}>취소</Button>
          <Button onClick={handleCreateSubmit} color="primary">
            만들기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 플레이리스트 삭제 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>플레이리스트 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{selectedPlaylist?.name}' 플레이리스트를 정말로 삭제하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>취소</Button>
          <Button onClick={handleDeleteSubmit} color="error">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 플레이리스트 이름 변경 다이얼로그 */}
      <Dialog open={renameDialogOpen} onClose={handleRenameClose}>
        <DialogTitle>플레이리스트 이름 변경</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="새 이름"
            type="text"
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameClose}>취소</Button>
          <Button onClick={handleRenameSubmit} color="primary">
            변경
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Playlists;
