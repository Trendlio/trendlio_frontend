import * as React from "react"
import { View, FlatList, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { Ionicons } from '@expo/vector-icons'

type CarouselApi = {
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

interface CarouselProps {
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
  style?: any
}

type CarouselContextProps = {
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  View,
  React.ComponentProps<typeof View> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      setApi,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const flatListRef = React.useRef<FlatList>(null)

    const scrollPrev = React.useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
    }, [])

    const scrollNext = React.useCallback(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, [])

    React.useEffect(() => {
      if (!setApi) {
        return
      }

      setApi({
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      })
    }, [setApi, scrollPrev, scrollNext, canScrollPrev, canScrollNext])

    return (
      <CarouselContext.Provider
        value={{
          orientation,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <View
          ref={ref}
          style={[styles.container, style]}
          {...props}
        >
          {children}
        </View>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

interface CarouselContentProps extends Omit<React.ComponentProps<typeof FlatList>, 'data' | 'renderItem'> {
  children: React.ReactNode
}

const CarouselContent = React.forwardRef<
  FlatList,
  CarouselContentProps
>(({ style, children, ...props }, ref) => {
  const { orientation } = useCarousel()
  const windowWidth = Dimensions.get('window').width

  // Convert children to array if it's not already
  const items = React.Children.toArray(children)

  return (
    <FlatList
      ref={ref}
      data={items}
      horizontal={orientation === "horizontal"}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      pagingEnabled
      snapToInterval={windowWidth}
      decelerationRate="fast"
      style={[styles.content, style]}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          {item as React.ReactElement}
        </View>
      )}
      keyExtractor={(_, index) => index.toString()}
      {...props}
    />
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ style, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <View
      ref={ref}
      style={[
        styles.item,
        orientation === "horizontal" ? styles.horizontalItem : styles.verticalItem,
        style
      ]}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  View,
  React.ComponentProps<typeof TouchableOpacity>
>(({ style, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <TouchableOpacity
      ref={ref}
      onPress={scrollPrev}
      disabled={!canScrollPrev}
      style={[
        styles.button,
        orientation === "horizontal" ? styles.horizontalButton : styles.verticalButton,
        style
      ]}
      {...props}
    >
      <Ionicons name="chevron-back" size={16} color="#fff" />
    </TouchableOpacity>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  View,
  React.ComponentProps<typeof TouchableOpacity>
>(({ style, ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <TouchableOpacity
      ref={ref}
      onPress={scrollNext}
      disabled={!canScrollNext}
      style={[
        styles.button,
        orientation === "horizontal" ? styles.horizontalButton : styles.verticalButton,
        style
      ]}
      {...props}
    >
      <Ionicons name="chevron-forward" size={16} color="#fff" />
    </TouchableOpacity>
  )
})
CarouselNext.displayName = "CarouselNext"

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    overflow: 'hidden',
  },
  itemContainer: {
    width: Dimensions.get('window').width,
  },
  item: {
    flex: 1,
    minWidth: '100%',
  },
  horizontalItem: {
    paddingLeft: 16,
  },
  verticalItem: {
    paddingTop: 16,
  },
  button: {
    position: 'absolute',
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalButton: {
    top: '50%',
    transform: [{ translateY: -16 }],
  },
  verticalButton: {
    left: '50%',
    transform: [{ translateX: -16 }],
  },
})

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} 