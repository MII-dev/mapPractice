import React from "react";
import "../admin/AdminPage.css";

interface RaionEditorProps {
    oblastName: string;
    raionValues: { raion: string; value: number }[];
    suffix: string;
    loading: boolean;
    onBack: () => void;
    onSave: () => void;
    onValueChange: (raion: string, newValue: string) => void;
}

const RaionEditor: React.FC<RaionEditorProps> = ({
    oblastName,
    raionValues,
    suffix,
    loading,
    onBack,
    onSave,
    onValueChange,
}) => (
    <div className="raion-editor-wrap">
        <div className="raion-editor-header">
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <button onClick={onBack} className="btn-back">← Назад</button>
                <div>
                    <div className="raion-editor-subtitle">Деталізація області</div>
                    <div className="raion-editor-title">{oblastName}</div>
                </div>
            </div>
            <button onClick={onSave} disabled={loading} className="btn-primary" style={{ padding: "12px 28px" }}>
                {loading ? "Збереження..." : "Зберегти райони"}
            </button>
        </div>
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <table className="data-table">
                <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "rgba(248,250,252,0.95)", backdropFilter: "blur(8px)" }}>
                    <tr>
                        <th>Район</th>
                        <th className="right">Значення</th>
                    </tr>
                </thead>
                <tbody>
                    {raionValues.map((row) => (
                        <tr key={row.raion}>
                            <td style={{ padding: "16px 32px", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>
                                {row.raion}
                            </td>
                            <td style={{ padding: "16px 32px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                                    <input
                                        type="number"
                                        value={row.value === 0 ? "" : row.value}
                                        placeholder="0"
                                        onChange={(e) => onValueChange(row.raion, e.target.value)}
                                        className="value-input"
                                    />
                                    <span className="value-suffix">{suffix}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default RaionEditor;
