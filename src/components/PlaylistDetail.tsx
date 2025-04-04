import React from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  ListItemSecondaryAction,
  Paper,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  QueueMusic as QueueMusicIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { Playlist, Video } from "../types";

interface PlaylistDetailProps {
  playlist: Playlist | null;
  currentVideo: Video | null;
  onBack: () => void;
  onPlayVideo: (video: Video) => void;
  onRemoveFromPlaylist: (playlistId: string, videoId: string) => void;
  onPlayAll: (videos: Video[]) => void;
  onAddToQueue: (video: Video) => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({
  playlist,
  currentVideo,
  onBack,
  onPlayVideo,
  onRemoveFromPlaylist,
  onPlayAll,
  onAddToQueue,
}) => {
  if (!playlist) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          선택된 플레이리스트가 없습니다.
        </Typography>
      </Box>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto" }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" noWrap>
          {playlist.name}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ p: 2, bgcolor: "background.paper" }}>
        <Typography variant="subtitle2" color="text.secondary">
          {playlist.videos.length}곡 • 생성일: {formatDate(playlist.createdAt)}
        </Typography>

        {playlist.videos.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => onPlayAll(playlist.videos)}
            sx={{ mt: 2 }}
          >
            전체 재생
          </Button>
        )}
      </Box>

      <Divider />

      <List sx={{ width: "100%" }}>
        {playlist.videos.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              이 플레이리스트에는 아직 음악이 없습니다.
            </Typography>
          </Box>
        ) : (
          playlist.videos.map((video, index) => (
            <ListItemButton
              key={`${video.id}-${index}`}
              selected={currentVideo?.id === video.id}
              onClick={() => onPlayVideo(video)}
              sx={{
                borderLeft:
                  currentVideo?.id === video.id ? "4px solid #1DB954" : "none",
                pl: currentVideo?.id === video.id ? 2 : 3,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ width: 30, textAlign: "center" }}
              >
                {index + 1}
              </Typography>
              <ListItemAvatar>
                <Avatar
                  variant="rounded"
                  src={video.thumbnail}
                  alt={video.title}
                  sx={{ width: 60, height: 40, ml: 1 }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body1" noWrap>
                    {video.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {video.channelTitle}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => onAddToQueue(video)}>
                  <QueueMusicIcon fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => onRemoveFromPlaylist(playlist.id, video.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItemButton>
          ))
        )}
      </List>
    </Box>
  );
};

export default PlaylistDetail;
