import React, { useState, useEffect, useRef } from "react";
import YouTube, { YouTubePlayer, YouTubeEvent } from "react-youtube";
import {
  Box,
  Card,
  Typography,
  IconButton,
  Slider,
  Stack,
  Drawer,
  useTheme,
  Avatar,
  LinearProgress,
  Container,
  useMediaQuery,
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
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { Video } from "../types";

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
  // 플레이어 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);

  // 플레이어 참조
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 모바일 화면 확인
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm")) || isMobile;

  // YouTube 플레이어 옵션
  const youtubeOpts = {
    height: isSmallScreen ? "0" : "0",
    width: isSmallScreen ? "0" : "0",
    playerVars: {
      autoplay: 1,
      controls: 0,
      mute: 0, // 음소거 해제
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1, // 모바일에서 필요
    },
  };

  // 플레이어 준비 완료 핸들러
  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setPlayerReady(true);

    // 볼륨 설정 및 즉시 재생
    if (playerRef.current) {
      playerRef.current.setVolume(volume);

      // 음소거 해제 및 재생 시작
      playerRef.current.unMute();
      setIsMuted(false);
      playerRef.current.playVideo();

      // 진행 상태 추적 시작
      startProgressTracking();
    }
  };

  // 플레이어 상태 변경 핸들러
  const handleStateChange = (event: YouTubeEvent) => {
    const playerState = event.data;

    // 재생 상태 업데이트
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
      setIsPlaying(false);
    }

    // 영상 길이 가져오기
    if (playerRef.current && playerState !== -1) {
      setDuration(playerRef.current.getDuration());
    }
  };

  // 재생/일시정지 토글
  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  // 진행 상태 추적 시작
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const currentTime = playerRef.current.getCurrentTime();
        setCurrentTime(currentTime);
      }
    }, 1000);
  };

  // 진행 상태 추적 중지
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // 볼륨 변경 핸들러
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
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  // 진행 바 클릭 핸들러
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

  // 시간 포맷팅 (mm:ss)
  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // 컴포넌트 제거 시 정리
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, []);

  // 전체 플레이어 토글
  const toggleFullPlayer = () => {
    setFullPlayerOpen(!fullPlayerOpen);
  };

  // 현재 비디오가 변경되면 플레이어 업데이트
  useEffect(() => {
    setCurrentTime(0);

    // 새 비디오가 설정되면 재생 상태를 true로 설정
    if (currentVideo) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      stopProgressTracking();
    }
  }, [currentVideo]);

  // 미니 플레이어 렌더링
  const renderMiniPlayer = () => {
    if (!currentVideo) return null;

    return (
      <Card
        elevation={3}
        sx={{
          position: "fixed",
          bottom: isSmallScreen ? 56 : 0, // 모바일 탭 메뉴 위에 위치
          left: 0,
          right: 0,
          zIndex: 10,
          bgcolor: "background.paper",
          borderRadius: isSmallScreen ? 0 : "8px 8px 0 0",
          overflow: "hidden",
        }}
      >
        {/* 진행 상태 바 */}
        <LinearProgress
          variant="determinate"
          value={(currentTime / duration) * 100}
          sx={{
            height: 2,
            "& .MuiLinearProgress-bar": {
              bgcolor: "#1db954", // Spotify 그린 컬러
              transition: "transform 0.1s linear",
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: isSmallScreen ? 1 : 2,
            py: isSmallScreen ? 0.8 : 1.2,
          }}
        >
          {/* 앨범 커버와 음악 정보 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexBasis: isSmallScreen ? "60%" : "40%",
              overflow: "hidden",
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
            }}
            onClick={toggleFullPlayer}
          >
            <Avatar
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              variant="rounded"
              sx={{
                width: isSmallScreen ? 40 : 56,
                height: isSmallScreen ? 40 : 56,
                mr: 1.5,
                borderRadius: 1,
              }}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                noWrap
                sx={{ fontWeight: 500 }}
              >
                {currentVideo.title}
              </Typography>
              <Typography
                variant={isSmallScreen ? "caption" : "body2"}
                color="text.secondary"
                noWrap
              >
                {currentVideo.channelTitle}
              </Typography>
            </Box>
            {isSmallScreen ? null : (
              <IconButton
                size="small"
                onClick={toggleFullPlayer}
                sx={{ ml: 1 }}
              >
                <ExpandLess />
              </IconButton>
            )}
          </Box>

          {/* 재생 컨트롤 */}
          <Stack
            direction="row"
            spacing={isSmallScreen ? 0.5 : 1.5}
            alignItems="center"
            sx={{ flexBasis: isSmallScreen ? "40%" : "30%" }}
          >
            {!isSmallScreen && (
              <IconButton
                onClick={onPrevious}
                disabled={!hasPreviousTrack && playbackHistory.length === 0}
                size={isSmallScreen ? "small" : "medium"}
              >
                <SkipPrevious />
              </IconButton>
            )}

            <IconButton
              onClick={togglePlayPause}
              size={isSmallScreen ? "small" : "medium"}
              sx={{
                bgcolor: "#1db954", // Spotify 그린 컬러
                color: "white",
                "&:hover": { bgcolor: "#1ed760" },
                width: isSmallScreen ? 32 : 40,
                height: isSmallScreen ? 32 : 40,
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            {!isSmallScreen && (
              <IconButton
                onClick={onNext}
                disabled={queue.length === 0 && !hasNextTrack}
                size={isSmallScreen ? "small" : "medium"}
              >
                <SkipNext />
              </IconButton>
            )}

            {isSmallScreen ? (
              <IconButton
                size="small"
                onClick={onToggleQueue}
                sx={{ ml: isSmallScreen ? 0.5 : 1 }}
              >
                <QueueMusic fontSize="small" />
              </IconButton>
            ) : (
              <>
                <IconButton onClick={toggleMute} size="small">
                  {isMuted || volume === 0 ? (
                    <VolumeOff fontSize="small" />
                  ) : (
                    <VolumeUp fontSize="small" />
                  )}
                </IconButton>
                <Box
                  sx={{
                    width: 60,
                    ml: 0.5,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  <Slider
                    size="small"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    min={0}
                    max={100}
                    sx={{
                      color: "#1db954",
                      "& .MuiSlider-thumb": {
                        width: 10,
                        height: 10,
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </Stack>
        </Box>
      </Card>
    );
  };

  // 전체 화면 플레이어 렌더링
  const renderFullPlayer = () => {
    if (!currentVideo) return null;

    return (
      <Drawer
        anchor="bottom"
        open={fullPlayerOpen}
        onClose={toggleFullPlayer}
        PaperProps={{
          sx: {
            height: "calc(100% - 56px)",
            bgcolor: "background.default",
            backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(18,18,18,0.95)), url(${currentVideo.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "darken",
          },
        }}
      >
        <Container maxWidth="sm" sx={{ height: "100%", pt: 3, pb: 4 }}>
          {/* 헤더 - 닫기 버튼 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <IconButton onClick={toggleFullPlayer} sx={{ color: "white" }}>
              <ExpandMore />
            </IconButton>
          </Box>

          {/* 앨범 아트 */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: isSmallScreen ? "70%" : "60%",
                aspectRatio: "1",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
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
          </Box>

          {/* 음악 정보 */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 1,
                color: "white",
              }}
            >
              {currentVideo.title}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              {currentVideo.channelTitle}
            </Typography>
          </Box>

          {/* 재생 진행 바 */}
          <Box sx={{ mb: 4 }}>
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleProgressChange}
              aria-label="progress"
              sx={{
                color: "#1db954",
                height: 4,
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                },
                mb: 1,
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 1,
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
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <IconButton
              onClick={() =>
                onShuffleChange && onShuffleChange(!shuffleEnabled)
              }
              color={shuffleEnabled ? "primary" : "default"}
              sx={{ color: shuffleEnabled ? "#1db954" : "white" }}
            >
              <Shuffle />
            </IconButton>

            <IconButton
              onClick={onPrevious}
              disabled={!hasPreviousTrack && playbackHistory.length === 0}
              sx={{
                color: "white",
                "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
              }}
            >
              <SkipPrevious fontSize="large" />
            </IconButton>

            <IconButton
              onClick={togglePlayPause}
              sx={{
                bgcolor: "#1db954",
                color: "white",
                "&:hover": { bgcolor: "#1ed760" },
                width: 64,
                height: 64,
              }}
            >
              {isPlaying ? (
                <Pause fontSize="large" />
              ) : (
                <PlayArrow fontSize="large" />
              )}
            </IconButton>

            <IconButton
              onClick={onNext}
              disabled={queue.length === 0 && !hasNextTrack}
              sx={{
                color: "white",
                "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
              }}
            >
              <SkipNext fontSize="large" />
            </IconButton>

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
                color: repeatMode !== "none" ? "#1db954" : "white",
              }}
            >
              {repeatMode === "one" ? <RepeatOne /> : <Repeat />}
            </IconButton>
          </Stack>

          {/* 대기열 버튼 */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <IconButton onClick={onToggleQueue} sx={{ color: "white" }}>
              <QueueMusic />
              {queue.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{ ml: 1, color: "rgba(255,255,255,0.7)" }}
                >
                  {queue.length} 곡
                </Typography>
              )}
            </IconButton>
          </Box>
        </Container>
      </Drawer>
    );
  };

  return (
    <>
      {/* YouTube 플레이어 (숨김 처리) */}
      <Box
        sx={{
          position: "fixed",
          top: -9999,
          left: -9999,
          visibility: "hidden",
          zIndex: -1,
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
