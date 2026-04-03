// ─────────────────────────────────────────────
// AccentButton — Large Gym-Friendly Button
// Büyük touch target, neon yeşil accent
// ─────────────────────────────────────────────
import React from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    ActivityIndicator,
} from "react-native";
import { borderRadius, spacing, fontSize, fontWeight } from "../constants/theme";
import { useTheme } from "../hooks/ThemeContext";

interface AccentButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    variant?: "primary" | "outline" | "ghost";
    size?: "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export default function AccentButton({
    title,
    onPress,
    style,
    variant = "primary",
    size = "lg",
    loading = false,
    disabled = false,
    icon,
}: AccentButtonProps) {
    const { colors } = useTheme();
    const isPrimary = variant === "primary";
    const isOutline = variant === "outline";
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.base,
                size === "lg" ? styles.sizeLg : styles.sizeMd,
                isPrimary && styles.primary,
                isOutline && styles.outline,
                variant === "ghost" && styles.ghost,
                (disabled || loading) && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    color={isPrimary ? colors.background : colors.accent}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            isPrimary && styles.textPrimary,
                            (isOutline || variant === "ghost") && styles.textAccent,
                            icon ? { marginLeft: spacing.sm } : undefined,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    base: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: borderRadius.md,
    },
    sizeLg: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxl,
        minHeight: 56,
    },
    sizeMd: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 44,
    },
    primary: {
        backgroundColor: colors.accent,
    },
    outline: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: colors.accent,
    },
    ghost: {
        backgroundColor: "transparent",
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    textPrimary: {
        color: colors.background,
    },
    textAccent: {
        color: colors.accent,
    },
});
