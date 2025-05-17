import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
  useMap,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ukrGeoJSon from "./UKR_adm1.json";
import { SheedData } from "./GoogleSheetsAPI";
import ScaleBar from "./ScaleBar";
import Sidebar from "./MapSideBar";
import L from "leaflet";

// Тип пропсів
type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  const position: [number, number] = [50.4501, 30.5234];

  // Отримання географічних меж України з GeoJSON
  const bounds = L.geoJSON(ukrGeoJSon as any).getBounds();

  // Отримання даних з Google Sheets
  const sheetData = SheedData();

  // Обчислення мінімального та максимального значення для побудови шкали
  const values = sheetData
    .map((row) => parseInt(row.total, 10))
    .filter(Number.isFinite);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const levels = 6;
  const step = Math.floor((maxValue - minValue) / levels);
  const scale = Array.from(
    { length: levels + 1 },
    (_, i) => minValue + i * step
  );

  // Обчислення індексу кольору для значення
  const getColorIndex = (value: number, min: number, max: number): number => {
    if (isNaN(value)) return 1;
    const normalized = (value - min) / (max - min);
    return Math.ceil(normalized * levels);
  };

  // Отримання кольору по індексу
  const getColorByIndex = (index: number) => {
    const colors = [
      "#FBDB93",
      "#F4B5A7",
      "#ad5e78",
      "#BE5B50",
      "#8A2D3B",
      "#641B2E",

      // "#fca8be",
      // "#db8a9f",
      // "#b54a66",
      // "#96354e",
      // "#752137",
      // "#4f1121",
    ];

    // коричневий
    // const colors = [
    //   "#fff4e6",
    //   "#ffe0bf",
    //   "#ffcc99",
    //   "#ffb877",
    //   "#ffa366",
    //   "#e68a4d",
    // ];

    //фіолетова
    // const colors = [
    //   "#f5e6ff",
    //   "#e6ccff",
    //   "#d9b3ff",
    //   "#cc99ff",
    //   "#bf80ff",
    //   "#b366ff",
    // ];

    //синя
    // const colors = [
    //   "#e6f2ff",
    //   "#cce6ff",
    //   "#b3d9ff",
    //   "#99ccff",
    //   "#80
    return colors[Math.min(index - 1, colors.length - 1)];
  };

  // Обробка кліку по регіону
  const handeRegionClick = (props: any) => {
    const regionData = sheetData.find((row) => row.region === props.NAME_1);
    setSelectedRegion({
      ...props,
      total: regionData ? regionData.total : null,
    });
    onRegionSelect(props);
  };

  // Налаштування для кожного об'єкта на мапі
  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    const regionName = props.NAME_1;
    const regionInfo = sheetData.find((row) => row.region === regionName);
    const total = regionInfo ? regionInfo.total : null;
    const value = regionInfo ? parseInt(regionInfo.total, 10) : 0;

    const colorIndex = getColorIndex(value, minValue, maxValue);
    const fillColor = getColorByIndex(colorIndex);

    layer.setStyle({
      fillColor: regionInfo ? fillColor : "red",
      weight: 2,
    });

    // Вміст тултіпа
    const tooltipContent = `
      <div class="info-card">
        <div class="info-header">
          <span class="icon">🏠</span>
          <span class="region">${props.NAME_1}</span>
        </div>
        <hr />
        <div class="info-row">
          <span>Ветеранів:</span>
          <strong>${total}</strong>
        </div>
        <div class="info-row">
          <span>Вакансій:</span>
          <strong>0</strong>
        </div>
        <div class="info-row">
          <span>Рейтинг:</span>
          <span class="ratio-value">
            <span class="circle good"></span>
            Property (XX%)
          </span>
        </div>
      </div>
    `;

    // Події миші
    layer.on({
      mouseover: (e: any) => e.target.setStyle({ fillOpacity: 0.5 }),
      mouseout: (e: any) => e.target.setStyle({ fillOpacity: 1 }),
      click: () => handeRegionClick(props),
    });

    layer.bindTooltip(tooltipContent, { sticky: true });
  };

  if (!sheetData || sheetData.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        display: "flex",
      }}
    >
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
          data={ukrGeoJSon as any}
          style={{
            color: "black",
            weight: 2,
            fillOpacity: 1,
          }}
          onEachFeature={onEachFeature}
        />

        <div style={{ position: "absolute", bottom: "10%", left: "10%" }}>
          <ScaleBar scale={scale} />
        </div>
      </MapContainer>

      <Sidebar
        region={selectedRegion}
        onClose={() => setSelectedRegion(null)}
      />
    </div>
  );
}

export default Map;
