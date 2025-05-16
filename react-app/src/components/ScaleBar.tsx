import React from "react";

const colors = [
  // "#FBDB93",
  // "#F4B5A7",
  // "#ad5e78",
  // "#BE5B50",
  // "#8A2D3B",
  // "#641B2E",

  "#f57a9a",
  "#d66381",
  "#b54a66",
  "#96354e",
  "#752137",
  "#4f1121",
];

const ScaleBar = ({ scale }) => {
  if (!scale || scale.length < 2) return null;

  return (
    <div style={{ fontFamily: "sans-serif", fontSize: "14px" }}>
      {scale.slice(0, -1).map((from, i) => {
        const to = scale[i + 1];
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: color,
                marginRight: "8px",
                flexShrink: 0,
              }}
            />
            <span>{`${from} - ${to}`} тис.</span>
          </div>
        );
      })}
    </div>
  );
};

export default ScaleBar;
