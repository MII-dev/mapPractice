import React from "react";
import "leaflet/dist/leaflet.css";

interface RegionTooltipProps {
  x: number;
  y: number;
  regionName: string;
  info: string;
  visible: boolean;
}

const RegionTooltip: React.FC<RegionTooltipProps> = ({
  x,
  y,
  regionName,
  info,
  visible,
}) => {
  const style = {
    top: y,
    left: x,
  };

  return (
    <div className={`tooltip-card ${visible ? "visible" : ""}`} style={style}>
      <div className="tooltip-title">{regionName}</div>
      <div className="tooltip-body">{info}</div>
    </div>
  );
};

export default RegionTooltip;
