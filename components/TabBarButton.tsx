import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect } from "react";
import { icon } from "@/constants/Icon";
import { StyleSheet } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type RouteName = "index" | "movements" | "graphics" | "profile" | "add";

export default function TabBarButton({
  onPress,
  isFocused,
  routeName,
}: {
  onPress: Function;
  isFocused: boolean;
  routeName: RouteName;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, { damping: 10, stiffness: 100 });
  }, [scale, isFocused]);

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);
    return { opacity };
  });

  const selectedIcon = icon[routeName];
  if (!selectedIcon) {
    console.error(`No icon found for routeName: ${routeName}`);
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1} // 🔥 Evita la opacidad en iOS
      style={[
        styles.tabbarItem,
        routeName === "add" && styles.centralTabItem, // 🔥 Estilo especial para el botón central
      ]}
      android_ripple={{ borderless: true, rippleColor: "transparent" }} // 🔥 Evita el efecto en Android
    >
      {selectedIcon({
        color: isFocused ? "#000" : "#FFF",
        backgroundcolor: isFocused ? "#00DC5A" : "#000",
      })}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  centralTabItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#00DC5A",
    justifyContent: "center",
    alignItems: "center",
  },
});
