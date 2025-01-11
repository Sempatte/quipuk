import { View, Text, Pressable } from "react-native";
import React, { useEffect } from "react";
import { icon } from "@/constants/Icon";
import { StyleSheet } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type RouteName = "index" | "movements" | "graphics" | "profile";


export default function TabBarButton({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  color,
  label,
}: {
  onPress: Function;
  onLongPress: Function;
  isFocused: boolean;
  routeName: RouteName;
  color: string;
  label: string;
}) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === "boolean" ? (isFocused ? 1 : 0) : isFocused,
      { duration: 350 }
    );
  }, [scale, isFocused]);

  const animatedTextStyle  = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0,1], [1,0])
    return {
        opacity
    }
  })
  const selectedIcon = icon[routeName];
  if (!selectedIcon) {
    console.error(`No icon found for routeName: ${routeName}`);
    return null; // O un ícono predeterminado
  }
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={style.tabbarItem}>
      {icon[routeName]({ color: isFocused ? "#673ab7" : "#222222" })}
      <Animated.Text style={[{ color: isFocused ? "#673ab7" : "#222" }, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const style = StyleSheet.create({
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
});
