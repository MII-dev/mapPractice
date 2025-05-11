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
import L from "leaflet";

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
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
    //   "#FBDB93",
    // "#F4B5A7",
    // "#ad5e78",
    // "#BE5B50",
    // "#8A2D3B",
    // "#641B2E",
    switch (index) {
      case 1:
        return "#FBDB93";
      case 2:
        return "#F4B5A7";
      case 3:
        return "#ad5e78";
      case 4:
        return "#BE5B50";
      case 5:
        return "#8A2D3B";
      case 6:
        return "#641B2E";
      default:
        return "#641B2E";
    }
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

    const tooltipContent =
      '<div class="custom-card-content"><h5>' +
      props.NAME_1 +
      "</h5><div><strong>Загальна кількість:</strong> " +
      total +
      " </div><div><strong>Code:</strong> property </div><div><strong>Square:</strong> property </div><div><strong>Date:</strong> property </div></div>";

    layer.on({
      mouseover: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.5 });
      },
      mouseout: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.7 });
      },
      click: () => {
        onRegionSelect(feature.properties);
      },
    });

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      className: "custom-card",
    });
  };

  if (!sheetData || sheetData.length === 0) {
    return <div>Loading...</div>;
  } else {
    return (
      <div style={{ height: "100vh", width: "100vh" }}>
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
          style={{ height: "100%", width: "100%" }}
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
          <ScaleBar scale={scale} />
        </MapContainer>
      </div>
    );
  }
}

export default Map;
