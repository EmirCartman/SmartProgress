// ─────────────────────────────────────────────
// GymCard — Elevated Card Component
// ─────────────────────────────────────────────
import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { borderRadius, spacing } from "../constants/theme";
import { useTheme } from "../hooks/ThemeContext";

interface GymCardProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    elevated?: boolean;
}

export default function GymCard({ children, style, elevated = false }: GymCardProps) {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    return (
        <View
            style={[
                styles.card,
                elevated && styles.elevated,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    elevated: {
        backgroundColor: colors.surfaceLight,
        borderColor: colors.borderLight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
