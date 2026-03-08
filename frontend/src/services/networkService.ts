// ─────────────────────────────────────────────
// SmartProgress — Network Service
// Connectivity monitoring via NetInfo
// ─────────────────────────────────────────────
import NetInfo, { NetInfoState, NetInfoSubscription } from "@react-native-community/netinfo";

/**
 * Check current connectivity status (one-shot).
 */
export async function isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
}

/**
 * Subscribe to connectivity changes.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange(
    callback: (online: boolean) => void,
): NetInfoSubscription {
    return NetInfo.addEventListener((state: NetInfoState) => {
        const online = !!(state.isConnected && state.isInternetReachable !== false);
        callback(online);
    });
}
