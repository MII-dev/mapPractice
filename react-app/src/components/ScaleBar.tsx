import React from "react";

const colors = [
  "#FBDB93",
  "#F4B5A7",
  "#ad5e78",
  "#BE5B50",
  "#8A2D3B",
  "#641B2E",
];

const ScaleBar = ({ scale }) => {
  if (!scale || scale.length < 2) return null;

  const segments = [];

  for (let i = 0; i < scale.length - 1; i++) {
    const from = scale[i];
    const to = scale[i + 1];
    const label = `${from} - ${to}`;
    const color = colors[i % colors.length];

    segments.push(
      <div
        key={i}
        style={{
          flex: 1,
          backgroundColor: color,
          textAlign: "center",
          padding: "8px 0",
          borderRight: i !== scale.length - 2 ? "1px solid #ccc" : "none",
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        border: "1px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden",
        fontFamily: "sans-serif",
        fontSize: "14px",
      }}
    >
      {segments}
    </div>
  );
};

export default ScaleBar;
