// ─────────────────────────────────────────────
// ProfileScreen — User Settings & Programs
// Avatar, ayarlar, programlarım, PR'lar
// ─────────────────────────────────────────────
import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../constants/theme";
import { useFocusEffect } from "@react-navigation/native";
import { workoutApi, programApi, authApi } from "../services/api";
import GymCard from "../components/GymCard";
import SectionHeader from "../components/SectionHeader";
import AccentButton from "../components/AccentButton";

export default function ProfileScreen() {
    const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);

    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({ totalWorkouts: 0, currentStreak: 0, totalPRs: 0 });
    const [programs, setPrograms] = useState<any[]>([]);
    const [prs, setPrs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProfileData = async () => {
        try {
            const [userRes, progRes, workRes] = await Promise.all([
                authApi.getProfile(),
                programApi.listMine(),
                workoutApi.list({ limit: 50 })
            ]);

            setUser(userRes.data);
            setPrograms(progRes.data.programs || []);

            const workouts = workRes.data.workouts || [];

            // Extract PRs
            const highestWeightMap = new Map<string, any>();
            workouts.forEach((wk: any) => {
                if (wk.data?.exercises) {
                    wk.data.exercises.forEach((ex: any) => {
                        let maxWeight = 0;
                        ex.sets?.forEach((set: any) => {
                            const w = parseFloat(set.weight) || 0;
                            if (w > maxWeight) maxWeight = w;
                        });
                        if (maxWeight > 0) {
                            const cb = highestWeightMap.get(ex.name);
                            if (!cb || maxWeight > cb.weight) {
                                highestWeightMap.set(ex.name, {
                                    exercise: ex.name,
                                    date: wk.logDate,
                                    weight: maxWeight,
                                    unit: ex.sets[0]?.unit || "kg"
                                });
                            }
                        }
                    });
                }
            });
            const allPrs = Array.from(highestWeightMap.values());
            setPrs(allPrs.slice(0, 3));

            setStats({
                totalWorkouts: workouts.length || 0,
                currentStreak: 0,
                totalPRs: allPrs.length
            });
        } catch (error) {
            console.error("Profile Load Error", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadProfileData();
        }, [])
    );

    const firstName = user?.firstName || "Sporcu";
    const lastName = user?.lastName || "";
    const email = user?.email || "sporcu@smartprogress.com";

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ─── Profile Header ─── */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>
                        {firstName.charAt(0)}{lastName.charAt(0)}
                    </Text>
                </View>
                <Text style={styles.fullName}>
                    {firstName} {lastName}
                </Text>
                <Text style={styles.email}>{email}</Text>
                <View style={styles.roleBadge}>
                    <Ionicons name="fitness-outline" size={14} color={colors.accent} />
                    <Text style={styles.roleBadgeText}>KULLANICI</Text>
                </View>
            </View>

            {/* ─── Quick Stats ─── */}
            <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                    <Text style={styles.quickStatValue}>{stats.totalWorkouts}</Text>
                    <Text style={styles.quickStatLabel}>Antrenman</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                    <Text style={styles.quickStatValue}>{stats.currentStreak}</Text>
                    <Text style={styles.quickStatLabel}>Gün Seri</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                    <Text style={styles.quickStatValue}>{stats.totalPRs}</Text>
                    <Text style={styles.quickStatLabel}>PR</Text>
                </View>
            </View>

            {/* ─── Settings ─── */}
            <SectionHeader title="⚙️ Ayarlar" />
            <GymCard style={styles.settingsCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <View style={styles.settingIconWrap}>
                            <Ionicons name="sparkles" size={20} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingTitle}>Akıllı Öneri</Text>
                            <Text style={styles.settingDesc}>
                                Auto-Regulation ağırlık tahmini
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={autoSuggestEnabled}
                        onValueChange={setAutoSuggestEnabled}
                        trackColor={{
                            false: colors.surfaceElevated,
                            true: colors.accentMuted,
                        }}
                        thumbColor={autoSuggestEnabled ? colors.accent : colors.textMuted}
                    />
                </View>

                <View style={styles.settingDivider} />

                <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                    <View style={styles.settingInfo}>
                        <View style={styles.settingIconWrap}>
                            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingTitle}>Bildirimler</Text>
                            <Text style={styles.settingDesc}>Antrenman hatırlatıcıları</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={styles.settingDivider} />

                <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                    <View style={styles.settingInfo}>
                        <View style={styles.settingIconWrap}>
                            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingTitle}>Tema</Text>
                            <Text style={styles.settingDesc}>Dark Mode (Aktif)</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </GymCard>

            {/* ─── My Programs ─── */}
            <SectionHeader
                title="📋 Programlarım"
                actionLabel="Yeni"
                onAction={() => { }}
            />
            {programs.length > 0 ? programs.map((prog) => (
                <GymCard key={prog.id} style={styles.programCard}>
                    <View style={styles.programRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.programName}>{prog.name}</Text>
                            <Text style={styles.programDesc} numberOfLines={1}>
                                {prog.description || "Açıklama yok"}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.visibilityBadge,
                                prog.isPublic
                                    ? styles.visibilityPublic
                                    : styles.visibilityPrivate,
                            ]}
                        >
                            <Ionicons
                                name={prog.isPublic ? "globe-outline" : "lock-closed-outline"}
                                size={12}
                                color={prog.isPublic ? colors.accent : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.visibilityText,
                                    prog.isPublic
                                        ? styles.visibilityTextPublic
                                        : styles.visibilityTextPrivate,
                                ]}
                            >
                                {prog.isPublic ? "Public" : "Private"}
                            </Text>
                        </View>
                    </View>
                </GymCard>
            )) : (
                <Text style={{ color: colors.textMuted, fontStyle: "italic", marginBottom: spacing.lg }}>Henüz programınız yok.</Text>
            )}

            {/* ─── Personal Records ─── */}
            <SectionHeader title="🏆 Rekorlarım" actionLabel="Tümü" onAction={() => { }} />
            <GymCard style={styles.prList}>
                {prs.length > 0 ? prs.map((pr, index) => (
                    <View key={index}>
                        <View style={styles.prRow}>
                            <Ionicons name="trophy" size={18} color={colors.warning} />
                            <Text style={styles.prExercise}>{pr.exercise}</Text>
                            <Text style={styles.prWeight}>
                                {pr.weight} {pr.unit}
                            </Text>
                        </View>
                        {index < prs.length - 1 && <View style={styles.prDivider} />}
                    </View>
                )) : (
                    <Text style={{ color: colors.textSecondary, fontStyle: "italic" }}>Görüntülenecek rekor yok.</Text>
                )}
            </GymCard>

            {/* ─── Logout ─── */}
            <AccentButton
                title="Çıkış Yap"
                variant="outline"
                onPress={() => { }}
                style={styles.logoutBtn}
            />

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
    profileHeader: {
        alignItems: "center",
        marginBottom: spacing.xxl,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.accentMuted,
        borderWidth: 3,
        borderColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    avatarLargeText: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.heavy,
        color: colors.accent,
    },
    fullName: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.heavy,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    email: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.accentMuted,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    roleBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        color: colors.accent,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    quickStats: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickStatItem: {
        flex: 1,
        alignItems: "center",
    },
    quickStatValue: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.heavy,
        color: colors.accent,
        marginBottom: 2,
    },
    quickStatLabel: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginHorizontal: spacing.md,
    },
    settingsCard: {
        marginBottom: spacing.xxl,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.sm,
    },
    settingInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: spacing.md,
    },
    settingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.surfaceElevated,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    settingTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    settingDesc: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    settingDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    programCard: {
        marginBottom: spacing.sm,
    },
    programRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    programName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    programDesc: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    visibilityBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        gap: 4,
        marginLeft: spacing.sm,
    },
    visibilityPublic: {
        backgroundColor: colors.accentMuted,
    },
    visibilityPrivate: {
        backgroundColor: colors.surfaceElevated,
    },
    visibilityText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
    },
    visibilityTextPublic: {
        color: colors.accent,
    },
    visibilityTextPrivate: {
        color: colors.textSecondary,
    },
    prList: {
        marginBottom: spacing.xxl,
    },
    prRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        gap: spacing.md,
    },
    prExercise: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.text,
        fontWeight: fontWeight.medium,
    },
    prWeight: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.heavy,
        color: colors.accent,
    },
    prDivider: {
        height: 1,
        backgroundColor: colors.border,
    },
    logoutBtn: {
        marginTop: spacing.md,
    },
});
