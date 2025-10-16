import React from "react";
import "leaflet/dist/leaflet.css";

// Типи пропсів для компонента тултіпа (Props type for tooltip component)
interface RegionTooltipProps {
  x: number;          // Координата X для позиціювання тултіпа (X coordinate for positioning)
  y: number;          // Координата Y для позиціювання тултіпа (Y coordinate for positioning)
  regionName: string; // Назва регіону (Region name)
  info: string;       // Додаткова інформація для відображення (Additional info)
  visible: boolean;   // Чи показувати тултіп (Whether tooltip is visible)
}

// Функціональний компонент RegionTooltip
const RegionTooltip: React.FC<RegionTooltipProps> = ({
  x,
  y,
  regionName,
  info,
  visible,
}) => {
  // Інлайн-стиль для позиціювання тултіпа (Inline style to position tooltip)
  const style = {
    top: y,
    left: x,
  };

  return (
    <div
      // Додаємо клас 'visible', якщо тултіп показаний (Add 'visible' class if tooltip is visible)
      className={`tooltip-card ${visible ? "visible" : ""}`}
      style={style} // Прив’язка позиції до стилю (Apply position styles)
    >
      {/* Заголовок тултіпа (Tooltip title) */}
      <div className="tooltip-title">{regionName}</div>

      {/* Основний контент тултіпа (Tooltip body content) */}
      <div className="tooltip-body">{info}</div>
    </div>
  );
};

// Експортуємо компонент (Export the tooltip component)
export default RegionTooltip;
