import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const confirmationMessages = [
  '¡A un paso de la libertad financiera!',
  '¡Adiós deuda, hola tranquilidad!',
  '¡Tu billetera te lo agradecerá!',
  '¡Un pago menos, un logro más!',
  '¡Finanzas saludables, vida feliz!',
];

interface PaymentConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  title: string;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  amount,
  title,
}) => {
  const randomMessage = useMemo(() => {
    // Seleccionar aleatoriamente un mensaje
    return confirmationMessages[
      Math.floor(Math.random() * confirmationMessages.length)
    ];
  }, [visible]); // Recalcular solo cuando el modal se hace visible

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <LinearGradient
            colors={['#00DC5A', '#01B74B']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerText}>¡Confirma tu pago!</Text>
          </LinearGradient>

          <View style={styles.contentContainer}>
            <Text style={styles.title}>¿Marcar como pagado?</Text>
            <Text style={styles.message}>{title}</Text>
            <Text style={styles.amount}>S/ {amount.toFixed(0)}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.motivationalText}>{randomMessage}</Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>¡Sí, pagado!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerGradient: {
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_600SemiBold',
    color: '#333',
    marginBottom: 10,
    lineHeight: 30,
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
  },
  amount: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#333',
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginVertical: 20,
  },
  motivationalText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#4CAF50',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  confirmButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default PaymentConfirmationModal;