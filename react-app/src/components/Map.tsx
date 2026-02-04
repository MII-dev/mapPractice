import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ukrGeoJSon from "./UKR_adm1.json";
import { useMapData, MetricConfig, RegionData } from "./MapDataHook";
import ScaleBar from "./ScaleBar";
import Sidebar from "./MapSideBar";
import LayerSwitcher from "./LayerSwitcher";
import MapSearch from "./MapSearch";
import L from "leaflet";
import { generatePalette } from "../utils/colors";
import "../App.css";

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [activeMetric, setActiveMetric] = useState<MetricConfig | null>(null);
  const geojsonRef = useRef<L.GeoJSON>(null);

  const [focusedRegionName, setFocusedRegionName] = useState<string | null>(null);

  const position: [number, number] = [50.4501, 30.5234];
  const bounds = L.geoJSON(ukrGeoJSon as any).getBounds();

  // Extract region names for search
  const regionNames = useMemo(() => {
    return (ukrGeoJSon as any).features.map((f: any) => f.properties.NAME_1);
  }, []);

  // Controller component to handle flyTo and bounds
  const MapController = ({ focusRegion }: { focusRegion: string | null }) => {
    const map = useMap();

    useEffect(() => {
      if (focusRegion === "-reset-") {
        map.flyToBounds(bounds, { duration: 1.5 });
        setSelectedRegion(null);
        return;
      }

      if (focusRegion && geojsonRef.current) {
        geojsonRef.current.eachLayer((layer: any) => {
          if (layer.feature.properties.NAME_1 === focusRegion) {
            const layerBounds = layer.getBounds();
            map.flyToBounds(layerBounds, { padding: [50, 50], duration: 1.5 });

            // Trigger visual selection
            handleRegionClick(layer.feature.properties);
          }
        });
      }
    }, [focusRegion, map]);

    return null;
  };

  const { data: sheetData, metrics } = useMapData();

  // Set default active metric when metrics are loaded
  useEffect(() => {
    if (metrics.length > 0 && !activeMetric) {
      setActiveMetric(metrics[0]);
    }
  }, [metrics, activeMetric]);

  useEffect(() => {
    if (!selectedRegion || !activeMetric) return;
    const regionData = sheetData.find((r) => r.region === selectedRegion.NAME_1);
    const newTotal = regionData ? regionData[activeMetric.slug] : null;

    // Calculate Global Stats for Comparison
    const activeValues = sheetData.map(r => Number(r[activeMetric.slug]) || 0);
    const average = activeValues.reduce((a, b) => a + b, 0) / activeValues.length;
    const max = Math.max(...activeValues);

    // Calculate All Metrics for this region
    const allMetricsData = metrics.map(m => ({
      name: m.name,
      value: regionData ? regionData[m.slug] : 0,
      suffix: m.suffix,
      slug: m.slug
    }));

    if (selectedRegion.total !== newTotal || selectedRegion.average !== average) {
      setSelectedRegion((prev: any) => ({
        ...prev,
        total: newTotal,
        suffix: activeMetric.suffix,
        average: average,
        max: max,
        allMetrics: allMetricsData
      }));
    }

  }, [sheetData, selectedRegion?.NAME_1, activeMetric]);

  if (!sheetData.length || !activeMetric) return <div>Loading...</div>;

  const currentKey = activeMetric.slug; // e.g., 'veterans', 'vacancies'
  const values = sheetData.map((row) => {
    const val = parseInt(row[currentKey], 10);
    return Number.isNaN(val) ? 0 : val;
  });

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const levels = 6;
  const step = Math.floor((maxValue - minValue) / levels);
  const scale = Array.from({ length: levels + 1 }, (_, i) => minValue + i * step);

  const getColorIndex = (value: number) => {
    if (isNaN(value)) return 1;
    if (maxValue === minValue) return Math.ceil(levels / 2);
    const normalized = (value - minValue) / (maxValue - minValue);
    const idx = Math.ceil(normalized * levels);
    return Math.min(Math.max(1, idx), levels);
  };

  const getColorByIndex = (index: number) => {
    // Generate dynamic palette based on the active metric's theme
    const colors = generatePalette(activeMetric.color_theme, levels);
    return colors[Math.min(index - 1, colors.length - 1)];
  };

  const handleRegionClick = (props: any) => {
    const regionData = sheetData.find((row) => row.region === props.NAME_1);
    const value = regionData ? regionData[currentKey] : null;

    // Calculate Global Stats for Comparison
    const activeValues = sheetData.map(r => Number(r[activeMetric.slug]) || 0);
    const average = activeValues.reduce((a, b) => a + b, 0) / activeValues.length;
    const max = Math.max(...activeValues);

    // Calculate All Metrics for this region
    const allMetricsData = metrics.map(m => ({
      name: m.name,
      value: regionData ? regionData[m.slug] : 0,
      suffix: m.suffix,
      slug: m.slug
    }));

    // Fetch History for Trend Line
    fetch(`/api/history/${activeMetric.slug}/${props.NAME_1}`)
      .then(res => res.json())
      .then(history => {
        setSelectedRegion({
          ...props,
          total: value,
          suffix: activeMetric.suffix,
          label: activeMetric.name,
          average: average,
          max: max,
          allMetrics: allMetricsData,
          history: history,
          color: activeMetric.color_theme
        });
      })
      .catch(err => console.error("History fetch error:", err));

    onRegionSelect(props);
  };

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    const regionInfo = sheetData.find((row) => row.region === props.NAME_1);
    const value = regionInfo ? parseInt(regionInfo[currentKey], 10) : 0;
    const fillColor = getColorByIndex(getColorIndex(value));

    layer.setStyle({
      fillColor: regionInfo ? fillColor : "#e2e8f0",
      weight: 0.8,
      color: "#94a3b8",
      fillOpacity: 1,
    });

    // Calculation for Premium Tooltip Stats
    const activeValues = sheetData.map(r => Number(r[activeMetric.slug]) || 0);
    const avg = Math.round(activeValues.reduce((a, b) => a + b, 0) / (activeValues.length || 1));
    const max = Math.max(...activeValues) || 1;
    const val = value || 0;

    const diff = val - avg;
    const isHigher = diff > 0;
    const percentVsAvg = Math.abs((diff / (avg || 1)) * 100).toFixed(0);
    const percentOfMax = Math.min(100, Math.max(0, (val / max) * 100));

    const tooltipContent = `
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
                <span class="stat-value">${max.toLocaleString()} ${activeMetric.suffix}</span>
            </div>
        </div>
      </div>
    `;

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          fillOpacity: 0.7,
          color: "#0f172a",
          weight: 2
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          fillOpacity: 1,
          color: "#94a3b8",
          weight: 0.8
        });
      },
      click: (e: any) => {
        handleRegionClick(props);
        // Reset style immediately to prevent persistent highlighting
        e.target.setStyle({
          fillOpacity: 1,
          color: "#94a3b8",
          weight: 0.8
        });

        // Explicitly blur the element to remove browser focus ring
        if (e.originalEvent && e.originalEvent.target) {
          (e.originalEvent.target as any).blur();
        }
      },
    });

    layer.bindTooltip(tooltipContent, { sticky: true });
  };



  const geoKey = `${activeMetric.slug}:${sheetData.length}`; // Force re-render on metric change

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%", display: "flex" }}>
      <LayerSwitcher
        metrics={metrics}
        activeMetric={activeMetric}
        onChange={setActiveMetric}
      />

      <MapSearch
        regions={regionNames}
        onSelectRegion={(name) => setFocusedRegionName(name)}
        onResetZoom={() => {
          setFocusedRegionName("-reset-"); // Trigger reset
          setTimeout(() => setFocusedRegionName(null), 100);
        }}
      />

      <MapContainer
        center={position}
        zoom={6.7}
        zoomSnap={0.1}
        zoomDelta={0.1}
        scrollWheelZoom={true}
        dragging={true}
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
      >
        <MapController focusRegion={focusedRegionName} />
        <ZoomControl position="topleft" />
        <GeoJSON
          key={geoKey}
          data={ukrGeoJSon as any}
          ref={geojsonRef as any}
          onEachFeature={onEachFeature}
        />
        <div style={{ position: "absolute", bottom: "10%", left: "10%" }}>
          <ScaleBar
            scale={scale}
            title={activeMetric.name}
            theme={activeMetric.color_theme}
          />
        </div>
      </MapContainer>
      <Sidebar region={selectedRegion} onClose={() => setSelectedRegion(null)} />
    </div>
  );
}

export default Map;

