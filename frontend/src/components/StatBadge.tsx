// ─────────────────────────────────────────────
// StatBadge — Statistics Display Card
// Sayı + etiket + ikon ile istatistik göstergesi
// ─────────────────────────────────────────────
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { borderRadius, spacing, fontSize, fontWeight } from "../constants/theme";
import { useTheme } from "../hooks/ThemeContext";

interface StatBadgeProps {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
    accentValue?: boolean;
}

export default function StatBadge({ value, label, icon, accentValue = false }: StatBadgeProps) {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.value, accentValue && styles.valueAccent]}>
                {value}
            </Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconWrap: {
        marginBottom: spacing.xs,
    },
    value: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.heavy,
        color: colors.text,
        marginBottom: 2,
    },
    valueAccent: {
        color: colors.accent,
    },
    label: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
});
