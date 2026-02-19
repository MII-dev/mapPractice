import React from "react";

interface SparklineProps {
    data: { value: number; period?: string }[];
    color?: string;
    width?: number;
    height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({
    data,
    color = "#3b82f6",
    width = 100,
    height = 30,
}) => {
    if (!data || data.length < 2)
        return <div style={{ width, height }} />;

    const padding = 2;
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values
        .map((val, i) => {
            const x =
                (i / (values.length - 1)) * (width - padding * 2) + padding;
            const y =
                height -
                ((val - min) / range) * (height - padding * 2) -
                padding;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg width={width} height={height} style={{ overflow: "visible" }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

export default Sparkline;
