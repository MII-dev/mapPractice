import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ukrGeoJSon from "./UKR_adm1.json";
import { useSheetData } from "./GoogleSheetsAPI";
import ScaleBar from "./ScaleBar";
import Sidebar from "./MapSideBar";
import L from "leaflet";

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const position: [number, number] = [50.4501, 30.5234];
  const bounds = L.geoJSON(ukrGeoJSon as any).getBounds();

  const sheetData = useSheetData();

  useEffect(() => {
    if(!selectedRegion) return;
    const regionData = sheetData.find((r) => r.region === selectedRegion.NAME_1);
    const newTotal = regionData ? regionData.total : null;

    if(selectedRegion.total !== newTotal){
      setSelectedRegion((prev: any) => ({...prev, total: newTotal}));
    }

  }, [sheetData, selectedRegion?.NAME_1, selectedRegion?.total]);

  if (!sheetData.length) return <div>Loading...</div>;

  const values = sheetData.map((row) => parseInt(row.total, 10)).filter(Number.isFinite);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const levels = 6;
  const step = Math.floor((maxValue - minValue) / levels);
  const scale = Array.from({ length: levels + 1 }, (_, i) => minValue + i * step);

  const getColorIndex = (value: number) => {
    if (isNaN(value)) return 1;
    // Якщо всі значення однакові — повертаємо середній рівень
    if (maxValue === minValue) return Math.ceil(levels / 2);
    const normalized = (value - minValue) / (maxValue - minValue);
    // індекс у діапазоні [1, levels]
    const idx = Math.ceil(normalized * levels);
    return Math.min(Math.max(1, idx), levels);
  };

  const getColorByIndex = (index: number) => {
    const colors = ["#FBDB93", "#F4B5A7", "#ad5e78", "#BE5B50", "#8A2D3B", "#641B2E"];
    return colors[Math.min(index - 1, colors.length - 1)];
  };

  const handleRegionClick = (props: any) => {
    const regionData = sheetData.find((row) => row.region === props.NAME_1);
    setSelectedRegion({ ...props, total: regionData ? regionData.total : null });
    onRegionSelect(props);
  };

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    const regionInfo = sheetData.find((row) => row.region === props.NAME_1);
    const value = regionInfo ? parseInt(regionInfo.total, 10) : 0;
    const fillColor = getColorByIndex(getColorIndex(value));

    layer.setStyle({ fillColor: regionInfo ? fillColor : "red", weight: 2 });

    const tooltipContent = `
      <div class="info-card">
        <div class="info-header"><span class="icon">🏠</span><span class="region">${props.NAME_1}</span></div>
        <hr />
        <div class="info-row"><span>Ветеранів:</span><strong>${regionInfo?.total ?? "—"}</strong></div>
        <div class="info-row"><span>Вакансій:</span><strong>0</strong></div>
        <div class="info-row"><span>Рейтинг:</span><span class="ratio-value"><span class="circle good"></span>Property (XX%)</span></div>
      </div>
    `;

    layer.on({
      mouseover: (e: any) => e.target.setStyle({ fillOpacity: 0.5 }),
      mouseout: (e: any) => e.target.setStyle({ fillOpacity: 1 }),
      click: () => handleRegionClick(props),
    });

    layer.bindTooltip(tooltipContent, { sticky: true });
  };

  const geoKey = sheetData.map((r) => `${r.region}:${r.total}`).join("|");


  return (
    <div style={{ position: "relative", height: "100vh", width: "100%", display: "flex" }}>
      <MapContainer
        center={position}
        zoom={6.7}
        zoomSnap={0.1}
        zoomDelta={0.1}
        scrollWheelZoom={false}
        dragging={false}
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        style={{ height: "100%", width: "100%", background: "transparent" }}
      >
        <GeoJSON
          key={geoKey}
          data={ukrGeoJSon as any}
          style={{ color: "black", weight: 2, fillOpacity: 1 }}
          onEachFeature={onEachFeature}
        />
        <div style={{ position: "absolute", bottom: "10%", left: "10%" }}>
          <ScaleBar scale={scale} />
        </div>
      </MapContainer>
      <Sidebar region={selectedRegion} onClose={() => setSelectedRegion(null)} />
    </div>
  );
}

export default Map;
