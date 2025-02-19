import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

const DescriptionInput = () => {
  const [description, setDescription] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe aquí..."
        placeholderTextColor="#999"
        value={description}
        onChangeText={setDescription}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 15,
  },
  label: {
    fontSize: 22,
    fontFamily: "Outfit_600SemiBold",
    color: "#000",
    marginBottom: 5,
  },
  input: {
    fontSize: 18,
    color: "#000",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
});

export default DescriptionInput;
