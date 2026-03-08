// ─────────────────────────────────────────────
// SmartProgress — App Entry Point
// ─────────────────────────────────────────────
import React from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { registerRootComponent } from "expo";
import { AuthProvider } from "./store/AuthContext";
import RootNavigator from "./navigation/RootNavigator";
import { useSync } from "./hooks/useSync";
import { colors } from "./constants/theme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: any = {
    prefixes: ["http://localhost:8082", "smartprogress://"],
    config: {
        screens: {
            MainTabs: {
                screens: {
                    Home: "",
                    MyProgress: "progress",
                    Profile: "profile",
                },
            },
            WorkoutSession: "workout",
        },
    },
};

function AppContent() {
    // Auto-sync pending workouts on mount & connectivity change
    useSync();

    return (
        <NavigationContainer
            linking={linking}
            documentTitle={{ enabled: false }}
        >
            <StatusBar style="light" />
            <RootNavigator />
        </NavigationContainer>
    );
}

function App() {
    return (
        <View style={styles.root}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
});

export default App;
registerRootComponent(App);

