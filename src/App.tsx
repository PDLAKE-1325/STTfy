import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { HashRouter as Router } from "react-router-dom";
import {
  QueueMusic,
  History as HistoryIcon,
  LibraryMusic,
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { Video, Playlist } from "./types";
import Search from "./components/Search";
import MusicPlayer from "./components/MusicPlayer";
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
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [queue, setQueue] = useState<Video[]>([]);
  const [history, setHistory] = useState<Video[]>([]);
  const [popularVideos, setPopularVideos] = useState<Video[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [mainTabValue, setMainTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 플레이리스트 관련 상태
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [isPlaylistsOpen, setIsPlaylistsOpen] = useState(false);
  const [activePlaylistTab, setActivePlaylistTab] = useState(0);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [downloadedVideos, setDownloadedVideos] = useState<Video[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // 온라인/오프라인 상태 감지
  const [isOffline, setIsOffline] = useState(false);

  const { user, signInWithGoogle, signInWithGithub, logout } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<null | HTMLElement>(null);

  // 로그인 필요 알림 다이얼로그
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [loginRequiredMessage, setLoginRequiredMessage] = useState("");

  // 재생 기록 스택 (현재 세션에서 들은 곡들의 기록)
  const [playbackStack, setPlaybackStack] = useState<Video[]>([]);

  // 반복 재생 모드 ("none" | "one" | "all")
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none");

  // 셔플 활성화 여부
  const [shuffleEnabled, setShuffleEnabled] = useState(false);

  // 현재 재생 중인 것이 플레이리스트인지 여부
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);
  // 현재 재생 중인 플레이리스트 인덱스
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1);
  // 현재 재생 중인 플레이리스트 ID
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(
    null
  );

  // 현재 재생 중인 저장된 음악 인덱스
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState(-1);

  // 이전/다음 트랙 존재 여부
  const hasPreviousTrack =
    isPlayingPlaylist &&
    ((currentPlaylistId && currentPlaylistIndex > 0) ||
      (currentPlaylistId === null && currentDownloadIndex > 0));

  const hasNextTrack =
    isPlayingPlaylist &&
    ((currentPlaylistId &&
      currentPlaylistIndex < getPlaylistTrackCount() - 1) ||
      (currentPlaylistId === null &&
        currentDownloadIndex < downloadedVideos.length - 1));

  // 현재 재생 중인 플레이리스트의 트랙 수 가져오기
  function getPlaylistTrackCount(): number {
    if (!currentPlaylistId) return 0;
    const playlist = playlists.find((p) => p.id === currentPlaylistId);
    return playlist ? playlist.videos.length : 0;
  }

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
        try {
          // 7일 이내의 기록만 필터링
          const allHistory = JSON.parse(savedHistory);
          const filteredHistory = allHistory.filter((video: any) => {
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return video.viewedAt && video.viewedAt > sevenDaysAgo;
          });
          setHistory(filteredHistory);
        } catch (error) {
          console.error("Error parsing saved history:", error);
        }
      }

      // 다운로드된 음악 로드
      const savedDownloads = localStorage.getItem(`downloads_${user.uid}`);
      if (savedDownloads) {
        try {
          setDownloadedVideos(JSON.parse(savedDownloads));
        } catch (error) {
          console.error("Error parsing saved downloads:", error);
        }
      }
    } else {
      // 로그인하지 않으면 초기화
      setPlaylists([]);
      setHistory([]);
      setDownloadedVideos([]);
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

  // 다운로드된 음악 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        `downloads_${user.uid}`,
        JSON.stringify(downloadedVideos)
      );
    }
  }, [downloadedVideos, user]);

  // 인기 음악과 추천 음악 가져오기
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const popular = await getPopularMusicVideos();
        setPopularVideos(popular);

        // 트렌딩 음악으로 사용할 데이터 (실제로는 다른 API 호출이 필요할 수 있음)
        setTrendingVideos(popular.slice(0, 10));

        // 추천 음악으로 사용할 데이터 (실제로는 다른 API 호출이 필요할 수 있음)
        setRecommendedVideos([...popular].reverse().slice(0, 10));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setLoading(false);
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
    ? downloadedVideos
    : searchQuery && searchResults.length > 0
    ? searchResults
    : [
        ...recommendedVideos,
        ...popularVideos,
        ...trendingVideos,
        ...downloadedVideos,
      ];

  // 오프라인 상태에서 저장되지 않은 음악 재생 시도 처리
  const handleVideoPlay = (video: Video) => {
    // 현재 기기에서 다운로드한 음악인지 확인
    const isDownloadedOnCurrentDevice = downloadedVideos.some(
      (v) => v.id === video.id && v.deviceId === navigator.userAgent
    );

    if (isOffline && !isDownloadedOnCurrentDevice) {
      showSnackbar(
        "오프라인 모드에서는 현재 기기에 저장된 음악만 재생할 수 있습니다.",
        "warning"
      );
      return;
    }

    handleVideoSelect(video);
  };

  // 음악이 저장되었는지 확인하는 함수
  const isVideoDownloaded = (videoId: string) => {
    return downloadedVideos.some((v) => v.id === videoId);
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
      setCurrentPlaylistIndex(index);
      setCurrentPlaylistId(playlistId);
      setCurrentDownloadIndex(-1);
    } else {
      // 저장된 음악 재생 인덱스 설정
      setCurrentDownloadIndex(index);
      setCurrentPlaylistId(null);
      setCurrentPlaylistIndex(-1);
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

  // 일반 비디오 선택 시 처리 함수
  const handleVideoSelect = (video: Video) => {
    // 플레이리스트 재생 모드 해제
    setIsPlayingPlaylist(false);
    setCurrentPlaylistIndex(-1);
    setCurrentPlaylistId(null);
    setCurrentDownloadIndex(-1);

    // 현재 재생 중인 곡과 다른 경우에만 재생기록 스택에 추가
    if (currentVideo && currentVideo.id !== video.id) {
      setPlaybackStack((prevStack) => [...prevStack, currentVideo]);
    }

    // 선택한 비디오 재생
    setCurrentVideo(video);

    // 시청 기록에 추가 (중복 제거)
    addToHistoryWithoutDuplicates(video);

    // 아직 대기열에 없다면 대기열에 추가
    if (!queue.some((item) => item.id === video.id)) {
      setQueue((prev) => [...prev, video]);
    }
  };

  // 이전 곡 재생 처리
  const handlePreviousTrack = () => {
    if (isPlayingPlaylist) {
      // 플레이리스트 또는 저장된 음악 재생 중인 경우
      if (currentPlaylistId) {
        // 플레이리스트 재생 중
        if (currentPlaylistIndex > 0) {
          const playlist = playlists.find((p) => p.id === currentPlaylistId);
          if (playlist) {
            startPlaylistPlayback(
              playlist.videos,
              currentPlaylistIndex - 1,
              currentPlaylistId
            );
          }
        }
      } else {
        // 저장된 음악 재생 중
        if (currentDownloadIndex > 0) {
          startPlaylistPlayback(
            downloadedVideos,
            currentDownloadIndex - 1,
            null
          );
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
          const nextIndex = currentPlaylistIndex + 1;

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
        const nextIndex = currentDownloadIndex + 1;

        // 다음 곡이 있으면 재생, 없으면 반복 모드에 따라 처리
        if (nextIndex < downloadedVideos.length) {
          startPlaylistPlayback(downloadedVideos, nextIndex, null);
        } else if (repeatMode === "all") {
          // 전체 반복 모드면 처음부터 다시 재생
          startPlaylistPlayback(downloadedVideos, 0, null);
        }
      }
    } else {
      // 일반 재생 중인 경우 - 비슷한 음악 추천하여 재생
      if (currentVideo) {
        // 비슷한 음악 찾기 (여기서는 간단히 추천 음악 목록에서 랜덤으로 선택)
        const recommendationPool = [
          ...recommendedVideos,
          ...popularVideos,
        ].filter(
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

  // 저장된 음악 목록 재생 처리
  const handlePlayDownloads = (index: number = 0) => {
    if (downloadedVideos.length > 0) {
      // 저장된 음악 재생 시작
      startPlaylistPlayback(downloadedVideos, index, null);
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
    setActivePlaylistTab(newValue);
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
    setActivePlaylistTab(1); // 상세 보기 탭으로 전환
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylistId(null);
    setActivePlaylistTab(0); // 목록 탭으로 전환
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
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleMainTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setMainTabValue(newValue);
  };

  const handleDownloadVideo = (video: Video) => {
    if (!checkLoginRequired("음악 저장")) return;

    // 이미 다운로드된 비디오인지 확인
    if (!downloadedVideos.some((v) => v.id === video.id)) {
      const videoWithDeviceId = {
        ...video,
        deviceId: navigator.userAgent,
        downloadedAt: Date.now(),
      };
      setDownloadedVideos((prev) => [...prev, videoWithDeviceId]);
      showSnackbar(
        "음악이 저장되었습니다. 이 기기에서 오프라인에서도 재생할 수 있습니다.",
        "success"
      );
    } else {
      showSnackbar("이미 저장된 음악입니다", "info");
    }
  };

  const handleRemoveDownload = (videoId: string) => {
    setDownloadedVideos((prev) => prev.filter((v) => v.id !== videoId));
    showSnackbar("저장한 음악이 삭제되었습니다", "success");
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
            currentPlaylistIndex
          );

          // 섞인 플레이리스트로 업데이트
          const updatedPlaylists = playlists.map((p) =>
            p.id === currentPlaylistId ? { ...p, videos: shuffledVideos } : p
          );

          setPlaylists(updatedPlaylists);
          // 현재 재생 중인 곡이 맨 앞으로 왔으므로 인덱스 업데이트
          setCurrentPlaylistIndex(0);
        }
      } else if (currentDownloadIndex >= 0) {
        // 저장된 음악 목록 셔플
        const shuffledDownloads = shufflePlaylist(
          downloadedVideos,
          currentDownloadIndex
        );
        setDownloadedVideos(shuffledDownloads);
        // 현재 재생 중인 곡이 맨 앞으로 왔으므로 인덱스 업데이트
        setCurrentDownloadIndex(0);
      }
    }
  };

  const renderMusicGrid = (videos: Video[], title: string) => {
    if (videos.length === 0) return null;

    // 오프라인 모드에서 필터링된 비디오 (저장된 것만 표시)
    const filteredVideos = isOffline
      ? videos.filter((video) => isVideoDownloaded(video.id))
      : videos;

    if (filteredVideos.length === 0) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {filteredVideos.map((video) => (
            <Box
              key={video.id}
              sx={{
                width: 200,
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
                transition: "opacity 0.2s",
                position: "relative",
              }}
              className={`album-art ${
                isVideoDownloaded(video.id) ? "saved-music" : ""
              } ${currentVideo?.id === video.id ? "now-playing" : ""}`}
            >
              <Box
                onClick={() => handleVideoPlay(video)}
                sx={{ width: "100%" }}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ width: "100%", borderRadius: 4 }}
                />
                <Typography variant="body2" noWrap sx={{ mt: 1 }}>
                  {video.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {video.channelTitle}
                </Typography>

                {isVideoDownloaded(video.id) && (
                  <Box sx={{ position: "absolute", top: 5, left: 5 }}>
                    <DownloadIcon fontSize="small" sx={{ color: "#00BFFF" }} />
                  </Box>
                )}
              </Box>

              {!isOffline && !isVideoDownloaded(video.id) && (
                <IconButton
                  size="small"
                  onClick={() => handleDownloadVideo(video)}
                  sx={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    bgcolor: "rgba(0,0,0,0.7)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.9)" },
                  }}
                  className="download-btn"
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              )}
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
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            "{searchQuery}"에 대한 검색 결과가 없습니다.
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {renderMusicGrid(recommendedVideos, "추천 음악")}
        {renderMusicGrid(popularVideos, "인기 음악")}
        {renderMusicGrid(trendingVideos, "최신 트렌드")}

        {/* 장르별 음악 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            장르별 음악
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {["팝", "락", "힙합", "재즈", "클래식", "K-Pop"].map(
              (genre, index) => (
                <Paper
                  key={genre}
                  className="genre-card"
                  sx={{
                    width: 150,
                    height: 100,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    backgroundImage: `url(https://source.unsplash.com/random/150x100?${genre}-music&sig=${index})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Typography variant="subtitle1" className="genre-text">
                    {genre}
                  </Typography>
                </Paper>
              )
            )}
          </Box>
        </Box>
      </Box>
    );
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
    if (!user) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            시청 기록을 보려면 로그인이 필요합니다.
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
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            아직 재생 기록이 없습니다.
          </Typography>
        </Box>
      );
    }

    // 시간 기준으로 정렬 (최신순)
    const sortedHistory = [...history].sort(
      (a, b) => (b.viewedAt || 0) - (a.viewedAt || 0)
    );

    return (
      <List sx={{ width: "100%" }}>
        {sortedHistory.map((video, index) => (
          <Box
            key={`${video.id}-${index}`}
            sx={{
              display: "flex",
              p: 1,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
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
              <Box sx={{ width: 120, flexShrink: 0, mr: 2 }}>
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ width: "100%", borderRadius: 4 }}
                />
              </Box>
              <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Typography variant="body1" noWrap>
                  {video.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {video.channelTitle}
                </Typography>
                {video.viewedAt && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(video.viewedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFromHistory(video.id);
                }}
                color="error"
                size="small"
                title="시청 기록에서 삭제"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </List>
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
          value={activePlaylistTab}
          onChange={(e, v) => setActivePlaylistTab(v)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="플레이리스트" />
          {selectedPlaylistId && <Tab label="상세" />}
        </Tabs>

        {activePlaylistTab === 0 && (
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

        {activePlaylistTab === 1 && selectedPlaylistId && (
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

  const renderDownloadsTab = () => {
    if (!user) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            저장한 음악을 이용하려면 로그인이 필요합니다.
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

    if (downloadedVideos.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            저장된 음악이 없습니다. 음악을 저장하려면 음악 항목의 다운로드
            아이콘을 클릭하세요.
          </Typography>
        </Box>
      );
    }

    // 현재 기기에서 다운로드한 음악만 필터링
    const currentDeviceDownloads = downloadedVideos.filter(
      (video) => video.deviceId === navigator.userAgent
    );

    // 다른 기기에서 다운로드한 음악 필터링
    const otherDeviceDownloads = downloadedVideos.filter(
      (video) => video.deviceId !== navigator.userAgent
    );

    return (
      <Box>
        {currentDeviceDownloads.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              이 기기에 저장된 음악
            </Typography>
            <List sx={{ width: "100%", mb: 4 }}>
              {currentDeviceDownloads.map((video) => (
                <Box
                  key={video.id}
                  sx={{
                    display: "flex",
                    p: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
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
                    <Box sx={{ width: 120, flexShrink: 0, mr: 2 }}>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{ width: "100%", borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                      <Typography variant="body1" noWrap>
                        {video.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {video.channelTitle}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDownload(video.id);
                      }}
                      color="error"
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </List>
          </>
        )}

        {otherDeviceDownloads.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              다른 기기에 저장된 음악
            </Typography>
            <List sx={{ width: "100%" }}>
              {otherDeviceDownloads.map((video) => (
                <Box
                  key={video.id}
                  sx={{
                    display: "flex",
                    p: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
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
                    <Box sx={{ width: 120, flexShrink: 0, mr: 2 }}>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{ width: "100%", borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                      <Typography variant="body1" noWrap>
                        {video.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {video.channelTitle}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Button
                      startIcon={<DownloadIcon />}
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadVideo(video);
                      }}
                    >
                      이 기기에 저장
                    </Button>
                  </Box>
                </Box>
              ))}
            </List>
          </>
        )}
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

    // 저장한 음악 초기화
    setDownloadedVideos([]);
    localStorage.removeItem(`downloads_${user.uid}`);

    showSnackbar("계정 데이터가 초기화되었습니다.", "success");
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <InstallPWA />
      <Router>
        <Box
          sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
          className="dark-theme"
        >
          <AppBar position="static" color="secondary">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                ST Music
              </Typography>
              {currentVideo && (
                <IconButton
                  color="inherit"
                  onClick={toggleAddToPlaylistDialog}
                  disabled={!user}
                  title={!user ? "로그인이 필요합니다" : "플레이리스트에 추가"}
                >
                  <AddIcon />
                </IconButton>
              )}
              <IconButton color="inherit" onClick={toggleQueue}>
                <QueueMusic />
              </IconButton>
              {user ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    src={user.photoURL}
                    alt={user.displayName}
                    sx={{ width: 32, height: 32, cursor: "pointer", ml: 1 }}
                    onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                  />
                </Box>
              ) : (
                <Button
                  color="inherit"
                  onClick={() => setIsLoginDialogOpen(true)}
                >
                  로그인
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 2, mb: 10, flexGrow: 1 }}>
            <Paper sx={{ mb: 2, p: 2 }}>
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
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleSearch(searchQuery)}
                        edge="end"
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Paper>

            <Paper elevation={3} sx={{ mb: 3 }}>
              <Tabs
                value={mainTabValue}
                onChange={handleMainTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab icon={<HomeIcon />} label="홈" />
                <Tab icon={<HistoryIcon />} label="기록" />
                <Tab icon={<LibraryMusic />} label="플레이리스트" />
                <Tab icon={<DownloadIcon />} label="저장됨" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {mainTabValue === 0 && renderHomeTab()}
                {mainTabValue === 1 && renderHistoryTab()}
                {mainTabValue === 2 && renderPlaylistsTab()}
                {mainTabValue === 3 && renderDownloadsTab()}
              </Box>
            </Paper>
          </Container>

          <Drawer
            anchor="right"
            open={isQueueOpen}
            onClose={toggleQueue}
            PaperProps={{
              sx: { width: "320px", bgcolor: "background.paper" },
            }}
          >
            <Queue
              queue={queue}
              currentVideo={currentVideo}
              onSelect={handleVideoSelect}
              onRemove={handleRemoveFromQueue}
            />
          </Drawer>

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
              >
                로그인
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          <MusicPlayer
            currentVideo={currentVideo}
            queue={queue}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
            onQueueUpdate={setQueue}
            onToggleQueue={toggleQueue}
            playbackHistory={playbackStack}
            isPlayingPlaylist={isPlayingPlaylist}
            hasNextTrack={hasNextTrack}
            hasPreviousTrack={hasPreviousTrack}
            repeatMode={repeatMode}
            onRepeatModeChange={setRepeatMode}
            shuffleEnabled={shuffleEnabled}
            onShuffleChange={handleShuffleChange}
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
