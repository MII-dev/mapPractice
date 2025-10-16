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
      {/* Кнопка закриття */}
      <button className="close-btn" onClick={onClose}>
        ×
      </button>

      {/* Назва області */}
      <h2>{localRegion?.NAME_1}</h2>

      {/* Дані по ветеранах */}
      <p>
        <strong>Ветеранів:</strong> {localRegion?.total ?? "—"}
      </p>

      {/* Плейсхолдери для інших показників */}
      <p>
        <strong>Вакансій:</strong> 0
      </p>
      <p>
        <strong>Рейтинг:</strong> —
      </p>
    </div>
  );
};

// Експортуємо компонент для використання в інших частинах програми
export default Sidebar;
