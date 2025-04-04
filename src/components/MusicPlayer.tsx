import React, { useState, useEffect, useRef } from "react";
import YouTube, { YouTubePlayer, YouTubeEvent } from "react-youtube";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  SwipeableDrawer,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  VolumeUp,
  VolumeOff,
  Repeat,
  RepeatOne,
  Shuffle,
  QueueMusic,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { Video } from "../types";
import "../App.css";

interface MusicPlayerProps {
  currentVideo: Video | null;
  queue: Video[];
  onPrevious: () => void;
  onNext: () => void;
  onQueueUpdate: (queue: Video[]) => void;
  onToggleQueue?: () => void;
  playbackHistory?: Video[];
  isPlayingPlaylist?: boolean;
  hasNextTrack?: boolean;
  hasPreviousTrack?: boolean;
  repeatMode?: "none" | "one" | "all";
  onRepeatModeChange?: (mode: "none" | "one" | "all") => void;
  shuffleEnabled?: boolean;
  onShuffleChange?: (enabled: boolean) => void;
  isMobile?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentVideo,
  queue,
  onPrevious,
  onNext,
  onQueueUpdate,
  onToggleQueue,
  playbackHistory = [],
  isPlayingPlaylist = false,
  hasNextTrack = false,
  hasPreviousTrack = false,
  repeatMode = "none",
  onRepeatModeChange,
  shuffleEnabled = false,
  onShuffleChange,
  isMobile = false,
}) => {
  // 상태 변수들
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // 플레이어 참조
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 모바일 여부 확인
  const theme = useTheme();
  const isMobileDevice =
    useMediaQuery(theme.breakpoints.down("sm")) || isMobile;

  // YouTube 플레이어 옵션
  const youtubeOpts = {
    height: "0",
    width: "0",
    playerVars: {
      autoplay: 1,
      controls: 0,
      mute: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
    },
  };

  // 플레이어 준비 완료 핸들러
  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;

    if (playerRef.current) {
      playerRef.current.setVolume(volume);
      playerRef.current.unMute();
      setIsMuted(false);
      setIsPlaying(true);
      playerRef.current.playVideo();
      startProgressTracking();

      // 영상 길이 설정
      setDuration(playerRef.current.getDuration());
    }
  };

  // 플레이어 상태 변경 핸들러
  const handleStateChange = (event: YouTubeEvent) => {
    const playerState = event.data;

    if (playerState === 1) {
      // 재생
      setIsPlaying(true);
      startProgressTracking();
    } else if (playerState === 2) {
      // 일시정지
      setIsPlaying(false);
      stopProgressTracking();
    } else if (playerState === 0) {
      // 종료
      handleVideoEnd();
    } else if (playerState === 3) {
      // 버퍼링
      // 버퍼링 UI 표시 가능
    }

    // 영상 길이 가져오기
    if (playerRef.current && playerState !== -1) {
      setDuration(playerRef.current.getDuration());
    }
  };

  // 재생/일시정지 토글
  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // 진행 상태 추적 시작
  const startProgressTracking = () => {
    stopProgressTracking();

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 500);
  };

  // 진행 상태 추적 중지
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // 볼륨 변경
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setVolume(value);

    if (playerRef.current) {
      playerRef.current.setVolume(value);
      if (value === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  // 음소거 토글
  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // 진행 바 변경
  const handleProgressChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    if (playerRef.current) {
      playerRef.current.seekTo(value, true);
      setCurrentTime(value);
    }
  };

  // 비디오 종료 처리
  const handleVideoEnd = () => {
    if (repeatMode === "one") {
      // 한 곡 반복
      if (playerRef.current) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      }
    } else if (queue.length > 0 || hasNextTrack || repeatMode === "all") {
      // 다음 곡 재생
      onNext();
    } else {
      // 재생할 곡 없음
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // 시간 형식 변환 (mm:ss)
  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // 컴포넌트 정리
  useEffect(() => {
    return () => stopProgressTracking();
  }, []);

  // 현재 비디오 변경 시 처리
  useEffect(() => {
    setCurrentTime(0);

    if (currentVideo) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      stopProgressTracking();
    }
  }, [currentVideo]);

  // 전체 화면으로 열기
  const openFullPlayer = () => setFullPlayerOpen(true);

  // 전체 화면 닫기
  const closeFullPlayer = () => setFullPlayerOpen(false);

  // 볼륨 슬라이더 토글
  const toggleVolumeSlider = () => setShowVolumeSlider(!showVolumeSlider);

  // 미니 플레이어 렌더링
  const renderMiniPlayer = () => {
    if (!currentVideo) return null;

    return (
      <Paper
        elevation={3}
        className="mini-player"
        sx={{
          position: "fixed",
          bottom: isMobileDevice ? 56 : 0,
          left: 0,
          right: 0,
          zIndex: 10,
          borderRadius: 0,
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
        onClick={openFullPlayer}
      >
        {/* 진행 상태 바 */}
        <Box className="progress-container">
          <Box
            className="progress-bar"
            sx={{
              height: 2,
              width: "100%",
              position: "relative",
              bgcolor: "rgba(255,255,255,0.1)",
            }}
          >
            <Box
              className="progress-bar-fill"
              sx={{
                position: "absolute",
                height: "100%",
                left: 0,
                bgcolor: "#1db954",
                width: `${(currentTime / duration) * 100}%`,
              }}
            />
          </Box>
        </Box>

        {/* 컨트롤 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 1,
          }}
        >
          {/* 앨범 아트와 정보 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              overflow: "hidden",
              mr: 1,
            }}
          >
            <Box
              component="img"
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              sx={{
                width: isMobileDevice ? 40 : 48,
                height: isMobileDevice ? 40 : 48,
                borderRadius: 1,
                objectFit: "cover",
                mr: 1.5,
              }}
            />
            <Box sx={{ overflow: "hidden" }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 500, lineHeight: 1.2 }}
              >
                {currentVideo.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {currentVideo.channelTitle}
              </Typography>
            </Box>
          </Box>

          {/* 컨트롤 버튼 */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* 재생 버튼 */}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="play-button"
              size="small"
              sx={{
                color: "white",
                bgcolor: "#1db954",
                "&:hover": { bgcolor: "#1ed760" },
                width: isMobileDevice ? 36 : 40,
                height: isMobileDevice ? 36 : 40,
                ml: 1,
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Box>
        </Box>
      </Paper>
    );
  };

  // 전체 플레이어 렌더링
  const renderFullPlayer = () => {
    if (!currentVideo) return null;

    return (
      <SwipeableDrawer
        anchor="bottom"
        open={fullPlayerOpen}
        onClose={closeFullPlayer}
        onOpen={openFullPlayer}
        disableSwipeToOpen
        swipeAreaWidth={0}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            height: "100%",
            backgroundColor: "#121212",
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(18,18,18,0.9)), url(${currentVideo.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          },
        }}
      >
        {/* 상단 닫기 핸들 */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            pt: 2,
            pb: 1,
          }}
        >
          <IconButton
            onClick={closeFullPlayer}
            color="inherit"
            sx={{ color: "rgba(255,255,255,0.8)" }}
          >
            <KeyboardArrowDown />
          </IconButton>
        </Box>

        {/* 앨범 아트 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            px: 3,
            py: 2,
            flex: 1,
          }}
        >
          <Box
            className="album-art"
            sx={{
              width: isMobileDevice ? "75%" : "50%",
              aspectRatio: "1",
              mb: 4,
              mt: 2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <img
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>

          {/* 노래 정보 */}
          <Box sx={{ width: "100%", mb: 3 }}>
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: "bold",
                color: "white",
                mb: 0.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {currentVideo.title}
            </Typography>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              {currentVideo.channelTitle}
            </Typography>
          </Box>

          {/* 진행 바 */}
          <Box sx={{ width: "100%", px: 1, mb: 4 }}>
            <Slider
              value={currentTime}
              max={duration || 100}
              onChange={handleProgressChange}
              sx={{
                color: "#1db954",
                height: 4,
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  transition: "0.3s all",
                  "&:hover, &.Mui-active": {
                    boxShadow: "0px 0px 0px 8px rgba(29, 185, 84, 0.16)",
                  },
                },
                "& .MuiSlider-rail": {
                  opacity: 0.3,
                },
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 1,
                px: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                {formatTime(currentTime)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>

          {/* 재생 컨트롤 */}
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <IconButton
              onClick={() =>
                onShuffleChange && onShuffleChange(!shuffleEnabled)
              }
              sx={{
                color: shuffleEnabled ? "#1db954" : "rgba(255,255,255,0.7)",
              }}
            >
              <Shuffle />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <IconButton
                onClick={onPrevious}
                disabled={!hasPreviousTrack && playbackHistory.length === 0}
                sx={{
                  color: "white",
                  fontSize: "2rem",
                  "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
                }}
              >
                <SkipPrevious fontSize="large" />
              </IconButton>

              <IconButton
                onClick={togglePlayPause}
                className="play-button"
                sx={{
                  color: "white",
                  bgcolor: "#1db954",
                  "&:hover": { bgcolor: "#1ed760" },
                  width: 64,
                  height: 64,
                }}
              >
                {isPlaying ? (
                  <Pause sx={{ fontSize: 32 }} />
                ) : (
                  <PlayArrow sx={{ fontSize: 32 }} />
                )}
              </IconButton>

              <IconButton
                onClick={onNext}
                disabled={queue.length === 0 && !hasNextTrack}
                sx={{
                  color: "white",
                  fontSize: "2rem",
                  "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
                }}
              >
                <SkipNext fontSize="large" />
              </IconButton>
            </Box>

            <IconButton
              onClick={() =>
                onRepeatModeChange &&
                onRepeatModeChange(
                  repeatMode === "none"
                    ? "all"
                    : repeatMode === "all"
                    ? "one"
                    : "none"
                )
              }
              sx={{
                color:
                  repeatMode !== "none" ? "#1db954" : "rgba(255,255,255,0.7)",
              }}
            >
              {repeatMode === "one" ? <RepeatOne /> : <Repeat />}
            </IconButton>
          </Box>

          {/* 볼륨 & 대기열 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              px: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <IconButton
                onClick={toggleVolumeSlider}
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
              </IconButton>

              {showVolumeSlider && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: -80,
                    width: 40,
                    height: 80,
                    bgcolor: "rgba(0,0,0,0.7)",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 1,
                    zIndex: 10,
                  }}
                >
                  <Slider
                    orientation="vertical"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    min={0}
                    max={100}
                    sx={{
                      color: "#1db954",
                      height: "100%",
                      "& .MuiSlider-thumb": {
                        width: 10,
                        height: 10,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            <IconButton
              onClick={onToggleQueue}
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              <QueueMusic />
              {queue.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    ml: 0.5,
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {queue.length}
                </Typography>
              )}
            </IconButton>
          </Box>
        </Box>
      </SwipeableDrawer>
    );
  };

  return (
    <>
      {/* 숨겨진 유튜브 플레이어 */}
      <Box
        sx={{
          position: "absolute",
          top: -9999,
          left: -9999,
          zIndex: -1,
          opacity: 0.01,
        }}
      >
        {currentVideo && (
          <YouTube
            videoId={currentVideo.id}
            opts={youtubeOpts}
            onReady={handleReady}
            onStateChange={handleStateChange}
          />
        )}
      </Box>

      {/* 미니 플레이어 */}
      {renderMiniPlayer()}

      {/* 전체 화면 플레이어 */}
      {renderFullPlayer()}
    </>
  );
};

export default MusicPlayer;
