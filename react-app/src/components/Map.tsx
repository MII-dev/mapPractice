import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ukrGeoJSon from "./UKR_adm1.json";

function Map() {
  const position = [50.4501, 30.5234];
  const [zoom, setZoom] = useState(6);

  const someShops = [
    { name: "Shop 1", position: [50.4501, 30.5244] },
    { name: "Shop 2", position: [50.46, 30.5234] },
    { name: "Shop 3", position: [50.4501, 30.53] },
    { name: "Shop 4", position: [50.4521, 30.54] },
    { name: "Shop 5", position: [50.45, 30.52] },
  ];

  const onEachRegion = (feature, layer) => {
    const regionName = feature.properties.NAME_1;
    const map = useMap();
    // layer.bindPopup("Область: " + regionName);
    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ fillOpacity: 0.7 });
      },
      mouseout: (e) => {
        e.target.setStyle({ fillOpacity: 0.1 });
      },
      click: () => {
        const bounds = layer.getBounds();
        map.fitBounds(bounds);
      },
    });
  };

  function ZoomHandler({ setZoom }) {
    useMapEvents({
      zoomend: (e) => {
        setZoom(e.target.getZoom());
      },
    });
    return null;
  }

  return (
    <div style={{ height: "100vh", width: "100vh" }}>
      <MapContainer
        center={position}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomHandler setZoom={setZoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {zoom <= 9 && (
          <GeoJSON
            data={ukrGeoJSon}
            style={{
              color: "#3388ff",
              weight: 2,
              fillColor: "#3388ff",
              fillOpacity: 0.1,
            }}
            onEachFeature={onEachRegion}
          />
        )}

        {zoom >= 10 &&
          someShops.map((shop, index) => (
            <Marker key={index} position={shop.position}>
              <Popup>{shop.name}</Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

export default Map;
