import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function Map() {
  const position = [50.4501, 30.5234];

  const someShops = [
    { name: "Shop 1", position: [50.4501, 30.5244] },
    { name: "Shop 2", position: [50.46, 30.5234] },
    { name: "Shop 3", position: [50.4501, 30.53] },
    { name: "Shop 4", position: [50.4521, 30.54] },
    { name: "Shop 5", position: [50.45, 30.52] },
  ];

  return (
    <div style={{ height: "100vh", width: "100vh" }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={position}>
          <Popup>Hy from Kyiv</Popup>
        </Marker>

        {someShops.map((shop, index) => (
          <Marker key={index} position={shop.position}>
            <Popup>{shop.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
