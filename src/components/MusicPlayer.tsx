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
    setPlayer(event.target);
    setDuration(event.target.getDuration());

    // Set initial volume
    event.target.setVolume(volume);

    // Auto play when ready
    event.target.playVideo();

    // Start tracking progress
    startProgressTracking();
  };

  const handleStateChange = (event: YouTubeEvent) => {
    const playerState = event.data;

    // PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    setIsPlaying(playerState === 1);

    if (playerState === 1) {
      startProgressTracking();
    } else if (playerState === 0) {
      // Video ended
      handleVideoEnded();
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

  return (
    <Card
      sx={{
        width: "100%",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      {currentVideo ? (
        <>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              height: 0,
              overflow: "hidden",
            }}
          >
            <YouTube
              videoId={currentVideo.id}
              opts={{
                height: "0",
                width: "0",
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  rel: 0,
                  modestbranding: 1,
                  origin: window.location.origin,
                },
              }}
              onReady={handleReady}
              onStateChange={handleStateChange}
              className="youtube-player"
            />
          </Box>

          <Box sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "30%",
                  minWidth: 200,
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                  image={currentVideo.thumbnail}
                  alt={currentVideo.title}
                />
                <Box>
                  <Typography
                    variant="subtitle1"
                    noWrap
                    sx={{ maxWidth: "100%" }}
                  >
                    {currentVideo.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {currentVideo.channelTitle}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <Tooltip
                    title={isPreviousDisabled ? "이전 곡 없음" : "이전 곡"}
                  >
                    <span>
                      <IconButton
                        color="inherit"
                        size="small"
                        onClick={onPrevious}
                        disabled={isPreviousDisabled}
                      >
                        <SkipPrevious />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <IconButton
                    color="primary"
                    onClick={togglePlayPause}
                    sx={{
                      mx: 1,
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": { bgcolor: "primary.dark" },
                      height: 48,
                      width: 48,
                    }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>

                  <Tooltip title={isNextDisabled ? "다음 곡 없음" : "다음 곡"}>
                    <span>
                      <IconButton
                        color="inherit"
                        size="small"
                        onClick={onNext}
                        disabled={isNextDisabled}
                      >
                        <SkipNext />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={
                      repeatMode === "none"
                        ? "반복 재생 꺼짐"
                        : repeatMode === "all"
                        ? "전체 반복 재생"
                        : "한 곡 반복 재생"
                    }
                  >
                    <IconButton
                      color="inherit"
                      size="small"
                      onClick={toggleRepeatMode}
                      sx={{
                        ml: 1,
                        color:
                          repeatMode !== "none"
                            ? theme.palette.primary.main
                            : "inherit",
                      }}
                    >
                      {repeatMode === "one" ? <RepeatOne /> : <Repeat />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip
                    title={
                      isShuffleDisabled
                        ? "플레이리스트에서만 사용 가능"
                        : shuffleEnabled
                        ? "셔플 켜짐"
                        : "셔플 꺼짐"
                    }
                  >
                    <span>
                      <IconButton
                        color="inherit"
                        size="small"
                        onClick={toggleShuffle}
                        disabled={isShuffleDisabled}
                        sx={{
                          color:
                            shuffleEnabled && !isShuffleDisabled
                              ? theme.palette.primary.main
                              : "inherit",
                          opacity: isShuffleDisabled ? 0.5 : 1,
                        }}
                      >
                        <Shuffle />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    maxWidth: 800,
                    mx: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ mr: 1, minWidth: 40, textAlign: "right" }}
                  >
                    {formatTime(currentTime)}
                  </Typography>
                  <Slider
                    value={currentTime}
                    min={0}
                    max={duration || 100}
                    onChange={handleProgressChange}
                    aria-labelledby="time-slider"
                    sx={{
                      color: "primary.main",
                      height: 4,
                      "& .MuiSlider-thumb": {
                        width: 8,
                        height: 8,
                        transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                        "&:hover, &.Mui-focusVisible": {
                          boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}33`,
                        },
                        "&:before": {
                          boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)",
                        },
                      },
                      "& .MuiSlider-rail": {
                        opacity: 0.28,
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ ml: 1, minWidth: 40 }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "20%",
                  justifyContent: "flex-end",
                }}
              >
                <IconButton
                  color="inherit"
                  onClick={handleVolumeClick}
                  aria-describedby={volumePopoverId}
                >
                  {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                </IconButton>

                <Popover
                  id={volumePopoverId}
                  open={open}
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
                  sx={{ overflow: "hidden" }}
                >
                  <Box
                    sx={{
                      height: 120,
                      width: 40,
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <Slider
                      value={volume}
                      min={0}
                      max={100}
                      onChange={handleVolumeChange}
                      orientation="vertical"
                      aria-labelledby="volume-slider"
                      className="volume-slider"
                      sx={{
                        color: "primary.main",
                        height: "90%",
                        "& .MuiSlider-rail": {
                          backgroundColor: theme.palette.grey[400],
                        },
                      }}
                    />
                  </Box>
                </Popover>

                <IconButton color="inherit" onClick={onToggleQueue}>
                  <QueueMusic />
                </IconButton>
              </Box>
            </Stack>
          </Box>
        </>
      ) : (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="subtitle1">음악을 선택해주세요</Typography>
          <Typography variant="body2" color="text.secondary">
            검색하거나 추천 음악을 선택하여 재생할 수 있습니다
          </Typography>
        </Box>
      )}

      <audio
        ref={audioRef}
        src={currentVideo?.audioUrl}
        onTimeUpdate={updateTime}
        onLoadedMetadata={loadMetadata}
        onEnded={onEnded}
      />
    </Card>
  );
};

export default MusicPlayer;
