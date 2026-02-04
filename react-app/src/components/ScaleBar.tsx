import React from "react";
import { generatePalette } from "../utils/colors";

interface ScaleBarProps {
  scale: number[];
  title: string;
  theme: string;
}

const ScaleBar: React.FC<ScaleBarProps> = ({ scale, title, theme }) => {
  if (!scale || scale.length < 2) return null;

  const colors = generatePalette(theme, 6);

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "white",
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        minWidth: "250px",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "12px",
        }}
      >
        {title}
      </div>

      {/* Gradient Bar */}
      <div
        style={{
          display: "flex",
          height: "10px",
          borderRadius: "6px",
          overflow: "hidden",
          marginBottom: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        {colors.map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#64748b",
          fontWeight: 500,
        }}
      >
        <span>{scale[0]}</span>
        <span>{scale[scale.length - 1]}</span>
      </div>
    </div>
  );
};

export default ScaleBar;
