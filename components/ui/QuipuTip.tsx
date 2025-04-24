// components/QuipuTip.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// Importando los SVG como strings
import QuipuTipsSvg from '@/assets/images/QuipuTips.svg';
import DollarCoinSvg from '@/assets/images/icons/DollarCoin.svg';

// Definición del tipo para los tips
interface QuipuTip {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
}

// Query GraphQL para obtener los tips activos
const GET_ACTIVE_TIPS = gql`
  query ActiveQuiputips {
    activeQuiputips {
      id
      title
      description
      category
      imageUrl
      isActive
    }
  }
`;

interface QuipuTipProps {
  onPress?: () => void;
}

const QuipuTip: React.FC<QuipuTipProps> = ({ onPress }) => {
  // Estado para almacenar el primer tip
  const [tip, setTip] = useState<QuipuTip | null>(null);
  
  // Ejecutar la query GraphQL
  const { loading, error, data } = useQuery(GET_ACTIVE_TIPS);
  
  // Seleccionar el primer tip cuando los datos estén disponibles
  useEffect(() => {
    if (data && data.activeQuiputips && data.activeQuiputips.length > 0) {
      setTip(data.activeQuiputips[0]);
    }
  }, [data]);

  // Función para resaltar el título dentro de la descripción
  const highlightTitle = (description: string, title: string) => {
    if (!title || !description) return <Text style={styles.tipDescription}>{description}</Text>;
    
    // Crear una expresión regular insensible a mayúsculas y minúsculas para encontrar todas las ocurrencias
    const regex = new RegExp(`(${title})`, 'gi');
    
    // Dividir la descripción en partes basadas en la coincidencia del título
    const parts = description.split(regex);
    
    return (
      <Text style={styles.tipDescription}>
        {parts.map((part, index) => {
          // Si la parte coincide con el título (ignorando mayúsculas/minúsculas), destacarla
          if (part.toLowerCase() === title.toLowerCase()) {
            return <Text key={index} style={styles.highlighted}>{part}</Text>;
          }
          // De lo contrario, mostrar el texto normal
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };
  
  // Si hay un error, mostrar nada
  if (error) return null;
  
  // Si está cargando, mostrar un indicador
  if (loading && !tip) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#4CD964" />
      </View>
    );
  }
  
  // Si no hay tips, no mostrar nada
  if (!tip) return null;
  
  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <Text style={styles.hashtag}>#QuipuTIP del día</Text>
      </View>
      
      <View style={styles.tipCard}>
        <View style={styles.contentContainer}>
          {/* Usando el SVG para el logo de QuipuTips */}
          <QuipuTipsSvg />
          
          <View style={styles.tipContent}>
            {highlightTitle(tip.description, tip.title)}
          </View>
        </View>
        
        <View style={styles.iconContainer}>
          {/* Usando el SVG para el icono de dólar */}
          <DollarCoinSvg />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hashtag: {
    fontSize: 25,
    fontFamily: "Outfit_600SemiBold",
    color: "#000",
    marginBottom: 15,
  },
  tipCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 10,
  },
  tipContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tipDescription: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Outfit_400Regular',
  },
  highlighted: {
    color: '#4CD964', // Color verde similar al de la imagen
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 55,
  },
});

export default QuipuTip;