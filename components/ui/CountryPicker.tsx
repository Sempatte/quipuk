// components/ui/CountryPicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { countries, Country } from '@/app/constants/countries';

const { height } = Dimensions.get('window');

interface CountryPickerProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  disabled?: boolean;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
  selectedCountry,
  onSelect,
  disabled = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filtrar países según búsqueda
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchText.toLowerCase()) ||
    country.dialCode.includes(searchText) ||
    country.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectCountry = (country: Country) => {
    onSelect(country);
    setModalVisible(false);
    setSearchText('');
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry.code === item.code && styles.selectedCountryItem
      ]}
      onPress={() => handleSelectCountry(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.dialCode}>{item.dialCode}</Text>
      </View>
      {selectedCountry.code === item.code && (
        <Ionicons name="checkmark" size={20} color="#00c450" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          disabled && styles.pickerButtonDisabled
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={disabled ? "#BDC3C7" : "#7F8C8D"} 
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar País</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar país..."
              placeholderTextColor="#BDC3C7"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#BDC3C7" />
              </TouchableOpacity>
            )}
          </View>

          {/* Countries List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={renderCountryItem}
            style={styles.countryList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#BDC3C7" />
                <Text style={styles.emptyText}>No se encontraron países</Text>
                <Text style={styles.emptySubtext}>
                  Intenta con otro término de búsqueda
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
    minWidth: 100,
  },
  pickerButtonDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E8EB',
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  dialCode: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'Outfit_500Medium',
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'Outfit_600SemiBold',
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'Outfit_400Regular',
  },
  clearButton: {
    marginLeft: 8,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedCountryItem: {
    backgroundColor: '#F0FFF4',
  },
  countryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  countryName: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'Outfit_500Medium',
    marginBottom: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 72,
    marginRight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7F8C8D',
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    fontFamily: 'Outfit_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});