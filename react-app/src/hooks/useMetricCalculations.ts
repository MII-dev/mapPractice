import { useMemo } from "react";
import { MetricConfig, RegionData } from "../types";
import { generatePalette } from "../utils/colors";

export function useMetricCalculations(
    data: any[],
    activeMetric: MetricConfig | null
) {
    return useMemo(() => {
        if (!data.length || !activeMetric) {
            return {
                activeValues: [],
                average: 0,
                max: 0,
                minValue: 0,
                maxValue: 0,
                scale: [],
                getColorIndex: () => 1,
                getColorByIndex: () => "#e2e8f0",
            };
        }

        const currentKey = activeMetric.slug;
        const activeValues = data.map((r) => Number(r[currentKey]) || 0);
        const average =
            activeValues.reduce((a, b) => a + b, 0) / (activeValues.length || 1);
        const max = Math.max(...activeValues);

        const minValue = Math.min(...activeValues);
        const maxValue = max;
        const levels = 6;
        const step = Math.floor((maxValue - minValue) / levels);
        const scale = Array.from(
            { length: levels + 1 },
            (_, i) => minValue + i * step
        );

        // Pre-generate palette
        const colors = generatePalette(activeMetric.color_theme, levels);

        const getColorIndex = (value: number) => {
            if (isNaN(value)) return 1;
            if (maxValue === minValue) return Math.ceil(levels / 2);
            const normalized = (value - minValue) / ((maxValue - minValue) || 1);
            const idx = Math.ceil(normalized * levels);
            return Math.min(Math.max(1, idx), levels);
        };

        const getColorByIndex = (index: number) => {
            return colors[Math.min(index - 1, colors.length - 1)];
        };

        return {
            activeValues,
            average,
            max,
            minValue,
            maxValue,
            scale,
            getColorIndex,
            getColorByIndex,
        };
    }, [data, activeMetric]);
}
