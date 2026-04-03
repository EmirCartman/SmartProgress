// ─────────────────────────────────────────────
// SectionHeader — Bölüm Başlığı
// Başlık + opsiyonel "See All" butonu
// ─────────────────────────────────────────────
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { spacing, fontSize, fontWeight } from "../constants/theme";
import { useTheme } from "../hooks/ThemeContext";

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function SectionHeader({
    title,
    actionLabel,
    onAction,
}: SectionHeaderProps) {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
                    <Text style={styles.action}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    action: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.accent,
    },
});
