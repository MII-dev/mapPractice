import React, { useState, useEffect } from "react";

function Weather() {
  const [weather, setWeather] = useState(null);
  const API_KEY = "923676616b15d74e98a1d64dc24613f8";
  const [city, setCity] = useState("Kyiv");
  let apiLink =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    city +
    "&appid=" +
    API_KEY +
    "&units=metric";

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(apiLink);

        if (!response.ok) {
          throw new Error("Помилка при запиті до API");
        }

        const data = await response.json();
        setWeather(data);
      } catch (error) {
        console.error("Сталася помилка:", error);
        setWeather(null);
      }
    };

    fetchWeather();
  }, [city]);

  return (
    <div>
      <h1>Weather in {city}</h1>
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      {weather ? (
        <div>
          <p>Temp: {weather.main.temp}°C</p>
          <p>Feels like: {weather.main.feels_like}°C</p>
          <p>Pressure: {weather.main.pressure}</p>
          <p>Wind speed: {weather.wind.speed}</p>
          <p>Describe: {weather.weather[0].description}</p>
        </div>
      ) : (
        <p>Download...</p>
      )}
    </div>
  );
}

export default Weather;
