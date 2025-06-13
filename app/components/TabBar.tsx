import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons"; // Cambiado a Ionicons
import Animated from "react-native-reanimated";

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#000" }}>
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

            if (route.name === "add" && isFocused) {
              // Si es la pestaña 'add' y ya está activa, intenta abrir el escáner
              if (!event.defaultPrevented) {
                navigation.navigate(
                  "add",
                  { openScanner: true, timestamp: Date.now() } as any
                );
              }
            } else {
              // Comportamiento de navegación estándar para otras pestañas o para activar 'add'
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
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
                activeOpacity={1}
                style={styles.centralButtonContainer}
              >
                <Animated.View
                  style={[
                    styles.centralButton,
                    isFocused ? styles.centralButtonActive : null,
                  ]}
                >
                  <Icon
                    name={isFocused ? "camera-outline" : "add"}
                    size={30}
                    color="#FFF"
                  />
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
              style={styles.tabButton}
            >
              <Icon
                name={
                  route.name === "movements"
                    ? "swap-horizontal" // Cambiado
                    : route.name === "board"
                    ? "stats-chart" // Cambiado
                    : route.name === "profile"
                    ? "person" // Cambiado
                    : "home" // Cambiado
                }
                size={30}
                color={isFocused ? "#00DC5A" : "#FFF"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#000",
    height: 60,
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
    backgroundColor: "#00DC5A", // Cambiado a un verde más apagado
  },
});
