import { useState } from "react";
import reactLogo from "./assets/react.svg";
import ListGroup from "./components/ListGroup";
import Message from "./Message";
import Weather from "./components/Weather";
import Map from "./components/Map";
import "leaflet/dist/leaflet.css"; 
// Імпортуємо необхідні модулі та стилі (Importing required modules and styles)

function App() {
  // Створюємо стан для вибраного регіону (Create state for the selected region)
  const [SelectedRegion, setSelectedRegion] = useState<any>(null);

  // Створюємо стан для даних таблиці або аркуша (Create state for sheet or table data)
  const [sheetData, setSheetData] = useState<any[]>([])

  /* 
  Попередня версія компонента — тестовий шаблон із кількома елементами 
  (Previous version of the component — test layout with multiple elements)
  
  return (
    <div>
      <Message />
      <ListGroup items={items} heading="Cities" />
      <Weather />
      <Map />
    </div>
  );
  */

  return (
    <div>
      {/* Відображаємо компонент карти та передаємо функцію для вибору регіону 
          (Render the Map component and pass a function for selecting a region) */}
      <Map onRegionSelect={setSelectedRegion} />
    </div>
  );
}

export default App;
// Експортуємо компонент App як головний компонент застосунку (Export App as the main application component)
