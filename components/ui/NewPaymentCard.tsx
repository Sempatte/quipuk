import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import QuipuPersona1 from "@/assets/images/QuipuPersonaje1.svg";

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 80;

interface NewPaymentCardProps {
  onPress: () => void;
}

const NewPaymentCard: React.FC<NewPaymentCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.plusIcon}>+</Text>
        </View>
        
        <Text style={styles.titleText}>Programar</Text>
        <Text style={styles.subtitleText}>Nuevo Pago</Text>
        
        <View style={styles.characterContainer}>
          <QuipuPersona1 width={200} height={160} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
    height: 230, // Altura fija más compacta
    borderRadius: 15,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: 30,
  },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  plusIcon: {
    fontSize: 22,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  subtitleText: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  characterContainer: {
    marginTop: 5,
    top: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewPaymentCard;