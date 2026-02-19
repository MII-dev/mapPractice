// Імпорт базових залежностей React
import React, { useEffect, useState } from "react";
// Імпорт локального CSS для бокової панелі
import "./MapSideBar.css";
// Імпорт компонента графіка
import HistoryChart from "./HistoryChart";

// Тип, що описує структуру даних про регіон
type Region = {
  NAME_1: string;      // Назва області
  region: string;
  total: number;
  suffix: string;
  label?: string;
  average?: number;
  max?: number;
  color?: string;
  history?: any[];
  allMetrics?: {
    name: string;
    value: number;
    suffix: string;
    color: string;
  }[];
  isRaion?: boolean; // Додано для визначення, чи це район
  childRaions?: string[]; // Додано для списку районів
  [key: string]: any;  // Дозволяє інші довільні властивості
};

// Тип пропсів, які отримує Sidebar
type SidebarProps = {
  region: Region | null; // Поточний вибраний регіон або null
  onClose: () => void;   // Функція для закриття панелі
  onRaionSelect?: (name: string) => void; // Додано для навігації
};

import Sparkline from "./ui/Sparkline";

// Sidebar-specific sparkline wrapper with label
const SidebarSparkline: React.FC<{ data: any[]; color?: string }> = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
      <Sparkline data={data} color={color} />
      <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>ТРЕНД (6 МІС.)</span>
    </div>
  );
};

// Компонент Sidebar (функціональний компонент React)
const Sidebar: React.FC<SidebarProps> = ({ region, onClose, onRaionSelect }) => {
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
      <p className="sidebar-subtitle">{localRegion.isRaion ? "Детальна інформація про район" : "Статистика регіону"}</p>

      <div className="sidebar-content">
        <div className="sidebar-content-item main-value" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <label>{localRegion.label || "Кількість"}</label>
            <div className="value-display">
              <span className="number">
                {(localRegion.total !== null && localRegion.total !== undefined) ? localRegion.total.toLocaleString() : "—"}
              </span>
              <span className="unit">{localRegion.suffix || ""}</span>
            </div>
          </div>
          <SidebarSparkline data={localRegion.history} color={localRegion.color} />
        </div>

        {!localRegion.isRaion && localRegion.average && (
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
                  style={{ width: `${(localRegion.total / localRegion.max) * 100}%`, background: localRegion.color }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Райони області (Drill-down) */}
        {!localRegion.isRaion && localRegion.childRaions && localRegion.childRaions.length > 0 && (
          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">📑</span>
              <h3>Райони області</h3>
            </div>
            <div className="raion-list-grid">
              {localRegion.childRaions
                .sort((a: any, b: any) => b.value - a.value) // Sort by value desc
                .map((item: any) => (
                  <button
                    key={item.name}
                    className="raion-pill-btn"
                    onClick={() => onRaionSelect && onRaionSelect(item.name)}
                  >
                    <div className="raion-pill-content">
                      <span className="raion-name">{item.name.replace(' район', '')}</span>
                      <span className="raion-value-pill">{item.value.toLocaleString()}</span>
                    </div>
                    <span className="pill-icon">📍</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Raion Specific Real Metrics */}
        {localRegion.isRaion && localRegion.allMetrics && (
          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">📊</span>
              <h3>Основні показники</h3>
            </div>
            <div className="placeholder-stats-grid">
              {localRegion.allMetrics.map((m: any) => (
                <div className="p-stat-card" key={m.slug}>
                  <span className="p-icon">📈</span>
                  <div className="p-details">
                    <span className="p-label">{m.name}</span>
                    <span className="p-value">{m.value.toLocaleString()} {m.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {localRegion.history && localRegion.history.length > 0 && (
          <div className="history-chart-section" style={{ marginTop: '1rem' }}>
            <h3 className="section-title">Динаміка змін</h3>
            <HistoryChart data={localRegion.history} color={localRegion.color} />
          </div>
        )}

        {!localRegion.isRaion && localRegion.allMetrics && localRegion.allMetrics.length > 0 && (
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
