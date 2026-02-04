import React from "react";
import { MetricConfig } from "./MapDataHook";

interface LayerSwitcherProps {
    metrics: MetricConfig[];
    activeMetric: MetricConfig;
    onChange: (metric: MetricConfig) => void;
}

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ metrics, activeMetric, onChange }) => {
    if (metrics.length === 0) return null;

    return (
        <div
            style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "white",
                padding: "6px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                display: "flex",
                gap: "4px",
                zIndex: 1000,
                border: "1px solid #e2e8f0"
            }}
        >
            {metrics.map((metric) => {
                const isActive = activeMetric.id === metric.id;

                // Define active colors based on theme
                let activeBg = "#3b82f6"; // default blue
                if (metric.color_theme === "green") activeBg = "#10b981";
                if (metric.color_theme === "purple") activeBg = "#8b5cf6";

                return (
                    <button
                        key={metric.id}
                        onClick={() => onChange(metric)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "12px",
                            border: "none",
                            background: isActive ? activeBg : "transparent",
                            color: isActive ? "white" : "#64748b",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        {metric.name}
                    </button>
                );
            })}
        </div>
    );
};

export default LayerSwitcher;
