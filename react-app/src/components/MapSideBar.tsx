// Імпорт базових залежностей React
import React, { useEffect, useState } from "react";
// Імпорт стилів для карти (Leaflet)
import "leaflet/dist/leaflet.css";
// Імпорт локального CSS для бокової панелі
import "./MapSideBar.css";

// Тип, що описує структуру даних про регіон
type Region = {
  NAME_1: string;      // Назва області
  total?: number;      // Кількість ветеранів (необов’язкове поле)
  [key: string]: any;  // Дозволяє інші довільні властивості
};

// Тип пропсів, які отримує Sidebar
type SidebarProps = {
  region: Region | null; // Поточний вибраний регіон або null
  onClose: () => void;   // Функція для закриття панелі
};

// Компонент Sidebar (функціональний компонент React)
const Sidebar: React.FC<SidebarProps> = ({ region, onClose }) => {
  // Стан, який керує анімацією появи/зникнення панелі
  const [isVisible, setIsVisible] = useState(false);

  // Локальна копія регіону (щоб панель не зникала миттєво при закритті)
  const [localRegion, setLocalRegion] = useState<any>(null);

  // Виконується кожного разу, коли змінюється `region`
  useEffect(() => {
    if (region) {
      // Якщо новий регіон передано — оновлюємо локальний стан
      setLocalRegion(region);
      // Через коротку затримку додаємо клас `open` для плавної анімації
      setTimeout(() => setIsVisible(true), 10);
    } else if (localRegion) {
      // Якщо регіон закривається — запускаємо анімацію закриття
      setIsVisible(false);
      // Після завершення анімації (300 мс) очищаємо локальний регіон
      const timeout = setTimeout(() => setLocalRegion(null), 300);
      // При зміні регіону або демонтажі компонента — очищаємо таймер
      return () => clearTimeout(timeout);
    }
  }, [region]);

  // Якщо регіон ще не вибрано — нічого не рендеримо
  if (!localRegion) return null;

  // Основна розмітка панелі
  return (
    <div className={`sidebar ${isVisible ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        ×
      </button>

      <h2>{localRegion?.NAME_1}</h2>
      <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: "-1.5rem" }}>Статистика регіону</p>

      <div className="sidebar-content">
        <div className="sidebar-content-item main-value">
          <label>{localRegion.label || "Кількість"}</label>
          <div className="value-display">
            <span className="number">
              {localRegion.total !== null ? localRegion.total.toLocaleString() : "—"}
            </span>
            <span className="unit">{localRegion.suffix || ""}</span>
          </div>
        </div>

        {localRegion.average && (
          <div className="comparison-section">
            <div className="comparison-row">
              <label>Середнє по Україні</label>
              <span>{Math.round(localRegion.average).toLocaleString()} {localRegion.suffix}</span>
            </div>

            <div className="comparison-row">
              <label>Відхилення</label>
              <span className={`diff-badge ${localRegion.total >= localRegion.average ? 'positive' : 'negative'}`}>
                {localRegion.total >= localRegion.average ? '+' : ''}
                {Math.round(((localRegion.total - localRegion.average) / localRegion.average) * 100)}%
              </span>
            </div>

            <div className="stat-bar-container">
              <div className="stat-bar-label">
                <span>Порівняння з макс. регіоном</span>
                <span>{Math.round((localRegion.total / localRegion.max) * 100)}%</span>
              </div>
              <div className="stat-bar-bg">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${(localRegion.total / localRegion.max) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Експортуємо компонент для використання в інших частинах програми
export default Sidebar;
