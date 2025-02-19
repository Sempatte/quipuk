import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const rotateValue = useSharedValue(0);
  const isAddScreenActive = state.routes[state.index].name === "add";

  useEffect(() => {
    rotateValue.value = withTiming(isAddScreenActive ? 45 : 0, { duration: 300 });
  }, [isAddScreenActive]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }],
    };
  });

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === "add") {
          return (
            <TouchableOpacity
              key={route.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              activeOpacity={1} // ✅ Evita la opacidad en iOS
              android_ripple={{ borderless: true, rippleColor: "transparent" }} // ✅ Evita el efecto en Android
              style={styles.centralButtonContainer}
            >
              <Animated.View
                style={[
                  styles.centralButton,
                  isAddScreenActive ? styles.centralButtonActive : null,
                ]}
              >
                <Animated.View style={animatedIconStyle}>
                  <Icon name="add" size={30} color="#FFF" />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.name}
            accessibilityRole="button"
            onPress={onPress}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            activeOpacity={1} // ✅ Evita la opacidad en iOS
            android_ripple={{ borderless: true, rippleColor: "transparent" }} // ✅ Evita el efecto en Android
            style={styles.tabButton}
          >
            <Icon
              name={
                route.name === "movements"
                  ? "swap-horiz"
                  : route.name === "graphics"
                  ? "bar-chart"
                  : "person"
              }
              size={30}
              color={isFocused ? "#00DC5A" : "#FFF"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#000",
    height: 60,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centralButtonContainer: {
    position: "relative",
    bottom: 15,
    alignSelf: "center",
    zIndex: 5,
  },
  centralButton: {
    width: 70,
    height: 70,
    backgroundColor: "#00DC5A",
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  centralButtonActive: {
    backgroundColor: "#EF674A",
  },
});
