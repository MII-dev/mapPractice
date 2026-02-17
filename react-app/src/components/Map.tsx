import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, Pane } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ukrGeoJSon from "./UKR_adm1.json";
import raionGeoJSon from "./UKR_adm2.json";
import { useMapData } from "./MapDataHook";
import { MetricConfig, RegionData } from "../types";
import ScaleBar from "./ScaleBar";
import Sidebar from "./MapSideBar";
import LayerSwitcher from "./LayerSwitcher";
import MapSearch from "./MapSearch";
import MapController from "./MapController";
import AIChat from "./AIChat";
import AdminButton from "./AdminButton";
import TimeSlider from "./TimeSlider";
import L from "leaflet";
import "../App.css";

// Hooks & Utils
import { useMetricCalculations } from "../hooks/useMetricCalculations";
import { buildTooltipContent, buildRaionTooltipContent } from "../utils/tooltipParams";

const ZoomTracker = ({ onZoomChange }: { onZoomChange: (zoom: number) => void }) => {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => onZoomChange(map.getZoom());
    map.on("zoomend", handleZoom); // Revert to zoomend for stability
    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map, onZoomChange]);
  return null;
};

/**
 * High-performance component that handles live cross-fade transitions 
 * directly through Leaflet, bypassing React's re-render cycle.
 */
const LayerTransitionController = ({
  geojsonRef,
  raionGeojsonRef,
  isDataLoaded
}: {
  geojsonRef: React.RefObject<L.GeoJSON>,
  raionGeojsonRef: React.RefObject<L.GeoJSON>,
  isDataLoaded: boolean
}) => {
  const map = useMap();

  const updateOpacities = useCallback((zoom: number) => {
    const oblastOpacity = Math.max(0, Math.min(1, (8.3 - zoom) / 0.6));
    const raionOpacity = Math.max(0, Math.min(1, (zoom - 7.7) / 0.6));

    // Threshold for interactivity switch - consistent everywhere
    const interactiveThreshold = 8.2;
    const oblastInteractive = zoom < interactiveThreshold;
    const raionInteractive = zoom >= interactiveThreshold;

    // Update Panes interactivity directly (foolproof)
    const oblastPane = map.getPane("oblast-pane");
    const raionPane = map.getPane("raion-pane");
    const ghostPane = map.getPane("ghost-pane");

    if (oblastPane) {
      oblastPane.style.pointerEvents = oblastInteractive ? "auto" : "none";
      const paths = oblastPane.querySelectorAll('path');
      paths.forEach((p: any) => {
        p.style.pointerEvents = oblastInteractive ? "auto" : "none";
      });
    }

    if (raionPane) {
      raionPane.style.pointerEvents = raionInteractive ? "auto" : "none";
      const paths = raionPane.querySelectorAll('path');
      paths.forEach((p: any) => {
        p.style.pointerEvents = raionInteractive ? "auto" : "none";
      });
    }

    if (ghostPane) {
      ghostPane.style.pointerEvents = "none";
      const paths = ghostPane.querySelectorAll('path');
      paths.forEach((p: any) => {
        p.style.pointerEvents = "none";
      });
    }

    if (geojsonRef.current) {
      geojsonRef.current.eachLayer((layer: any) => {
        layer.setStyle({
          fillOpacity: oblastOpacity,
          opacity: oblastOpacity,
        });
      });
    }

    if (raionGeojsonRef.current) {
      raionGeojsonRef.current.eachLayer((layer: any) => {
        const isSelected = layer._path && layer._path.classList.contains('pulse-selected');
        layer.setStyle({
          fillOpacity: raionOpacity,
          opacity: raionOpacity,
          // If selected, we want to maintain visibility for the pulse
          ...(isSelected ? { opacity: Math.max(raionOpacity, 0.8), fillOpacity: Math.max(raionOpacity, 0.4) } : {})
        });
      });
    }
  }, [map, geojsonRef, raionGeojsonRef]);

  useEffect(() => {
    const onZoom = () => {
      updateOpacities(map.getZoom());
    };

    // Fallback: sync on first interaction to "wake up" the map
    const onFirstInteraction = () => {
      updateOpacities(map.getZoom());
      map.off("mousedown", onFirstInteraction);
      map.off("mousemove", onFirstInteraction);
    };

    map.on("zoom", onZoom);
    map.on("mousedown", onFirstInteraction);
    map.on("mousemove", onFirstInteraction);

    // Initial sync with multiple attempts
    updateOpacities(map.getZoom());
    const rafId = requestAnimationFrame(() => updateOpacities(map.getZoom()));
    const timeoutId = setTimeout(() => updateOpacities(map.getZoom()), 500);

    return () => {
      map.off("zoom", onZoom);
      map.off("mousedown", onFirstInteraction);
      map.off("mousemove", onFirstInteraction);
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [map, updateOpacities]);

  // Sync when data actually arrives
  useEffect(() => {
    if (isDataLoaded) {
      updateOpacities(map.getZoom());
    }
  }, [isDataLoaded, map, updateOpacities]);

  return null;
};

/**
 * Controller to show Raion Labels at high zoom
 */
const RaionLabelController = ({ zoomLevel }: { zoomLevel: number }) => {
  const map = useMap();
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    markersRef.current.addTo(map);
    return () => {
      markersRef.current.remove();
    };
  }, [map]);

  useEffect(() => {
    markersRef.current.clearLayers();
    if (zoomLevel < 8.1) return;

    (raionGeoJSon as any).features.forEach((feature: any) => {
      // Simple centroid estimation for labels
      let coords = feature.geometry.coordinates[0];
      if (feature.geometry.type === 'MultiPolygon') coords = feature.geometry.coordinates[0][0];

      let lat = 0, lng = 0;
      coords.forEach((p: any) => { lng += p[0]; lat += p[1]; });
      lat /= coords.length;
      lng /= coords.length;

      const label = L.divIcon({
        className: 'raion-label-container',
        html: `<div class="raion-label">${feature.properties.rayon.replace(' район', '')}</div>`,
        iconSize: [100, 20],
        iconAnchor: [50, 10]
      });

      L.marker([lat, lng], { icon: label, interactive: false }).addTo(markersRef.current);
    });
  }, [zoomLevel, map]);

  return null;
};

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [activeMetric, setActiveMetric] = useState<MetricConfig | null>(null);
  const geojsonRef = useRef<L.GeoJSON>(null);
  const raionGeojsonRef = useRef<L.GeoJSON>(null);
  const [zoomLevel, setZoomLevel] = useState(6.7);

  const [focusedRegionName, setFocusedRegionName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRaion, setSelectedRaion] = useState<string | null>(null);

  const position: [number, number] = [50.4501, 30.5234];
  const bounds = useMemo(() => L.geoJSON(ukrGeoJSon as any).getBounds(), []);

  // Extract region names for search
  const regionNames = useMemo(() => {
    return (ukrGeoJSon as any).features.map((f: any) => f.properties.NAME_1);
  }, []);

  // When active metric changes, reset date or keep it? 
  // For now, let's keep it null to show latest unless user picks one
  useEffect(() => {
    setSelectedDate(null);
  }, [activeMetric]);

  const { data: sheetData, raionData, metrics, availableDates } = useMapData(selectedDate);

  // Create references to latest data and state to avoid stale closures in Leaflet event handlers
  const latestDataRef = useRef({ sheetData, raionData, metrics, activeMetric, zoomLevel });

  useEffect(() => {
    latestDataRef.current = { sheetData, raionData, metrics, activeMetric, zoomLevel };
  }, [sheetData, raionData, metrics, activeMetric, zoomLevel]);

  // Initial opacities for mount time (static) - Balanced transition
  const initialOblastOpacity = Math.max(0, Math.min(1, (8.3 - zoomLevel) / 0.6));
  const initialRaionOpacity = Math.max(0, Math.min(1, (zoomLevel - 7.7) / 0.6));

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

  const raionCalculations = useMetricCalculations(raionData, activeMetric);

  const handleRegionClick = useCallback((props: any) => {
    const { sheetData, metrics, activeMetric } = latestDataRef.current;
    if (!activeMetric) return;

    const currentKey = activeMetric.slug;
    const regionData = sheetData.find((row) => row.region === props.NAME_1);
    const value = regionData ? (regionData[currentKey] ?? null) : null;

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

    // Find children raions with real values
    const childRaions = (raionGeoJSon as any).features
      .filter((f: any) => f.properties.parent_oblast === props.NAME_1)
      .map((f: any) => {
        const raionName = f.properties.rayon;
        const raionInfo = latestDataRef.current.raionData.find((r: any) => r.raion === raionName);
        return {
          name: raionName,
          value: raionInfo ? raionInfo[latestDataRef.current.activeMetric?.slug || ''] : 0
        };
      });

    // Open sidebar immediately with latest data
    setSelectedRegion({
      ...props,
      total: value,
      suffix: activeMetric.suffix,
      label: activeMetric.name,
      average: avg,
      max: maxVal,
      allMetrics: allMetricsData,
      color: activeMetric.color_theme,
      childRaions,
      history: [] // Loading state
    });

    // Fetch History in background
    fetch(`/api/history/${activeMetric.slug}/${props.NAME_1}`)
      .then(res => res.json())
      .then(history => {
        setSelectedRegion(prev => prev && prev.NAME_1 === props.NAME_1 ? {
          ...prev,
          history: history
        } : prev);
      })
      .catch(err => console.error("History fetch error:", err));

    onRegionSelect(props);
  }, [onRegionSelect]);

  const handleFocusComplete = useCallback(() => {
    setFocusedRegionName(null);
  }, []);

  const handleRaionSelect = useCallback((raionProps: any) => {
    // Find latest data for this raion from the Ref (prevent stale closure)
    const { raionData, activeMetric, metrics } = latestDataRef.current;
    if (!activeMetric) return;

    const raionInfo = raionData.find((r: any) => r.raion === raionProps.rayon);
    const value = raionInfo ? Number(raionInfo[activeMetric.slug]) : 0;

    setSelectedRaion(raionProps.rayon);
    setSelectedRegion({
      NAME_1: raionProps.rayon,
      label: activeMetric.name || "Район України",
      total: value,
      suffix: activeMetric.suffix || "",
      isRaion: true,
      color: activeMetric.color_theme || "#3b82f6",
      parentOblast: raionProps.parent_oblast,
      history: [],
      // Pass all metric values for the sidebar list
      allMetrics: metrics.map(m => ({
        name: m.name,
        value: raionInfo ? raionInfo[m.slug] : 0,
        suffix: m.suffix,
        slug: m.slug
      }))
    });

    // Fetch Raion History
    fetch(`/api/raion-history/${activeMetric.slug}/${raionProps.rayon}`)
      .then(res => res.json())
      .then(history => {
        setSelectedRegion(prev => prev && prev.NAME_1 === raionProps.rayon ? {
          ...prev,
          history: history
        } : prev);
      })
      .catch(err => console.error("Raion history fetch error:", err));
  }, [setSelectedRegion, setSelectedRaion]);

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

      // Tooltip binding moved to useEffect for better visibility control
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
        // Calculate current opacity dynamically to avoid stale state
        const zoom = e.target._map ? e.target._map.getZoom() : 6.7;
        const currentOpacity = Math.max(0, Math.min(1, (8.3 - zoom) / 0.6));

        // GATING: Only interact with oblasts if they are the primary layer
        if (zoom >= 8.2) return;

        layer.setStyle({
          fillOpacity: 0.7 * currentOpacity,
          color: "#0f172a",
          weight: 2
        });
        if (currentOpacity > 0.1) layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        const zoom = e.target._map ? e.target._map.getZoom() : 6.7;
        const currentOpacity = Math.max(0, Math.min(1, (8.3 - zoom) / 0.6));

        layer.setStyle({
          fillOpacity: currentOpacity,
          color: "#94a3b8",
          weight: 0.8
        });
      },
      click: (e: any) => {
        const zoom = e.target._map ? e.target._map.getZoom() : 6.7;
        // GATING: Only interact with oblasts if they are the primary layer
        if (zoom >= 8.2) return;

        handleRegionClick(props);
        const currentOpacity = Math.max(0, Math.min(1, (8.3 - zoom) / 0.6));

        e.target.setStyle({
          fillOpacity: currentOpacity,
          color: "#94a3b8",
          weight: 0.8
        });

        if (e.originalEvent && e.originalEvent.target) {
          (e.originalEvent.target as any).blur();
        }
      },
    });
  }, [handleRegionClick, getColorIndex, getColorByIndex]);

  // Transitions: 7.5 - 8.5 zone
  // Removed from here and moved up to handle dependencies correctly

  const onEachRaionFeature = useCallback((feature: any, layer: any) => {
    const props = feature.properties;
    const { raionData, activeMetric } = latestDataRef.current;

    let fillColor = "#f1f5f9";
    if (activeMetric && raionData) {
      const raionInfo = raionData.find((r: any) => r.raion === props.rayon);
      const value = raionInfo ? Number(raionInfo[activeMetric.slug]) : 0;
      const colorIdx = raionCalculations.getColorIndex(value);
      fillColor = raionCalculations.getColorByIndex(colorIdx);
    }

    layer.setStyle({
      fillColor,
      weight: 0.8,
      color: "#cbd5e1",
      fillOpacity: initialRaionOpacity,
      opacity: initialRaionOpacity,
      className: selectedRaion === props.rayon ? 'pulse-selected' : ''
    });

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        const zoom = e.target._map ? e.target._map.getZoom() : 6.7;
        const currentRaionOpacity = Math.max(0, Math.min(1, (zoom - 7.8) / 0.4));

        if (zoom < 7.7) return;

        layer.setStyle({
          fillOpacity: 0.9 * currentRaionOpacity, // Slightly highlight opacity
          color: "#64748b", // Darker border
          weight: 2
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        const zoom = e.target._map ? e.target._map.getZoom() : 6.7;
        const currentRaionOpacity = Math.max(0, Math.min(1, (zoom - 7.7) / 0.6));

        layer.setStyle({
          fillOpacity: currentRaionOpacity,
          color: selectedRaion === props.rayon ? "#2563eb" : "#cbd5e1",
          weight: selectedRaion === props.rayon ? 2 : 0.8
        });
      },
      click: (e: any) => {
        const zoom = e.target._map ? e.target._map.getZoom() : 6.7;
        if (zoom < 8.2) return;

        const props = e.target.feature.properties;
        handleRaionSelect(props);

        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          (e.originalEvent.target as any).blur();
        }
      }
    });
  }, [zoomLevel, selectedRaion, initialRaionOpacity]);

  // ─── Animated style + tooltip update on metric/data change ───
  useEffect(() => {
    if (!activeMetric) return;

    const currentSlug = activeMetric.slug;

    if (geojsonRef.current && sheetData.length) {
      geojsonRef.current.eachLayer((layer: any) => {
        const props = layer.feature.properties;
        const regionInfo = sheetData.find((row: any) => row.region === props.NAME_1);
        const value = regionInfo ? parseInt(regionInfo[currentSlug], 10) : 0;
        const colorIdx = getColorIndex(value);
        const fillColor = getColorByIndex(colorIdx);

        // Update fill color
        layer.setStyle({
          fillColor: regionInfo ? fillColor : "#e2e8f0",
          fillOpacity: initialOblastOpacity,
          opacity: initialOblastOpacity,
        });

        // Update tooltip - ONLY if visible
        layer.unbindTooltip();
        if (initialOblastOpacity > 0.7) {
          layer.bindTooltip(buildTooltipContent(props, value, sheetData, activeMetric), { sticky: true });
        }
      });
    }

    // Also update Raion tooltips & styling
    if (raionGeojsonRef.current && raionData.length) {
      raionGeojsonRef.current.eachLayer((layer: any) => {
        const props = layer.feature.properties;
        const raionInfo = raionData.find((row: any) => row.raion === props.rayon);
        const value = raionInfo ? Number(raionInfo[currentSlug]) : 0;
        // Use raion-specific scale
        const colorIdx = raionCalculations.getColorIndex(value);
        const fillColor = raionCalculations.getColorByIndex(colorIdx);

        layer.setStyle({
          fillColor: raionInfo ? fillColor : "#f1f5f9",
          fillOpacity: initialRaionOpacity,
          opacity: initialRaionOpacity,
          weight: initialRaionOpacity > 0.1 ? 0.8 : 0,
          color: "#cbd5e1",
        });

        layer.unbindTooltip();
        if (initialRaionOpacity > 0.7) {
          layer.bindTooltip(buildRaionTooltipContent(props, value, activeMetric), { sticky: true });
        }
      });
    }
  }, [activeMetric, sheetData, raionData, getColorIndex, getColorByIndex, raionCalculations, initialOblastOpacity, initialRaionOpacity]);

  // Cleaned up the reactive useEffect that was causing lags

  if (!sheetData.length || !activeMetric) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.2rem", color: "#64748b", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>Завантаження...</div>;

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%", display: "flex" }}>
      <LayerSwitcher
        activeMetric={activeMetric}
        metrics={metrics}
        onChange={setActiveMetric}
      />

      <TimeSlider
        dates={availableDates}
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />


      <MapSearch
        regions={regionNames}
        raions={(raionGeoJSon as any).features.map((f: any) => f.properties.rayon)}
        onSelectRegion={(name: string) => setFocusedRegionName(name)}
        onSelectRaion={(name: string) => {
          // Logic to find raion by name and fly to it
          const feature = (raionGeoJSon as any).features.find((f: any) => f.properties.rayon === name);
          if (feature && geojsonRef.current) {
            setFocusedRegionName(`raion:${name}`);
            setSelectedRaion(name); // Set selected raion for pulsing effect
          }
        }}
        onResetZoom={() => {
          setFocusedRegionName("-reset-");
          setTimeout(() => setFocusedRegionName(null), 100);
        }}
      />

      <MapContainer
        {...({
          center: position,
          zoom: 6.7,
          zoomSnap: 0.1,
          zoomDelta: 0.1,
          scrollWheelZoom: true,
          dragging: true,
          bounds: bounds,
          maxBounds: bounds,
          maxBoundsViscosity: 1.0,
          minZoom: 6.7,
          maxZoom: 12,
          zoomControl: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
          style: { height: "100%", width: "100%", background: "#f1f5f9" }
        } as any)}
      >
        <MapController
          focusRegion={focusedRegionName}
          bounds={bounds}
          geojsonRef={geojsonRef}
          onReset={() => {
            setSelectedRegion(null);
            setSelectedRaion(null);
          }}
          onFocusComplete={handleFocusComplete}
        />
        <ZoomControl position="topleft" />
        <LayerTransitionController
          geojsonRef={geojsonRef}
          raionGeojsonRef={raionGeojsonRef}
          isDataLoaded={sheetData.length > 0 || raionData.length > 0}
        />
        <RaionLabelController zoomLevel={zoomLevel} />

        {/* Ghost Contour (always visible at high zoom for context) */}
        {/* Persistent Ghost Countours for Oblast Boundaries */}
        {/* Persistent Ghost Countours for Oblast Boundaries */}
        {zoomLevel > 7.0 && (
          <Pane name="ghost-pane" style={{ zIndex: 400 }}>
            <GeoJSON
              data={ukrGeoJSon as any}
              pathOptions={{ fillColor: 'transparent', color: '#fff', weight: 0.5, opacity: 0.3, interactive: false }}
            />
          </Pane>
        )}

        {/* Interactive Oblast Layer (background) */}
        {zoomLevel < 12.0 && (
          <Pane
            name="oblast-pane"
            style={{
              zIndex: 410,
              pointerEvents: 'none' // Controller will enable this
            }}
          >
            <GeoJSON
              {...({
                data: ukrGeoJSon,
                ref: geojsonRef,
                onEachFeature: onEachFeature
              } as any)}
            />
          </Pane>
        )}

        {/* Raion Layer (foreground) */}
        {zoomLevel >= 6.0 && (
          <Pane
            name="raion-pane"
            style={{
              zIndex: 450,
              pointerEvents: 'none' // Controller will enable this
            }}
          >
            <GeoJSON
              {...({
                data: raionGeoJSon,
                ref: raionGeojsonRef,
                onEachFeature: onEachRaionFeature
              } as any)}
            />
          </Pane>
        )}
        <ZoomTracker onZoomChange={setZoomLevel} />
        <div style={{ position: "absolute", bottom: "10%", left: "10%" }}>
          <ScaleBar
            scale={zoomLevel >= 7.5 ? raionCalculations.scale : scale}
            title={activeMetric.name}
            theme={activeMetric.color_theme}
          />
        </div>
      </MapContainer>
      <Sidebar
        region={selectedRegion}
        onClose={() => {
          setSelectedRegion(null);
          setSelectedRaion(null);
        }}
        onRaionSelect={(name: string) => {
          setFocusedRegionName(`raion:${name}`);
          // Find raion props to update sidebar data and highlight
          const feature = (raionGeoJSon as any).features.find((f: any) => f.properties.rayon === name);
          if (feature) {
            handleRaionSelect(feature.properties);
          }
        }}
      />
      <AdminButton />
      <AIChat />
    </div>
  );
}

export default Map;
