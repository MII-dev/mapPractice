import React from "react";

// Масив кольорів для шкали (Colors used in the scale)
const colors = [
  // Можеш змінювати палітру залежно від стилю карти
  "#f57a9a",
  "#d66381",
  "#b54a66",
  "#96354e",
  "#752137",
  "#4f1121",
];

// Компонент ScaleBar приймає масив scale (ScaleBar component receives a scale array)
const ScaleBar = ({ scale }) => {
  // Якщо шкала порожня або менше 2 значень — нічого не рендеримо
  if (!scale || scale.length < 2) return null;

  return (
    <div style={{ fontFamily: "sans-serif", fontSize: "14px" }}>
      {/* Проходимо по шкалі і будуємо сегменти кольорів */}
      {scale.slice(0, -1).map((from, i) => {
        const to = scale[i + 1];                  // Наступне значення шкали
        const color = colors[i % colors.length];  // Вибір кольору по індексу

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "6px", // Відстань між рядками шкали
            }}
          >
            {/* Круглий колірний маркер */}
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                borderRadius: "50%",       // Робимо круг
                backgroundColor: color,    // Колір сегменту
                marginRight: "8px",        // Відстань до тексту
                flexShrink: 0,             // Щоб коло не стискалось
              }}
            />
            {/* Текстовий діапазон для цього кольору */}
            <span>{`${from} - ${to}`} тис.</span>
          </div>
        );
      })}
    </div>
  );
};

// Експортуємо компонент для використання на карті (Export component for map)
export default ScaleBar;
