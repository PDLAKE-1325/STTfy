import React from "react";
import {
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { Video } from "../types";

interface VideoItemProps {
  video: Video;
  onSelect: () => void;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, onSelect }) => {
  return (
    <ListItemButton
      alignItems="flex-start"
      onClick={onSelect}
      sx={{
        borderRadius: 1,
        mb: 1,
        "&:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          variant="rounded"
          src={video.thumbnail}
          alt={video.title}
          sx={{ width: 120, height: 67, marginRight: 2 }}
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            variant="subtitle1"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {video.title}
          </Typography>
        }
        secondary={
          <Typography variant="body2" color="text.secondary">
            {video.channelTitle}
          </Typography>
        }
      />
    </ListItemButton>
  );
};

export default VideoItem;
