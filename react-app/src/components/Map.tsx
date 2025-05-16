import React, { useState, useEffect, useRef } from "react";
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

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const position: [number, number] = [50.4501, 30.5234];
  const bounds = L.geoJSON(ukrGeoJSon as any).getBounds();

  const sheetData = SheedData();

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

  console.log(scale);

  console.log(values);

  const getColorIndex = (value: number, min: number, max: number): number => {
    if (isNaN(value)) return 1;
    const normalized = (value - min) / (max - min);
    return Math.ceil(normalized * 6);
  };

  const getColorByIndex = (index: number) => {
    const colors = [
      // "#FBDB93",
      // "#F4B5A7",
      // "#ad5e78",
      // "#BE5B50",
      // "#8A2D3B",
      // "#641B2E",

      "#f57a9a",
      "#d66381",
      "#b54a66",
      "#96354e",
      "#752137",
      "#4f1121",
    ];

    switch (index) {
      case 1:
        return colors[0];
      case 2:
        return colors[1];
      case 3:
        return colors[2];
      case 4:
        return colors[3];
      case 5:
        return colors[4];
      case 6:
        return colors[5];
      default:
        return colors[5];
    }
  };

  const handeRegionClick = (props: any) => {
    const regionData = sheetData.find((row) => row.region === props.NAME_1);
    setSelectedRegion({
      ...props,
      total: regionData ? regionData.total : null,
    });
    onRegionSelect(props);
  };

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    const regionName = props.NAME_1;

    const regionInfo = sheetData.find((row) => row.region === regionName);
    const total = regionInfo ? regionInfo.total : null;
    const value = regionInfo ? parseInt(regionInfo.total, 10) : 0;

    // console.log(regionInfo);

    const colorIndex = getColorIndex(value, minValue, maxValue);
    console.log(colorIndex);
    const fillColor = getColorByIndex(colorIndex);

    if (regionInfo) {
      layer.setStyle({
        fillColor,
        weight: 2,
      });
    } else {
      layer.setStyle({ fillColor: "red" });
    }

    // const tooltipContent =
    //   '<div class=""><h5 class="">' +
    //   props.NAME_1 +
    //   "</h5><div><strong>Загальна кількість:</strong> " +
    //   total +
    //   " </div><div><strong>Code:</strong> property </div><div><strong>Square:</strong> property </div><div><strong>Date:</strong> property </div></div>";

    const tooltipContent =
      '<div class="info-card"> <div class="info-header"> <span class="icon">🏠</span> <span class="region">' +
      props.NAME_1 +
      '</span> </div> <hr /> <div class="info-row"> <span>Ветеранів:</span> <strong>' +
      total +
      '</strong> </div> <div class="info-row"> <span>Вакансій:</span> <strong>0</strong> </div> <div class="info-row"> <span>Рейтинг:</span> <span class="ratio-value"> <span class="circle good"></span> Property (XX%) </span> </div> </div>';

    layer.on({
      mouseover: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.5 });
      },
      mouseout: (e: any) => {
        e.target.setStyle({ fillOpacity: 1 });
      },
      click: () => {
        // onRegionSelect(feature.properties);
        handeRegionClick(feature.properties);
      },
    });

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      // className: "info-card",
    });
  };

  if (!sheetData || sheetData.length === 0) {
    return <div>Loading...</div>;
  } else {
    return (
      <div style={{ position: "relative", height: "100vh", width: "100%" }}>
        <MapContainer
          center={position}
          zoom={6}
          scrollWheelZoom={false}
          dragging={false}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          touchZoom={false}
          style={{ height: "80%", width: "70%", background: "transparent" }}
        >
          <GeoJSON
            data={ukrGeoJSon as any}
            style={{
              color: "black",
              weight: 2,
              // fillColor: "#3388ff",
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
}

export default Map;
