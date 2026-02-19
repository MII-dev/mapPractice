import React from "react";
import "../admin/AdminPage.css";

interface LoginFormProps {
    passwordInput: string;
    loginError: string;
    onPasswordChange: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
    passwordInput,
    loginError,
    onPasswordChange,
    onSubmit,
}) => (
    <div className="login-page">
        <form onSubmit={onSubmit} className="login-form">
            <h1 className="login-title">Вхід для адміністратора</h1>
            <div style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: 8 }}>
                    Пароль
                </label>
                <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="Введіть пароль адміністратора"
                    className="form-input"
                    style={{ width: "100%" }}
                />
            </div>
            <button type="submit" className="login-submit">
                Увійти
            </button>
            {loginError && (
                <p style={{ color: "red", textAlign: "center", marginTop: 10 }}>
                    {loginError}
                </p>
            )}
            <p style={{ marginTop: 20, textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
                Підказка: перевірте файл .env
            </p>
        </form>
    </div>
);

export default LoginForm;
