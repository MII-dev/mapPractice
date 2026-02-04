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

// Sparkline component to render a simple trend line
const Sparkline: React.FC<{ data: any[], color?: string }> = ({ data, color = "#3b82f6" }) => {
  if (!data || data.length < 2) return null;

  const width = 100;
  const height = 30;
  const padding = 2;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>ТРЕНД (6 МІС.)</span>
    </div>
  );
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
      <p className="sidebar-subtitle">Статистика регіону</p>

      <div className="sidebar-content">
        <div className="sidebar-content-item main-value" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <label>{localRegion.label || "Кількість"}</label>
            <div className="value-display">
              <span className="number">
                {localRegion.total !== null ? localRegion.total.toLocaleString() : "—"}
              </span>
              <span className="unit">{localRegion.suffix || ""}</span>
            </div>
          </div>
          <Sparkline data={localRegion.history} color={localRegion.color} />
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

        {localRegion.allMetrics && localRegion.allMetrics.length > 0 && (
          <div className="all-metrics-section">
            <h3 className="section-title">Усі показники</h3>
            <div className="metrics-grid">
              {localRegion.allMetrics.map((m: any) => (
                <div key={m.slug} className="metric-row">
                  <label>{m.name}</label>
                  <span>{m.value?.toLocaleString() || 0} <small>{m.suffix}</small></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Експортуємо компонент для використання в інших частинах програми
export default Sidebar;
