import React, { useState, useEffect } from "react";

// Компонент Weather для відображення погоди у заданому місті
function Weather() {
  // Стан для зберігання даних погоди
  const [weather, setWeather] = useState(null);

  // Ключ API OpenWeatherMap
  const API_KEY = "923676616b15d74e98a1d64dc24613f8";

  // Стан для поточного міста
  const [city, setCity] = useState("Kyiv");

  // URL для запиту до OpenWeatherMap API
  let apiLink =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    city +
    "&appid=" +
    API_KEY +
    "&units=metric"; // Параметр units=metric для градусів Цельсія

  // useEffect запускається при зміні `city`
  useEffect(() => {
    // Функція для асинхронного запиту погоди
    const fetchWeather = async () => {
      try {
        const response = await fetch(apiLink);

        if (!response.ok) {
          // Якщо статус відповіді не 200-299 — кидаємо помилку
          throw new Error("Помилка при запиті до API");
        }

        const data = await response.json(); // Конвертуємо JSON
        setWeather(data); // Зберігаємо дані у стан
      } catch (error) {
        console.error("Сталася помилка:", error);
        setWeather(null); // У разі помилки очищуємо стан
      }
    };

    fetchWeather(); // Викликаємо функцію
  }, [city]); // Залежність — кожного разу при зміні міста

  return (
    <div>
      <h1>Weather in {city}</h1>

      {/* Поле вводу для зміни міста */}
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      {/* Вивід погоди або повідомлення про завантаження */}
      {weather ? (
        <div>
          <p>Temp: {weather.main.temp}°C</p>
          <p>Feels like: {weather.main.feels_like}°C</p>
          <p>Pressure: {weather.main.pressure}</p>
          <p>Wind speed: {weather.wind.speed}</p>
          <p>Describe: {weather.weather[0].description}</p>
        </div>
      ) : (
        <p>Download...</p> // Поки дані завантажуються
      )}
    </div>
  );
}

export default Weather;
