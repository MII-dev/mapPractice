import React, { useEffect, useState, useCallback } from "react";
import { MetricConfig } from "../types";
import { useAdminAuth } from "../hooks/useAdminAuth";
import * as api from "../services/api";
import LoginForm from "./admin/LoginForm";
import LayerManager from "./admin/LayerManager";
import DataEditor from "./admin/DataEditor";
import "./admin/AdminPage.css";

const AdminPage: React.FC = () => {
    const auth = useAdminAuth();
    const [activeTab, setActiveTab] = useState<"layers" | "data">("layers");
    const [layers, setLayers] = useState<MetricConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Data Editor state
    const [selectedLayerSlug, setSelectedLayerSlug] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState(
        new Date().toISOString().split("T")[0].substring(0, 7) + "-01"
    );
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
    const [regionValues, setRegionValues] = useState<api.RegionValueRow[]>([]);
    const [layerHistory, setLayerHistory] = useState<
        Record<string, { value: number; period: string }[]>
    >({});
    const [showHistoryTable, setShowHistoryTable] = useState(false);

    // Raion state
    const [selectedOblastForRaions, setSelectedOblastForRaions] = useState<string | null>(null);
    const [raionValues, setRaionValues] = useState<{ raion: string; value: number }[]>([]);

    // ─── Data fetching ───────────────────────────────────

    const fetchLayers = useCallback(async () => {
        try {
            const data = await api.getLayers();
            setLayers(data);
            if (data.length > 0 && !selectedLayerSlug) {
                setSelectedLayerSlug(data[0].slug);
            }
        } catch (err) {
            console.error("Failed to fetch layers", err);
        }
    }, [selectedLayerSlug]);

    const fetchPeriods = useCallback(async () => {
        if (!selectedLayerSlug) return;
        try {
            setAvailablePeriods(await api.getPeriods(selectedLayerSlug));
        } catch (e) {
            console.error(e);
        }
    }, [selectedLayerSlug]);

    const fetchLayerHistory = useCallback(async () => {
        if (!selectedLayerSlug) return;
        try {
            setLayerHistory(await api.getLayerHistory(selectedLayerSlug));
        } catch (e) {
            console.error(e);
        }
    }, [selectedLayerSlug]);

    const fetchLayerData = useCallback(async () => {
        if (!selectedLayerSlug) return;
        setLoading(true);
        try {
            const data = await api.getLayerData(selectedLayerSlug, selectedPeriod || undefined);
            setRegionValues(data);
            fetchPeriods();
            fetchLayerHistory();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedLayerSlug, selectedPeriod, fetchPeriods, fetchLayerHistory]);

    const fetchRaionData = useCallback(
        async (oblastName: string) => {
            if (!selectedLayerSlug) return;
            setLoading(true);
            try {
                const data = await api.getRaionData(selectedLayerSlug, selectedPeriod || undefined);
                const filtered = data
                    .filter((r) => r.parent_oblast === oblastName)
                    .map((r) => ({ raion: r.raion, value: r.value }));
                setRaionValues(filtered);
                setSelectedOblastForRaions(oblastName);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        },
        [selectedLayerSlug, selectedPeriod]
    );

    useEffect(() => {
        fetchLayers();
    }, []);

    useEffect(() => {
        if (activeTab === "data") {
            fetchLayerData();
            setSelectedOblastForRaions(null);
        }
    }, [activeTab, selectedLayerSlug, selectedPeriod]);

    // ─── Handlers ────────────────────────────────────────

    const handleDeletePeriod = async (period: string) => {
        if (!selectedLayerSlug) return;
        const formattedDate = new Date(period).toLocaleDateString("uk-UA", {
            month: "long",
            year: "numeric",
        });
        if (!window.confirm(`Видалити ВСІ дані для періоду ${formattedDate}? Цю дію неможливо скасувати.`))
            return;

        setLoading(true);
        try {
            await api.deleteHistory(selectedLayerSlug, auth.password, period);
            setMessage(`Дані за ${formattedDate} видалено`);
            fetchLayerData();
        } catch {
            setMessage("Помилка при видаленні");
        } finally {
            setLoading(false);
        }
    };

    const handleDataSave = async () => {
        setLoading(true);
        try {
            await api.saveLayerData(
                selectedLayerSlug,
                regionValues.map((r) => ({ region_name: r.region, value: r.value })),
                selectedPeriod,
                auth.password
            );
            setMessage("✅ Дані успішно збережено!");
            await fetchLayerData();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            if (err instanceof api.AuthError) {
                setMessage("Помилка авторизації: Перевірте пароль");
                auth.handleLogout();
            } else {
                setMessage("Не вдалося зберегти дані");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRaionDataSave = async () => {
        setLoading(true);
        try {
            await api.saveRaionData(
                selectedLayerSlug,
                raionValues.map((r) => ({ raion_name: r.raion, value: r.value })),
                selectedPeriod,
                auth.password
            );
            setMessage(`Дані районів ${selectedOblastForRaions} збережено!`);
            setTimeout(() => setMessage(""), 3000);
            fetchLayerData();
        } catch {
            setMessage("Не вдалося зберегти дані районів");
        } finally {
            setLoading(false);
        }
    };

    const handleRandomFill = () => {
        if (selectedOblastForRaions) {
            setRaionValues((prev) => prev.map((r) => ({ ...r, value: Math.floor(Math.random() * 200) + 50 })));
            setMessage("Згенеровано випадкові значення для районів!");
        } else {
            setRegionValues((prev) => prev.map((r) => ({ ...r, value: Math.floor(Math.random() * 5000) + 500 })));
            setMessage("Згенеровано випадкові значення! Не забудьте зберегти.");
        }
    };

    const handleGenerateHistory = async () => {
        if (!window.confirm("Це автоматично згенерує випадкові історичні дані за останні 6 місяців. Продовжити?"))
            return;
        setLoading(true);
        try {
            const today = new Date();
            for (let i = 0; i < 6; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const p = d.toISOString().split("T")[0];
                await api.saveLayerData(
                    selectedLayerSlug,
                    regionValues.map((r) => ({
                        region_name: r.region,
                        value: Math.floor(Math.random() * 5000) + 500,
                    })),
                    p,
                    auth.password
                );
            }
            setMessage("Історію згенеровано!");
            fetchLayerData();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!selectedLayerSlug) return;
        const forPeriod = window.confirm(
            "Видалити дані ТІЛЬКИ для вибраного місяця? Скасувати - видалити ВСЮ історію."
        );
        if (!window.confirm("Дію неможливо скасувати. Продовжити?")) return;
        setLoading(true);
        try {
            await api.deleteHistory(selectedLayerSlug, auth.password, forPeriod ? selectedPeriod : undefined);
            setMessage("Дані очищено!");
            fetchLayerData();
        } catch {
            setMessage("Помилка");
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (region: string, newValue: string) => {
        const val = newValue === "" ? 0 : parseInt(newValue, 10);
        setRegionValues((prev) => prev.map((r) => (r.region === region ? { ...r, value: val } : r)));
    };

    const handleRaionValueChange = (raion: string, newValue: string) => {
        const val = newValue === "" ? 0 : parseInt(newValue, 10);
        setRaionValues((prev) => prev.map((r) => (r.raion === raion ? { ...r, value: val } : r)));
    };

    // ─── Render ──────────────────────────────────────────

    if (!auth.isAuthenticated) {
        return (
            <LoginForm
                passwordInput={auth.passwordInput}
                loginError={auth.loginError}
                onPasswordChange={auth.setPasswordInput}
                onSubmit={auth.handleLogin}
            />
        );
    }

    const isSuccess = message.includes("✅") || message.includes("успішно") || message.includes("збережено") || message.includes("згенеровано") || message.includes("видалено") || message.includes("очищено");

    return (
        <div className="admin-page">
            {/* Toast */}
            {message && (
                <div className={`toast ${isSuccess ? "success" : "error"}`}>{message}</div>
            )}

            <div className="admin-container">
                {/* Header */}
                <div className="admin-header">
                    <h1 className="admin-title">Адмін-панель Карти</h1>
                    <div className="admin-header-actions">
                        <div className="tab-switcher">
                            <button
                                onClick={() => setActiveTab("layers")}
                                className={`tab-btn ${activeTab === "layers" ? "active" : ""}`}
                            >
                                Шари
                            </button>
                            <button
                                onClick={() => setActiveTab("data")}
                                className={`tab-btn ${activeTab === "data" ? "active" : ""}`}
                            >
                                Редактор даних
                            </button>
                        </div>
                        <button onClick={auth.handleLogout} className="btn-danger">Вийти</button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === "layers" && (
                    <LayerManager
                        layers={layers}
                        loading={loading}
                        password={auth.password}
                        onMessage={setMessage}
                        onSetLoading={setLoading}
                        onRefreshLayers={fetchLayers}
                        onLogout={auth.handleLogout}
                    />
                )}

                {activeTab === "data" && (
                    <DataEditor
                        layers={layers}
                        loading={loading}
                        password={auth.password}
                        selectedLayerSlug={selectedLayerSlug}
                        onSelectLayer={setSelectedLayerSlug}
                        selectedPeriod={selectedPeriod}
                        onSelectPeriod={setSelectedPeriod}
                        availablePeriods={availablePeriods}
                        regionValues={regionValues}
                        layerHistory={layerHistory}
                        onValueChange={handleValueChange}
                        selectedOblastForRaions={selectedOblastForRaions}
                        raionValues={raionValues}
                        onRaionValueChange={handleRaionValueChange}
                        onFetchRaionData={fetchRaionData}
                        onClearRaionSelection={() => setSelectedOblastForRaions(null)}
                        onSaveRaionData={handleRaionDataSave}
                        onSave={handleDataSave}
                        onDeletePeriod={handleDeletePeriod}
                        onRandomFill={handleRandomFill}
                        onGenerateHistory={handleGenerateHistory}
                        onClearHistory={handleClearHistory}
                        onRefreshData={fetchLayerData}
                        onRefreshHistory={fetchLayerHistory}
                        showHistoryTable={showHistoryTable}
                        onToggleHistoryTable={() => setShowHistoryTable((v) => !v)}
                        onSetLoading={setLoading}
                        onMessage={setMessage}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminPage;
