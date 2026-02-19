import { useEffect, useState, useCallback } from "react";
import { verifyAdmin } from "../services/api";

export interface AdminAuth {
    isAuthenticated: boolean;
    password: string;
    passwordInput: string;
    loginError: string;
    setPasswordInput: (v: string) => void;
    handleLogin: (e: React.FormEvent) => Promise<void>;
    handleLogout: () => void;
}

export function useAdminAuth(): AdminAuth {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [loginError, setLoginError] = useState("");

    // Restore session from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("admin_password");
        if (stored) {
            setPassword(stored);
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setLoginError("");
            if (!passwordInput) return;

            try {
                const ok = await verifyAdmin(passwordInput);
                if (ok) {
                    localStorage.setItem("admin_password", passwordInput);
                    setPassword(passwordInput);
                    setIsAuthenticated(true);
                } else {
                    setLoginError("Невірний пароль");
                }
            } catch {
                setLoginError("Помилка з'єднання");
            }
        },
        [passwordInput]
    );

    const handleLogout = useCallback(() => {
        localStorage.removeItem("admin_password");
        setPassword("");
        setIsAuthenticated(false);
        setPasswordInput("");
    }, []);

    return {
        isAuthenticated,
        password,
        passwordInput,
        loginError,
        setPasswordInput,
        handleLogin,
        handleLogout,
    };
}
