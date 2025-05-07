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
import L from "leaflet";

type Props = {
  onRegionSelect: (props: any) => void;
};

function Map({ onRegionSelect }: Props) {
  const position: [number, number] = [50.4501, 30.5234];
  const bounds = L.geoJSON(ukrGeoJSon as any).getBounds();

  const onEachFeature = (feature: any, layer: any) => {
    const regionName = feature.properties.NAME_1;

    layer.on({
      mouseover: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.4 });
      },
      mouseout: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.1 });
      },
      click: () => {
        onRegionSelect(feature.properties);
      },
    });

    layer.bindTooltip(regionName, {
      sticky: true,
    });
  };

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
            color: "#3388ff",
            weight: 2,
            fillColor: "#3388ff",
            fillOpacity: 0.1,
          }}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}

export default Map;
