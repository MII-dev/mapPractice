import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import ListGroup from "./components/ListGroup";
import Message from "./Message";
import Weather from "./components/Weather";
import Map from "./components/Map";
import "leaflet/dist/leaflet.css";

function App() {
  const [count, setCount] = useState(0);
  let items = ["New York", "San Francisco", "Tokyo", "London", "Paris"];

  /*return (
    <div>
      <Message />
      <ListGroup items={items} heading="Cities" />
      <Weather />
      <Map />
    </div>
  );*/

  return (
    <div>
      <Map />
    </div>
  );
}
export default App;
