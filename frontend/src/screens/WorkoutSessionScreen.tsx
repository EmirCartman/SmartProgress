// ─────────────────────────────────────────────
// WorkoutSessionScreen — Aktif Antrenman Kaydı
// Egzersiz/set ekleme, ağırlık/tekrar/RPE girişi
// Local persistence + outbox sync
// ─────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { programApi } from "../services/api";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../constants/theme";
import {
    WorkoutSession,
    WorkoutExercise,
    WorkoutSet,
} from "../types/workout";
import DraggableFlatList, {
    ScaleDecorator,
    RenderItemParams,
} from "react-native-draggable-flatlist";
import {
    saveActiveSession,
    clearActiveSession,
    restoreActiveSession,
    savePendingWorkout,
    syncPendingWorkouts,
} from "../services/syncService";
import AccentButton from "../components/AccentButton";

// ─── Constants ───────────────────────────────

// Default Fitness sport ID — replace with dynamic value when sports API ready
const DEFAULT_SPORT_ID = "00000000-0000-0000-0000-000000000001";
const AUTOSAVE_DEBOUNCE_MS = 500;

// ─── ID Generator ────────────────────────────

function uid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ─── New Factories ───────────────────────────

function createSet(): WorkoutSet {
    return { id: uid(), weight: 0, reps: 0, unit: "kg", completed: false };
}

function createExercise(): WorkoutExercise {
    return { id: uid(), name: "", sets: [createSet()] };
}

function createSession(): WorkoutSession {
    return {
        id: uid(),
        title: "Antrenman",
        sportId: DEFAULT_SPORT_ID,
        exercises: [createExercise()],
        startedAt: new Date().toISOString(),
        totalDuration: 0,
        status: "active",
    };
}

// ─── Component ───────────────────────────────

export default function WorkoutSessionScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, "WorkoutSession">>();
    const programId = route.params?.programId;

    const [session, setSession] = useState<WorkoutSession>(createSession);
    const [elapsed, setElapsed] = useState(0);
    const [finishing, setFinishing] = useState(false);
    const [restored, setRestored] = useState(false);
    const [isRirMode, setIsRirMode] = useState(false);

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputRefs = useRef<Record<string, TextInput | null>>({});

    const focusNext = useCallback((exIndex: number, setIndex: number, field: "weight" | "reps" | "rpe") => {
        let nextKey = "";
        if (field === "weight") nextKey = `ex-${exIndex}-set-${setIndex}-reps`;
        else if (field === "reps") nextKey = `ex-${exIndex}-set-${setIndex}-rpe`;
        else if (field === "rpe") nextKey = `ex-${exIndex}-set-${setIndex + 1}-weight`;

        const nextInput = inputRefs.current[nextKey];
        if (nextInput) {
            nextInput.focus();
        }
    }, []);

    // ─── Decimal Input Cache ─────────────────
    // Stores raw text per input so users can type "72." or "72,5" without
    // the dot/comma being stripped by parseFloat on every keystroke.
    const [textCache, setTextCache] = useState<Record<string, string>>({});

    const cacheKey = (exerciseId: string, setId: string, field: string) =>
        `${exerciseId}-${setId}-${field}`;

    const getTextValue = (exerciseId: string, setId: string, field: string, numericValue: number): string => {
        const key = cacheKey(exerciseId, setId, field);
        if (key in textCache) return textCache[key];
        return numericValue > 0 ? String(numericValue) : "";
    };

    const onNumericChange = (exerciseId: string, setId: string, field: keyof WorkoutSet, text: string) => {
        // Replace comma with dot for Turkish keyboards
        const normalized = text.replace(/,/g, ".");
        const key = cacheKey(exerciseId, setId, field);
        setTextCache((prev) => ({ ...prev, [key]: normalized }));
    };

    const onNumericBlur = (exerciseId: string, setId: string, field: keyof WorkoutSet, isInteger = false) => {
        const key = cacheKey(exerciseId, setId, field);
        const raw = textCache[key];
        if (raw === undefined) return;
        const num = isInteger ? (parseInt(raw, 10) || 0) : (parseFloat(raw) || 0);
        const clamped = field === "rpe" ? Math.min(num, 10) : num;
        updateSet(exerciseId, setId, field, clamped);
        // Clear cache so it falls back to formatted number
        setTextCache((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    // ─── Restore Active Session / Load Program ─
    useEffect(() => {
        (async () => {
            const saved = await restoreActiveSession();
            if (saved && saved.status === "active") {
                setSession(saved);
                // Calculate elapsed time from startedAt
                const start = new Date(saved.startedAt).getTime();
                const now = Date.now();
                setElapsed(Math.floor((now - start) / 1000));
            } else if (programId) {
                try {
                    const res = await programApi.getById(programId);
                    const prog = res.data;
                    if (prog && prog.data && prog.data.exercises) {
                        const newExercises: WorkoutExercise[] = prog.data.exercises.map((templateEx: any) => ({
                            id: uid(),
                            name: templateEx.name,
                            sets: templateEx.sets.map((templateSet: any) => ({
                                id: uid(),
                                weight: 0,
                                reps: templateSet.targetReps || 0,
                                rpe: 0,
                                unit: "kg",
                                completed: false
                            }))
                        }));
                        setSession(prev => ({
                            ...prev,
                            title: prog.name,
                            exercises: newExercises
                        }));
                    }
                } catch (error) {
                    console.error("[WorkoutSession] Failed to load program", error);
                }
            }
            setRestored(true);
        })();
    }, [programId]);

    // ─── Timer ───────────────────────────────
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // ─── Debounced Auto-Save ─────────────────
    useEffect(() => {
        if (!restored) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveActiveSession({ ...session, totalDuration: elapsed });
        }, AUTOSAVE_DEBOUNCE_MS);
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [session, elapsed, restored]);

    // ─── Update Helpers ──────────────────────

    const updateSession = useCallback((updater: (prev: WorkoutSession) => WorkoutSession) => {
        setSession(updater);
    }, []);

    const updateTitle = useCallback((title: string) => {
        updateSession((prev) => ({ ...prev, title }));
    }, [updateSession]);

    const addExercise = useCallback(() => {
        updateSession((prev) => ({
            ...prev,
            exercises: [...prev.exercises, createExercise()],
        }));
    }, [updateSession]);

    const removeExercise = useCallback((exerciseId: string) => {
        updateSession((prev) => ({
            ...prev,
            exercises: prev.exercises.filter((e) => e.id !== exerciseId),
        }));
    }, [updateSession]);

    const updateExerciseName = useCallback((exerciseId: string, name: string) => {
        updateSession((prev) => ({
            ...prev,
            exercises: prev.exercises.map((e) =>
                e.id === exerciseId ? { ...e, name } : e,
            ),
        }));
    }, [updateSession]);

    const addSet = useCallback((exerciseId: string) => {
        updateSession((prev) => ({
            ...prev,
            exercises: prev.exercises.map((e) =>
                e.id === exerciseId
                    ? { ...e, sets: [...e.sets, createSet()] }
                    : e,
            ),
        }));
    }, [updateSession]);

    const removeSet = useCallback((exerciseId: string, setId: string) => {
        updateSession((prev) => ({
            ...prev,
            exercises: prev.exercises.map((e) =>
                e.id === exerciseId
                    ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
                    : e,
            ),
        }));
    }, [updateSession]);

    const updateSet = useCallback(
        (exerciseId: string, setId: string, field: keyof WorkoutSet, value: string | number | boolean) => {
            updateSession((prev) => ({
                ...prev,
                exercises: prev.exercises.map((e) =>
                    e.id === exerciseId
                        ? {
                            ...e,
                            sets: e.sets.map((s) =>
                                s.id === setId ? { ...s, [field]: value } : s,
                            ),
                        }
                        : e,
                ),
            }));
        },
        [updateSession],
    );

    const toggleSetCompleted = useCallback((exerciseId: string, setId: string) => {
        updateSession((prev) => ({
            ...prev,
            exercises: prev.exercises.map((e) =>
                e.id === exerciseId
                    ? {
                        ...e,
                        sets: e.sets.map((s) =>
                            s.id === setId ? { ...s, completed: !s.completed } : s,
                        ),
                    }
                    : e,
            ),
        }));
    }, [updateSession]);

    // ─── Finish Workout ──────────────────────

    const finishWorkout = async () => {
        // Validate: at least one named exercise with one set
        const validExercises = session.exercises.filter(
            (e) => e.name.trim().length > 0 && e.sets.some((s) => s.weight > 0 || s.reps > 0),
        );

        if (validExercises.length === 0) {
            Alert.alert(
                "Eksik Bilgi",
                "En az bir egzersiz adı ve bir set bilgisi girmelisiniz.",
            );
            return;
        }

        setFinishing(true);

        try {
            const completedSession: WorkoutSession = {
                ...session,
                exercises: validExercises,
                completedAt: new Date().toISOString(),
                totalDuration: elapsed,
                status: "completed",
            };

            console.log(
                "[WorkoutSession] Antrenman verisi hazırlandı —",
                "exercises:", completedSession.exercises.length,
                "sets:", completedSession.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
                "duration:", completedSession.totalDuration,
            );
            console.log("Kaydedilecek Veri:", JSON.stringify(completedSession, null, 2));

            // Save to pending queue (outbox)
            await savePendingWorkout(completedSession);

            // Clear active session
            await clearActiveSession();
            console.log("[WorkoutSession] Aktif oturum temizlendi, navigasyon başlıyor");

            // Attempt immediate sync (best-effort)
            syncPendingWorkouts().catch((err) => {
                console.warn("[WorkoutSession] Anlık senkronizasyon başarısız, yeniden denenecek:", err);
            });

            // Navigate back
            navigation.goBack();
        } catch (error) {
            console.error("[WorkoutSession] ❌ Kaydetme hatası:", error);
            Alert.alert(
                "Kaydetme Hatası",
                "Antrenman verisi kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
            );
        } finally {
            setFinishing(false);
        }
    };

    const cancelWorkout = () => {
        Alert.alert(
            "Antrenmanı İptal Et",
            "Bu antrenman kaydedilmeyecek. Emin misiniz?",
            [
                { text: "Hayır", style: "cancel" },
                {
                    text: "Evet, İptal Et",
                    style: "destructive",
                    onPress: async () => {
                        await clearActiveSession();
                        navigation.goBack();
                    },
                },
            ],
        );
    };

    // ─── Format Helpers ──────────────────────

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // ─── Render Helpers ──────────────────────

    const renderHeader = () => (
        <View style={styles.listHeader}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={cancelWorkout}
                    style={styles.cancelBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="close" size={28} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                        style={styles.rirToggleBtn}
                        onPress={() => setIsRirMode(!isRirMode)}
                    >
                        <Text style={styles.rirToggleText}>
                            {isRirMode ? "RIR MODE" : "RPE MODE"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.timerContainer}>
                        <Ionicons name="time-outline" size={20} color={colors.accent} />
                        <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
                    </View>
                </View>
            </View>

            <TextInput
                style={styles.titleInput}
                value={session.title}
                onChangeText={updateTitle}
                placeholder="Antrenman Adı"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.accent}
            />
        </View>
    );

    const renderFooter = () => (
        <View style={styles.listFooter}>
            <AccentButton
                title="+ Egzersiz Ekle"
                onPress={addExercise}
                variant="outline"
                size="lg"
                style={styles.addExerciseBtn}
            />

            <AccentButton
                title="✅  Antrenmanı Bitir"
                onPress={finishWorkout}
                loading={finishing}
                style={styles.finishBtn}
            />
            <View style={{ height: spacing.xxxl * 2 }} />
        </View>
    );

    const renderExerciseItem = ({ item: exercise, drag, isActive, getIndex }: RenderItemParams<WorkoutExercise>) => {
        const exIndex = getIndex() ?? 0;
        return (
            <ScaleDecorator>
                <View style={[styles.exerciseCard, isActive && styles.activeExerciseCard]}>
                    <View style={styles.exerciseHeader}>
                        <TouchableOpacity onLongPress={drag} delayLongPress={200} style={styles.dragHandle}>
                            <Ionicons name="reorder-two" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.exerciseIndexBadge}>
                            <Text style={styles.exerciseIndexText}>{exIndex + 1}</Text>
                        </View>

                        <TextInput
                            style={styles.exerciseNameInput}
                            value={exercise.name}
                            onChangeText={(text) => updateExerciseName(exercise.id, text)}
                            placeholder="Egzersiz adı (ör: Bench Press)"
                            placeholderTextColor={colors.textMuted}
                            selectionColor={colors.accent}
                        />

                        {session.exercises.length > 1 && (
                            <TouchableOpacity
                                onPress={() => removeExercise(exercise.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="trash-outline" size={20} color={colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.setHeaderRow}>
                        <Text style={[styles.setHeaderText, { flex: 0.5 }]}>SET</Text>
                        <Text style={[styles.setHeaderText, { flex: 1 }]}>KG</Text>
                        <Text style={[styles.setHeaderText, { flex: 1 }]}>TEKRAR</Text>
                        <Text style={[styles.setHeaderText, { flex: 0.8 }]}>{isRirMode ? "RIR" : "RPE"}</Text>
                    </View>

                    {exercise.sets.map((set: WorkoutSet, setIndex: number, setsArray: WorkoutSet[]) => (
                        <View key={set.id} style={styles.setRow}>
                            <Text style={[styles.setNumber, { flex: 0.5 }]}>
                                {setIndex + 1}
                            </Text>

                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <TextInput
                                    ref={(el) => { inputRefs.current[`ex-${exIndex}-set-${setIndex}-weight`] = el; }}
                                    style={styles.numericInput}
                                    value={getTextValue(exercise.id, set.id, "weight", set.weight)}
                                    onChangeText={(text) => {
                                        onNumericChange(exercise.id, set.id, "weight", text);
                                        // Auto-complete set logically based on input change, no need for checkmark
                                        if (text.trim() && !set.completed) toggleSetCompleted(exercise.id, set.id);
                                    }}
                                    onBlur={() => onNumericBlur(exercise.id, set.id, "weight")}
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="decimal-pad"
                                    selectionColor={colors.accent}
                                    returnKeyType="next"
                                    onSubmitEditing={() => focusNext(exIndex, setIndex, "weight")}
                                    blurOnSubmit={false}
                                />
                            </View>

                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <TextInput
                                    ref={(el) => { inputRefs.current[`ex-${exIndex}-set-${setIndex}-reps`] = el; }}
                                    style={styles.numericInput}
                                    value={getTextValue(exercise.id, set.id, "reps", set.reps)}
                                    onChangeText={(text) => {
                                        onNumericChange(exercise.id, set.id, "reps", text);
                                        if (text.trim() && !set.completed) toggleSetCompleted(exercise.id, set.id);
                                    }}
                                    onBlur={() => onNumericBlur(exercise.id, set.id, "reps", true)}
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    selectionColor={colors.accent}
                                    returnKeyType="next"
                                    onSubmitEditing={() => focusNext(exIndex, setIndex, "reps")}
                                    blurOnSubmit={false}
                                />
                            </View>

                            <View style={[styles.inputWrapper, { flex: 0.8 }]}>
                                <TextInput
                                    ref={(el) => { inputRefs.current[`ex-${exIndex}-set-${setIndex}-rpe`] = el; }}
                                    style={styles.numericInput}
                                    value={getTextValue(exercise.id, set.id, "rpe", set.rpe ?? 0)}
                                    onChangeText={(text) => onNumericChange(exercise.id, set.id, "rpe", text)}
                                    onBlur={() => onNumericBlur(exercise.id, set.id, "rpe")}
                                    placeholder="—"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="decimal-pad"
                                    selectionColor={colors.accent}
                                    returnKeyType="next"
                                    onSubmitEditing={() => focusNext(exIndex, setIndex, "rpe")}
                                    blurOnSubmit={false}
                                />
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.addSetBtn}
                        onPress={() => addSet(exercise.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={18} color={colors.accent} />
                        <Text style={styles.addSetText}>Set Ekle</Text>
                    </TouchableOpacity>
                </View>
            </ScaleDecorator>
        );
    };

    // ─── Render ──────────────────────────────

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <DraggableFlatList
                data={session.exercises}
                onDragEnd={({ data }: { data: WorkoutExercise[] }) => updateSession(prev => ({ ...prev, exercises: data }))}
                keyExtractor={(item: WorkoutExercise) => item.id}
                renderItem={renderExerciseItem}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                containerStyle={styles.scrollView}
            />
        </KeyboardAvoidingView>
    );
}



// ─── Styles ─────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === "ios" ? 60 : spacing.xxxl + spacing.lg,
        paddingBottom: spacing.xxxl,
    },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xxl,
    },
    cancelBtn: {
        padding: spacing.xs,
    },
    timerContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    rirToggleBtn: {
        marginRight: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.border,
    },
    rirToggleText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.textSecondary,
    },
    timerText: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.accent,
        marginLeft: spacing.sm,
        fontVariant: ["tabular-nums"],
    },

    // Title
    titleInput: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.heavy,
        color: colors.text,
        marginBottom: spacing.xxl,
        paddingVertical: spacing.sm,
        borderBottomWidth: 2,
        borderBottomColor: colors.border,
    },

    // Exercise Card
    exerciseCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    exerciseHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    exerciseIndexBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.accentMuted,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    exerciseIndexText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.accent,
    },
    exerciseNameInput: {
        flex: 1,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        marginRight: spacing.sm,
    },

    // Set Header
    setHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    setHeaderText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
        textAlign: "center",
    },

    // Set Row
    setRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    setNumber: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textSecondary,
        textAlign: "center",
    },
    inputWrapper: {
        marginHorizontal: spacing.xs,
    },
    numericInput: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.sm,
        paddingVertical: Platform.OS === "ios" ? spacing.md : spacing.sm,
        paddingHorizontal: spacing.md,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        textAlign: "center",
        minHeight: 48,
        borderWidth: 1.5,
        borderColor: colors.border,
    },

    // Complete Button
    completeBtn: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surfaceLight,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    completeBtnActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },

    // Drag 
    dragHandle: {
        paddingRight: spacing.sm,
        paddingLeft: spacing.xs,
        justifyContent: "center",
    },
    activeExerciseCard: {
        borderColor: colors.accent,
        elevation: 8,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    listHeader: {
        marginBottom: spacing.md,
    },
    listFooter: {
        marginTop: spacing.md,
    },

    // Add Set
    addSetBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.sm,
        marginTop: spacing.xs,
    },
    addSetText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.accent,
        marginLeft: spacing.xs,
    },

    // Add Exercise
    addExerciseBtn: {
        marginBottom: spacing.lg,
    },

    // Finish
    finishBtn: {
        marginBottom: spacing.lg,
    },
});
