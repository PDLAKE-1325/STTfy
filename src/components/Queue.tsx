import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { Delete, PlayArrow } from "@mui/icons-material";
import { Video } from "../types";

interface QueueProps {
  queue: Video[];
  currentVideo: Video | null;
  onSelect: (video: Video) => void;
  onRemove: (videoId: string) => void;
}

const Queue: React.FC<QueueProps> = ({
  queue,
  currentVideo,
  onSelect,
  onRemove,
}) => {
  if (queue.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          시청기록이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: "100%", maxHeight: "400px", overflow: "auto" }}>
      <Typography variant="subtitle1" sx={{ p: 2 }}>
        Queue - {queue.length} songs
      </Typography>
      <Divider />

      {currentVideo && (
        <>
          <ListItem
            sx={{
              bgcolor: "rgba(29, 185, 84, 0.1)",
              borderLeft: "4px solid #1DB954",
            }}
          >
            <ListItemAvatar>
              <Avatar
                variant="rounded"
                src={currentVideo.thumbnail}
                alt={currentVideo.title}
                sx={{ width: 50, height: 50 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body1" fontWeight="medium">
                  Now Playing
                </Typography>
              }
              secondary={
                <Typography variant="body2" noWrap sx={{ maxWidth: "200px" }}>
                  {currentVideo.title}
                </Typography>
              }
            />
          </ListItem>
          <Divider />
        </>
      )}

      {queue
        .filter((video) => !currentVideo || video.id !== currentVideo.id)
        .map((video) => (
          <ListItem
            key={video.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => onRemove(video.id)}>
                <Delete fontSize="small" />
              </IconButton>
            }
            sx={{
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            <IconButton
              edge="start"
              onClick={() => onSelect(video)}
              sx={{ mr: 1 }}
            >
              <PlayArrow fontSize="small" />
            </IconButton>
            <ListItemAvatar>
              <Avatar
                variant="rounded"
                src={video.thumbnail}
                alt={video.title}
                sx={{ width: 40, height: 40 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body2" noWrap sx={{ maxWidth: "200px" }}>
                  {video.title}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary" noWrap>
                  {video.channelTitle}
                </Typography>
              }
            />
          </ListItem>
        ))}
    </List>
  );
};

export default Queue;
