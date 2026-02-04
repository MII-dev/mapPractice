import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ukrGeoJSon from "./UKR_adm1.json";
import { useMapData, MetricConfig, RegionData } from "./MapDataHook";
import ScaleBar from "./ScaleBar";
import Sidebar from "./MapSideBar";
import LayerSwitcher from "./LayerSwitcher";
import L from "leaflet";
import { generatePalette } from "../utils/colors";

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [activeMetric, setActiveMetric] = useState<MetricConfig | null>(null);

  const position: [number, number] = [50.4501, 30.5234];
  const bounds = L.geoJSON(ukrGeoJSon as any).getBounds();

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

    if (selectedRegion.total !== newTotal || selectedRegion.average !== average) {
      setSelectedRegion((prev: any) => ({
        ...prev,
        total: newTotal,
        suffix: activeMetric.suffix,
        average: average,
        max: max
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

    setSelectedRegion({
      ...props,
      total: value,
      suffix: activeMetric.suffix,
      label: activeMetric.name,
      average: average,
      max: max
    });
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

    // Tooltip content updated for active metric
    const tooltipContent = `
      <div class="info-card">
        <div class="info-header"><span class="region">${props.NAME_1}</span></div>
        <hr />
        <div class="info-row">
            <span>${activeMetric.name}:</span>
            <strong>${regionInfo ? regionInfo[currentKey] : "0"} ${activeMetric.suffix}</strong>
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

      <MapContainer
        center={position}
        zoom={6.7}
        zoomSnap={0.1}
        zoomDelta={0.1}
        scrollWheelZoom={false}
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
        <GeoJSON
          key={geoKey}
          data={ukrGeoJSon as any}
          style={{ transition: "none" }}
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

