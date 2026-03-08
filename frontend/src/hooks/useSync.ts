// ─────────────────────────────────────────────
// SmartProgress — useSync Hook
// App start & connectivity change auto-sync
// ─────────────────────────────────────────────
import { useEffect, useRef } from "react";
import { syncPendingWorkouts } from "../services/syncService";
import { onConnectivityChange } from "../services/networkService";
import { useAuth } from "../store/AuthContext";

/**
 * Auto-sync pending workouts:
 * 1. When authenticated and app mounts
 * 2. When connectivity status changes to "online"
 */
export function useSync(): void {
    const isSyncing = useRef(false);
    const { isAuthenticated } = useAuth();

    const attemptSync = async () => {
        if (!isAuthenticated) return;
        if (isSyncing.current) return;

        isSyncing.current = true;
        console.log("[useSync] Otomatik senkronizasyon başlatılıyor...");
        try {
            const synced = await syncPendingWorkouts();
            console.log("[useSync] Senkronizasyon tamamlandı —", synced, "antrenman gönderildi");
        } catch (error) {
            console.warn("[useSync] Senkronizasyon hatası:", error);
        } finally {
            isSyncing.current = false;
        }
    };

    useEffect(() => {
        // Sync when authenticated
        if (isAuthenticated) {
            attemptSync();
        }

        // Subscribe to connectivity changes
        const unsubscribe = onConnectivityChange((online) => {
            if (online && isAuthenticated) {
                attemptSync();
            }
        });

        return () => {
            unsubscribe();
        };
    }, [isAuthenticated]);
}
