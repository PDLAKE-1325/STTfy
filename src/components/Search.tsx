import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  List,
} from "@mui/material";
import { Search as SearchIcon, Clear } from "@mui/icons-material";
import { Video } from "../types";
import { searchVideos } from "../services/api";
import VideoItem from "./VideoItem";

interface SearchProps {
  onVideoSelect: (video: Video) => void;
}

const Search: React.FC<SearchProps> = ({ onVideoSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const videos = await searchVideos(query);
      setResults(videos);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
      <TextField
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for music..."
        variant="outlined"
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton onClick={clearSearch} edge="end">
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ textAlign: "center", py: 2 }}>Loading...</Box>
      ) : (
        <List sx={{ width: "100%" }}>
          {results.map((video) => (
            <VideoItem
              key={video.id}
              video={video}
              onSelect={() => onVideoSelect(video)}
            />
          ))}
        </List>
      )}
    </Box>
  );
};

export default Search;
