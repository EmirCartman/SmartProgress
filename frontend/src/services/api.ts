// ─────────────────────────────────────────────
// SmartProgress — API Service
// Backend endpoint'lerine istek atacak yapı
// ─────────────────────────────────────────────
import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SyncWorkoutPayload } from "../types/workout";

const API_BASE_URL = "http://10.196.14.180:3000/api/v1";

// ─── Error Types ─────────────────────────────

export interface ApiError {
    message: string;
    statusCode: number;
    details?: unknown;
}

export function parseApiError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<{ error?: string; message?: string; details?: unknown }>;

        // Network error (offline, timeout, DNS failure)
        if (!axiosErr.response) {
            return {
                message: "Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.",
                statusCode: 0,
            };
        }

        const data = axiosErr.response.data;
        return {
            message: data?.error || data?.message || "Bilinmeyen bir hata oluştu.",
            statusCode: axiosErr.response.status,
            details: data?.details,
        };
    }

    return {
        message: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.",
        statusCode: -1,
    };
}

// ─── Axios Instance ──────────────────────────

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Request Interceptor (JWT Token) ─────────

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ─── Response Interceptor (Error Handling) ───

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired — clear storage
            await AsyncStorage.removeItem("auth_token");
            await AsyncStorage.removeItem("user");
        }
        return Promise.reject(error);
    },
);

// ─── Auth Endpoints ──────────────────────────

export const authApi = {
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) => api.post("/auth/register", data),

    login: (data: { email: string; password: string }) =>
        api.post("/auth/login", data),

    getProfile: () => api.get("/auth/me"),
};

// ─── Workout Endpoints ───────────────────────

export const workoutApi = {
    sync: (workouts: SyncWorkoutPayload[]) =>
        api.post("/workouts/sync", { workouts }),

    list: (params?: { limit?: number; offset?: number }) =>
        api.get("/workouts", { params }),
};

// ─── Program Endpoints ───────────────────────

export const programApi = {
    create: (data: { name: string; description?: string; isPublic?: boolean; data?: any }) =>
        api.post("/programs", data),

    getById: (id: string) => api.get(`/programs/${id}`),

    listMine: () => api.get("/programs/mine"),

    listPublic: (params?: { limit?: number; offset?: number }) =>
        api.get("/programs/public", { params }),

    toggleVisibility: (id: string) =>
        api.patch(`/programs/${id}/visibility`),

    suggestWeight: (exerciseName: string) =>
        api.get(`/programs/suggest/${encodeURIComponent(exerciseName)}`),
};

export default api;
