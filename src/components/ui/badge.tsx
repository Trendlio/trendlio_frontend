import * as React from "react"
import { View, Text, StyleSheet } from "react-native"

const badgeVariants = {
  default: {
    backgroundColor: '#3b82f6',
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: '#64748b',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#ef4444',
    borderColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#e2e8f0',
  },
}

export interface BadgeProps extends React.ComponentProps<typeof View> {
  variant?: keyof typeof badgeVariants
}

function Badge({ style, variant = 'default', ...props }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        badgeVariants[variant],
        style,
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
})

export { Badge, badgeVariants } 