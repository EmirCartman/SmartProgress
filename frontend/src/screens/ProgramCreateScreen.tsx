// ─────────────────────────────────────────────
// Program Create Screen
// Create custom workout programs with target sets
// ─────────────────────────────────────────────
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { programApi, parseApiError } from "../services/api";
import {
    colors,
    spacing,
    borderRadius,
    fontSize,
    fontWeight,
} from "../constants/theme";

// ─── Types ───────────────────────────────────

interface TargetSet {
    targetReps: string;
}

interface TargetExercise {
    id: string;
    name: string;
    targetSets: TargetSet[];
}

export default function ProgramCreateScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [exercises, setExercises] = useState<TargetExercise[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // ─── Actions ─────────────────────────────────

    const addExercise = () => {
        setExercises((prev) => [
            ...prev,
            {
                id: Math.random().toString(),
                name: "",
                targetSets: [{ targetReps: "" }],
            },
        ]);
    };

    const updateExerciseName = (id: string, newName: string) => {
        setExercises((prev) =>
            prev.map((e) => (e.id === id ? { ...e, name: newName } : e))
        );
    };

    const addSetToExercise = (exerciseId: string) => {
        setExercises((prev) =>
            prev.map((e) =>
                e.id === exerciseId
                    ? { ...e, targetSets: [...e.targetSets, { targetReps: "" }] }
                    : e
            )
        );
    };

    const updateTargetReps = (exerciseId: string, setIndex: number, reps: string) => {
        setExercises((prev) =>
            prev.map((e) => {
                if (e.id !== exerciseId) return e;
                const newSets = [...e.targetSets];
                newSets[setIndex].targetReps = reps;
                return { ...e, targetSets: newSets };
            })
        );
    };

    const removeSet = (exerciseId: string, setIndex: number) => {
        setExercises((prev) =>
            prev.map((e) => {
                if (e.id !== exerciseId) return e;
                const newSets = e.targetSets.filter((_, idx) => idx !== setIndex);
                return { ...e, targetSets: newSets };
            })
        );
    };

    const removeExercise = (exerciseId: string) => {
        setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    };

    // ─── Submit ──────────────────────────────────

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Hata", "Lütfen programa bir isim verin.");
            return;
        }

        if (exercises.length === 0) {
            Alert.alert("Hata", "En az bir egzersiz eklemelisiniz.");
            return;
        }

        // Validate
        for (const ex of exercises) {
            if (!ex.name.trim()) {
                Alert.alert("Hata", "Tüm egzersizlerin bir ismi olmalı.");
                return;
            }
            if (ex.targetSets.length === 0) {
                Alert.alert("Hata", `"${ex.name}" için en az bir set ekleyin.`);
                return;
            }
            for (const s of ex.targetSets) {
                if (!s.targetReps.trim()) {
                    Alert.alert("Hata", `"${ex.name}" egzersizinin eksik tekrar hedefleri var.`);
                    return;
                }
            }
        }

        try {
            setIsSaving(true);

            // Format data for DB JSON
            const programData = {
                exercises: exercises.map(ex => ({
                    name: ex.name,
                    sets: ex.targetSets.map(set => ({
                        targetReps: parseInt(set.targetReps, 10) || 0
                    }))
                }))
            };

            await programApi.create({
                name: name.trim(),
                description: description.trim(),
                isPublic: false,
                data: programData,
            });

            navigation.goBack();

        } catch (error) {
            const apiError = parseApiError(error);
            Alert.alert("Kaydetme Hatası", apiError.message);
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Render ──────────────────────────────────

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Program</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.iconBtn}>
                    <Ionicons
                        name="checkmark"
                        size={28}
                        color={isSaving ? colors.textSecondary : colors.accent}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Meta Inputs */}
                <View style={styles.metaCard}>
                    <Text style={styles.label}>Program Adı *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: İtme Günü (Push Day)"
                        placeholderTextColor={colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={[styles.label, { marginTop: spacing.md }]}>Açıklama (Opsiyonel)</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        placeholder="Programın amacı, notlar..."
                        placeholderTextColor={colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>

                {/* Exercises List */}
                <View style={styles.exercisesSection}>
                    <Text style={styles.sectionTitle}>Egzersizler ve Hedefler</Text>

                    {exercises.map((exercise, exIndex) => (
                        <View key={exercise.id} style={styles.exerciseCard}>
                            <View style={styles.exHeader}>
                                <Text style={styles.exNumber}>#{exIndex + 1}</Text>
                                <TextInput
                                    style={styles.exNameInput}
                                    placeholder="Egzersiz Adı (Örn: Bench Press)"
                                    placeholderTextColor={colors.textSecondary}
                                    value={exercise.name}
                                    onChangeText={(txt) => updateExerciseName(exercise.id, txt)}
                                />
                                <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.setsContainer}>
                                {exercise.targetSets.map((set, setIndex) => (
                                    <View key={setIndex} style={styles.setRow}>
                                        <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                                        <View style={styles.targetInputContainer}>
                                            <TextInput
                                                style={styles.targetInput}
                                                placeholder="Hedef Tekrar (örn: 10)"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="numeric"
                                                value={set.targetReps}
                                                onChangeText={(txt) => updateTargetReps(exercise.id, setIndex, txt)}
                                            />
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => removeSet(exercise.id, setIndex)}
                                            style={styles.removeSetBtn}
                                        >
                                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.addSetBtn}
                                onPress={() => addSetToExercise(exercise.id)}
                            >
                                <Ionicons name="add" size={18} color={colors.accent} />
                                <Text style={styles.addSetText}>Set Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Add Exercise BTN */}
                    <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise}>
                        <Ionicons name="barbell-outline" size={20} color={colors.background} />
                        <Text style={styles.addExerciseText}>Yeni Egzersiz Ekle</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 50,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    iconBtn: {
        padding: spacing.xs,
        minWidth: 44,
        alignItems: "center",
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100, // extra padding for bottom scrolling
    },
    metaCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    label: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        color: colors.text,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
    },
    exercisesSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    exerciseCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    exHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    exNumber: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.accent,
        marginRight: spacing.sm,
    },
    exNameInput: {
        flex: 1,
        fontSize: fontSize.md,
        fontWeight: "bold",
        color: colors.text,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
    },
    setsContainer: {
        marginBottom: spacing.md,
    },
    setRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
    setLabel: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        width: 60,
    },
    targetInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    targetInput: {
        flex: 1,
        color: colors.text,
        fontSize: fontSize.md,
        padding: 0,
    },
    removeSetBtn: {
        padding: spacing.xs,
    },
    addSetBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        borderStyle: "dashed",
    },
    addSetText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    },
    addExerciseBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.sm,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    addExerciseText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.background,
        marginLeft: spacing.sm,
    },
});
