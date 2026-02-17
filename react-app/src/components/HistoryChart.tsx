import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface HistoryData {
    period: string;
    value: number;
}

interface HistoryChartProps {
    data: HistoryData[];
    color?: string;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ data, color = "#3b82f6" }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{
                height: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.02)",
                borderRadius: "16px",
                color: "#94a3b8",
                fontSize: "14px"
            }}>
                Дані відсутні
            </div>
        );
    }

    // Format date for display
    const chartData = data.map((d) => ({
        ...d,
        formattedDate: new Date(d.period).toLocaleDateString("uk-UA", {
            month: "short",
            year: "2-digit",
        }),
    }));

    return (
        <div style={{ width: "100%", height: "200px", marginTop: "12px" }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis
                        dataKey="formattedDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "rgba(255, 255, 255, 0.9)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(0,0,0,0.05)",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            padding: "8px 12px"
                        }}
                        itemStyle={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}
                        labelStyle={{ fontSize: "10px", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", fontWeight: 800 }}
                        cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default HistoryChart;
