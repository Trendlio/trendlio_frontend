// import React, { useRef, useState } from 'react';
// import { View, Image, FlatList, Dimensions, StyleSheet } from 'react-native';

// interface ImageCarouselProps {
//   images: string[];
// }

// const { width } = Dimensions.get('window');

// const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
//   const [activeIndex, setActiveIndex] = useState(0);
//   const flatListRef = useRef<FlatList>(null);

//   const onViewableItemsChanged = useRef(({
//     viewableItems,
//   }: { viewableItems: any[] }) => {
//     if (viewableItems.length > 0) {
//       setActiveIndex(viewableItems[0].index || 0);
//     }
//   });

//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 50,
//   });

//   return (
//     <View className="w-full h-52 my-2">
//       <FlatList
//         ref={flatListRef}
//         data={images}
//         renderItem={({ item }) => (
//           <Image source={{ uri: item }} className="w-screen h-full rounded-lg" resizeMode="cover" />
//         )}
//         keyExtractor={(item, index) => index.toString()}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         onViewableItemsChanged={onViewableItemsChanged.current}
//         viewabilityConfig={viewabilityConfig.current}
//       />
//       {images.length > 1 && (
//         <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
//           {images.map((_, index) => (
//             <View
//               key={index}
//               className={`w-2 h-2 rounded-full mx-1 ${index === activeIndex ? 'bg-white' : 'bg-gray-500'
//                 }`}
//             />
//           ))}
//         </View>
//       )}
//     </View>
//   );
// };

// export default ImageCarousel; 



import React, { useRef, useState } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { MediaPlayer } from './MediaPlayer';
import { useMediaPlayback } from '@/context/MediaPlaybackContext';
import { Media } from '@/types';

interface ImageCarouselProps {
  media: Media[];
  postId: number;
}

const { width } = Dimensions.get('window');

const ImageCarousel: React.FC<ImageCarouselProps> = ({ media, postId }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { onCarouselItemChanged } = useMediaPlayback();

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index || 0;
      setActiveIndex(newIndex);

      // Report visible video to playback context
      const visibleMedia = media[newIndex];
      if (visibleMedia.mediaType === 2) {
        onCarouselItemChanged(
          postId,
          visibleMedia.id,
          true
        );
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View className="w-full h-52 my-2">
      <FlatList
        ref={flatListRef}
        data={media}
        renderItem={({ item, index }) => (
          <View style={{ width: width - 32 }} className="mx-4">
            <MediaPlayer
              media={item}
              postId={postId}
              isMultipleItems={true}
              currentIndex={index}
              totalItems={media.length}
            />
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      {media.length > 1 && (
        <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
          {media.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${index === activeIndex ? 'bg-white' : 'bg-gray-500'}`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ImageCarousel;