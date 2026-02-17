import React, { useEffect, useState } from "react";
import { MetricConfig } from "./MapDataHook";

// Sparkline component to render a simple trend line
const Sparkline: React.FC<{ data: any[], color?: string }> = ({ data, color = "#3b82f6" }) => {
    if (!data || data.length < 2) return <div style={{ width: 100, height: 30 }} />;

    const width = 100;
    const height = 30;
    const padding = 2;

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((val, i) => {
        const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={width} height={height} style={{ overflow: "visible" }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'layers' | 'data'>('layers');
    const [layers, setLayers] = useState<MetricConfig[]>([]);
    const [newLayer, setNewLayer] = useState({ name: "", slug: "", color_theme: "blue", suffix: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [loginError, setLoginError] = useState("");

    // Data Editor State
    const [selectedLayerSlug, setSelectedLayerSlug] = useState<string>("");
    const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().toISOString().split('T')[0].substring(0, 7) + "-01");
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
    const [regionValues, setRegionValues] = useState<{ region: string; value: number; suffix: string; is_aggregated?: boolean }[]>([]);
    const [layerHistory, setLayerHistory] = useState<Record<string, { value: number; period: string }[]>>({});
    const [showHistoryTable, setShowHistoryTable] = useState(false);

    // Raion Editor State
    const [selectedOblastForRaions, setSelectedOblastForRaions] = useState<string | null>(null);
    const [raionValues, setRaionValues] = useState<{ raion: string; value: number }[]>([]);

    // Summary Stats
    const stats = React.useMemo(() => {
        if (regionValues.length === 0) return { total: 0, avg: 0, max: 0 };
        const vals = regionValues.map(r => Number(r.value) || 0);
        const total = vals.reduce((a, b) => a + b, 0);
        return {
            total,
            avg: Math.round(total / vals.length),
            max: Math.max(...vals)
        };
    }, [regionValues]);


    useEffect(() => {
        // Check for existing session
        const storedPass = localStorage.getItem("admin_password");
        if (storedPass) {
            setPassword(storedPass);
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");

        if (!passwordInput) return;

        try {
            const res = await fetch("/api/verify-admin", {
                headers: {
                    "Authorization": "Basic " + btoa("admin:" + passwordInput)
                }
            });

            if (res.ok) {
                localStorage.setItem("admin_password", passwordInput);
                setPassword(passwordInput);
                setIsAuthenticated(true);
            } else {
                setLoginError("Невірний пароль");
            }
        } catch (err) {
            console.error(err);
            setLoginError("Помилка з'єднання");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_password");
        setPassword("");
        setIsAuthenticated(false);
        setPasswordInput("");
    };

    const getAuthHeaders = () => {
        return {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa("admin:" + password)
        };
    };

    const fetchLayers = async () => {
        try {
            const res = await fetch("/api/layers");
            if (res.ok) {
                const data = await res.json();
                setLayers(data);
                if (data.length > 0 && !selectedLayerSlug) {
                    setSelectedLayerSlug(data[0].slug);
                }
            }
        } catch (err) {
            console.error("Failed to fetch layers", err);
        }
    };

    const fetchPeriods = async () => {
        if (!selectedLayerSlug) return;
        try {
            const res = await fetch(`/api/periods/${selectedLayerSlug}`);
            if (res.ok) {
                const data = await res.json();
                setAvailablePeriods(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchLayerHistory = async () => {
        if (!selectedLayerSlug) return;
        try {
            const res = await fetch(`/api/layer-history/${selectedLayerSlug}`);
            if (res.ok) {
                const data = await res.json();
                setLayerHistory(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchLayerData = async () => {
        if (!selectedLayerSlug) return;
        setLoading(true);
        try {
            const url = selectedPeriod
                ? `/api/data/${selectedLayerSlug}?period=${selectedPeriod}`
                : `/api/data/${selectedLayerSlug}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // Ensure values are numbers to avoid string concatenation in stats
                setRegionValues(data.map((r: any) => ({ ...r, value: Number(r.value) || 0 })));
            }
            // Fetch periods and history in background
            fetchPeriods();
            fetchLayerHistory();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRaionData = async (oblastName: string) => {
        if (!selectedLayerSlug) return;
        setLoading(true);
        try {
            const url = selectedPeriod
                ? `/api/raion-data/${selectedLayerSlug}?period=${selectedPeriod}`
                : `/api/raion-data/${selectedLayerSlug}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // Filter for this oblast
                const filtered = data
                    .filter((r: any) => r.parent_oblast === oblastName)
                    .map((r: any) => ({ raion: r.raion, value: r.value }));
                setRaionValues(filtered);
                setSelectedOblastForRaions(oblastName);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLayers();
    }, []);

    useEffect(() => {
        if (activeTab === 'data') {
            fetchLayerData();
            setSelectedOblastForRaions(null);
        }
    }, [activeTab, selectedLayerSlug, selectedPeriod]);

    const handleLayerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (!newLayer.name || !newLayer.slug) {
            setMessage("Назва та Slug обов'язкові");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/layers", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(newLayer),
            });

            if (res.ok) {
                setMessage("Шар успішно додано!");
                setNewLayer({ name: "", slug: "", color_theme: "blue", suffix: "" });
                fetchLayers();
            } else {
                if (res.status === 401) {
                    setMessage("Помилка авторизації: Перевірте пароль");
                    handleLogout();
                } else {
                    setMessage("Помилка при додаванні шару");
                }
            }
        } catch (err) {
            console.error(err);
            setMessage("Помилка мережі");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePeriod = async (period: string) => {
        if (!selectedLayerSlug) return;
        const formattedDate = new Date(period).toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
        if (!window.confirm(`Видалити ВСІ дані для періоду ${formattedDate}? Цю дію неможливо скасувати.`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/history/${selectedLayerSlug}?period=${period}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setMessage(`Дані за ${formattedDate} видалено`);
                fetchLayerData();
            } else {
                setMessage("Помилка при видаленні");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDataSave = async () => {
        setLoading(true);
        try {
            const payload = {
                layer_slug: selectedLayerSlug,
                data: regionValues.map(r => ({ region_name: r.region, value: r.value })),
                period: selectedPeriod
            };

            const res = await fetch("/api/data", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage("✅ Дані успішно збережено!");
                await fetchLayerData();
                setTimeout(() => setMessage(""), 3000);
            } else {
                if (res.status === 401) {
                    setMessage("Помилка авторизації: Перевірте пароль");
                    handleLogout();
                } else {
                    setMessage("Не вдалося зберегти дані");
                }
            }
        } catch (e) {
            console.error(e);
            setMessage("Помилка мережі");
        } finally {
            setLoading(false);
        }
    };

    const handleRaionDataSave = async () => {
        setLoading(true);
        try {
            const payload = {
                layer_slug: selectedLayerSlug,
                data: raionValues.map(r => ({
                    raion_name: r.raion,
                    value: r.value
                })),
                period: selectedPeriod
            };

            const res = await fetch("/api/raion-data", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage(`Дані районів ${selectedOblastForRaions} збережено!`);
                setTimeout(() => setMessage(""), 3000);
                // Refresh oblast data to see rollup effect
                fetchLayerData();
            } else {
                setMessage("Не вдалося зберегти дані районів");
            }
        } catch (e) {
            console.error(e);
            setMessage("Помилка мережі");
        } finally {
            setLoading(false);
        }
    };

    const handleRandomFill = () => {
        if (selectedOblastForRaions) {
            const randomRaions = raionValues.map(r => ({
                ...r,
                value: Math.floor(Math.random() * 200) + 50
            }));
            setRaionValues(randomRaions);
            setMessage("Згенеровано випадкові значення для районів!");
        } else {
            const randomValues = regionValues.map(r => ({
                ...r,
                value: Math.floor(Math.random() * 5000) + 500
            }));
            setRegionValues(randomValues);
            setMessage("Згенеровано випадкові значення! Не забудьте зберегти.");
        }
    };

    const handleValueChange = (region: string, newValue: string) => {
        const val = newValue === '' ? 0 : parseInt(newValue, 10);
        setRegionValues(prev => prev.map(r => r.region === region ? { ...r, value: val } : r));
    };

    const handleRaionValueChange = (raion: string, newValue: string) => {
        const val = newValue === '' ? 0 : parseInt(newValue, 10);
        setRaionValues(prev => prev.map(r => r.raion === raion ? { ...r, value: val } : r));
    };


    if (!isAuthenticated) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
                <form onSubmit={handleLogin} style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "100%", maxWidth: "400px" }}>
                    <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "1.5rem", color: "#0f172a" }}>Вхід для адміністратора</h1>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#64748b" }}>Пароль</label>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Введіть пароль адміністратора"
                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{ width: "100%", padding: "14px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
                    >
                        Увійти
                    </button>
                    {loginError && <p style={{ color: "red", textAlign: "center", marginTop: "10px" }}>{loginError}</p>}
                    <p style={{ marginTop: "20px", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
                        Підказка: перевірте файл .env
                    </p>
                </form>
            </div>
        );
    }

    return (
        <div style={{ height: "100vh", width: "100%", overflowY: "auto", fontFamily: "'Inter', sans-serif", position: "relative" }}>
            {/* Global Feedback Notice */}
            {message && (
                <div style={{
                    position: "fixed",
                    top: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10000,
                    padding: "16px 32px",
                    background: message.includes("✅") || message.includes("success") || message.includes("успішно") ? "#10b981" : "#ef4444",
                    color: "white",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    fontWeight: 700,
                    fontSize: "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    animation: "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                    <style>{`
                        @keyframes slideDown {
                            from { transform: translate(-50%, -100%); opacity: 0; }
                            to { transform: translate(-50%, 0); opacity: 1; }
                        }
                    `}</style>
                    {message}
                </div>
            )}
            <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <h1 style={{ fontSize: "2rem", color: "#0f172a", margin: 0 }}>Адмін-панель Карти</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{ display: "flex", background: "#e2e8f0", padding: "4px", borderRadius: "8px" }}>
                            <button
                                onClick={() => setActiveTab('layers')}
                                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: activeTab === 'layers' ? 'white' : 'transparent', fontWeight: 600, cursor: "pointer" }}
                            >
                                Шари
                            </button>
                            <button
                                onClick={() => setActiveTab('data')}
                                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: activeTab === 'data' ? 'white' : 'transparent', fontWeight: 600, cursor: "pointer" }}
                            >
                                Редактор даних
                            </button>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{ padding: "8px 16px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                        >
                            Вийти
                        </button>
                    </div>
                </div>

                {activeTab === 'layers' && (
                    <div style={{ display: "grid", gap: "40px" }}>
                        {/* Layer Creation Form */}
                        <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                            <h2 style={{ fontSize: "1.25rem", marginBottom: "20px" }}>Додати новий шар</h2>
                            <form onSubmit={handleLayerSubmit} style={{ display: "grid", gap: "20px" }}>
                                <div style={{ display: "grid", gap: "8px" }}>
                                    <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Назва шару</label>
                                    <input
                                        value={newLayer.name}
                                        onChange={(e) => setNewLayer({ ...newLayer, name: e.target.value })}
                                        placeholder="напр. Рівень безробіття"
                                        style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div style={{ display: "grid", gap: "8px" }}>
                                        <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Ідентифікатор (Slug)</label>
                                        <input
                                            value={newLayer.slug}
                                            onChange={(e) => setNewLayer({ ...newLayer, slug: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                                            placeholder="напр. unemployment"
                                            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
                                        />
                                    </div>
                                    <div style={{ display: "grid", gap: "8px" }}>
                                        <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Суфікс (од. вим.)</label>
                                        <input
                                            value={newLayer.suffix}
                                            onChange={(e) => setNewLayer({ ...newLayer, suffix: e.target.value })}
                                            placeholder="напр. осіб"
                                            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gap: "8px" }}>
                                    <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Базовий колір</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                        <input
                                            type="color"
                                            value={newLayer.color_theme.startsWith('#') ? newLayer.color_theme : '#3b82f6'}
                                            onChange={(e) => setNewLayer({ ...newLayer, color_theme: e.target.value })}
                                            style={{
                                                height: "50px",
                                                width: "100px",
                                                cursor: "pointer",
                                                border: "none",
                                                borderRadius: "8px",
                                                padding: "0",
                                                background: "none"
                                            }}
                                        />
                                        <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                                            Hex: <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>{newLayer.color_theme}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ marginTop: "10px", padding: "14px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
                                >
                                    {loading ? "Збереження..." : "Створити шар"}
                                </button>
                            </form>
                        </div>

                        {/* Existing Layers List */}
                        <div>
                            <h2 style={{ fontSize: "1.25rem", marginBottom: "20px" }}>Наявні шари</h2>
                            <div style={{ display: "grid", gap: "10px" }}>
                                {layers.map(layer => (
                                    <div key={layer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                        <div>
                                            <span style={{ fontWeight: 600, marginRight: "10px" }}>{layer.name}</span>
                                            <span style={{ fontSize: "0.85em", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px" }}>{layer.slug}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{
                                                    width: "16px",
                                                    height: "16px",
                                                    borderRadius: "50%",
                                                    border: "1px solid #e2e8f0",
                                                    background: layer.color_theme.startsWith('#')
                                                        ? layer.color_theme
                                                        : (layer.color_theme === 'green' ? '#10b981' : '#3b82f6')
                                                }}></span>
                                                <span style={{ color: "#64748b", fontSize: "0.9em", fontFamily: "monospace" }}>{layer.color_theme}</span>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm(`Ви впевнені, що хочете видалити шар "${layer.name}" та ВСІ його дані? Цю дію неможливо скасувати.`)) return;
                                                    setLoading(true);
                                                    try {
                                                        const res = await fetch(`/api/layers/${layer.slug}`, {
                                                            method: "DELETE",
                                                            headers: getAuthHeaders()
                                                        });
                                                        if (res.ok) {
                                                            setMessage("Шар успішно видалено");
                                                            fetchLayers();
                                                        } else {
                                                            setMessage("Не вдалося видалити шар");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        setMessage("Помилка при видаленні шару");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                style={{ padding: "6px 12px", background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div style={{ display: "grid", gap: "30px" }}>
                        {/* Premium Toolbar */}
                        <div style={{
                            background: "rgba(255, 255, 255, 0.6)",
                            backdropFilter: "blur(12px)",
                            padding: "24px",
                            borderRadius: "20px",
                            border: "1px solid rgba(255, 255, 255, 0.4)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px"
                        }}>
                            <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", flexWrap: "wrap" }}>
                                <div style={{ minWidth: "240px", flex: "1", display: "grid", gap: "8px" }}>
                                    <label style={{ fontWeight: 700, fontSize: "13px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Активний шар</label>
                                    <select
                                        value={selectedLayerSlug}
                                        onChange={(e) => setSelectedLayerSlug(e.target.value)}
                                        style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "1rem", width: "100%", background: "white", fontWeight: 600, color: "#0f172a", outline: "none", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
                                    >
                                        {layers.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ minWidth: "180px", display: "grid", gap: "8px" }}>
                                    <label style={{ fontWeight: 700, fontSize: "13px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Період (Місяць)</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <input
                                            type="month"
                                            value={selectedPeriod.substring(0, 7)}
                                            onChange={(e) => setSelectedPeriod(e.target.value + "-01")}
                                            style={{ padding: "11px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "1rem", background: "white", fontWeight: 600, color: "#0f172a", outline: "none", flex: 1 }}
                                        />
                                        <select
                                            value={selectedPeriod}
                                            onChange={(e) => setSelectedPeriod(e.target.value)}
                                            style={{ padding: "11px 8px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", fontWeight: 600, fontSize: "0.9rem" }}
                                        >
                                            <option value={new Date().toISOString().split('T')[0].substring(0, 7) + "-01"}>Поточний</option>
                                            {availablePeriods.map(p => (
                                                <option key={p} value={p}>{new Date(p).toLocaleDateString("uk-UA", { month: "short", year: "numeric" })}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginLeft: "auto" }}>
                                    <button
                                        onClick={() => setShowHistoryTable(!showHistoryTable)}
                                        style={{
                                            padding: "12px 20px",
                                            background: showHistoryTable ? "#3b82f6" : "white",
                                            color: showHistoryTable ? "white" : "#1e293b",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            fontSize: "15px",
                                            boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
                                        }}
                                    >
                                        {showHistoryTable ? "← До редактора" : "📊 Таблиця історії"}
                                    </button>
                                    <button
                                        onClick={handleDataSave}
                                        disabled={loading}
                                        style={{
                                            padding: "12px 32px",
                                            background: "linear-gradient(135deg, #0f172a, #1e293b)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            fontSize: "15px",
                                            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.3)",
                                            transition: "transform 0.2s"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                    >
                                        {loading ? "Збереження..." : "Зберегти всі зміни"}
                                    </button>
                                    <button
                                        onClick={() => handleDeletePeriod(selectedPeriod)}
                                        disabled={loading}
                                        title="Видалити вибраний місяць"
                                        style={{
                                            padding: "12px",
                                            background: "#fee2e2",
                                            color: "#991b1b",
                                            border: "1px solid #fca5a5",
                                            borderRadius: "12px",
                                            cursor: "pointer",
                                            fontSize: "1.2rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "15px", flexWrap: "wrap" }}>
                                <button
                                    onClick={handleRandomFill}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", fontWeight: 600, color: "#475569", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#cbd5e1"}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                                >
                                    🎲 Випадкові значення
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Це автоматично згенерує випадкові історичні дані за останні 6 місяців. Продовжити?")) return;
                                        setLoading(true);
                                        try {
                                            const months = 6;
                                            const today = new Date();
                                            for (let i = 0; i < months; i++) {
                                                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                                                const p = d.toISOString().split('T')[0];
                                                const payload = {
                                                    layer_slug: selectedLayerSlug,
                                                    period: p,
                                                    data: regionValues.map(r => ({
                                                        region_name: r.region,
                                                        value: Math.floor(Math.random() * 5000) + 500
                                                    }))
                                                };
                                                await fetch("/api/data", {
                                                    method: "POST",
                                                    headers: getAuthHeaders(),
                                                    body: JSON.stringify(payload)
                                                });
                                            }
                                            setMessage("Історію згенеровано!");
                                            fetchLayerData();
                                        } catch (e) { console.error(e); } finally { setLoading(false); }
                                    }}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", fontWeight: 600, color: "#475569", cursor: "pointer", fontSize: "14px" }}
                                >
                                    📈 Згенерувати історію
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!selectedLayerSlug) return;
                                        const forPeriod = window.confirm("Видалити дані ТІЛЬКИ для вибраного місяця? Скасувати - видалити ВСЮ історію.");
                                        if (!window.confirm("Дію неможливо скасувати. Продовжити?")) return;
                                        setLoading(true);
                                        try {
                                            let url = `/api/history/${selectedLayerSlug}`;
                                            if (forPeriod) url += `?period=${selectedPeriod}`;
                                            const res = await fetch(url, { method: "DELETE", headers: getAuthHeaders() });
                                            if (res.ok) { setMessage("Дані очищено!"); fetchLayerData(); }
                                            else { setMessage("Помилка"); }
                                        } catch (e) { console.error(e); } finally { setLoading(false); }
                                    }}
                                    disabled={loading}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(254, 226, 226, 0.5)", border: "1px solid #fca5a5", borderRadius: "10px", fontWeight: 600, color: "#991b1b", cursor: "pointer", fontSize: "14px" }}
                                >
                                    🗑️ Очистити історію
                                </button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                            {[
                                { label: "Загалом по країні", value: stats.total, color: "#3b82f6", icon: "🌍", gradient: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
                                { label: "Середнє по області", value: stats.avg, color: "#10b981", icon: "📊", gradient: "linear-gradient(135deg, #ecfdf5, #d1fae5)" },
                                { label: "Максимальне", value: stats.max, color: "#f59e0b", icon: "🚀", gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)" }
                            ].map((s, i) => (
                                <div key={i} style={{
                                    background: "rgba(255, 255, 255, 0.7)",
                                    backdropFilter: "blur(10px)",
                                    padding: "24px",
                                    borderRadius: "20px",
                                    border: "1px solid rgba(255, 255, 255, 0.4)",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                    transition: "transform 0.3s ease",
                                    cursor: "default"
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ padding: "8px", borderRadius: "10px", background: s.gradient, fontSize: "18px" }}>{s.icon}</div>
                                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", width: "100%", overflow: "hidden" }}>
                                        <div style={{
                                            fontSize: "28px",
                                            fontWeight: 900,
                                            color: "#0f172a",
                                            letterSpacing: "-0.02em",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                        }} title={s.value.toLocaleString()}>
                                            {s.value.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>{regionValues[0]?.suffix || ""}</div>
                                    </div>
                                </div>
                            ))}
                        </div>


                        {selectedOblastForRaions ? (
                            <div style={{
                                background: "rgba(255, 255, 255, 0.7)",
                                backdropFilter: "blur(12px)",
                                borderRadius: "24px",
                                border: "1px solid rgba(255, 255, 255, 0.4)",
                                overflow: "hidden",
                                boxShadow: "0 12px 40px rgba(0,0,0,0.06)"
                            }}>
                                <div style={{
                                    padding: "24px 32px",
                                    background: "rgba(248, 250, 252, 0.5)",
                                    borderBottom: "1px solid #e2e8f0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                        <button
                                            onClick={() => setSelectedOblastForRaions(null)}
                                            style={{
                                                background: "white",
                                                border: "1px solid #e2e8f0",
                                                color: "#475569",
                                                cursor: "pointer",
                                                fontWeight: 700,
                                                padding: "10px 18px",
                                                borderRadius: "12px",
                                                fontSize: "0.95rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                            }}
                                        >
                                            ← Назад
                                        </button>
                                        <div>
                                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Деталізація області</div>
                                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{selectedOblastForRaions}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRaionDataSave}
                                        disabled={loading}
                                        style={{
                                            padding: "12px 28px",
                                            background: "linear-gradient(135deg, #0f172a, #1e293b)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "12px",
                                            cursor: "pointer",
                                            fontSize: "15px",
                                            fontWeight: 700,
                                            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)"
                                        }}
                                    >
                                        {loading ? "Збереження..." : "Зберегти райони"}
                                    </button>
                                </div>
                                <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0" }}>
                                        <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "rgba(248, 250, 252, 0.95)", backdropFilter: "blur(8px)" }}>
                                            <tr>
                                                <th style={{ padding: "20px 32px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Район</th>
                                                <th style={{ padding: "20px 32px", textAlign: "right", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Значення</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {raionValues.map((row) => (
                                                <tr key={row.raion} style={{ transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(241, 245, 249, 0.4)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                    <td style={{ padding: "16px 32px", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>{row.raion}</td>
                                                    <td style={{ padding: "16px 32px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
                                                            <input
                                                                type="number"
                                                                value={row.value === 0 ? '' : row.value}
                                                                placeholder="0"
                                                                onChange={(e) => handleRaionValueChange(row.raion, e.target.value)}
                                                                style={{
                                                                    padding: "10px 16px",
                                                                    borderRadius: "12px",
                                                                    border: "1px solid #cbd5e1",
                                                                    textAlign: "right",
                                                                    width: "140px",
                                                                    fontSize: "1.1rem",
                                                                    fontWeight: 700,
                                                                    outline: "none",
                                                                    transition: "all 0.2s",
                                                                    color: "#0f172a",
                                                                    background: "white"
                                                                }}
                                                                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                                                onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                                                            />
                                                            <span style={{ minWidth: "50px", textAlign: "left", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 500 }}>{regionValues[0]?.suffix || ""}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : showHistoryTable ? (
                            <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", position: "sticky", left: 0, background: "#f8fafc", zIndex: 2 }}>Регіон</th>
                                                {availablePeriods.map(p => (
                                                    <th key={p} style={{ padding: "16px 10px", textAlign: "center", fontSize: "12px", fontWeight: 800, color: "#64748b", whiteSpace: "nowrap" }}>
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                                            {new Date(p).toLocaleDateString("uk-UA", { month: "short", year: "2-digit" })}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeletePeriod(p); }}
                                                                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "10px", padding: "2px", opacity: 0.5 }}
                                                                title="Видалити період"
                                                            >
                                                                ❌
                                                            </button>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {regionValues.map(row => (
                                                <tr key={row.region} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                    <td style={{ padding: "14px 24px", fontWeight: 700, color: "#0f172a", position: "sticky", left: 0, background: "white", zIndex: 1, borderRight: "1px solid #f1f5f9" }}>
                                                        {row.region}
                                                    </td>
                                                    {availablePeriods.map(p => {
                                                        const hist = layerHistory[row.region]?.find(h => h.period.startsWith(p.substring(0, 10)));
                                                        return (
                                                            <td key={p} style={{ padding: "12px", textAlign: "center", background: selectedPeriod === p ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                                                                <input
                                                                    type="number"
                                                                    defaultValue={hist?.value || 0}
                                                                    onBlur={async (e) => {
                                                                        const newVal = parseInt(e.target.value, 10);
                                                                        if (newVal === hist?.value) return;

                                                                        // Auto-save cell change
                                                                        try {
                                                                            const payload = {
                                                                                layer_slug: selectedLayerSlug,
                                                                                data: [{ region_name: row.region, value: newVal }],
                                                                                period: p
                                                                            };
                                                                            await fetch("/api/data", {
                                                                                method: "POST",
                                                                                headers: getAuthHeaders(),
                                                                                body: JSON.stringify(payload)
                                                                            });
                                                                            fetchLayerHistory(); // Refresh sparklines/grid
                                                                        } catch (err) { console.error(err); }
                                                                    }}
                                                                    style={{
                                                                        width: "80px",
                                                                        padding: "6px 8px",
                                                                        borderRadius: "8px",
                                                                        border: "1px solid transparent",
                                                                        textAlign: "center",
                                                                        fontSize: "13px",
                                                                        fontWeight: 600,
                                                                        background: hist ? "transparent" : "#fff1f2",
                                                                        color: hist ? "#334155" : "#be123c",
                                                                        outline: "none"
                                                                    }}
                                                                    onFocus={(e) => e.target.style.border = "1px solid #3b82f6"}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.4)", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0" }}>
                                    <thead style={{ background: "rgba(248, 250, 252, 0.5)" }}>
                                        <tr>
                                            <th style={{ padding: "20px 24px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>Регіон</th>
                                            <th style={{ padding: "20px 24px", textAlign: "center", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>Тренд</th>
                                            <th style={{ padding: "20px 24px", textAlign: "center", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>Райони</th>
                                            <th style={{ padding: "20px 24px", textAlign: "right", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>Значення</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {regionValues.map((row) => (
                                            <tr key={row.region} style={{ transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(241, 245, 249, 0.4)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                <td style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9" }}>
                                                    <div style={{ fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                                                        {row.region}
                                                        {row.is_aggregated && (
                                                            <span title="Автоматично розраховано з районів" style={{ cursor: "help", fontSize: "9px", color: "white", background: "linear-gradient(135deg, #3b82f6, #2563eb)", padding: "2px 8px", borderRadius: "20px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                                                Σ РАЙОНИ
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px 24px", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
                                                    <Sparkline data={layerHistory[row.region]} color={row.is_aggregated ? "#3b82f6" : "#64748b"} />
                                                </td>
                                                <td style={{ padding: "16px 24px", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
                                                    <button
                                                        onClick={() => fetchRaionData(row.region)}
                                                        className="raion-drill-btn"
                                                        style={{
                                                            padding: "8px 16px",
                                                            background: "white",
                                                            border: "1px solid #e2e8f0",
                                                            borderRadius: "10px",
                                                            cursor: "pointer",
                                                            fontSize: "13px",
                                                            fontWeight: 600,
                                                            color: "#475569",
                                                            transition: "all 0.2s",
                                                            boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = "#3b82f6";
                                                            e.currentTarget.style.color = "#3b82f6";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = "#e2e8f0";
                                                            e.currentTarget.style.color = "#475569";
                                                        }}
                                                    >
                                                        🏘️ Деталізація
                                                    </button>
                                                </td>
                                                <td style={{ padding: "16px 24px", textAlign: "right", borderTop: "1px solid #f1f5f9" }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
                                                        <input
                                                            type="number"
                                                            value={row.value === 0 ? '' : row.value}
                                                            placeholder="0"
                                                            onChange={(e) => handleValueChange(row.region, e.target.value)}
                                                            disabled={row.is_aggregated}
                                                            style={{
                                                                padding: "10px",
                                                                borderRadius: "10px",
                                                                border: "1px solid #cbd5e1",
                                                                textAlign: "right",
                                                                width: "140px",
                                                                fontSize: "1.1rem",
                                                                fontWeight: 700,
                                                                background: row.is_aggregated ? "#f8fafc" : "white",
                                                                color: row.is_aggregated ? "#94a3b8" : "#0f172a",
                                                                cursor: row.is_aggregated ? "not-allowed" : "text",
                                                                outline: "none",
                                                                transition: "all 0.2s"
                                                            }}
                                                            onFocus={(e) => !row.is_aggregated && (e.target.style.borderColor = "#3b82f6")}
                                                            onBlur={(e) => !row.is_aggregated && (e.target.style.borderColor = "#cbd5e1")}
                                                        />
                                                        <span style={{ minWidth: "50px", textAlign: "left", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 500 }}>{row.suffix}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
