import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Drawer,
  IconButton,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  List,
  CardContent,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  Stack,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  Link,
} from "@mui/material";
import { HashRouter as Router } from "react-router-dom";
import {
  QueueMusic,
  History as HistoryIcon,
  LibraryMusic,
  Add as AddIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Delete as DeleteIcon,
  MusicNote as MusicNoteIcon,
  RepeatOne,
  Repeat,
  SkipPrevious,
  PlayArrow,
  Pause,
  SkipNext,
  Shuffle,
  Logout as LogoutIcon,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Video, Playlist } from "./types";
import Search from "./components/Search";
import MusicPlayer, {
  NowPlayingContent,
  usePlayerState,
  formatTimeHelper,
  MusicPlayerState,
} from "./components/MusicPlayer";
import Queue from "./components/Queue";
import Playlists from "./components/Playlists";
import PlaylistDetail from "./components/PlaylistDetail";
import AddToPlaylistDialog from "./components/AddToPlaylistDialog";
import { getPopularMusicVideos, searchVideos } from "./services/api";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Auth/Login";
import ProfileMenu from "./components/ProfileMenu";
import { AuthProvider } from "./contexts/AuthContext";
import InstallPWA from "./components/InstallPWA";
import YouTube, { YouTubePlayer } from "react-youtube";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00BFFF", // 아쿠아 색상으로 변경 (기존 Spotify 녹색에서 변경)
    },
    secondary: {
      main: "#191414", // Spotify black
    },
    background: {
      default: "#121212",
      paper: "#181818",
    },
  },
  typography: {
    fontFamily: ["Circular", "Helvetica", "Arial", "sans-serif"].join(","),
  },
});

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [queue, setQueue] = useState<Video[]>([]);
  const [history, setHistory] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [mainTabValue, setMainTabValue] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isPlaylistsOpen, setIsPlaylistsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(
    null
  );
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [playerStateObj, setPlayerStateObj] = useState<MusicPlayerState | null>(
    null
  );

  // 모바일 여부 확인
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { user, signInWithGoogle, signInWithGithub, logout } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<null | HTMLElement>(null);

  // 로그인 필요 알림 다이얼로그
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [loginRequiredMessage, setLoginRequiredMessage] = useState("");

  // 재생 기록 스택 (현재 세션에서 들은 곡들의 기록)
  const [playbackStack, setPlaybackStack] = useState<Video[]>([]);

  // 플레이어 상태
  const [playerRef, setPlayerRef] = useState<YouTubePlayer | null>(null);

  // 로그인 필요 기능 확인
  const checkLoginRequired = (feature: string): boolean => {
    if (!user) {
      setLoginRequiredMessage(
        `${feature}을(를) 이용하려면 로그인이 필요합니다.`
      );
      setIsLoginRequiredOpen(true);
      return false;
    }
    return true;
  };

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    if (user) {
      // 플레이리스트 로드
      const savedPlaylists = localStorage.getItem(`playlists_${user.uid}`);
      if (savedPlaylists) {
        try {
          setPlaylists(JSON.parse(savedPlaylists));
        } catch (error) {
          console.error("Error parsing saved playlists:", error);
        }
      }

      // 히스토리 로드
      const savedHistory = localStorage.getItem(`history_${user.uid}`);
      if (savedHistory) {
        // 7일 이내의 기록만 필터링
        const allHistory = JSON.parse(savedHistory);
        const filteredHistory = allHistory.filter((video: any) => {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return video.viewedAt && video.viewedAt > sevenDaysAgo;
        });
        setHistory(filteredHistory);
      }
    } else {
      // 로그인하지 않으면 초기화
      setPlaylists([]);
      setHistory([]);
    }
  }, [user]);

  // 플레이리스트 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem(`playlists_${user.uid}`, JSON.stringify(playlists));
    }
  }, [playlists, user]);

  // 히스토리 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (user) {
      // 7일 이내의 기록만 저장
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filteredHistory = history.filter(
        (video) => video.viewedAt && video.viewedAt > sevenDaysAgo
      );
      localStorage.setItem(
        `history_${user.uid}`,
        JSON.stringify(filteredHistory)
      );
    }
  }, [history, user]);

  // 인기 음악과 추천 음악 가져오기
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const popular = await getPopularMusicVideos();
        setVideos(popular);

        // 트렌딩 음악으로 사용할 데이터 (실제로는 다른 API 호출이 필요할 수 있음)
        const trendingVideos = popular.slice(0, 10);

        // 추천 음악으로 사용할 데이터 (실제로는 다른 API 호출이 필요할 수 있음)
        const recommendedVideos = [...popular].reverse().slice(0, 10);

        setVideos(popular);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, []);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 초기 상태 설정
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 오프라인 모드에서는 저장된 음악만 재생 가능
  const availableVideos = isOffline
    ? videos
    : searchQuery && searchResults.length > 0
    ? searchResults
    : videos;

  // 오프라인 상태에서 저장되지 않은 음악 재생 시도 처리
  const handleVideoPlay = (video: Video) => {
    setCurrentVideo(video);
    setQueue((prevQueue) => {
      const index = prevQueue.findIndex((item) => item.id === video.id);
      if (index !== -1) {
        return [...prevQueue.slice(0, index), ...prevQueue.slice(index + 1)];
      }
      return prevQueue;
    });
    addToHistoryWithoutDuplicates(video);
    setMainTabValue(3); // 재생 시 자동으로 '재생 중' 탭으로 이동
  };

  // 음악이 저장되었는지 확인하는 함수
  const isVideoDownloaded = (videoId: string) => {
    return videos.some((v) => v.id === videoId);
  };

  // 시청 기록 중복 제거 및 최신 항목만 유지하는 함수
  const addToHistoryWithoutDuplicates = (video: Video) => {
    if (!user) return;

    // 중복된 항목이 있는지 확인
    const duplicateIndex = history.findIndex((v) => v.id === video.id);
    let newHistory: Video[];

    if (duplicateIndex !== -1) {
      // 중복 항목 제거 및 최신 항목으로 업데이트
      newHistory = [
        { ...video, viewedAt: Date.now() },
        ...history.slice(0, duplicateIndex),
        ...history.slice(duplicateIndex + 1),
      ];
    } else {
      // 중복 항목 없으면 그냥 추가
      newHistory = [{ ...video, viewedAt: Date.now() }, ...history];
    }

    // 최대 20개만 유지
    setHistory(newHistory.slice(0, 20));
  };

  // 플레이리스트 또는 저장된 음악을 재생하는 함수
  const startPlaylistPlayback = (
    videos: Video[],
    index: number,
    playlistId: string | null = null
  ) => {
    if (videos.length === 0 || index < 0 || index >= videos.length) return;

    // 현재 플레이리스트 재생 상태 설정
    setIsPlayingPlaylist(true);

    if (playlistId) {
      // 플레이리스트 재생 인덱스 설정
      setCurrentPlaylistId(playlistId);
    } else {
      // 저장된 음악 재생 인덱스 설정
      setCurrentPlaylistId(null);
    }

    // 선택한 비디오 재생
    const selectedVideo = videos[index];

    // 현재 재생 중인 곡과 다른 경우에만 재생기록 스택에 추가
    if (!currentVideo || currentVideo.id !== selectedVideo.id) {
      if (currentVideo) {
        // 현재 재생 중인 곡이 있다면 스택에 추가
        setPlaybackStack((prevStack) => [...prevStack, currentVideo]);
      }

      // 선택한 비디오 재생
      setCurrentVideo(selectedVideo);

      // 시청 기록에 추가 (중복 제거)
      addToHistoryWithoutDuplicates(selectedVideo);
    }
  };

  // 히스토리에 저장하는 함수
  const saveToHistory = (video: Video) => {
    // 이미 기록에 있으면 중복 제거하고 최신 항목으로 추가
    setHistory((prevHistory) => {
      const filtered = prevHistory.filter((item) => item.id !== video.id);
      return [video, ...filtered];
    });
  };

  // 음악 선택 핸들러 수정
  const handleVideoSelect = (video: Video) => {
    setCurrentVideo(video);
    handleVideoPlay(video);
  };

  // 이전 곡 재생 처리
  const handlePreviousTrack = () => {
    if (isPlayingPlaylist) {
      // 플레이리스트 또는 저장된 음악 재생 중인 경우
      if (currentPlaylistId) {
        // 플레이리스트 재생 중
        const playlist = playlists.find((p) => p.id === currentPlaylistId);
        if (playlist) {
          startPlaylistPlayback(
            playlist.videos,
            playlist.videos.indexOf(currentVideo || videos[0]),
            currentPlaylistId
          );
        }
      } else {
        // 저장된 음악 재생 중
        if (playbackStack.length > 0) {
          const previousVideo = playbackStack[playbackStack.length - 1];

          // 스택에서 제거
          setPlaybackStack((prevStack) => prevStack.slice(0, -1));

          // 이전 곡 재생
          setCurrentVideo(previousVideo);

          // 시청 기록에 추가 (중복 제거)
          addToHistoryWithoutDuplicates(previousVideo);
        }
      }
    } else {
      // 일반 재생 중인 경우 - 재생 기록 스택에서 이전 곡 가져오기
      if (playbackStack.length > 0) {
        const previousVideo = playbackStack[playbackStack.length - 1];

        // 스택에서 제거
        setPlaybackStack((prevStack) => prevStack.slice(0, -1));

        // 이전 곡 재생
        setCurrentVideo(previousVideo);

        // 시청 기록에 추가 (중복 제거)
        addToHistoryWithoutDuplicates(previousVideo);
      }
    }
  };

  // 다음 곡 재생 처리
  const handleNextTrack = () => {
    if (isPlayingPlaylist) {
      // 플레이리스트 또는 저장된 음악 재생 중인 경우
      if (currentPlaylistId) {
        // 플레이리스트 재생 중
        const playlist = playlists.find((p) => p.id === currentPlaylistId);
        if (playlist) {
          const nextIndex =
            playlist.videos.indexOf(currentVideo || videos[0]) + 1;

          // 다음 곡이 있으면 재생, 없으면 반복 모드에 따라 처리
          if (nextIndex < playlist.videos.length) {
            startPlaylistPlayback(
              playlist.videos,
              nextIndex,
              currentPlaylistId
            );
          } else if (repeatMode === "all") {
            // 전체 반복 모드면 처음부터 다시 재생
            startPlaylistPlayback(playlist.videos, 0, currentPlaylistId);
          }
        }
      } else {
        // 저장된 음악 재생 중
        const nextIndex = playbackStack.length;

        // 다음 곡이 있으면 재생, 없으면 반복 모드에 따라 처리
        if (nextIndex < videos.length) {
          startPlaylistPlayback(videos, nextIndex, null);
        } else if (repeatMode === "all") {
          // 전체 반복 모드면 처음부터 다시 재생
          startPlaylistPlayback(videos, 0, null);
        }
      }
    } else {
      // 일반 재생 중인 경우 - 비슷한 음악 추천하여 재생
      if (currentVideo) {
        // 비슷한 음악 찾기 (여기서는 간단히 추천 음악 목록에서 랜덤으로 선택)
        const recommendationPool = videos.filter(
          (v) =>
            v.id !== currentVideo.id &&
            !playbackStack.some((p) => p.id === v.id)
        );

        if (recommendationPool.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * recommendationPool.length
          );
          const recommendedVideo = recommendationPool[randomIndex];

          // 현재 곡을 스택에 추가
          setPlaybackStack((prevStack) => [...prevStack, currentVideo]);

          // 추천 곡 재생
          setCurrentVideo(recommendedVideo);

          // 시청 기록에 추가 (중복 제거)
          addToHistoryWithoutDuplicates(recommendedVideo);

          // 대기열에 추가
          if (!queue.some((item) => item.id === recommendedVideo.id)) {
            setQueue((prev) => [...prev, recommendedVideo]);
          }
        }
      }
    }
  };

  // 플레이리스트 재생 처리
  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist && playlist.videos.length > 0) {
      // 플레이리스트 재생 시작
      startPlaylistPlayback(playlist.videos, 0, playlistId);
    }
  };

  const handleRemoveFromQueue = (videoId: string) => {
    setQueue((prev) => prev.filter((v) => v.id !== videoId));
  };

  const toggleQueue = () => {
    setIsQueueOpen(!isQueueOpen);
    setIsPlaylistsOpen(false); // 둘 중 하나만 열리도록
  };

  const togglePlaylists = () => {
    setIsPlaylistsOpen(!isPlaylistsOpen);
    setIsQueueOpen(false); // 둘 중 하나만 열리도록
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue > 4) return; // 5개의 탭만 존재

    // 탭 1(기록), 탭 2(플레이리스트)는 로그인 필요
    if ((newValue === 1 || newValue === 2) && !user) {
      setLoginRequiredMessage(
        `${
          newValue === 1 ? "기록" : "플레이리스트"
        }을(를) 이용하려면 로그인이 필요합니다.`
      );
      setIsLoginRequiredOpen(true);
      return;
    }

    setMainTabValue(newValue);
  };

  // 플레이리스트 관련 핸들러
  const handleCreatePlaylist = (name: string, initialVideo?: Video) => {
    if (!checkLoginRequired("플레이리스트 생성")) return;

    const newPlaylist: Playlist = {
      id: uuidv4(),
      name,
      videos: initialVideo ? [initialVideo] : [],
      createdAt: Date.now(),
      userId: user ? user.uid : "",
    };

    setPlaylists((prev) => [...prev, newPlaylist]);
    setSelectedPlaylistId(newPlaylist.id);

    if (initialVideo) {
      showSnackbar(
        `"${initialVideo.title.substring(
          0,
          30
        )}..." 음악이 "${name}" 플레이리스트에 추가되었습니다`,
        "success"
      );
    } else {
      showSnackbar(`"${name}" 플레이리스트가 생성되었습니다`, "success");
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const playlistToDelete = playlists.find((p) => p.id === playlistId);
    if (playlistToDelete) {
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
      }
      showSnackbar(
        `"${playlistToDelete.name}" 플레이리스트가 삭제되었습니다`,
        "success"
      );
    }
  };

  const handleRenamePlaylist = (playlistId: string, newName: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, name: newName } : p))
    );
    showSnackbar("플레이리스트 이름이 변경되었습니다", "success");
  };

  const handleAddToQueue = (videos: Video[]) => {
    const newVideos = videos.filter((v) => !queue.some((q) => q.id === v.id));
    if (newVideos.length > 0) {
      setQueue((prev) => [...prev, ...newVideos]);
      showSnackbar(
        `${newVideos.length}곡이 대기열에 추가되었습니다`,
        "success"
      );
    } else {
      showSnackbar("이미 대기열에 있는 곡입니다", "info");
    }
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setMainTabValue(2); // 플레이리스트 탭으로 전환
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylistId(null);
    setMainTabValue(2); // 플레이리스트 탭으로 전환
  };

  const handleAddToPlaylist = (playlistId: string, video: Video) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          // 플레이리스트에 이미 있는지 확인
          const isAlreadyInPlaylist = p.videos.some((v) => v.id === video.id);
          if (!isAlreadyInPlaylist) {
            return { ...p, videos: [...p.videos, video] };
          }
        }
        return p;
      })
    );
    showSnackbar("플레이리스트에 추가되었습니다", "success");
  };

  const handleRemoveFromPlaylist = (playlistId: string, videoId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, videos: p.videos.filter((v) => v.id !== videoId) };
        }
        return p;
      })
    );
    showSnackbar("플레이리스트에서 제거되었습니다", "success");
  };

  const toggleAddToPlaylistDialog = () => {
    setIsAddToPlaylistOpen(!isAddToPlaylistOpen);
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbarState({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const handleMainTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    if (newValue > 4) return; // 5개의 탭만 존재

    // 탭 1(기록), 탭 2(플레이리스트)는 로그인 필요
    if ((newValue === 1 || newValue === 2) && !user) {
      setLoginRequiredMessage(
        `${
          newValue === 1 ? "기록" : "플레이리스트"
        }을(를) 이용하려면 로그인이 필요합니다.`
      );
      setIsLoginRequiredOpen(true);
      return;
    }

    setMainTabValue(newValue);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchVideos(query);
      setSearchResults(results);
      setMainTabValue(0); // 검색 시 홈 탭으로 이동
    } catch (error) {
      console.error("검색 오류:", error);
      showSnackbar("검색 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  // 셔플 기능을 위한 플레이리스트 또는 저장된 음악 섞기
  const shufflePlaylist = (videos: Video[], currentIndex: number) => {
    // 현재 재생 중인 곡은 제외하고 나머지 섞기
    const currentVideo = videos[currentIndex];
    const restVideos = videos.filter((_, idx) => idx !== currentIndex);

    // 나머지 비디오 섞기
    for (let i = restVideos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [restVideos[i], restVideos[j]] = [restVideos[j], restVideos[i]];
    }

    // 현재 비디오를 맨 앞에 두고 섞인 비디오들 추가
    return [currentVideo, ...restVideos];
  };

  // 셔플 상태 변경 처리
  const handleShuffleChange = (enabled: boolean) => {
    setShuffleEnabled(enabled);

    // 셔플 켜기로 변경하면 현재 재생 중인 플레이리스트 섞기
    if (enabled && isPlayingPlaylist) {
      if (currentPlaylistId) {
        const playlist = playlists.find((p) => p.id === currentPlaylistId);
        if (playlist) {
          const shuffledVideos = shufflePlaylist(
            playlist.videos,
            playlist.videos.indexOf(currentVideo || videos[0])
          );

          // 섞인 플레이리스트로 업데이트
          const updatedPlaylists = playlists.map((p) =>
            p.id === currentPlaylistId ? { ...p, videos: shuffledVideos } : p
          );

          setPlaylists(updatedPlaylists);
          // 현재 재생 중인 곡이 맨 앞으로 왔으므로 인덱스 업데이트
          setMainTabValue(2);
        }
      } else if (playbackStack.length > 0) {
        // 저장된 음악 목록 셔플
        const shuffledDownloads = shufflePlaylist(
          videos,
          videos.indexOf(currentVideo || videos[0])
        );
        setVideos(shuffledDownloads);
        // 현재 재생 중인 곡이 맨 앞으로 왔으므로 인덱스 업데이트
        setMainTabValue(2);
      }
    }
  };

  // 음악 목록 그리드 렌더링
  const renderMusicGrid = (videos: Video[], title: string) => {
    if (videos.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          sx={{
            mb: 1.5,
            fontWeight: "bold",
            px: isMobile ? 1 : 0,
          }}
        >
          {title}
        </Typography>
        <Box className="music-grid-container">
          {videos.map((video) => (
            <Box
              key={video.id}
              className={`album-art ${
                currentVideo?.id === video.id ? "now-playing" : ""
              }`}
              sx={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: 2,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Box
                onClick={() => handleVideoPlay(video)}
                sx={{ width: "100%" }}
              >
                <Box
                  sx={{
                    position: "relative",
                    paddingTop: "56.25%" /* 16:9 비율 */,
                    overflow: "hidden",
                    borderRadius: 2,
                  }}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                  />
                </Box>
                <Typography
                  variant="body2"
                  className="mobile-title"
                  sx={{
                    mt: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: 1.2,
                  }}
                >
                  {video.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="mobile-subtitle"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {video.channelTitle}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderHomeTab = () => {
    if (searchQuery && searchResults.length > 0) {
      return (
        <Box>
          {renderMusicGrid(searchResults, `"${searchQuery}" 검색 결과`)}
        </Box>
      );
    }

    if (searchQuery && searchResults.length === 0 && !isSearching) {
      return (
        <Box
          sx={{
            py: 4,
            px: 2,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "30vh",
          }}
        >
          <Box sx={{ mb: 2, opacity: 0.6 }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </Box>
          <Typography variant="body1" color="text.secondary">
            "{searchQuery}"에 대한 검색 결과가 없습니다.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            startIcon={<SearchIcon />}
            onClick={() => setSearchQuery("")}
          >
            다시 검색하기
          </Button>
        </Box>
      );
    }

    if (isSearching) {
      return (
        <Box
          sx={{
            py: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "30vh",
          }}
        >
          <Typography color="text.secondary">검색 중...</Typography>
        </Box>
      );
    }

    return <Box>{renderMusicGrid(videos, "추천 음악")}</Box>;
  };

  // 시청 기록에서 항목 삭제 함수
  const handleRemoveFromHistory = (videoId: string) => {
    if (!user) return;
    setHistory((prevHistory) =>
      prevHistory.filter((video) => video.id !== videoId)
    );
    showSnackbar("시청 기록에서 삭제되었습니다", "success");
  };

  const renderHistoryTab = () => {
    // 로그인 체크
    if (!user) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            시청 기록을 이용하려면 로그인이 필요합니다.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsLoginDialogOpen(true)}
          >
            로그인
          </Button>
        </Box>
      );
    }

    if (history.length === 0) {
      return (
        <Box
          sx={{
            py: 4,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            opacity: 0.7,
          }}
        >
          <HistoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
          <Typography variant="body1" color="text.secondary">
            아직 시청 기록이 없습니다.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => setMainTabValue(0)}
          >
            음악 탐색하기
          </Button>
        </Box>
      );
    }

    // 날짜별로 그룹화
    const groupedHistory: Record<string, Video[]> = {};

    // 가장 최근에 본 순서로 정렬
    const sortedHistory = [...history].sort(
      (a, b) => (b.viewedAt || 0) - (a.viewedAt || 0)
    );

    // 오늘, 어제, 이번 주, 이전 형태로 그룹화
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - today.getDay());

    sortedHistory.forEach((video) => {
      if (!video.viewedAt) return;

      const viewDate = new Date(video.viewedAt);
      viewDate.setHours(0, 0, 0, 0);

      let group = "이전";

      if (viewDate.getTime() === today.getTime()) {
        group = "오늘";
      } else if (viewDate.getTime() === yesterday.getTime()) {
        group = "어제";
      } else if (viewDate > thisWeek) {
        group = "이번 주";
      }

      if (!groupedHistory[group]) {
        groupedHistory[group] = [];
      }
      groupedHistory[group].push(video);
    });

    return (
      <Box sx={{ pb: 4 }}>
        {Object.entries(groupedHistory).map(([date, videos]) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              sx={{
                mb: 1.5,
                fontWeight: "bold",
                px: isMobile ? 1.5 : 0,
              }}
            >
              {date}
            </Typography>

            <Box sx={{ mb: 1 }}>
              {videos.map((video, index) => (
                <Box
                  key={`${video.id}-${index}`}
                  sx={{
                    display: "flex",
                    p: 1.5,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    "&:active": {
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flex: 1,
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <Box
                      sx={{
                        width: isMobile ? 80 : 120,
                        flexShrink: 0,
                        mr: 1.5,
                        borderRadius: 1.5,
                        overflow: "hidden",
                        position: "relative",
                        paddingTop: isMobile ? "45px" : "67.5px", // 16:9 비율 유지
                      }}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        overflow: "hidden",
                        mr: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        className="mobile-title"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.2,
                        }}
                      >
                        {video.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        className="mobile-subtitle"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {video.channelTitle}
                      </Typography>
                      {video.viewedAt && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: "10px",
                            opacity: 0.7,
                          }}
                        >
                          {new Date(video.viewedAt).toLocaleTimeString(
                            "ko-KR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFromHistory(video.id)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "error.main" },
                      }}
                      className="touch-target"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const renderPlaylistsTab = () => {
    if (!user) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            플레이리스트를 이용하려면 로그인이 필요합니다.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsLoginDialogOpen(true)}
          >
            로그인
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ height: "100%" }}>
        <Tabs
          value={mainTabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="플레이리스트" />
          {selectedPlaylistId && <Tab label="상세" />}
        </Tabs>

        {mainTabValue === 0 && (
          <Playlists
            playlists={playlists}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onRenamePlaylist={handleRenamePlaylist}
            onPlayPlaylist={handlePlayPlaylist}
            onAddToQueue={handleAddToQueue}
            onSelectPlaylist={handleSelectPlaylist}
            selectedPlaylistId={selectedPlaylistId}
          />
        )}

        {mainTabValue === 1 && selectedPlaylistId && (
          <PlaylistDetail
            playlist={
              playlists.find((p) => p.id === selectedPlaylistId) || null
            }
            currentVideo={currentVideo}
            onBack={handleBackToPlaylists}
            onPlayVideo={handleVideoSelect}
            onRemoveFromPlaylist={handleRemoveFromPlaylist}
            onPlayAll={handleAddToQueue}
            onAddToQueue={(video) => handleAddToQueue([video])}
          />
        )}
      </Box>
    );
  };

  // 음악 재생 탭 렌더링
  const renderNowPlayingTab = () => {
    return (
      <Box sx={{ height: "100%", overflow: "auto", pt: 2 }}>
        <NowPlayingContent
          currentVideo={currentVideo}
          isPlaying={playerStateObj?.isPlaying || false}
          currentTime={playerStateObj?.currentTime || 0}
          duration={playerStateObj?.duration || 0}
          volume={playerStateObj?.volume || 70}
          isMuted={playerStateObj?.isMuted || false}
          videoViews={playerStateObj?.videoViews || ""}
          onToggleMute={playerStateObj?.toggleMute || (() => {})}
          togglePlayPause={playerStateObj?.togglePlayPause || (() => {})}
          handleVolumeChange={playerStateObj?.handleVolumeChange || (() => {})}
          handleProgressChange={
            playerStateObj?.handleProgressChange || (() => {})
          }
          handlePrevious={handlePreviousTrack}
          handleNext={handleNextTrack}
          formatTime={playerStateObj?.formatTime || formatTimeHelper}
          hasNextTrack={queue.length > 0}
          hasPreviousTrack={history.length > 0}
          needsUserInteraction={playerStateObj?.needsUserInteraction || false}
          attemptUnmute={playerStateObj?.attemptUnmute || (() => false)}
          repeatMode={repeatMode}
          onRepeatModeChange={handleToggleRepeatMode}
          shuffleEnabled={shuffleEnabled}
          onShuffleChange={handleShuffleChange}
          isPlayingPlaylist={isPlayingPlaylist}
          onAddToPlaylist={() => toggleAddToPlaylistDialog()}
        />
      </Box>
    );
  };

  // 계정 데이터 초기화 함수
  const handleClearUserData = () => {
    if (!user) return;

    // 플레이리스트 초기화
    setPlaylists([]);
    localStorage.removeItem(`playlists_${user.uid}`);

    // 시청 기록 초기화
    setHistory([]);
    localStorage.removeItem(`history_${user.uid}`);

    showSnackbar("계정 데이터가 초기화되었습니다.", "success");
  };

  // 반복 재생 모드 변경
  const handleToggleRepeatMode = (mode: "none" | "all" | "one") => {
    setRepeatMode(mode);
    const message =
      mode === "none"
        ? "반복 재생이 꺼졌습니다"
        : mode === "all"
        ? "모든 곡을 반복 재생합니다"
        : "한 곡을 반복 재생합니다";
    showSnackbar(message, "info");
  };

  // 셔플 모드 변경
  const handleToggleShuffle = () => {
    setShuffleEnabled(!shuffleEnabled);
  };

  // 설정 탭 렌더링
  const renderSettingsTab = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          설정
        </Typography>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            계정
          </Typography>
          {user ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  src={user.photoURL || undefined}
                  alt={user.displayName || "사용자"}
                  sx={{ mr: 2 }}
                />
                <Box>
                  <Typography variant="body1">
                    {user.displayName || "사용자"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={logout}
                startIcon={<LogoutIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                로그아웃
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearUserData}
                startIcon={<DeleteIcon />}
                fullWidth
              >
                계정 데이터 초기화
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                로그인하여 플레이리스트를 저장하고 기기 간에 동기화하세요.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={signInWithGoogle}
                startIcon={<GoogleIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                Google로 로그인
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={signInWithGithub}
                startIcon={<GitHubIcon />}
                fullWidth
              >
                GitHub로 로그인
              </Button>
            </>
          )}
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            앱 정보
          </Typography>
          <Typography variant="body2" color="text.secondary">
            버전: 1.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © 2023 STTfy
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            참고
          </Typography>
          <Typography variant="body2" color="text.secondary">
            이 앱은 YouTube API를 사용하며, YouTube 서비스 약관을 준수합니다.
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Link
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener"
              color="primary"
              sx={{ display: "block", mb: 0.5 }}
            >
              Google 개인정보처리방침
            </Link>
            <Link
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener"
              color="primary"
            >
              YouTube 서비스 약관
            </Link>
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box className="app-container">
          {/* 모바일 헤더 */}
          <AppBar
            position="sticky"
            className="mobile-app-bar"
            sx={{
              backgroundColor: isMobile ? "transparent" : "background.paper",
            }}
          >
            <Toolbar className={isMobile ? "mobile-toolbar" : ""}>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                STAfy
                {isOffline && (
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 1,
                      bgcolor: "error.main",
                      color: "white",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: isMobile ? "8px" : "10px",
                    }}
                  >
                    오프라인
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <InstallPWA />
                <IconButton
                  color="inherit"
                  onClick={toggleQueue}
                  className="touch-target"
                >
                  <QueueMusic />
                  {queue.length > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "primary.main",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      {queue.length}
                    </Box>
                  )}
                </IconButton>
                {user ? (
                  <Avatar
                    src={user.photoURL}
                    alt={user.displayName}
                    sx={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      cursor: "pointer",
                      ml: 1,
                    }}
                    onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                  />
                ) : (
                  <Button
                    color="inherit"
                    onClick={() => setIsLoginDialogOpen(true)}
                    size={isMobile ? "small" : "medium"}
                  >
                    로그인
                  </Button>
                )}
              </Box>
            </Toolbar>
          </AppBar>

          {/* 검색창 - 모바일에서 상단에 고정 */}
          <Paper
            className="mobile-search-container"
            elevation={isMobile ? 0 : 3}
          >
            <TextField
              fullWidth
              placeholder="음악 검색..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleSearch(searchQuery)}
                      edge="end"
                      size="small"
                      className="touch-target"
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size="small"
              className="mobile-search-field"
            />
          </Paper>

          <Container maxWidth="lg" className="mobile-content">
            {/* 데스크탑에서는 상단에 탭 메뉴 */}
            {!isMobile && (
              <Paper elevation={3} sx={{ mb: 3 }}>
                <Tabs
                  value={mainTabValue}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab icon={<HomeIcon />} label="홈" />
                  <Tab icon={<HistoryIcon />} label="기록" />
                  <Tab icon={<LibraryMusic />} label="플레이리스트" />
                  <Tab icon={<MusicNoteIcon />} label="재생 중" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                  {mainTabValue === 0 && renderHomeTab()}
                  {mainTabValue === 1 && renderHistoryTab()}
                  {mainTabValue === 2 && renderPlaylistsTab()}
                  {mainTabValue === 3 && renderNowPlayingTab()}
                </Box>
              </Paper>
            )}

            {/* 모바일에서는 하단에 고정된 탭 메뉴와 별도의 콘텐츠 영역 */}
            {isMobile && (
              <>
                <Box
                  sx={{ pb: currentVideo ? 7 : 0 }}
                  className="mobile-tabs-content"
                >
                  {mainTabValue === 0 && renderHomeTab()}
                  {mainTabValue === 1 && renderHistoryTab()}
                  {mainTabValue === 2 && renderPlaylistsTab()}
                  {mainTabValue === 3 && renderNowPlayingTab()}
                </Box>

                <Paper elevation={3} className="mobile-bottom-tabs">
                  <Tabs
                    value={mainTabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                    className="mobile-tabs"
                  >
                    <Tab icon={<HomeIcon />} aria-label="홈" />
                    <Tab icon={<HistoryIcon />} aria-label="기록" />
                    <Tab icon={<LibraryMusic />} aria-label="플레이리스트" />
                    <Tab
                      icon={<MusicNoteIcon />}
                      aria-label="재생 중"
                      className={currentVideo ? "now-playing-tab" : ""}
                    />
                  </Tabs>
                </Paper>
              </>
            )}
          </Container>

          <SwipeableDrawer
            anchor="right"
            open={isQueueOpen}
            onClose={toggleQueue}
            onOpen={() => setIsQueueOpen(true)}
            swipeAreaWidth={isMobile ? 20 : 0}
            disableDiscovery={!isMobile}
            disableSwipeToOpen={!isMobile}
            PaperProps={{
              sx: {
                width: isMobile ? "85vw" : "320px",
                bgcolor: "background.paper",
              },
            }}
            className="swipeable-drawer"
          >
            <Queue
              queue={queue}
              currentVideo={currentVideo}
              onSelect={handleVideoSelect}
              onRemove={handleRemoveFromQueue}
            />
          </SwipeableDrawer>

          <AddToPlaylistDialog
            open={isAddToPlaylistOpen}
            onClose={toggleAddToPlaylistDialog}
            playlists={playlists}
            currentVideo={currentVideo}
            onAddToPlaylist={handleAddToPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
          />

          <Login
            open={isLoginDialogOpen}
            onClose={() => setIsLoginDialogOpen(false)}
          />

          <ProfileMenu
            anchorEl={profileMenuAnchor}
            onClose={() => setProfileMenuAnchor(null)}
            onClearData={handleClearUserData}
          />

          {/* 로그인 필요 다이얼로그 */}
          <Dialog
            open={isLoginRequiredOpen}
            onClose={() => setIsLoginRequiredOpen(false)}
            fullWidth={isMobile}
            maxWidth="xs"
          >
            <DialogTitle>로그인 필요</DialogTitle>
            <DialogContent>
              <Typography>{loginRequiredMessage}</Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setIsLoginRequiredOpen(false)}
                color="inherit"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  setIsLoginRequiredOpen(false);
                  setIsLoginDialogOpen(true);
                }}
                color="primary"
                variant="contained"
              >
                로그인
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarState.open}
            autoHideDuration={3000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{
              vertical: isMobile ? "top" : "bottom",
              horizontal: "center",
            }}
            sx={{
              bottom: isMobile ? 68 : 24,
            }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbarState.severity}
              sx={{
                width: "100%",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {snackbarState.message}
            </Alert>
          </Snackbar>

          <MusicPlayer
            currentVideo={currentVideo}
            queue={queue}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
            onQueueUpdate={setQueue}
            onToggleQueue={toggleQueue}
            playbackHistory={history}
            isPlayingPlaylist={isPlayingPlaylist}
            hasNextTrack={queue.length > 0}
            hasPreviousTrack={history.length > 0}
            repeatMode={repeatMode}
            onRepeatModeChange={handleToggleRepeatMode}
            shuffleEnabled={shuffleEnabled}
            onShuffleChange={handleShuffleChange}
            isMobile={isMobile}
            onNavigateToNowPlaying={() => setMainTabValue(3)}
          />

          {isOffline && (
            <Box className="offline-indicator">
              <Typography variant="body2">
                현재 오프라인 모드입니다. 저장된 음악만 재생할 수 있습니다.
              </Typography>
            </Box>
          )}
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
