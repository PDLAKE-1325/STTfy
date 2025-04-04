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
  useMediaQuery,
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
  // 모바일 화면 감지
  const isMobile = useMediaQuery("(max-width:600px)");

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
      <Typography variant="subtitle1" sx={{ p: isMobile ? 1 : 2 }}>
        대기열 - {queue.length}곡
      </Typography>
      <Divider />

      {currentVideo && (
        <>
          <ListItem
            sx={{
              bgcolor: "rgba(29, 185, 84, 0.1)",
              borderLeft: "4px solid #1DB954",
              py: isMobile ? 1 : 2,
            }}
          >
            <ListItemAvatar>
              <Avatar
                variant="rounded"
                src={currentVideo.thumbnail}
                alt={currentVideo.title}
                sx={{ width: isMobile ? 40 : 50, height: isMobile ? 40 : 50 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography
                  variant={isMobile ? "body2" : "body1"}
                  fontWeight="medium"
                >
                  재생 중
                </Typography>
              }
              secondary={
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  noWrap
                  sx={{ maxWidth: isMobile ? "120px" : "200px" }}
                >
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
              <IconButton
                edge="end"
                onClick={() => onRemove(video.id)}
                size={isMobile ? "small" : "medium"}
              >
                <Delete fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            }
            sx={{
              py: isMobile ? 0.75 : 1.5,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            <IconButton
              edge="start"
              onClick={() => onSelect(video)}
              sx={{ mr: isMobile ? 0.5 : 1 }}
              size={isMobile ? "small" : "medium"}
            >
              <PlayArrow fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
            <ListItemAvatar>
              <Avatar
                variant="rounded"
                src={video.thumbnail}
                alt={video.title}
                sx={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  noWrap
                  sx={{ maxWidth: isMobile ? "120px" : "200px" }}
                >
                  {video.title}
                </Typography>
              }
              secondary={
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  noWrap
                  sx={{ fontSize: isMobile ? "10px" : "inherit" }}
                >
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
