// ─────────────────────────────────────────────
// RootNavigator — Stack + Tab Navigation
// MainTabs (Tab) + WorkoutSession (Modal)
// ─────────────────────────────────────────────
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../constants/theme";

import TabNavigator from "./TabNavigator";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import ProgramCreateScreen from "../screens/ProgramCreateScreen";

// ─── Types ───────────────────────────────────

export type RootStackParamList = {
    MainTabs: undefined;
    WorkoutSession: { programId?: string }; // <-- Add param for Phase 3
    ProgramCreate: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Navigator ───────────────────────────────

export default function RootNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
                name="WorkoutSession"
                component={WorkoutSessionScreen}
                options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name="ProgramCreate"
                component={ProgramCreateScreen}
                options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                }}
            />
        </Stack.Navigator>
    );
}
