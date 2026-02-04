import React, { useEffect, useState } from "react";
import { MetricConfig } from "./MapDataHook";

// Helper for Mock Import from Sheets (in real app, this parses CSV or calls Google API)
const mockImportFromSheets = async (slug: string) => {
    // Simulating fetching from the Google Sheet for the specific layer
    const mockData = [
        { region_name: "Вінницька область", value: 5000 },
        { region_name: "Волинська область", value: 3200 },
        { region_name: "Дніпропетровська область", value: 15000 },
        { region_name: "Донецька область", value: 8000 },
        { region_name: "Житомирська область", value: 4500 },
        { region_name: "Закарпатська область", value: 2800 },
        { region_name: "Запорізька область", value: 9000 },
        { region_name: "Івано-Франківська область", value: 4100 },
        { region_name: "Київська область", value: 12000 },
        { region_name: "м. Київ", value: 35000 },
        { region_name: "Кіровоградська область", value: 3800 },
        { region_name: "Луганська область", value: 2000 },
        { region_name: "Львівська область", value: 11500 },
        { region_name: "Миколаївська область", value: 5200 },
        { region_name: "Одеська область", value: 10500 },
        { region_name: "Полтавська область", value: 6000 },
        { region_name: "Рівненська область", value: 3900 },
        { region_name: "Сумська область", value: 4200 },
        { region_name: "Тернопільська область", value: 3500 },
        { region_name: "Харківська область", value: 14000 },
        { region_name: "Херсонська область", value: 3000 },
        { region_name: "Хмельницька область", value: 4800 },
        { region_name: "Черкаська область", value: 5100 },
        { region_name: "Чернівецька область", value: 2500 },
        { region_name: "Чернігівська область", value: 3700 },
    ];

    // Randomize for demo if it's not veterans
    if (slug !== 'veterans') {
        mockData.forEach(d => d.value = Math.floor(Math.random() * 1000));
    }

    return mockData;
};

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'layers' | 'data'>('layers');
    const [layers, setLayers] = useState<MetricConfig[]>([]);
    const [newLayer, setNewLayer] = useState({ name: "", slug: "", color_theme: "blue", suffix: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Data Editor State
    const [selectedLayerSlug, setSelectedLayerSlug] = useState<string>("");
    const [regionValues, setRegionValues] = useState<{ region: string; value: number; suffix: string }[]>([]);

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

    const fetchLayerData = async () => {
        if (!selectedLayerSlug) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/data/${selectedLayerSlug}`);
            if (res.ok) {
                const data = await res.json();
                setRegionValues(data);
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
        }
    }, [activeTab, selectedLayerSlug]);

    const handleLayerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (!newLayer.name || !newLayer.slug) {
            setMessage("Name and Slug are required");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/layers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLayer),
            });

            if (res.ok) {
                setMessage("Layer added successfully!");
                setNewLayer({ name: "", slug: "", color_theme: "blue", suffix: "" });
                fetchLayers();
            } else {
                setMessage("Error adding layer");
            }
        } catch (err) {
            console.error(err);
            setMessage("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleDataSave = async () => {
        setLoading(true);
        try {
            // Payload: { layer_slug, data: [{ region_name, value }] }
            const payload = {
                layer_slug: selectedLayerSlug,
                data: regionValues.map(r => ({ region_name: r.region, value: r.value }))
            };

            const res = await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage("Data saved successfully!");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setMessage("Failed to save data");
            }
        } catch (e) {
            console.error(e);
            setMessage("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleRandomFill = () => {
        const randomValues = regionValues.map(r => ({
            ...r,
            value: Math.floor(Math.random() * 5000) + 500
        }));
        setRegionValues(randomValues);
        setMessage("Generated random values! Don't forget to save.");
    };

    const handleGenerateHistory = async () => {
        if (!selectedLayerSlug) return;
        setLoading(true);
        try {
            // Generate data for last 6 months
            const months = ['2023-08-01', '2023-09-01', '2023-10-01', '2023-11-01', '2023-12-01', '2024-01-01'];
            for (const month of months) {
                const payload = {
                    layer_slug: selectedLayerSlug,
                    data: regionValues.map(r => ({
                        region_name: r.region,
                        value: Math.floor(Math.random() * 5000) + 2000
                    })),
                    period: month // Backend needs to support this in the payload!
                };
                // We'll update backend to accept 'period' in /api/data
                await fetch("/api/data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }
            setMessage("Historical data generated for 6 months!");
            fetchLayerData();
        } catch (e) {
            console.error(e);
            setMessage("Error generating history");
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (regionName: string, newValue: string) => {
        const val = parseInt(newValue, 10);
        setRegionValues(prev => prev.map(r => r.region === regionName ? { ...r, value: isNaN(val) ? 0 : val } : r));
    };


    return (
        <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h1 style={{ fontSize: "2rem", color: "#0f172a", margin: 0 }}>UkrMap CMS</h1>
                <div style={{ display: "flex", background: "#e2e8f0", padding: "4px", borderRadius: "8px" }}>
                    <button
                        onClick={() => setActiveTab('layers')}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: activeTab === 'layers' ? 'white' : 'transparent', fontWeight: 600, cursor: "pointer" }}
                    >
                        Layers
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: activeTab === 'data' ? 'white' : 'transparent', fontWeight: 600, cursor: "pointer" }}
                    >
                        Data Editor
                    </button>
                </div>
            </div>

            {activeTab === 'layers' && (
                <div style={{ display: "grid", gap: "40px" }}>
                    {/* Layer Creation Form */}
                    <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                        <h2 style={{ fontSize: "1.25rem", marginBottom: "20px" }}>Add New Layer</h2>
                        <form onSubmit={handleLayerSubmit} style={{ display: "grid", gap: "20px" }}>
                            <div style={{ display: "grid", gap: "8px" }}>
                                <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Layer Name</label>
                                <input
                                    value={newLayer.name}
                                    onChange={(e) => setNewLayer({ ...newLayer, name: e.target.value })}
                                    placeholder="e.g. Unemployment Rate"
                                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                <div style={{ display: "grid", gap: "8px" }}>
                                    <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Slug</label>
                                    <input
                                        value={newLayer.slug}
                                        onChange={(e) => setNewLayer({ ...newLayer, slug: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                                        placeholder="e.g. unemployment"
                                        style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
                                    />
                                </div>
                                <div style={{ display: "grid", gap: "8px" }}>
                                    <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Suffix</label>
                                    <input
                                        value={newLayer.suffix}
                                        onChange={(e) => setNewLayer({ ...newLayer, suffix: e.target.value })}
                                        placeholder="e.g. people"
                                        style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "grid", gap: "8px" }}>
                                <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Base Color</label>
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
                                {loading ? "Saving..." : "Create Layer"}
                            </button>
                            {message && <p style={{ color: message.includes("Error") ? "red" : "green", marginTop: "10px" }}>{message}</p>}
                        </form>
                        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                            <button
                                onClick={async () => {
                                    const examples = [
                                        { name: "Середня зарплата", slug: "avg_salary", color_theme: "#f59e0b", suffix: "грн" },
                                        { name: "Кількість ВПО", slug: "vpo_count", color_theme: "#8b5cf6", suffix: "осіб" },
                                        { name: "Гуманітарна допомога", slug: "human_aid", color_theme: "#ec4899", suffix: "тон" }
                                    ];
                                    for (const ex of examples) {
                                        await fetch("/api/layers", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(ex)
                                        });
                                    }
                                    fetchLayers();
                                    setMessage("Added 3 example layers!");
                                }}
                                style={{ background: "none", border: "1px dashed #cbd5e1", color: "#64748b", padding: "10px", width: "100%", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                            >
                                + Додати прикладні категорії (моки)
                            </button>
                        </div>
                    </div>

                    {/* Existing Layers List */}
                    <div>
                        <h2 style={{ fontSize: "1.25rem", marginBottom: "20px" }}>Existing Layers</h2>
                        <div style={{ display: "grid", gap: "10px" }}>
                            {layers.map(layer => (
                                <div key={layer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div>
                                        <span style={{ fontWeight: 600, marginRight: "10px" }}>{layer.name}</span>
                                        <span style={{ fontSize: "0.85em", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px" }}>{layer.slug}</span>
                                    </div>
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div style={{ display: "grid", gap: "30px" }}>
                    <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
                        <div style={{ flex: 1, display: "grid", gap: "8px" }}>
                            <label style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>Select Layer to Edit</label>
                            <select
                                value={selectedLayerSlug}
                                onChange={(e) => setSelectedLayerSlug(e.target.value)}
                                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
                            >
                                {layers.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleRandomFill}
                            style={{ padding: "12px 20px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, color: "#475569", cursor: "pointer", height: "45px" }}
                        >
                            🎲 Randomize
                        </button>
                        <button
                            onClick={handleGenerateHistory}
                            disabled={loading}
                            style={{ padding: "12px 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, color: "#475569", cursor: "pointer", height: "45px" }}
                        >
                            📈 Gen History
                        </button>
                        <button
                            onClick={handleDataSave}
                            disabled={loading}
                            style={{ padding: "12px 30px", background: "#0f172a", border: "none", borderRadius: "8px", fontWeight: 600, color: "white", cursor: "pointer", height: "45px" }}
                        >
                            {loading ? "Saving..." : "Save All Changes"}
                        </button>
                    </div>

                    {message && <div style={{ padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "8px", border: "1px solid #bbf7d0" }}>{message}</div>}

                    <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <tr>
                                    <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "#64748b" }}>Region</th>
                                    <th style={{ padding: "16px", textAlign: "right", fontSize: "0.85rem", textTransform: "uppercase", color: "#64748b" }}>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regionValues.map((row) => (
                                    <tr key={row.region} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "16px", fontWeight: 500 }}>{row.region}</td>
                                        <td style={{ padding: "16px", textAlign: "right" }}>
                                            <input
                                                type="number"
                                                value={row.value === 0 ? '' : row.value}
                                                placeholder="0"
                                                onChange={(e) => handleValueChange(row.region, e.target.value)}
                                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0", textAlign: "right", width: "120px", fontSize: "1rem" }}
                                            />
                                            <span style={{ marginLeft: "8px", color: "#94a3b8", fontSize: "0.9em" }}>{row.suffix || ""}</span>
                                        </td>
                                    </tr>
                                ))}
                                {regionValues.length === 0 && (
                                    <tr><td colSpan={2} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>Select a layer to view data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
