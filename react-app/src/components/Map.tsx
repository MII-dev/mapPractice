import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ukrGeoJSon from "./UKR_adm1.json";
import { useMapData } from "./MapDataHook";
import { MetricConfig, RegionData } from "../types";
import ScaleBar from "./ScaleBar";
import Sidebar from "./MapSideBar";
import LayerSwitcher from "./LayerSwitcher";
import MapSearch from "./MapSearch";
import MapController from "./MapController";
import AIChat from "./AIChat";
import L from "leaflet";
import "../App.css";

// Hooks & Utils
import { useMetricCalculations } from "../hooks/useMetricCalculations";
import { buildTooltipContent } from "../utils/tooltipParams";

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [activeMetric, setActiveMetric] = useState<MetricConfig | null>(null);
  const geojsonRef = useRef<L.GeoJSON>(null);

  const [focusedRegionName, setFocusedRegionName] = useState<string | null>(null);

  const position: [number, number] = [50.4501, 30.5234];
  const bounds = useMemo(() => L.geoJSON(ukrGeoJSon as any).getBounds(), []);

  // Extract region names for search
  const regionNames = useMemo(() => {
    return (ukrGeoJSon as any).features.map((f: any) => f.properties.NAME_1);
  }, []);

  const { data: sheetData, metrics } = useMapData();

  // Create references to latest data to avoid stale closures in Leaflet event handlers
  const latestDataRef = useRef({ sheetData, metrics, activeMetric });
  useEffect(() => {
    latestDataRef.current = { sheetData, metrics, activeMetric };
  }, [sheetData, metrics, activeMetric]);

  // Initialize active metric
  useEffect(() => {
    if (metrics.length > 0 && !activeMetric) {
      setActiveMetric(metrics[0]);
    }
  }, [metrics, activeMetric]);

  // Use custom hook for calculations
  const {
    activeValues,
    average,
    max,
    scale,
    getColorIndex,
    getColorByIndex
  } = useMetricCalculations(sheetData, activeMetric);

  const handleRegionClick = useCallback((props: any) => {
    const { sheetData, metrics, activeMetric } = latestDataRef.current;
    if (!activeMetric) return;

    const currentKey = activeMetric.slug;
    const regionData = sheetData.find((row) => row.region === props.NAME_1);
    const value = regionData ? regionData[currentKey] : null;

    // Recalculate context for the clicked region based on latest data
    const currentValues = sheetData.map(r => Number(r[activeMetric.slug]) || 0);
    const avg = currentValues.reduce((a, b) => a + b, 0) / (currentValues.length || 1);
    const maxVal = Math.max(...currentValues);

    // Calculate All Metrics
    const allMetricsData = metrics.map(m => ({
      name: m.name,
      value: regionData ? regionData[m.slug] : 0,
      suffix: m.suffix,
      slug: m.slug
    }));

    // Fetch History
    fetch(`/api/history/${activeMetric.slug}/${props.NAME_1}`)
      .then(res => res.json())
      .then(history => {
        setSelectedRegion({
          ...props,
          total: value,
          suffix: activeMetric.suffix,
          label: activeMetric.name,
          average: avg,
          max: maxVal,
          allMetrics: allMetricsData,
          history: history,
          color: activeMetric.color_theme
        });
      })
      .catch(err => console.error("History fetch error:", err));

    onRegionSelect(props);
  }, [onRegionSelect]);

  const onEachFeature = useCallback((feature: any, layer: any) => {
    const props = feature.properties;

    // Attempt to set initial style immediately to avoid flash of unstyled content
    let initialColor = "#e2e8f0";
    const { sheetData, activeMetric } = latestDataRef.current;

    if (activeMetric && sheetData.length > 0) {
      const currentSlug = activeMetric.slug;
      const regionInfo = sheetData.find((row: any) => row.region === props.NAME_1);
      const value = regionInfo ? parseInt(regionInfo[currentSlug], 10) : 0;
      const colorIdx = getColorIndex(value);
      initialColor = getColorByIndex(colorIdx);

      // Also bind tooltip immediately
      layer.bindTooltip(buildTooltipContent(props, value, sheetData, activeMetric), { sticky: true });
    }

    layer.setStyle({
      fillColor: initialColor,
      weight: 0.8,
      color: "#94a3b8",
      fillOpacity: 1,
    });

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
        e.target.setStyle({
          fillOpacity: 1,
          color: "#94a3b8",
          weight: 0.8
        });

        if (e.originalEvent && e.originalEvent.target) {
          (e.originalEvent.target as any).blur();
        }
      },
    });
  }, [handleRegionClick, getColorIndex, getColorByIndex]);

  // ─── Animated style + tooltip update on metric/data change ───
  useEffect(() => {
    if (!geojsonRef.current || !activeMetric || !sheetData.length) return;

    const currentSlug = activeMetric.slug;

    geojsonRef.current.eachLayer((layer: any) => {
      const props = layer.feature.properties;
      const regionInfo = sheetData.find((row: any) => row.region === props.NAME_1);
      const value = regionInfo ? parseInt(regionInfo[currentSlug], 10) : 0;
      const colorIdx = getColorIndex(value);
      const fillColor = getColorByIndex(colorIdx);

      // Update fill color
      layer.setStyle({
        fillColor: regionInfo ? fillColor : "#e2e8f0",
      });

      // Update tooltip
      layer.unbindTooltip();
      layer.bindTooltip(buildTooltipContent(props, value, sheetData, activeMetric), { sticky: true });
    });
  }, [activeMetric, sheetData, getColorIndex, getColorByIndex]);

  if (!sheetData.length || !activeMetric) return <div>Loading...</div>;

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
          setFocusedRegionName("-reset-");
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
        <MapController
          focusRegion={focusedRegionName}
          bounds={bounds}
          geojsonRef={geojsonRef}
          onReset={() => setSelectedRegion(null)}
        />
        <ZoomControl position="topleft" />
        <GeoJSON
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
      <AIChat />
    </div>
  );
}

export default Map;
