// ─────────────────────────────────────────────
// HomeScreen — Dashboard
// Son antrenmanlar, hızlı başlat, keşfet
// ─────────────────────────────────────────────
import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    FlatList,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../constants/theme";
import { workoutApi, programApi, authApi } from "../services/api";
import GymCard from "../components/GymCard";
import AccentButton from "../components/AccentButton";
import StatBadge from "../components/StatBadge";
import SectionHeader from "../components/SectionHeader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const WORKOUT_CARD_WIDTH = SCREEN_WIDTH * 0.7;

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
    const navigation = useNavigation<HomeNav>();
    const greeting = getGreeting();

    const [user, setUser] = useState<any>(null);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalWorkouts: 0, currentStreak: 0, totalPRs: 0 });
    const [loading, setLoading] = useState(true);

    const loadDashboard = async () => {
        try {
            const [userRes, workoutRes, progRes] = await Promise.all([
                authApi.getProfile(),
                workoutApi.list({ limit: 5 }),
                programApi.listMine(),
            ]);
            setUser(userRes.data);
            setWorkouts(workoutRes.data.workouts || []);
            setPrograms(progRes.data.programs || []);
            setStats({
                totalWorkouts: workoutRes.data.count || 0,
                currentStreak: 0,
                totalPRs: 0,
            });
        } catch (error) {
            console.error("[HomeScreen] Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboard();
        }, [])
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    const firstName = user?.firstName || "Sporcu";
    const lastName = user?.lastName || "";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ─── Header ─── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{greeting}</Text>
                    <Text style={styles.userName}>
                        {firstName} {lastName} 💪
                    </Text>
                </View>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
            </View>

            {/* ─── Stats Row ─── */}
            <View style={styles.statsRow}>
                <StatBadge
                    value={stats.totalWorkouts}
                    label="Antrenman"
                    icon={<Ionicons name="barbell-outline" size={18} color={colors.accent} />}
                />
                <View style={{ width: spacing.sm }} />
                <StatBadge
                    value={stats.currentStreak}
                    label="Seri"
                    accentValue
                    icon={<Ionicons name="flame-outline" size={18} color={colors.accent} />}
                />
                <View style={{ width: spacing.sm }} />
                <StatBadge
                    value={stats.totalPRs}
                    label="PR"
                    icon={<Ionicons name="trophy-outline" size={18} color={colors.accent} />}
                />
            </View>

            {/* ─── Quick Start ─── */}
            <AccentButton
                title="⚡  Hızlı Başlat"
                onPress={() => navigation.navigate("WorkoutSession", {})}
                style={styles.quickStartBtn}
            />

            {/* ─── Recent Workouts ─── */}
            <SectionHeader title="Son Antrenmanlar" actionLabel="Tümü" onAction={() => { }} />
            {workouts.length > 0 ? (
                <FlatList
                    data={workouts}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.workoutList}
                    renderItem={({ item }) => (
                        <GymCard elevated style={[styles.workoutCard, { width: WORKOUT_CARD_WIDTH }]}>
                            <View style={styles.workoutCardHeader}>
                                <Text style={styles.workoutTitle}>{item.title}</Text>
                                <View style={styles.sportBadge}>
                                    <Text style={styles.sportBadgeText}>{item.sportName || "Fitness"}</Text>
                                </View>
                            </View>
                            <Text style={styles.workoutDate}>
                                📅 {formatDate(item.logDate)}
                            </Text>
                            {item.data?.exercises && (
                                <View style={styles.exercisePreview}>
                                    {item.data.exercises.slice(0, 2).map((ex: any, i: number) => (
                                        <Text key={i} style={styles.exerciseText}>
                                            • {ex.name} — {ex.sets?.[0]?.weight || 0}{ex.sets?.[0]?.unit || "kg"} x {ex.sets?.[0]?.reps || 0}
                                        </Text>
                                    ))}
                                </View>
                            )}
                            {item.data?.distance !== undefined && (
                                <Text style={styles.exerciseText}>
                                    🏃 {item.data.distance} {item.data.distanceUnit} — {item.data.avgPace}/km
                                </Text>
                            )}
                            <Text style={styles.durationText}>
                                ⏱ {formatDuration(item.data?.totalDuration || item.data?.duration || 0)}
                            </Text>
                        </GymCard>
                    )}
                    ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
                />
            ) : (
                <Text style={styles.emptyStateText}>Henüz antrenman kaydınız yok.</Text>
            )}

            {/* ─── My Programs ─── */}
            <SectionHeader
                title="🔥 Programlarım"
                actionLabel="Yeni Oluştur"
                onAction={() => navigation.navigate("ProgramCreate")}
            />
            {programs.length > 0 ? (
                programs.map((prog) => (
                    <TouchableOpacity
                        key={prog.id}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("WorkoutSession", { programId: prog.id })}
                    >
                        <GymCard style={styles.programCard} elevated>
                            <View style={styles.programHeader}>
                                <Text style={styles.programName}>{prog.name}</Text>
                                {prog.isPublic && (
                                    <View style={styles.publicBadge}>
                                        <Text style={styles.publicBadgeText}>PUBLIC</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.programDesc} numberOfLines={2}>
                                {prog.description || "Açıklama yok."}
                            </Text>
                        </GymCard>
                    </TouchableOpacity>
                ))
            ) : (
                <Text style={styles.emptyStateText}>Henüz bir program oluşturmadınız.</Text>
            )}

            <View style={{ height: spacing.xxxl }} />
        </ScrollView>
    );
}

// ─── Helpers ────────────────────────────────

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Günaydın";
    if (h < 18) return "İyi Günler";
    return "İyi Akşamlar";
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}dk ${s > 0 ? `${s}sn` : ""}`.trim();
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xxl,
    },
    greeting: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    userName: {
        fontSize: fontSize.xxl,
        color: colors.text,
        fontWeight: fontWeight.heavy,
        marginTop: spacing.xs,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accentMuted,
        borderWidth: 2,
        borderColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: colors.accent,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    statsRow: {
        flexDirection: "row",
        marginBottom: spacing.xl,
    },
    quickStartBtn: {
        marginBottom: spacing.xxl,
    },
    workoutList: {
        paddingBottom: spacing.xl,
    },
    workoutCard: {
        marginBottom: spacing.sm,
    },
    workoutCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    workoutTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        flex: 1,
    },
    sportBadge: {
        backgroundColor: colors.accentMuted,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    sportBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.accent,
    },
    workoutDate: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    exercisePreview: {
        marginBottom: spacing.sm,
    },
    exerciseText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginBottom: 2,
    },
    durationText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    programCard: {
        marginBottom: spacing.md,
    },
    programHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    programName: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        flex: 1,
    },
    publicBadge: {
        backgroundColor: colors.accentMuted,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    publicBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        color: colors.accent,
    },
    programDesc: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        lineHeight: 20,
    },
    emptyStateText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        fontStyle: "italic",
        marginBottom: spacing.xl,
    },
});
