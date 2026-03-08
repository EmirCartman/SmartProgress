// ─────────────────────────────────────────────
// MyProgressScreen — Data Analytics & Charts
// PR gelişimleri, haftalık hacim, akıllı tahmin
// ─────────────────────────────────────────────
import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../constants/theme";
import { useFocusEffect } from "@react-navigation/native";
import { workoutApi, programApi } from "../services/api";
import GymCard from "../components/GymCard";
import SectionHeader from "../components/SectionHeader";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function MyProgressScreen() {
    const [volumeData, setVolumeData] = React.useState<{ labels: string[], datasets: { data: number[] }[] }>({
        labels: ["0"],
        datasets: [{ data: [0] }]
    });
    const [prs, setPrs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadAnalytics = async () => {
        try {
            const res = await workoutApi.list({ limit: 20 });
            const workouts = res.data.workouts || [];

            // 1) Calculate Volume (Weight * Reps) for each workout chronologically
            const volumePoints: number[] = [];
            const labels: string[] = [];

            // Loop backwards to show chronological order
            [...workouts].reverse().forEach((wk: any, idx: number) => {
                let workoutVolume = 0;
                if (wk.data?.exercises) {
                    wk.data.exercises.forEach((ex: any) => {
                        ex.sets?.forEach((set: any) => {
                            const w = parseFloat(set.weight) || 0;
                            const r = parseInt(set.reps, 10) || 0;
                            if (set.completed !== false) { // count if true or undefined
                                workoutVolume += (w * r);
                            }
                        });
                    });
                }
                if (workoutVolume > 0) {
                    volumePoints.push(workoutVolume);
                    labels.push(`A$-${idx + 1}`);
                }
            });

            if (volumePoints.length === 0) {
                // Initial empty state
                setVolumeData({ labels: ["-"], datasets: [{ data: [0] }] });
            } else {
                setVolumeData({ labels, datasets: [{ data: volumePoints }] });
            }

            // 2) Parse basic PRs
            const highestWeightMap = new Map<string, any>();
            workouts.forEach((wk: any) => {
                if (wk.data?.exercises) {
                    wk.data.exercises.forEach((ex: any) => {
                        let maxWeightInThisWorkout = 0;
                        ex.sets?.forEach((set: any) => {
                            const w = parseFloat(set.weight) || 0;
                            if (w > maxWeightInThisWorkout) maxWeightInThisWorkout = w;
                        });
                        if (maxWeightInThisWorkout > 0) {
                            const currentBest = highestWeightMap.get(ex.name);
                            if (!currentBest || maxWeightInThisWorkout > currentBest.weight) {
                                highestWeightMap.set(ex.name, {
                                    exercise: ex.name,
                                    date: wk.logDate,
                                    weight: maxWeightInThisWorkout,
                                    unit: ex.sets[0]?.unit || "kg"
                                });
                            }
                        }
                    });
                }
            });

            setPrs(Array.from(highestWeightMap.values()).slice(0, 5));

        } catch (error) {
            console.error("Analytics Load Error", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadAnalytics();
        }, [])
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ─── Page Title ─── */}
            <Text style={styles.pageTitle}>Gelişimim</Text>
            <Text style={styles.pageSubtitle}>
                Performans analitiğin ve akıllı öneriler
            </Text>

            {/* ─── Weekly Volume Chart ─── */}
            <SectionHeader title="📊 Haftalık Antrenman Hacmi" />
            <GymCard elevated style={styles.chartCard}>
                <LineChart
                    data={volumeData}
                    width={SCREEN_WIDTH - spacing.lg * 2 - spacing.lg * 2}
                    height={200}
                    yAxisSuffix=" kg"
                    chartConfig={{
                        backgroundColor: colors.surface,
                        backgroundGradientFrom: colors.surfaceLight,
                        backgroundGradientTo: colors.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(204, 255, 0, ${opacity})`,
                        labelColor: () => colors.textSecondary,
                        propsForDots: {
                            r: "5",
                            strokeWidth: "2",
                            stroke: colors.accent,
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: "",
                            stroke: colors.border,
                            strokeWidth: 0.5,
                        },
                    }}
                    bezier
                    style={styles.chart}
                />
                <View style={styles.chartLegend}>
                    <View style={styles.legendDot} />
                    <Text style={styles.legendText}>Toplam Hacim (kg)</Text>
                </View>
            </GymCard>

            {/* ─── AI Suggestion ─── */}
            <SectionHeader title="🧠 Akıllı Tahmin" />
            <GymCard elevated style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                    <Ionicons name="sparkles" size={22} color={colors.accent} />
                    <Text style={styles.suggestionTitle}>Auto-Regulation Önerisi</Text>
                </View>
                <View style={styles.suggestionBody}>
                    <View style={styles.suggestionRow}>
                        <Text style={styles.suggestionLabel}>Egzersiz</Text>
                        <Text style={styles.suggestionValue}>
                            -
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.suggestionRow}>
                        <Text style={styles.suggestionLabel}>Son ağırlık</Text>
                        <Text style={styles.suggestionValue}>
                            -
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.suggestionRow}>
                        <Text style={styles.suggestionLabel}>Son tekrar</Text>
                        <Text style={styles.suggestionValue}>
                            -
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.suggestionRow}>
                        <Text style={styles.suggestionLabel}>Önerilen</Text>
                        <Text style={[styles.suggestionValue, styles.suggestedWeight]}>
                            Hesaplanıyor...
                        </Text>
                    </View>
                </View>
                <View style={styles.reasoningBox}>
                    <Text style={styles.reasoningText}>AI Auto-Regulation (Yapay Zeka Önerisi) için daha fazla antrenman verisi gerekiyor. Sistemi beslemeye devam et!</Text>
                </View>
            </GymCard>

            {/* ─── Personal Records ─── */}
            <SectionHeader title="🏆 Kişisel Rekorlar (PR)" />
            {prs.length > 0 ? prs.map((pr, index) => (
                <GymCard key={index} style={styles.prCard}>
                    <View style={styles.prRow}>
                        <View style={styles.prRank}>
                            <Text style={styles.prRankText}>#{index + 1}</Text>
                        </View>
                        <View style={styles.prInfo}>
                            <Text style={styles.prExercise}>{pr.exercise}</Text>
                            <Text style={styles.prDate}>
                                {new Date(pr.date).toLocaleDateString("tr-TR", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </Text>
                        </View>
                        <View style={styles.prWeight}>
                            <Text style={styles.prWeightValue}>
                                {pr.weight}
                            </Text>
                            <Text style={styles.prWeightUnit}>{pr.unit}</Text>
                        </View>
                    </View>
                </GymCard>
            )) : (
                <Text style={{ color: colors.textSecondary, fontStyle: "italic", marginTop: spacing.sm }}>
                    Henüz rekor bulunamadı.
                </Text>
            )}

            <View style={{ height: spacing.xxxl }} />
        </ScrollView>
    );
}

// ─── Styles ─────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxxl + spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    pageTitle: {
        fontSize: fontSize.xxxl,
        fontWeight: fontWeight.heavy,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    pageSubtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginBottom: spacing.xxl,
    },
    chartCard: {
        marginBottom: spacing.xxl,
        overflow: "hidden",
    },
    chart: {
        borderRadius: borderRadius.md,
        marginLeft: -spacing.lg,
    },
    chartLegend: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.md,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent,
        marginRight: spacing.sm,
    },
    legendText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    suggestionCard: {
        marginBottom: spacing.xxl,
        borderColor: colors.accent,
        borderWidth: 1,
    },
    suggestionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    suggestionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.accent,
        marginLeft: spacing.sm,
    },
    suggestionBody: {
        backgroundColor: colors.surfaceElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    suggestionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.sm,
    },
    suggestionLabel: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    suggestionValue: {
        fontSize: fontSize.md,
        color: colors.text,
        fontWeight: fontWeight.semibold,
    },
    suggestedWeight: {
        color: colors.accent,
        fontWeight: fontWeight.heavy,
        fontSize: fontSize.xl,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    reasoningBox: {
        backgroundColor: colors.accentMuted,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
    },
    reasoningText: {
        fontSize: fontSize.sm,
        color: colors.accent,
        lineHeight: 20,
    },
    prCard: {
        marginBottom: spacing.sm,
    },
    prRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    prRank: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accentMuted,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    prRankText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.accent,
    },
    prInfo: {
        flex: 1,
    },
    prExercise: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    prDate: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    prWeight: {
        alignItems: "flex-end",
    },
    prWeightValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.heavy,
        color: colors.accent,
    },
    prWeightUnit: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
});
