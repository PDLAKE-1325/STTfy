export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  audioUrl?: string;
  viewedAt?: number;
  deviceId?: string;
  downloadedAt?: number;
}

export interface Playlist {
  id: string;
  name: string;
  videos: Video[];
  createdAt: number;
  userId: string;
}

export interface UserPlaylists {
  playlists: Playlist[];
  activePlaylist: string | null;
}

export interface PlayerState {
  currentVideo: Video | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isFullScreen: boolean;
  queue: Video[];
  history: Video[];
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: string;
}

export interface SavedMusic {
  video: Video;
  savedAt: number;
  userId: string;
  deviceId: string;
}

export interface ViewHistory {
  video: Video;
  viewedAt: number;
  userId: string;
}

export interface UserSettings {
  userId: string;
  theme: "light" | "dark";
  language: string;
  autoplay: boolean;
  notifications: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
