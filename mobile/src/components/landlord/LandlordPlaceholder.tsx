import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

type Props = {
  title: string;
  description: string;
};

export default function LandlordPlaceholder({
  title,
  description,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>MAKAZII</Text>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable style={styles.button} onPress={() => router.replace("/landlord/dashboard" as any)}>
        <Text style={styles.buttonText}>Landlord dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F10",
    padding: 24,
    justifyContent: "center",
  },
  brand: {
    color: "#D7FF5F",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 20,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginBottom: 12,
  },
  description: {
    color: "#9CA5A7",
    fontSize: 15,
    lineHeight: 23,
  },
  button: {
    backgroundColor: "#D7FF5F",
    padding: 16,
    borderRadius: 14,
    marginTop: 28,
    alignItems: "center",
  },
  buttonText: {
    color: "#0B0F10",
    fontWeight: "800",
  },
});
