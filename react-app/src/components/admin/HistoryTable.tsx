import React from "react";
import * as api from "../../services/api";
import "../admin/AdminPage.css";

interface HistoryTableProps {
    regionValues: api.RegionValueRow[];
    layerHistory: Record<string, { value: number; period: string }[]>;
    availablePeriods: string[];
    selectedPeriod: string;
    selectedLayerSlug: string;
    password: string;
    onDeletePeriod: (period: string) => void;
    onRefresh: () => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
    regionValues,
    layerHistory,
    availablePeriods,
    selectedPeriod,
    selectedLayerSlug,
    password,
    onDeletePeriod,
    onRefresh,
}) => {
    const handleCellSave = async (regionName: string, period: string, value: number) => {
        try {
            await api.saveLayerData(
                selectedLayerSlug,
                [{ region_name: regionName, value }],
                period,
                password
            );
            onRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="history-table-wrap">
            <div style={{ overflowX: "auto" }}>
                <table className="history-table">
                    <thead>
                        <tr>
                            <th className="sticky">Регіон</th>
                            {availablePeriods.map((p) => (
                                <th key={p}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                        {new Date(p).toLocaleDateString("uk-UA", {
                                            month: "short",
                                            year: "2-digit",
                                        })}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeletePeriod(p);
                                            }}
                                            className="period-delete-btn"
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
                        {regionValues.map((row) => (
                            <tr key={row.region}>
                                <td className="sticky">{row.region}</td>
                                {availablePeriods.map((p) => {
                                    const hist = layerHistory[row.region]?.find((h) =>
                                        h.period.startsWith(p.substring(0, 10))
                                    );
                                    return (
                                        <td
                                            key={p}
                                            style={{
                                                padding: 12,
                                                textAlign: "center",
                                                background: selectedPeriod === p ? "rgba(59,130,246,0.05)" : "transparent",
                                            }}
                                        >
                                            <input
                                                type="number"
                                                defaultValue={hist?.value || 0}
                                                onBlur={(e) => {
                                                    const newVal = parseInt(e.target.value, 10);
                                                    if (newVal === hist?.value) return;
                                                    handleCellSave(row.region, p, newVal);
                                                }}
                                                className={`history-cell-input ${hist ? "filled" : "empty"}`}
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
    );
};

export default HistoryTable;
