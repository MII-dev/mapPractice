import React, { useState } from "react";
import { MetricConfig } from "../../types";
import * as api from "../../services/api";
import "../admin/AdminPage.css";

interface LayerManagerProps {
    layers: MetricConfig[];
    loading: boolean;
    password: string;
    onMessage: (msg: string) => void;
    onSetLoading: (v: boolean) => void;
    onRefreshLayers: () => void;
    onLogout: () => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
    layers,
    loading,
    password,
    onMessage,
    onSetLoading,
    onRefreshLayers,
    onLogout,
}) => {
    const [newLayer, setNewLayer] = useState({
        name: "",
        slug: "",
        color_theme: "blue",
        suffix: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onSetLoading(true);
        onMessage("");

        if (!newLayer.name || !newLayer.slug) {
            onMessage("Назва та Slug обов'язкові");
            onSetLoading(false);
            return;
        }

        try {
            await api.createLayer(newLayer, password);
            onMessage("Шар успішно додано!");
            setNewLayer({ name: "", slug: "", color_theme: "blue", suffix: "" });
            onRefreshLayers();
        } catch (err) {
            if (err instanceof api.AuthError) {
                onMessage("Помилка авторизації: Перевірте пароль");
                onLogout();
            } else {
                onMessage("Помилка при додаванні шару");
            }
        } finally {
            onSetLoading(false);
        }
    };

    const handleDelete = async (layer: MetricConfig) => {
        if (
            !window.confirm(
                `Ви впевнені, що хочете видалити шар "${layer.name}" та ВСІ його дані? Цю дію неможливо скасувати.`
            )
        )
            return;

        onSetLoading(true);
        try {
            await api.deleteLayer(layer.slug, password);
            onMessage("Шар успішно видалено");
            onRefreshLayers();
        } catch {
            onMessage("Не вдалося видалити шар");
        } finally {
            onSetLoading(false);
        }
    };

    const resolveColor = (theme: string) => {
        if (theme.startsWith("#")) return theme;
        if (theme === "green") return "#10b981";
        return "#3b82f6";
    };

    return (
        <div style={{ display: "grid", gap: 40 }}>
            {/* Create Layer Form */}
            <div className="card">
                <h2 style={{ fontSize: "1.25rem", marginBottom: 20 }}>Додати новий шар</h2>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                        <label className="form-label">Назва шару</label>
                        <input
                            value={newLayer.name}
                            onChange={(e) => setNewLayer({ ...newLayer, name: e.target.value })}
                            placeholder="напр. Рівень безробіття"
                            className="form-input"
                        />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <div style={{ display: "grid", gap: 8 }}>
                            <label className="form-label">Ідентифікатор (Slug)</label>
                            <input
                                value={newLayer.slug}
                                onChange={(e) =>
                                    setNewLayer({
                                        ...newLayer,
                                        slug: e.target.value.toLowerCase().replace(/\s/g, "_"),
                                    })
                                }
                                placeholder="напр. unemployment"
                                className="form-input form-input-mono"
                            />
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                            <label className="form-label">Суфікс (од. вим.)</label>
                            <input
                                value={newLayer.suffix}
                                onChange={(e) => setNewLayer({ ...newLayer, suffix: e.target.value })}
                                placeholder="напр. осіб"
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                        <label className="form-label">Базовий колір</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                            <input
                                type="color"
                                value={newLayer.color_theme.startsWith("#") ? newLayer.color_theme : "#3b82f6"}
                                onChange={(e) => setNewLayer({ ...newLayer, color_theme: e.target.value })}
                                style={{
                                    height: 50,
                                    width: 100,
                                    cursor: "pointer",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: 0,
                                    background: "none",
                                }}
                            />
                            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                                Hex:{" "}
                                <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                                    {newLayer.color_theme}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 10 }}>
                        {loading ? "Збереження..." : "Створити шар"}
                    </button>
                </form>
            </div>

            {/* Existing Layers */}
            <div>
                <h2 style={{ fontSize: "1.25rem", marginBottom: 20 }}>Наявні шари</h2>
                <div style={{ display: "grid", gap: 10 }}>
                    {layers.map((layer) => (
                        <div key={layer.id} className="layer-item">
                            <div>
                                <span style={{ fontWeight: 600, marginRight: 10 }}>{layer.name}</span>
                                <span className="layer-slug-badge">{layer.slug}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span
                                        className="color-dot"
                                        style={{ background: resolveColor(layer.color_theme) }}
                                    />
                                    <span style={{ color: "#64748b", fontSize: "0.9em", fontFamily: "monospace" }}>
                                        {layer.color_theme}
                                    </span>
                                </div>
                                <button onClick={() => handleDelete(layer)} className="layer-delete-btn">
                                    Видалити
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LayerManager;
