import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

type SidebarProps = {
  region: any;
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ region, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [localRegion, setLocalRegion] = useState<any>(null);

  useEffect(() => {
    if (region) {
      setLocalRegion(region);
      setTimeout(() => setIsVisible(true), 10);
    } else if (localRegion) {
      setIsVisible(false);
    }
  }, [region]);

  if (!localRegion) return null;

  return (
    <div className={`sidebar ${isVisible ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>{localRegion?.NAME_1}</h2>
      <p>
        <strong>Ветеранів:</strong> {localRegion?.total ?? "—"}
      </p>
      <p>
        <strong>Вакансій:</strong> 0
      </p>
      <p>
        <strong>Рейтинг:</strong> —
      </p>
    </div>
  );
};

export default Sidebar;
