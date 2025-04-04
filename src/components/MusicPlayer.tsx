import React, { useState, useEffect, useRef } from "react";
import YouTube, { YouTubePlayer, YouTubeEvent } from "react-youtube";
import {
  Box,
  Card,
  CardMedia,
  Typography,
  IconButton,
  Slider,
  Stack,
  Popover,
  useTheme,
  Tooltip,
  Dialog,
  DialogContent,
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
  Visibility,
} from "@mui/icons-material";
import { Video } from "../types";

interface MusicPlayerProps {
  currentVideo: Video | null;
  queue: Video[];
  onPrevious: () => void;
  onNext: () => void;
  onQueueUpdate: (queue: Video[]) => void;
  onToggleQueue?: () => void;
  playbackHistory?: Video[]; // 재생 기록 스택
  isPlayingPlaylist?: boolean; // 플레이리스트 또는 저장된 음악 재생 중인지
  hasNextTrack?: boolean; // 다음 트랙이 있는지
  hasPreviousTrack?: boolean; // 이전 트랙이 있는지
  repeatMode?: "none" | "one" | "all"; // 반복 재생 모드
  onRepeatModeChange?: (mode: "none" | "one" | "all") => void; // 반복 재생 모드 변경 콜백
  shuffleEnabled?: boolean; // 셔플 활성화 여부
  onShuffleChange?: (enabled: boolean) => void; // 셔플 상태 변경 콜백
  isMobile?: boolean; // 모바일 디바이스 여부
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
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const theme = useTheme();

  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // 모바일 상세 플레이어 다이얼로그 상태
  const [showDetailPlayer, setShowDetailPlayer] = useState(false);
  // 조회수 정보 (실제 구현에서는 API를 통해 가져옴)
  const [viewCount, setViewCount] = useState<string>("");

  // 조회수 포맷 함수
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // 현재 비디오가 변경되면 조회수 정보 가져오기 (랜덤 생성)
  useEffect(() => {
    if (currentVideo) {
      // 실제 구현에서는 YouTube API 호출 필요
      // 임의의 조회수 생성 (테스트용)
      const randomViews = Math.floor(Math.random() * 10000000);
      setViewCount(formatNumber(randomViews));
    }
  }, [currentVideo]);

  useEffect(() => {
    // 컴포넌트가 마운트되었을 때 이미 currentVideo가 있으면 진행 상황 추적 시작
    if (currentVideo && player && isPlaying) {
      startProgressTracking();
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentVideo, player, isPlaying]);

  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(() => {
      if (player && isPlaying) {
        try {
          const currentTimeValue = player.getCurrentTime() || 0;
          setCurrentTime(currentTimeValue);
        } catch (error) {
          console.error("재생 시간 업데이트 오류:", error);
        }
      }
    }, 500);
  };

  const handleReady = (event: YouTubeEvent) => {
    console.log("YouTube 플레이어 준비됨", event);
    setPlayer(event.target);

    try {
      // 재생 시간 설정
      const duration = event.target.getDuration();
      setDuration(duration || 0);

      // 볼륨 설정 (초기에는 항상 음소거)
      event.target.setVolume(0);
      event.target.mute();
      setIsMuted(true);

      // 자동 재생 시작
      setTimeout(() => {
        event.target.playVideo();
      }, 500);

      // 진행 상황 추적 시작
      startProgressTracking();
    } catch (error) {
      console.error("플레이어 초기화 오류:", error);
    }
  };

  const handleStateChange = (event: YouTubeEvent) => {
    console.log("YouTube 상태 변경:", event.data);
    const playerState = event.data;

    // PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (playerState === 1) {
      setIsPlaying(true);
      startProgressTracking();

      // 모바일에서 첫 재생 시 저장된 볼륨으로 설정 (사용자 상호작용 후)
      if (isMobile && player) {
        // 볼륨은 나중에 unmutePlayer 함수에서 설정
      }
    } else if (playerState === 2) {
      setIsPlaying(false);
    } else if (playerState === 0) {
      // Video ended
      handleVideoEnded();
    } else if (playerState === -1) {
      // 준비되지 않은 상태에서 다시 시도
      if (player) {
        setTimeout(() => {
          try {
            player.playVideo();
          } catch (e) {
            console.error("재생 재시도 오류:", e);
          }
        }, 1000);
      }
    }
  };

  // 비디오 종료 시 처리 함수
  const handleVideoEnded = () => {
    if (repeatMode === "one" && player) {
      // 한 곡 반복 모드면 현재 곡 다시 재생
      player.seekTo(0);
      player.playVideo();
    } else if (repeatMode === "all" && !hasNextTrack && isPlayingPlaylist) {
      // 전체 반복 모드이고 다음 곡이 없는 플레이리스트 상태면 처음부터 다시 재생
      onNext(); // App.tsx에서 처리
    } else {
      // 그 외 경우는 다음 곡으로
      onNext();
    }
  };

  const togglePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const volumeValue = newValue as number;
    setVolume(volumeValue);

    // YouTube 플레이어 볼륨 설정
    if (player) {
      player.setVolume(volumeValue);
    }

    // 오디오 요소 볼륨 설정 (백업용)
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 100;
    }

    // 음소거 상태 업데이트
    if (volumeValue === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    // 현재 음소거 상태 반전
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    // YouTube 플레이어 음소거 설정
    if (player) {
      if (newMuteState) {
        // 음소거 상태로 변경
        player.mute();
      } else {
        // 음소거 해제
        player.unMute();
        player.setVolume(volume);
      }
    }

    // 오디오 요소도 음소거 설정 (백업용)
    if (audioRef.current) {
      audioRef.current.volume = newMuteState ? 0 : volume / 100;
    }
  };

  const handleProgressChange = (_event: Event, newValue: number | number[]) => {
    const timeValue = newValue as number;
    setCurrentTime(timeValue);

    if (player) {
      player.seekTo(timeValue, true);
    }
  };

  const toggleRepeatMode = () => {
    if (onRepeatModeChange) {
      if (repeatMode === "none") onRepeatModeChange("all");
      else if (repeatMode === "all") onRepeatModeChange("one");
      else onRepeatModeChange("none");
    }
  };

  const toggleShuffle = () => {
    // 플레이리스트나 저장된 음악 목록 재생 중일 때만 셔플 가능
    if (!isPlayingPlaylist || !onShuffleChange) return;

    onShuffleChange(!shuffleEnabled);

    if (!shuffleEnabled && queue.length > 1) {
      const newQueue = [...queue];
      for (let i = newQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
      }
      onQueueUpdate(newQueue);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 볼륨 팝오버 표시/숨김
  const handleVolumeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleVolumeClose = () => {
    setAnchorEl(null);
  };

  // 팝오버 열림 상태
  const open = Boolean(anchorEl);
  const volumePopoverId = open ? "volume-popover" : undefined;

  // 오디오 관련 이벤트 핸들러
  const updateTime = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audioElement = e.currentTarget;
    setCurrentTime(audioElement.currentTime);
  };

  const loadMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audioElement = e.currentTarget;
    setDuration(audioElement.duration);
  };

  const onEnded = () => {
    handleVideoEnded();
  };

  // 이전 곡 버튼 활성화 여부 판단
  const isPreviousDisabled = isPlayingPlaylist
    ? !hasPreviousTrack
    : playbackHistory.length === 0;

  // 다음 곡 버튼 활성화 여부 판단
  const isNextDisabled = isPlayingPlaylist ? !hasNextTrack : false;

  // 셔플 버튼 활성화 여부 판단
  const isShuffleDisabled = !isPlayingPlaylist;

  // YouTube 플레이어 옵션 - 모바일 환경 고려
  const youtubeOpts = {
    width: "200", // 크기를 더 크게 설정
    height: "200", // 크기를 더 크게 설정
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      playsinline: 1, // 모바일에서 필요
      mute: 1, // 모바일에서 자동 재생을 위해 항상 초기에 음소거
    },
  };

  // 음소거 해제 함수 - 모바일에서 호출
  const unmutePlayer = () => {
    if (player) {
      try {
        player.unMute();
        player.setVolume(isMobile ? 100 : volume);
        setIsMuted(false);
      } catch (error) {
        console.error("음소거 해제 오류:", error);
      }
    }
  };

  // 사용자 상호작용을 감지하여 음소거 해제
  useEffect(() => {
    if (isPlaying && player && isMobile) {
      // 사용자가 플레이어를 클릭하면 음소거 해제
      setTimeout(() => {
        unmutePlayer();
      }, 1000);
    }
  }, [isPlaying, player, isMobile]);

  // 모바일에서 상세 플레이어 클릭 시에도 음소거 해제
  const toggleDetailPlayer = () => {
    setShowDetailPlayer(!showDetailPlayer);
    if (isMobile && player && isPlaying) {
      unmutePlayer();
    }
  };

  // 모바일에서 새 곡이 재생될 때 자동으로 상세 플레이어 열기
  useEffect(() => {
    if (isMobile && currentVideo && isPlaying) {
      // 1초 후에 상세 플레이어 열기 (애니메이션 자연스럽게)
      const timer = setTimeout(() => {
        setShowDetailPlayer(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentVideo, isMobile, isPlaying]);

  // 상세 플레이어 닫기 타이머 (10초 후 자동으로 닫힘)
  useEffect(() => {
    let closeTimer: NodeJS.Timeout | null = null;

    if (isMobile && showDetailPlayer && isPlaying) {
      // 10초 후에 상세 플레이어 닫기
      closeTimer = setTimeout(() => {
        setShowDetailPlayer(false);
      }, 10000);
    }

    return () => {
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [showDetailPlayer, isMobile, isPlaying]);

  return (
    <>
      {/* Audio 요소 - 실제 소리 출력 (YouTube API와 동기화) */}
      <audio
        ref={audioRef}
        onTimeUpdate={updateTime}
        onLoadedMetadata={loadMetadata}
        onEnded={onEnded}
      />

      {/* YouTube 컴포넌트 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
          opacity: 0.01,
        }}
        onClick={unmutePlayer}
      >
        {currentVideo && (
          <YouTube
            videoId={currentVideo.id}
            opts={youtubeOpts}
            onReady={handleReady}
            onStateChange={handleStateChange}
            className="youtube-player"
          />
        )}
      </div>

      {/* 음악 재생을 시작하기 위한 숨겨진 버튼 (모바일에서 필요) */}
      {isMobile && !isPlaying && currentVideo && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            background: "rgba(0,0,0,0.8)",
            borderRadius: "50%",
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0, 191, 255, 0.5)",
          }}
          onClick={() => {
            togglePlayPause();
            unmutePlayer();
          }}
        >
          <PlayArrow style={{ fontSize: 60, color: "#00bfff" }} />
        </div>
      )}

      {/* 모바일 상세 플레이어 다이얼로그 */}
      {isMobile && (
        <Dialog
          open={showDetailPlayer}
          onClose={toggleDetailPlayer}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            style: {
              backgroundColor: "rgba(18, 18, 18, 0.95)",
              borderRadius: "12px",
              backgroundImage: currentVideo
                ? `linear-gradient(to bottom, rgba(18, 18, 18, 0.7), rgba(18, 18, 18, 0.95)), url(${currentVideo.thumbnail})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
            }}
          >
            <IconButton onClick={toggleDetailPlayer} sx={{ color: "white" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </IconButton>
          </Box>

          <DialogContent>
            <Box sx={{ textAlign: "center", py: 2 }}>
              {currentVideo && (
                <>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      mb: 3,
                    }}
                  >
                    <Paper
                      elevation={8}
                      sx={{
                        width: "280px",
                        height: "280px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.5)",
                        transition: "transform 0.3s ease-in-out",
                        "&:hover": {
                          transform: "scale(1.02)",
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={currentVideo.thumbnail}
                        alt={currentVideo.title}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Paper>
                  </Box>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      fontSize: "1.2rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {currentVideo.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {currentVideo.channelTitle}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 1,
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Visibility fontSize="small" /> {viewCount} 조회수
                  </Typography>

                  <Box sx={{ mt: 3 }}>
                    <Slider
                      value={currentTime}
                      max={duration}
                      onChange={handleProgressChange}
                      aria-label="progress"
                      size="small"
                      sx={{
                        mb: 1,
                        color: "#00BFFF",
                        height: 4,
                        "& .MuiSlider-thumb": {
                          width: 14,
                          height: 14,
                          "&:hover": {
                            boxShadow: "0 0 0 8px rgba(0, 191, 255, 0.16)",
                          },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        px: 1,
                        mb: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(currentTime)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(duration)}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ mt: 2 }}
                  >
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
                      color={repeatMode !== "none" ? "primary" : "default"}
                      sx={{
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      {repeatMode === "one" ? <RepeatOne /> : <Repeat />}
                    </IconButton>

                    <IconButton
                      onClick={onPrevious}
                      disabled={
                        !hasPreviousTrack && playbackHistory.length === 0
                      }
                      sx={{
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      <SkipPrevious />
                    </IconButton>

                    <IconButton
                      onClick={togglePlayPause}
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": {
                          bgcolor: "primary.dark",
                          transform: "scale(1.1)",
                        },
                        width: 64,
                        height: 64,
                        transition: "all 0.2s ease",
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
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      <SkipNext />
                    </IconButton>

                    <IconButton
                      onClick={() =>
                        onShuffleChange && onShuffleChange(!shuffleEnabled)
                      }
                      color={shuffleEnabled ? "primary" : "default"}
                      sx={{
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      <Shuffle />
                    </IconButton>
                  </Stack>
                </>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* 플레이어 UI */}
      {currentVideo && (
        <Card
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            borderRadius: isMobile ? 0 : "8px 8px 0 0",
            boxShadow: 3,
            bgcolor: "background.paper",
          }}
        >
          {/* Progress Bar */}
          <Box
            sx={{ px: isMobile ? 0.5 : 2, pt: isMobile ? 0.5 : 1 }}
            className={isMobile ? "mobile-player-slider" : ""}
          >
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleProgressChange}
              aria-label="progress"
              size="small"
              sx={{ my: 0, py: 0, color: "#00BFFF" }}
              className={`slider-progress ${isPlaying ? "active" : ""}`}
            />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="caption"
                color="text.secondary"
                className={isMobile ? "mobile-player-time" : ""}
              >
                {formatTime(currentTime)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                className={isMobile ? "mobile-player-time" : ""}
              >
                {formatTime(duration)}
              </Typography>
            </Stack>
          </Box>

          {/* Controls */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: isMobile ? 1 : 2,
              py: isMobile ? 0.5 : 1,
            }}
            className={isMobile ? "mobile-player-controls" : ""}
          >
            {/* Song Info - 모바일에서는 클릭하면 상세 플레이어 열림 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: isMobile ? "40%" : "30%",
                overflow: "hidden",
                cursor: isMobile ? "pointer" : "default",
              }}
              onClick={isMobile ? toggleDetailPlayer : undefined}
            >
              <CardMedia
                component="img"
                sx={{
                  width: isMobile ? 40 : 50,
                  height: isMobile ? 40 : 50,
                  borderRadius: 1,
                  mr: 1,
                }}
                image={currentVideo.thumbnail}
                alt={currentVideo.title}
              />
              <Box sx={{ overflow: "hidden" }}>
                <Tooltip title={currentVideo.title}>
                  <Typography
                    variant={isMobile ? "body2" : "body1"}
                    noWrap
                    fontWeight="medium"
                  >
                    {currentVideo.title}
                  </Typography>
                </Tooltip>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  noWrap
                >
                  {currentVideo.channelTitle}
                </Typography>
              </Box>
            </Box>

            {/* Playback Controls */}
            <Stack
              direction="row"
              spacing={isMobile ? 0.5 : 1}
              alignItems="center"
              className={isMobile ? "mobile-control-buttons" : ""}
            >
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
                color={repeatMode !== "none" ? "primary" : "default"}
                size={isMobile ? "small" : "medium"}
              >
                {repeatMode === "one" ? <RepeatOne /> : <Repeat />}
              </IconButton>

              <IconButton
                onClick={onPrevious}
                disabled={!hasPreviousTrack && playbackHistory.length === 0}
                size={isMobile ? "small" : "medium"}
              >
                <SkipPrevious />
              </IconButton>

              <IconButton
                onClick={togglePlayPause}
                size={isMobile ? "medium" : "large"}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>

              <IconButton
                onClick={onNext}
                disabled={queue.length === 0 && !hasNextTrack}
                size={isMobile ? "small" : "medium"}
              >
                <SkipNext />
              </IconButton>

              <IconButton
                onClick={() =>
                  onShuffleChange && onShuffleChange(!shuffleEnabled)
                }
                color={shuffleEnabled ? "primary" : "default"}
                size={isMobile ? "small" : "medium"}
              >
                <Shuffle />
              </IconButton>
            </Stack>

            {/* Volume and Queue Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                width: isMobile ? "40%" : "30%",
              }}
            >
              {!isMobile && (
                <IconButton onClick={handleVolumeClick} size="small">
                  {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              )}

              <IconButton
                onClick={onToggleQueue}
                color="primary"
                size={isMobile ? "small" : "medium"}
              >
                <QueueMusic />
              </IconButton>

              {!isMobile && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 1, minWidth: 50 }}
                >
                  {queue.length > 0 && `+${queue.length}`}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Volume Popover */}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleVolumeClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
          >
            <Box sx={{ p: 2, height: 150, width: 50 }}>
              <Slider
                orientation="vertical"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                min={0}
                max={100}
                sx={{ color: "#00BFFF", height: "100%" }}
                className="volume-slider"
              />
            </Box>
          </Popover>
        </Card>
      )}
    </>
  );
};

export default MusicPlayer;
