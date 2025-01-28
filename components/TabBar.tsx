import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import TabBarButton from "./TabBarButton";
import { TouchableOpacity, View } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { StyleSheet } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons'; 


export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {

  
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === 'add') {
          return (
            <TouchableOpacity
              key={route.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.centralButtonContainer}
            >
              <View style={styles.centralButton}>
              <Icon name="add" size={30} color="#FFF" />
              </View>
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
            style={styles.tabButton}
          >
            <TabBarButton
              key={route.name}
              onPress={onPress}
              isFocused={isFocused}
              routeName={route.name}
              label="+"
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#000',
    height: 60,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralButtonContainer: {
    position: 'relative',
    bottom: 15, // Ajusta este valor para separar el botón de la barra
    alignSelf: 'center',
    zIndex: 5

  },
  centralButton: {
    width: 70,
    height: 70,
    backgroundColor: '#00DC5A',
    borderRadius: 35,
    borderWidth: 1,
    
    borderColor: '#000', // Borde negro de 1 píxel
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
});
