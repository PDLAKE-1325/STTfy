import axios from "axios";

import { Video } from "../types";

const API_KEY = "AIzaSyD9et-EpaZtdQQAHt-Jo-Mp7Jw2TQxr6nA";
const API_URL = "https://www.googleapis.com/youtube/v3";

// 오디오 URL 생성 함수 (모바일 지원)
const getAudioUrlForVideo = (videoId: string): string => {
  // 직접 YouTube 임베드 URL 사용 (모바일 호환)
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1`;
};

export const searchVideos = async (query: string): Promise<Video[]> => {
  try {
    const response = await axios.get(`${API_URL}/search`, {
      params: {
        key: API_KEY,
        q: query,
        part: "snippet",
        maxResults: 20,
        type: "video",
        videoCategoryId: "10", // Music category
      },
    });

    return response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      audioUrl: getAudioUrlForVideo(item.id.videoId),
    }));
  } catch (error) {
    console.error("Error searching videos:", error);
    return [];
  }
};

export const getVideoDetails = async (
  videoId: string
): Promise<Video | null> => {
  try {
    const response = await axios.get(`${API_URL}/videos`, {
      params: {
        key: API_KEY,
        id: videoId,
        part: "snippet",
      },
    });

    if (response.data.items.length === 0) {
      return null;
    }

    const item = response.data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      audioUrl: getAudioUrlForVideo(item.id),
    };
  } catch (error) {
    console.error("Error getting video details:", error);
    return null;
  }
};

export const getPopularMusicVideos = async (): Promise<Video[]> => {
  try {
    const response = await axios.get(`${API_URL}/videos`, {
      params: {
        key: API_KEY,
        chart: "mostPopular",
        regionCode: "US",
        videoCategoryId: "10", // Music category
        part: "snippet",
        maxResults: 20,
      },
    });

    return response.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      audioUrl: getAudioUrlForVideo(item.id),
    }));
  } catch (error) {
    console.error("Error getting popular music videos:", error);
    return [];
  }
};
