import { Image, View, Text } from 'react-native';

const Avatar = ({ ...props }) => (
  <View
    {...props}
    style={{
      position: 'relative',
      flexDirection: 'row',
      height: 40,
      width: 40,
      flexShrink: 0,
      overflow: 'hidden',
      borderRadius: 9999, // full rounded
    }}
  />
);

const AvatarImage = ({ ...props }) => (
  <Image
    {...props}
    style={{
      aspectRatio: 1,
      height: '100%',
      width: '100%',
    }}
  />
);

const AvatarFallback = ({ ...props }) => (
  <View
    {...props}
    style={{
      flexDirection: 'row',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9999,
      backgroundColor: '#333', // Equivalent to muted background
    }}
  >
    <Text></Text>
  </View>
);

export { Avatar, AvatarImage, AvatarFallback }; 