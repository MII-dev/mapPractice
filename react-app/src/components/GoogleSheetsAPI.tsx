import { useEffect, useState } from "react";

// Константи для підключення до Google Sheets API 
// (Constants for connecting to Google Sheets API)
const SPREADSHEET_ID = "1A0MhR4jl1w_N2Qyr0-Y9EbjMT-6Jc5xcl5HKoZjAkvQ";
const API_KEY = "AIzaSyCiEj9W9Ten-8zFSC9HdqqPKXLqHPXwWAc";
const RANGE = "Ветерани_по_регіонах_очищено!A1:B"; 
// Діапазон даних у таблиці (Data range in the spreadsheet)

export function SheedData() {
  // Стан для збереження отриманих даних з Google Sheets 
  // (State for storing fetched data from Google Sheets)
  const [data, setData] = useState<any[]>([]);

  // Запит до локального сервера для отримання даних про регіони 
  // (Request to local server to fetch region data)
  fetch("http://localhost:3001/api/regions")
    .then((res) => res.json())
    .then((data) => {
      console.log("Region data:", data);
      // Тут можна об’єднати дані з GeoJSON 
      // (Here you can merge this data with GeoJSON)
    });

  // Використовуємо useEffect для завантаження даних лише один раз після рендеру
  // (Using useEffect to load data once after component render)
  useEffect(() => {
    // Формуємо запит до Google Sheets API 
    // (Building request to Google Sheets API)
    fetch(
      "https://sheets.googleapis.com/v4/spreadsheets/" +
        SPREADSHEET_ID +
        "/values/" +
        RANGE +
        "?key=" +
        API_KEY
    )
      .then((res) => res.json())
      .then((res) => {
        const rows = res.values;
        if (!rows) return; // Якщо даних немає — припиняємо (If no data, exit)

        // Перший рядок — це заголовки (First row = headers)
        const headers = rows[0];

        // Решта рядків — основні дані (The rest are data rows)
        const body = rows.slice(1);

        // Форматуємо дані у вигляді масиву об’єктів 
        // (Format data as an array of objects)
        const formatted = body.map((row: any[]) => ({
          region: row[0], // Назва регіону (Region name)
          total: row[1],  // Кількість або значення (Total count or value)
        }));

        // Оновлюємо стан з відформатованими даними 
        // (Update state with formatted data)
        setData(formatted);
      });
  }, []);

  // Повертаємо масив даних, щоб його можна було використовувати в інших компонентах 
  // (Return the data array so it can be used in other components)
  return data;
}
