import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

type SidebarProps = {
  region: any;
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ region, onClose }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (region) {
      setTimeout(() => setIsOpen(true), 10);
    } else {
      setIsOpen(false);
    }
  }, [region]);

  if (!region) return null;

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>{region?.NAME_1}</h2>
      <p>
        <strong>Ветеранів:</strong> {region?.total ?? "—"}
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
