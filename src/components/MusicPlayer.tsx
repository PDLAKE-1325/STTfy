import React, { useState, useEffect, useRef } from "react";
import YouTube, { YouTubePlayer, YouTubeEvent } from "react-youtube";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Button,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  VolumeUp,
  VolumeOff,
  RepeatOne,
  Repeat,
  RepeatOneOn,
  Shuffle,
  PlaylistAdd,
} from "@mui/icons-material";
import { Video } from "../types";
import "../App.css";

// 화면 재생 콘텐츠를 렌더링하는 별도의 컴포넌트를 수정하여 needsUserInteraction 상태 추가
export const NowPlayingContent: React.FC<{
  currentVideo: Video | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  videoViews: string;
  onToggleMute: (e: React.MouseEvent) => void;
  togglePlayPause: (e?: React.MouseEvent) => void;
  handleVolumeChange: (event: Event, newValue: number | number[]) => void;
  handleProgressChange: (event: Event, newValue: number | number[]) => void;
  handlePrevious: (e: React.MouseEvent) => void;
  handleNext: (e: React.MouseEvent) => void;
  formatTime: (time: number) => string;
  hasNextTrack: boolean;
  hasPreviousTrack: boolean;
  needsUserInteraction?: boolean;
  attemptUnmute?: () => void;
  repeatMode?: "none" | "one" | "all";
  onRepeatModeChange?: (mode: "none" | "one" | "all") => void;
  shuffleEnabled?: boolean;
  onShuffleChange?: (enabled: boolean) => void;
  isPlayingPlaylist?: boolean;
  onAddToPlaylist?: (video: Video) => void;
}> = ({
  currentVideo,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  videoViews,
  onToggleMute,
  togglePlayPause,
  handleVolumeChange,
  handleProgressChange,
  handlePrevious,
  handleNext,
  formatTime,
  hasNextTrack,
  hasPreviousTrack,
  needsUserInteraction,
  attemptUnmute,
  repeatMode = "none",
  onRepeatModeChange,
  shuffleEnabled = false,
  onShuffleChange,
  isPlayingPlaylist = false,
  onAddToPlaylist,
}) => {
  if (!currentVideo) return null;

  // 반복 모드 전환 함수
  const handleToggleRepeat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRepeatModeChange && isPlayingPlaylist) {
      if (repeatMode === "none") {
        onRepeatModeChange("all");
      } else if (repeatMode === "all") {
        onRepeatModeChange("one");
      } else {
        onRepeatModeChange("none");
      }
    }
  };

  // 셔플 모드 전환 함수
  const handleToggleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShuffleChange && isPlayingPlaylist) {
      onShuffleChange(!shuffleEnabled);
    }
  };

  // 플레이리스트에 추가
  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToPlaylist && currentVideo) {
      onAddToPlaylist(currentVideo);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        p: 2,
        pt: 0,
      }}
    >
      {/* iOS 음소거 상태 알림 - iOS인 경우에만 표시 */}
      {needsUserInteraction && (
        <Box
          sx={{
            width: "100%",
            bgcolor: "rgba(0,0,0,0.7)",
            py: 1,
            px: 2,
            borderRadius: 2,
            mb: 2,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#1db954", fontWeight: "bold" }}
          >
            화면을 터치하여 오디오를 활성화하세요
          </Typography>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            sx={{ mt: 1, borderColor: "#1db954", color: "#1db954" }}
            onClick={() => attemptUnmute && attemptUnmute()}
          >
            오디오 활성화
          </Button>
        </Box>
      )}

      {/* 앨범 아트 */}
      <Box
        sx={{
          width: "85%",
          maxWidth: 320,
          aspectRatio: "1",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
          mb: 3,
          mt: 2,
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
          onClick={() => attemptUnmute && attemptUnmute()}
        />
      </Box>

      {/* 제목과 설명 */}
      <Box sx={{ width: "100%", mb: 3, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {currentVideo.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {currentVideo.channelTitle}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {videoViews || "재생 중"}
        </Typography>
      </Box>

      {/* 진행바 */}
      <Box sx={{ width: "100%", mb: 2 }}>
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
            },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>

      {/* 재생 컨트롤 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          gap: 2,
          mb: 2,
        }}
      >
        <IconButton
          onClick={(e) => {
            handlePrevious(e);
            attemptUnmute && attemptUnmute();
          }}
          disabled={!hasPreviousTrack}
          sx={{
            color: "white",
            "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
          }}
        >
          <SkipPrevious fontSize="large" />
        </IconButton>

        <IconButton
          onClick={(e) => {
            togglePlayPause(e);
            attemptUnmute && attemptUnmute();
          }}
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
          onClick={(e) => {
            handleNext(e);
            attemptUnmute && attemptUnmute();
          }}
          disabled={!hasNextTrack}
          sx={{
            color: "white",
            "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
          }}
        >
          <SkipNext fontSize="large" />
        </IconButton>
      </Box>

      {/* 플레이백 기능 컨트롤 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          mb: 2,
          gap: 2,
        }}
      >
        {/* 셔플 버튼 */}
        <IconButton
          onClick={handleToggleShuffle}
          disabled={!isPlayingPlaylist}
          sx={{
            color: shuffleEnabled ? "#1db954" : "rgba(255,255,255,0.7)",
            "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
          }}
        >
          <Shuffle />
        </IconButton>

        {/* 반복 재생 버튼 */}
        <IconButton
          onClick={handleToggleRepeat}
          disabled={!isPlayingPlaylist}
          sx={{
            color: repeatMode !== "none" ? "#1db954" : "rgba(255,255,255,0.7)",
            "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
          }}
        >
          {repeatMode === "one" ? (
            <RepeatOneOn />
          ) : repeatMode === "all" ? (
            <Repeat sx={{ color: "#1db954" }} />
          ) : (
            <Repeat />
          )}
        </IconButton>

        {/* 플레이리스트에 추가 버튼 */}
        <IconButton
          onClick={handleAddToPlaylist}
          sx={{
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <PlaylistAdd />
        </IconButton>

        {/* 볼륨 컨트롤 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "60%",
            maxWidth: 200,
          }}
        >
          <IconButton
            onClick={(e) => {
              onToggleMute(e);
              attemptUnmute && attemptUnmute();
            }}
            sx={{ color: "rgba(255,255,255,0.7)", mr: 1 }}
          >
            {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
          </IconButton>

          <Slider
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            sx={{
              color: "#1db954",
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

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
  onNavigateToNowPlaying?: () => void;
}

// App.tsx에서 접근할 수 있도록 외부로 타입 내보내기
export interface MusicPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  videoViews: string;
  toggleMute: (e: React.MouseEvent) => void;
  togglePlayPause: (e?: React.MouseEvent) => void;
  handleVolumeChange: (event: Event, newValue: number | number[]) => void;
  handleProgressChange: (event: Event, newValue: number | number[]) => void;
  formatTime: (time: number) => string;
  needsUserInteraction?: boolean;
  attemptUnmute?: () => boolean;
  isPlayingPlaylist?: boolean;
}

// 재생 상태를 모니터링하기 위한 리스너 함수형 타입
export type PlayerStateListener = (state: MusicPlayerState) => void;

// 전역 state 변수들
let playerState: MusicPlayerState | null = null;
let stateListeners: PlayerStateListener[] = [];

// 상태 변경 시 통지
const notifyStateListeners = (state: MusicPlayerState) => {
  playerState = state;
  stateListeners.forEach((listener) => listener(state));
};

// App.tsx에서 사용할 상태 구독 함수
export const usePlayerState = (listener: PlayerStateListener) => {
  useEffect(() => {
    stateListeners.push(listener);

    // 이미 상태가 있으면 즉시 알림
    if (playerState) {
      listener(playerState);
    }

    return () => {
      stateListeners = stateListeners.filter((l) => l !== listener);
    };
  }, [listener]);

  return playerState;
};

// 시간 형식 변환 (mm:ss) - 외부에서 사용할 수 있게 export
export const formatTimeHelper = (time: number): string => {
  if (isNaN(time)) return "0:00";

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentVideo,
  queue,
  onPrevious,
  onNext,
  onQueueUpdate,
  isPlayingPlaylist = false,
  hasNextTrack = false,
  hasPreviousTrack = false,
  repeatMode = "none",
  onRepeatModeChange,
  shuffleEnabled = false,
  onShuffleChange,
  isMobile = false,
  onNavigateToNowPlaying,
}) => {
  // 상태 변수들
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [videoViews, setVideoViews] = useState<string>("");
  const [isIOS, setIsIOS] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const interactionRef = useRef(false);

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
      mute: isIOS ? 1 : 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      origin: window.location.origin,
      enablejsapi: 1,
    },
  };

  // 플레이어 준비 완료 핸들러
  const handleReady = (event: YouTubeEvent) => {
    console.log("YouTube Player Ready, iOS:", isIOS);
    playerRef.current = event.target;

    if (playerRef.current) {
      // 초기 상태 설정
      try {
        // iOS에서는 초기에 음소거된 상태로 시작
        if (!isIOS) {
          // 비 iOS 디바이스
          playerRef.current.setVolume(volume);
          playerRef.current.unMute();
          setIsMuted(false);
        } else {
          // iOS 디바이스 - 음소거 상태 유지
          setIsMuted(true);
          console.log(
            "iOS 디바이스: 음소거 상태로 시작, 화면 터치시 소리가 활성화됩니다"
          );
        }

        // 영상 길이 설정
        const videoDuration = playerRef.current.getDuration();
        if (videoDuration && videoDuration > 0) {
          setDuration(videoDuration);
        }

        // 재생 시작
        setIsPlaying(true);
        playerRef.current.playVideo();
        startProgressTracking();

        // 조회수 정보 가져오기
        setTimeout(() => {
          try {
            const videoData = playerRef.current?.getVideoData();
            if (videoData && videoData.view_count) {
              const views = parseInt(videoData.view_count);
              if (!isNaN(views)) {
                setVideoViews(formatViewCount(views));
              }
            }
          } catch (error) {
            console.log("조회수 정보를 가져올 수 없습니다");
          }
        }, 1000);
      } catch (error) {
        console.error("YouTube 플레이어 초기화 중 오류:", error);
      }
    }
  };

  // 플레이어 상태 변경 핸들러
  const handleStateChange = (event: YouTubeEvent) => {
    const playerState = event.data;
    console.log("YouTube Player State Changed:", playerState);

    if (playerState === 1) {
      // 재생
      console.log("YouTube Player: Playing");
      setIsPlaying(true);
      startProgressTracking();
    } else if (playerState === 2) {
      // 일시정지
      console.log("YouTube Player: Paused");
      setIsPlaying(false);
      stopProgressTracking();
    } else if (playerState === 0) {
      // 종료
      console.log("YouTube Player: Ended");
      handleVideoEnd();
    } else if (playerState === 3) {
      // 버퍼링
      console.log("YouTube Player: Buffering");
      // 버퍼링 중에도 진행 상태는 계속 추적
      if (!progressIntervalRef.current) {
        startProgressTracking();
      }
    } else if (playerState === 5) {
      // 큐 상태
      console.log("YouTube Player: Video cued");
    } else if (playerState === -1) {
      // 초기화되지 않음
      console.log("YouTube Player: Unstarted");
      // 초기화가 안됐을 경우 다시 시도
      if (playerRef.current) {
        setTimeout(() => {
          try {
            playerRef.current?.playVideo();
          } catch (e) {
            console.error("재생 시도 중 오류:", e);
          }
        }, 1000);
      }
    }

    // 영상 길이 가져오기
    if (playerRef.current && playerState !== -1) {
      try {
        const videoDuration = playerRef.current.getDuration();
        if (videoDuration && videoDuration > 0) {
          setDuration(videoDuration);
        }
      } catch (e) {
        console.error("영상 길이 가져오기 오류:", e);
      }
    }
  };

  // 재생/일시정지 토글
  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!playerRef.current) {
      console.log("Player reference not available");
      return;
    }

    console.log("Toggle Play/Pause, current state:", isPlaying);
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (error) {
      console.error("재생/일시정지 전환 중 오류:", error);
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
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();

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

  // 조회수 형식화 (1000 -> 1천, 1000000 -> 100만)
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${Math.floor(count / 1000000)}만 회`;
    } else if (count >= 1000) {
      return `${Math.floor(count / 1000)}천 회`;
    } else {
      return `${count} 회`;
    }
  };

  // 시간 형식 변환 (mm:ss)
  const formatTime = (time: number): string => {
    return formatTimeHelper(time);
  };

  // 음소거 해제 시도 함수
  const attemptUnmute = () => {
    if (playerRef.current && needsUserInteraction) {
      try {
        console.log("음소거 해제 시도");
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
        setIsMuted(false);
        setNeedsUserInteraction(false);
        return true;
      } catch (err) {
        console.error("음소거 해제 시도 중 오류:", err);
      }
    }
    return false;
  };

  // 컴포넌트 정리
  useEffect(() => {
    return () => stopProgressTracking();
  }, []);

  // 현재 비디오 변경 시 처리
  useEffect(() => {
    console.log("currentVideo changed:", currentVideo?.title);
    setCurrentTime(0);
    setVideoViews("");

    if (currentVideo) {
      setIsPlaying(true);

      // 현재 플레이어가 있고 다른 비디오 재생 중인 경우
      if (playerRef.current) {
        try {
          // 플레이어가 이미 로드된 경우 새 비디오 로드
          const currentVideoId = playerRef.current.getVideoData()?.video_id;
          if (currentVideoId !== currentVideo.id) {
            console.log("Loading new video:", currentVideo.id);
            playerRef.current.loadVideoById(currentVideo.id);
          } else {
            // 같은 비디오면 처음부터 재생
            console.log("Restarting current video");
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          }
        } catch (error) {
          console.error("비디오 변경 중 오류:", error);
        }
      }
    } else {
      setIsPlaying(false);
      stopProgressTracking();

      // 비디오가 없으면 플레이어 정지
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
        } catch (error) {
          console.error("비디오 정지 중 오류:", error);
        }
      }
    }
  }, [currentVideo]);

  // 볼륨 슬라이더 토글
  const toggleVolumeSlider = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVolumeSlider(!showVolumeSlider);
  };

  // 이전 곡 버튼 핸들러 (이벤트 전파 방지)
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrevious();
  };

  // 다음 곡 버튼 핸들러 (이벤트 전파 방지)
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNext();
  };

  // 상태 변경 시 리스너에게 알림
  useEffect(() => {
    const state: MusicPlayerState = {
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      videoViews,
      toggleMute,
      togglePlayPause,
      handleVolumeChange,
      handleProgressChange,
      formatTime,
      needsUserInteraction,
      attemptUnmute,
      isPlayingPlaylist,
    };

    notifyStateListeners(state);
  }, [
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    videoViews,
    needsUserInteraction,
    isPlayingPlaylist,
  ]);

  // iOS가 아닌 경우에는 사용자 상호작용 필요 없이 자동 재생
  useEffect(() => {
    // iOS 디바이스 감지
    const detectIOS = () => {
      const userAgent = navigator.userAgent;
      const isIOSDevice =
        /iPad|iPhone|iPod/.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      setIsIOS(isIOSDevice);
      // iOS만 사용자 상호작용 필요
      setNeedsUserInteraction(isIOSDevice);
      console.log("iOS 디바이스 감지:", isIOSDevice);
    };

    detectIOS();

    // iOS에서만 사용자 상호작용 감지를 위한 이벤트 리스너 추가
    if (isIOS) {
      const handleUserInteraction = () => {
        if (needsUserInteraction && !interactionRef.current) {
          console.log("사용자 상호작용 감지됨, 오디오 활성화 시도");
          interactionRef.current = true;

          // 플레이어가 준비되었으면 음소거 해제
          if (playerRef.current) {
            try {
              playerRef.current.unMute();
              playerRef.current.setVolume(volume);
              setIsMuted(false);
              setNeedsUserInteraction(false);
            } catch (e) {
              console.error("음소거 해제 중 오류:", e);
            }
          }
        }
      };

      // 다양한 사용자 상호작용 이벤트 리스닝
      const interactionEvents = ["touchstart", "touchend", "click", "keydown"];
      interactionEvents.forEach((event) => {
        document.addEventListener(event, handleUserInteraction, {
          once: false,
        });
      });

      return () => {
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, handleUserInteraction);
        });
      };
    }
  }, [needsUserInteraction, volume, isIOS]);

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
        onClick={(e) => {
          if (needsUserInteraction) {
            // iOS에서 첫 상호작용시 오디오 활성화 시도
            if (playerRef.current) {
              try {
                playerRef.current.unMute();
                playerRef.current.setVolume(volume);
                setIsMuted(false);
                setNeedsUserInteraction(false);
              } catch (err) {
                console.error("음소거 해제 시도 중 오류:", err);
              }
            }
          }

          // 기본 클릭 핸들러 실행
          if (onNavigateToNowPlaying) {
            onNavigateToNowPlaying();
          }
        }}
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

        {/* iOS 음소거 상태 알림 - iOS인 경우에만 표시 */}
        {needsUserInteraction && (
          <Box
            sx={{
              width: "100%",
              bgcolor: "rgba(0,0,0,0.7)",
              py: 0.5,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "#1db954", fontWeight: "bold" }}
            >
              터치하여 오디오 활성화
            </Typography>
          </Box>
        )}

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

          {/* 셔플 버튼 - 플레이리스트 재생시에만 활성화 */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (onShuffleChange && isPlayingPlaylist) {
                onShuffleChange(!shuffleEnabled);
              }
            }}
            disabled={!isPlayingPlaylist}
            size="small"
            sx={{
              color: shuffleEnabled ? "#1db954" : "rgba(255,255,255,0.5)",
              mr: 1,
              "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
            }}
          >
            <Shuffle fontSize="small" />
          </IconButton>

          {/* 반복 재생 버튼 - 플레이리스트 재생시에만 활성화 */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (onRepeatModeChange && isPlayingPlaylist) {
                if (repeatMode === "none") {
                  onRepeatModeChange("all");
                } else if (repeatMode === "all") {
                  onRepeatModeChange("one");
                } else {
                  onRepeatModeChange("none");
                }
              }
            }}
            disabled={!isPlayingPlaylist}
            size="small"
            sx={{
              color:
                repeatMode !== "none" ? "#1db954" : "rgba(255,255,255,0.5)",
              mr: 1,
              "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
            }}
          >
            {repeatMode === "one" ? (
              <RepeatOneOn fontSize="small" />
            ) : repeatMode === "all" ? (
              <Repeat fontSize="small" sx={{ color: "#1db954" }} />
            ) : (
              <Repeat fontSize="small" />
            )}
          </IconButton>

          {/* 재생 버튼 */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();

              // iOS에서는 이 버튼 클릭으로도 음소거 해제 시도
              if (needsUserInteraction && playerRef.current) {
                try {
                  playerRef.current.unMute();
                  playerRef.current.setVolume(volume);
                  setIsMuted(false);
                  setNeedsUserInteraction(false);
                } catch (err) {
                  console.error("음소거 해제 시도 중 오류:", err);
                }
              }
            }}
            className="play-button"
            size="small"
            sx={{
              color: "white",
              bgcolor: "#1db954",
              "&:hover": { bgcolor: "#1ed760" },
              width: isMobileDevice ? 36 : 40,
              height: isMobileDevice ? 36 : 40,
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Box>
      </Paper>
    );
  };

  return (
    <>
      {/* YouTube 플레이어 컨테이너 */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "1px",
          height: "1px",
          opacity: 0.01,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
        className="youtube-player-container"
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

      {/* 미니 플레이어 */}
      {renderMiniPlayer()}
    </>
  );
};

export default MusicPlayer;
