import { MetricConfig, RegionData } from "../components/MapDataHook";

export const buildTooltipContent = (
    props: any,
    value: number,
    sheetData: RegionData[],
    activeMetric: MetricConfig
): string => {
    const activeValues = sheetData.map((r) => Number(r[activeMetric.slug]) || 0);
    const avg = Math.round(
        activeValues.reduce((a, b) => a + b, 0) / (activeValues.length || 1)
    );
    const maxVal = Math.max(...activeValues) || 1;
    const val = value || 0;

    const diff = val - avg;
    const isHigher = diff > 0;
    const percentVsAvg = Math.abs((diff / (avg || 1)) * 100).toFixed(0);
    const percentOfMax = Math.min(100, Math.max(0, (val / maxVal) * 100));

    return `
      <div class="info-card" style="border-left: 5px solid ${activeMetric.color_theme}">
        <div class="tooltip-header">
            <span class="region-label">Область</span>
            <span class="region-name-hero">${props.NAME_1}</span>
        </div>
        
        <div class="metric-hero">
            <span class="metric-hero-label">${activeMetric.name}</span>
            <div class="metric-hero-value-group">
                <span class="metric-hero-value" style="color: ${activeMetric.color_theme}">${val.toLocaleString()}</span>
                <span class="metric-hero-suffix">${activeMetric.suffix}</span>
            </div>
            
            <div class="progress-container" style="margin-top: 12px;">
                <div class="progress-header">
                    <span>Від лідера</span>
                    <span>${percentOfMax.toFixed(0)}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-bar" style="width: ${percentOfMax}%; background: ${activeMetric.color_theme}"></div>
                </div>
            </div>
        </div>

        <div class="comparison-tag ${isHigher ? 'plus' : 'minus'}">
            <span>${isHigher ? '↑' : '↓'}</span>
            <span>${percentVsAvg}% ${isHigher ? 'вище' : 'нижче'} середнього</span>
        </div>

        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label">Середнє</span>
                <span class="stat-value">${avg.toLocaleString()} ${activeMetric.suffix}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Максимум</span>
                <span class="stat-value">${maxVal.toLocaleString()} ${activeMetric.suffix}</span>
            </div>
        </div>
      </div>
    `;
};
