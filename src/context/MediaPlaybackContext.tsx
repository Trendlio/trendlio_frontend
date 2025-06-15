// import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
// import { Video } from 'expo-av';
// import { ViewToken } from 'react-native';

// interface MediaPlaybackContextType {
//   pauseAllVideos: () => void;
//   registerVideoRef: (postId: string, ref: Video | null) => void;
//   unregisterVideoRef: (postId: string) => void;
//   setActiveVideoId: (postId: string | null) => void;
//   activeVideoId: string | null;
//   onViewableItemsChanged: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
//   viewabilityConfig: {
//     itemVisiblePercentThreshold: number;
//     minimumViewTime: number;
//   };
// }

// const MediaPlaybackContext = createContext<MediaPlaybackContextType | undefined>(undefined);

// export function MediaPlaybackProvider({ children }: { children: React.ReactNode }) {
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
//   const videoRefs = useRef<Map<string, Video | null>>(new Map());

//   const pauseAllVideos = useCallback(async () => {
//     const pausePromises = Array.from(videoRefs.current.values())
//       .filter((ref): ref is Video => ref !== null)
//       .map(ref => ref.pauseAsync());
//     await Promise.all(pausePromises);
//     setActiveVideoId(null);
//   }, []);

//   const registerVideoRef = useCallback((postId: string, ref: Video | null) => {
//     videoRefs.current.set(postId, ref);
//   }, []);

//   const unregisterVideoRef = useCallback((postId: string) => {
//     videoRefs.current.delete(postId);
//   }, []);

//   const onViewableItemsChanged = useCallback(async ({ viewableItems }: { viewableItems: ViewToken[] }) => {
//     const visibleVideo = viewableItems.find(item => item.isViewable);

//     if (visibleVideo) {
//       const videoId = visibleVideo.item.id.toString();
//       const videoRef = videoRefs.current.get(videoId);

//       if (videoRef) {
//         await pauseAllVideos();
//         await videoRef.playAsync();
//         setActiveVideoId(videoId);
//       }
//     } else {
//       await pauseAllVideos();
//     }
//   }, [pauseAllVideos]);

//   const viewabilityConfig = {
//     itemVisiblePercentThreshold: 50,
//     minimumViewTime: 300
//   };

//   const updateActiveVideo = useCallback(async (postId: string | null) => {
//     if (activeVideoId && activeVideoId !== postId) {
//       const currentVideo = videoRefs.current.get(activeVideoId);
//       if (currentVideo) {
//         await currentVideo.pauseAsync();
//       }
//     }
//     if (postId) {
//       const newVideo = videoRefs.current.get(postId);
//       if (newVideo) {
//         await newVideo.playAsync();
//       }
//     }
//     setActiveVideoId(postId);
//   }, [activeVideoId]);

//   return (
//     <MediaPlaybackContext.Provider value={{
//       pauseAllVideos,
//       registerVideoRef,
//       unregisterVideoRef,
//       setActiveVideoId: updateActiveVideo,
//       activeVideoId,
//       onViewableItemsChanged,
//       viewabilityConfig
//     }}>
//       {children}
//     </MediaPlaybackContext.Provider>
//   );
// }

// export function useMediaPlayback() {
//   const context = useContext(MediaPlaybackContext);
//   if (context === undefined) {
//     throw new Error('useMediaPlayback must be used within a MediaPlaybackProvider');
//   }
//   return context;
// }

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Video } from 'expo-av';
import { ViewToken, Dimensions } from 'react-native';

interface MediaPlaybackContextType {
  pauseAllVideos: () => Promise<void>;
  registerVideoRef: (postId: number, mediaId: number, ref: Video | null) => void;
  unregisterVideoRef: (postId: number, mediaId: number) => void;
  setActiveVideoId: (postId: number | null, mediaId: number | null) => void;
  activePostId: number | null;
  activeMediaId: number | null;
  onViewableItemsChanged: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  onCarouselItemChanged: (postId: number, mediaId: number, isVisible: boolean) => void;
  viewabilityConfig: {
    itemVisiblePercentThreshold: number;
    minimumViewTime: number;
  };
  setActiveScreen: (screen: string | null) => void;
  setIsPlaybackAllowed: (allowed: boolean) => void;
  isPlaybackAllowed: boolean;
}

interface VideoRefInfo {
  ref: Video | null;
  postId: number;
  mediaId: number;
}

const MediaPlaybackContext = createContext<MediaPlaybackContextType | undefined>(undefined);

export function MediaPlaybackProvider({ children }: { children: React.ReactNode }) {
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [activeMediaId, setActiveMediaId] = useState<number | null>(null);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(true);
  const videoRefs = useRef<Map<string, VideoRefInfo>>(new Map());
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

  const pauseAllVideos = useCallback(async () => {
    const pausePromises = Array.from(videoRefs.current.values())
      .filter((info: VideoRefInfo): info is VideoRefInfo & { ref: Video } => info.ref !== null)
      .map((info) => info.ref.pauseAsync());
    await Promise.all(pausePromises);
    setActivePostId(null);
    setActiveMediaId(null);
    return;
  }, []);

  const registerVideoRef = useCallback((postId: number, mediaId: number, ref: Video | null) => {
    const key = `${postId}-${mediaId}`;
    videoRefs.current.set(key, { ref, postId, mediaId });
  }, []);

  const unregisterVideoRef = useCallback((postId: number, mediaId: number) => {
    const key = `${postId}-${mediaId}`;
    videoRefs.current.delete(key);
  }, []);

  const onViewableItemsChanged = useCallback(async ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Define central area (30-70% vertical, 20% left horizontal)
    const verticalCenterTop = screenHeight * 0.3;
    const verticalCenterBottom = screenHeight * 0.7;
    const horizontalStart = screenWidth * 0.2;

    // Find first post in vertical center AND horizontal start
    const centerPost = viewableItems.find(item => {
      if (!item.isViewable || !item.item) return false;

      // Vertical check
      const itemTop = item.item.layout?.y || 0;
      const itemHeight = item.item.layout?.height || 0;
      const itemBottom = itemTop + itemHeight;
      const verticalOverlap = Math.max(0,
        Math.min(itemBottom, verticalCenterBottom) -
        Math.max(itemTop, verticalCenterTop)
      );

      // Horizontal check
      const itemLeft = item.item.layout?.x || 0;
      const itemWidth = item.item.layout?.width || 0;
      const horizontalVisible = itemLeft <= horizontalStart;

      return verticalOverlap > itemHeight * 0.4 && horizontalVisible;
    });

    if (centerPost?.item) {
      const postId = centerPost.item.id.toString();
      if (postId !== activePostId) {
        await pauseAllVideos();
        setActivePostId(parseInt(postId));

        // Auto-play first video in post
        const firstVideoKey = Array.from(videoRefs.current.keys())
          .find(key => key.startsWith(`${postId}-`));
        if (firstVideoKey) {
          const videoInfo = videoRefs.current.get(firstVideoKey);
          videoInfo?.ref?.playAsync();
        }
      }
    } else {
      await pauseAllVideos();
    }
  }, [activePostId, screenHeight, screenWidth]);

  const onCarouselItemChanged = useCallback(async (postId: number, mediaId: number, isVisible: boolean) => {
    // Only handle carousel changes for the active post
    if (postId !== activePostId) return;

    // If the current media is no longer visible, find the visible one
    if (activeMediaId && !isVisible && activeMediaId === mediaId) {
      await pauseAllVideos();
    }

    // If we found a visible media in the carousel, play it
    if (isVisible) {
      await pauseAllVideos();

      const key = `${postId}-${mediaId}`;
      const videoInfo = videoRefs.current.get(key);

      if (videoInfo && videoInfo.ref) {
        await videoInfo.ref.playAsync();
        setActivePostId(postId);
        setActiveMediaId(mediaId);
      }
    }
  }, [activePostId, activeMediaId, pauseAllVideos]);

  const setActiveVideoId = useCallback(async (postId: number | null, mediaId: number | null) => {
    if (activePostId && (activePostId !== postId || activeMediaId !== mediaId)) {
      const currentKey = `${activePostId}-${activeMediaId}`;
      const currentVideo = videoRefs.current.get(currentKey)?.ref;
      if (currentVideo) {
        await currentVideo.pauseAsync();
      }
    }

    if (postId && mediaId) {
      const newKey = `${postId}-${mediaId}`;
      const newVideo = videoRefs.current.get(newKey)?.ref;
      if (newVideo) {
        await newVideo.playAsync();
      }
    }

    setActivePostId(postId);
    setActiveMediaId(mediaId);
  }, [activePostId, activeMediaId]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300
  };

  return (
    <MediaPlaybackContext.Provider value={{
      pauseAllVideos,
      registerVideoRef,
      unregisterVideoRef,
      setActiveVideoId,
      activePostId,
      activeMediaId,
      onViewableItemsChanged,
      onCarouselItemChanged,
      viewabilityConfig,
      setActiveScreen,
      setIsPlaybackAllowed,
      isPlaybackAllowed,
    }}>
      {children}
    </MediaPlaybackContext.Provider>
  );
}

export function useMediaPlayback() {
  const context = useContext(MediaPlaybackContext);
  if (context === undefined) {
    throw new Error('useMediaPlayback must be used within a MediaPlaybackProvider');
  }
  return context;
}