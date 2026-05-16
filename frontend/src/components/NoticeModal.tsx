import React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { borderRadius, fontSize, fontWeight, spacing } from "../constants/theme";
import { useTheme } from "../hooks/ThemeContext";

interface NoticeModalProps {
    visible: boolean;
    title: string;
    message: string;
    buttonLabel?: string;
    onClose: () => void;
}

export default function NoticeModal({
    visible,
    title,
    message,
    buttonLabel = "Tamam",
    onClose,
}: NoticeModalProps) {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.container} onPress={(event) => event.stopPropagation()}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
                        <Text style={styles.buttonText}>{buttonLabel}</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const createStyles = (colors: ReturnType<typeof import("../hooks/ThemeContext").generateColors>) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
            backgroundColor: "rgba(0, 0, 0, 0.72)",
        },
        container: {
            width: "100%",
            maxWidth: 380,
            padding: spacing.xxl,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.45,
            shadowRadius: 24,
            elevation: 20,
        },
        title: {
            color: colors.text,
            fontSize: fontSize.xl,
            fontWeight: fontWeight.bold,
            textAlign: "center",
            marginBottom: spacing.md,
        },
        message: {
            color: colors.textSecondary,
            fontSize: fontSize.md,
            lineHeight: 22,
            textAlign: "center",
            marginBottom: spacing.xxl,
        },
        button: {
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            borderWidth: 1.5,
            borderColor: colors.accent,
            backgroundColor: colors.accentMuted,
        },
        buttonText: {
            color: colors.accent,
            fontSize: fontSize.md,
            fontWeight: fontWeight.bold,
            textAlign: "center",
        },
    });
