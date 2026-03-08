// ─────────────────────────────────────────────
// SmartProgress — Auth Context (Context API)
// Token, user state, login/logout/register
// ─────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, parseApiError } from "../services/api";

// ─── Types ───────────────────────────────────

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    settings: {
        is_auto_suggest_enabled: boolean;
    } | null;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isLoading: true,
        isAuthenticated: false,
    });

    // Restore session from AsyncStorage on mount
    useEffect(() => {
        const restore = async () => {
            try {
                const token = await AsyncStorage.getItem("auth_token");
                const userJson = await AsyncStorage.getItem("user");
                if (token && userJson) {
                    setState({
                        user: JSON.parse(userJson),
                        token,
                        isLoading: false,
                        isAuthenticated: true,
                    });
                } else {
                    // ─── Development Auto-Login ──────────────────────
                    // Since there is no Login UI yet, auto-register/login
                    // a dummy dev user so API requests don't fail with 401
                    try {
                        let authData;
                        try {
                            const res = await authApi.login({ email: "dev@smartprogress.com", password: "password123" });
                            authData = res.data;
                        } catch {
                            const res = await authApi.register({
                                email: "dev@smartprogress.com",
                                password: "password123",
                                firstName: "Dev",
                                lastName: "User",
                            });
                            authData = res.data;
                        }

                        await AsyncStorage.setItem("auth_token", authData.token);
                        await AsyncStorage.setItem("user", JSON.stringify(authData.user));

                        setState({
                            user: authData.user,
                            token: authData.token,
                            isLoading: false,
                            isAuthenticated: true,
                        });
                        console.log("[AuthContext] ✅ Development user automatically logged in");
                    } catch (err) {
                        console.error("[AuthContext] ❌ Auto-login failed:", err);
                        setState((prev) => ({ ...prev, isLoading: false }));
                    }
                }
            } catch {
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        };
        restore();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await authApi.login({ email, password });
            const { token, user } = response.data;

            await AsyncStorage.setItem("auth_token", token);
            await AsyncStorage.setItem("user", JSON.stringify(user));

            setState({
                user,
                token,
                isLoading: false,
                isAuthenticated: true,
            });
        } catch (error) {
            const apiError = parseApiError(error);
            throw new Error(apiError.message);
        }
    }, []);

    const register = useCallback(
        async (data: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        }) => {
            try {
                const response = await authApi.register(data);
                const { token, user } = response.data;

                await AsyncStorage.setItem("auth_token", token);
                await AsyncStorage.setItem("user", JSON.stringify(user));

                setState({
                    user,
                    token,
                    isLoading: false,
                    isAuthenticated: true,
                });
            } catch (error) {
                const apiError = parseApiError(error);
                throw new Error(apiError.message);
            }
        },
        [],
    );

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("user");

        setState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
        });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

