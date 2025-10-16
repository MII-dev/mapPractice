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

// Тип пропсів для компонента Map (Props type for Map component)
type Props = {
  onRegionSelect: (props: any) => void; // Колбек при виборі регіону (Callback when a region is selected)
};

function Map({ onRegionSelect }: Props) {
  // Стан для збереження обраного регіону (State for storing selected region)
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  // Початкова позиція карти — Київ (Initial map position — Kyiv)
  const position: [number, number] = [50.4501, 30.5234];

  // Межі карти визначаються за GeoJSON України (Map bounds based on Ukraine GeoJSON)
  const bounds = L.geoJSON(ukrGeoJSon as any).getBounds();

  // Завантаження даних із Google Sheets (Fetching data from Google Sheets)
  const sheetData = SheedData();

  // Створення масиву числових значень для побудови шкали (Extract numeric values for color scale)
  const values = sheetData
    .map((row) => parseInt(row.total, 10))
    .filter(Number.isFinite);

  // Знаходження мінімального та максимального значення (Find min and max value)
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Налаштування шкали кольорів (Color scale configuration)
  const levels = 6;
  const step = Math.floor((maxValue - minValue) / levels);
  const scale = Array.from({ length: levels + 1 }, (_, i) => minValue + i * step);

  // Обчислення індексу кольору для значення (Calculate color index for a given value)
  const getColorIndex = (value: number, min: number, max: number): number => {
    if (isNaN(value)) return 1;
    const normalized = (value - min) / (max - min);
    return Math.ceil(normalized * levels);
  };

  // Отримання кольору за індексом (Get color by index)
  const getColorByIndex = (index: number) => {
    const colors = [
      "#FBDB93",
      "#F4B5A7",
      "#ad5e78",
      "#BE5B50",
      "#8A2D3B",
      "#641B2E",
    ];
    return colors[Math.min(index - 1, colors.length - 1)];
  };

  // Обробник кліку на регіон (Handle region click)
  const handeRegionClick = (props: any) => {
    // Знаходимо дані регіону в таблиці (Find region data from sheet)
    const regionData = sheetData.find((row) => row.region === props.NAME_1);

    // Зберігаємо обраний регіон разом з його даними (Save selected region with its data)
    setSelectedRegion({
      ...props,
      total: regionData ? regionData.total : null,
    });

    // Викликаємо функцію з пропсів для передачі регіону в батьківський компонент
    // (Trigger callback to send region data to parent component)
    onRegionSelect(props);
  };

  // Налаштування стилів і поведінки для кожного регіону карти
  // (Configure style and events for each map feature)
  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    const regionName = props.NAME_1;
    const regionInfo = sheetData.find((row) => row.region === regionName);
    const total = regionInfo ? regionInfo.total : null;
    const value = regionInfo ? parseInt(regionInfo.total, 10) : 0;

    // Визначення кольору заливки залежно від кількості (Determine fill color based on value)
    const colorIndex = getColorIndex(value, minValue, maxValue);
    const fillColor = getColorByIndex(colorIndex);

    // Встановлюємо стиль шару (Set layer style)
    layer.setStyle({
      fillColor: regionInfo ? fillColor : "red",
      weight: 2,
    });

    // HTML для тултіпа при наведенні на регіон (Tooltip HTML when hovering)
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

    // Події миші для взаємодії з регіонами (Mouse events for region interaction)
    layer.on({
      mouseover: (e: any) => e.target.setStyle({ fillOpacity: 0.5 }), // Наведення — затемнення (Hover = change opacity)
      mouseout: (e: any) => e.target.setStyle({ fillOpacity: 1 }),   // Вихід миші — повертає прозорість (Mouse out = restore)
      click: () => handeRegionClick(props),                          // Клік — вибір регіону (Click = select region)
    });

    // Прив’язуємо тултіп до шару (Bind tooltip to region layer)
    layer.bindTooltip(tooltipContent, { sticky: true });
  };

  // Якщо дані ще не завантажені — показуємо "Loading..." (Show loading indicator)
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
      {/* Контейнер карти (Main map container) */}
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
        {/* Відображення шарів GeoJSON (Display GeoJSON layers) */}
        <GeoJSON
          data={ukrGeoJSon as any}
          style={{
            color: "black",
            weight: 2,
            fillOpacity: 1,
          }}
          onEachFeature={onEachFeature}
        />

        {/* Масштабна шкала у нижньому лівому куті (Scale bar at bottom-left corner) */}
        <div style={{ position: "absolute", bottom: "10%", left: "10%" }}>
          <ScaleBar scale={scale} />
        </div>
      </MapContainer>

      {/* Бокова панель з інформацією про регіон (Sidebar with region info) */}
      <Sidebar
        region={selectedRegion}
        onClose={() => setSelectedRegion(null)}
      />
    </div>
  );
}

export default Map;
// Експортуємо компонент карти (Export the Map component)
