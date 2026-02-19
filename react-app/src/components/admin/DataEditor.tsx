import React from "react";
import { MetricConfig } from "../../types";
import { RegionValueRow } from "../../services/api";
import Sparkline from "../ui/Sparkline";
import RaionEditor from "./RaionEditor";
import HistoryTable from "./HistoryTable";
import "../admin/AdminPage.css";

interface DataEditorProps {
    layers: MetricConfig[];
    loading: boolean;
    password: string;

    // Layer / period selection
    selectedLayerSlug: string;
    onSelectLayer: (slug: string) => void;
    selectedPeriod: string;
    onSelectPeriod: (p: string) => void;
    availablePeriods: string[];

    // Oblast data
    regionValues: RegionValueRow[];
    layerHistory: Record<string, { value: number; period: string }[]>;
    onValueChange: (region: string, value: string) => void;

    // Raion data
    selectedOblastForRaions: string | null;
    raionValues: { raion: string; value: number }[];
    onRaionValueChange: (raion: string, value: string) => void;
    onFetchRaionData: (oblastName: string) => void;
    onClearRaionSelection: () => void;
    onSaveRaionData: () => void;

    // Actions
    onSave: () => void;
    onDeletePeriod: (period: string) => void;
    onRandomFill: () => void;
    onGenerateHistory: () => void;
    onClearHistory: () => void;
    onRefreshData: () => void;
    onRefreshHistory: () => void;

    // History table
    showHistoryTable: boolean;
    onToggleHistoryTable: () => void;

    onSetLoading: (v: boolean) => void;
    onMessage: (msg: string) => void;
}

const DataEditor: React.FC<DataEditorProps> = ({
    layers,
    loading,
    password,
    selectedLayerSlug,
    onSelectLayer,
    selectedPeriod,
    onSelectPeriod,
    availablePeriods,
    regionValues,
    layerHistory,
    onValueChange,
    selectedOblastForRaions,
    raionValues,
    onRaionValueChange,
    onFetchRaionData,
    onClearRaionSelection,
    onSaveRaionData,
    onSave,
    onDeletePeriod,
    onRandomFill,
    onGenerateHistory,
    onClearHistory,
    onRefreshData,
    onRefreshHistory,
    showHistoryTable,
    onToggleHistoryTable,
    onSetLoading,
    onMessage,
}) => {
    // Summary stats
    const stats = React.useMemo(() => {
        if (regionValues.length === 0) return { total: 0, avg: 0, max: 0 };
        const vals = regionValues.map((r) => Number(r.value) || 0);
        const total = vals.reduce((a, b) => a + b, 0);
        return {
            total,
            avg: Math.round(total / vals.length),
            max: Math.max(...vals),
        };
    }, [regionValues]);

    const suffix = regionValues[0]?.suffix || "";

    const statCards = [
        { label: "Загалом по країні", value: stats.total, icon: "🌍", gradient: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
        { label: "Середнє по області", value: stats.avg, icon: "📊", gradient: "linear-gradient(135deg, #ecfdf5, #d1fae5)" },
        { label: "Максимальне", value: stats.max, icon: "🚀", gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)" },
    ];

    return (
        <div style={{ display: "grid", gap: 30 }}>
            {/* ── Toolbar ────────────────────────────────── */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
                    {/* Layer select */}
                    <div style={{ minWidth: 240, flex: 1, display: "grid", gap: 8 }}>
                        <label className="form-label-sm">Активний шар</label>
                        <select
                            value={selectedLayerSlug}
                            onChange={(e) => onSelectLayer(e.target.value)}
                            className="form-select"
                        >
                            {layers.map((l) => (
                                <option key={l.id} value={l.slug}>{l.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Period select */}
                    <div style={{ minWidth: 180, display: "grid", gap: 8 }}>
                        <label className="form-label-sm">Період (Місяць)</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                type="month"
                                value={selectedPeriod.substring(0, 7)}
                                onChange={(e) => onSelectPeriod(e.target.value + "-01")}
                                className="form-input"
                                style={{ flex: 1, fontWeight: 600, color: "#0f172a", borderRadius: 12, border: "1px solid #e2e8f0" }}
                            />
                            <select
                                value={selectedPeriod}
                                onChange={(e) => onSelectPeriod(e.target.value)}
                                style={{ padding: "11px 8px", borderRadius: 12, border: "1px solid #e2e8f0", background: "white", fontWeight: 600, fontSize: "0.9rem" }}
                            >
                                <option value={new Date().toISOString().split("T")[0].substring(0, 7) + "-01"}>
                                    Поточний
                                </option>
                                {availablePeriods.map((p) => (
                                    <option key={p} value={p}>
                                        {new Date(p).toLocaleDateString("uk-UA", { month: "short", year: "numeric" })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
                        <button
                            onClick={onToggleHistoryTable}
                            className={`btn-toggle ${showHistoryTable ? "active" : ""}`}
                        >
                            {showHistoryTable ? "← До редактора" : "📊 Таблиця історії"}
                        </button>
                        <button onClick={onSave} disabled={loading} className="btn-primary">
                            {loading ? "Збереження..." : "Зберегти всі зміни"}
                        </button>
                        <button
                            onClick={() => onDeletePeriod(selectedPeriod)}
                            disabled={loading}
                            title="Видалити вибраний місяць"
                            className="btn-icon-danger"
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                {/* Utilities row */}
                <div style={{ display: "flex", gap: 12, borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 15, flexWrap: "wrap" }}>
                    <button onClick={onRandomFill} className="btn-secondary">🎲 Випадкові значення</button>
                    <button onClick={onGenerateHistory} className="btn-secondary">📈 Згенерувати історію</button>
                    <button onClick={onClearHistory} disabled={loading} className="btn-danger-outline">
                        🗑️ Очистити історію
                    </button>
                </div>
            </div>

            {/* ── Summary Cards ───────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {statCards.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ padding: 8, borderRadius: 10, background: s.gradient, fontSize: 18 }}>{s.icon}</div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {s.label}
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, overflow: "hidden" }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={s.value.toLocaleString()}>
                                {s.value.toLocaleString()}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>{suffix}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Content area ────────────────────────────── */}
            {selectedOblastForRaions ? (
                <RaionEditor
                    oblastName={selectedOblastForRaions}
                    raionValues={raionValues}
                    suffix={suffix}
                    loading={loading}
                    onBack={onClearRaionSelection}
                    onSave={onSaveRaionData}
                    onValueChange={onRaionValueChange}
                />
            ) : showHistoryTable ? (
                <HistoryTable
                    regionValues={regionValues}
                    layerHistory={layerHistory}
                    availablePeriods={availablePeriods}
                    selectedPeriod={selectedPeriod}
                    selectedLayerSlug={selectedLayerSlug}
                    password={password}
                    onDeletePeriod={onDeletePeriod}
                    onRefresh={onRefreshHistory}
                />
            ) : (
                /* Region values table */
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Регіон</th>
                                <th className="center">Тренд</th>
                                <th className="center">Райони</th>
                                <th className="right">Значення</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regionValues.map((row) => (
                                <tr key={row.region}>
                                    <td>
                                        <div className="region-name">
                                            {row.region}
                                            {row.is_aggregated && (
                                                <span title="Автоматично розраховано з районів" className="badge-aggregated">
                                                    Σ РАЙОНИ
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="center">
                                        <Sparkline
                                            data={layerHistory[row.region]}
                                            color={row.is_aggregated ? "#3b82f6" : "#64748b"}
                                        />
                                    </td>
                                    <td className="center">
                                        <button onClick={() => onFetchRaionData(row.region)} className="raion-drill-btn">
                                            🏘️ Деталізація
                                        </button>
                                    </td>
                                    <td className="right">
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                                            <input
                                                type="number"
                                                value={row.value === 0 ? "" : row.value}
                                                placeholder="0"
                                                onChange={(e) => onValueChange(row.region, e.target.value)}
                                                disabled={row.is_aggregated}
                                                className="value-input"
                                            />
                                            <span className="value-suffix">{row.suffix}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DataEditor;
