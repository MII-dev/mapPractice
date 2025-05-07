import { useState } from "react";
import reactLogo from "./assets/react.svg";
import ListGroup from "./components/ListGroup";
import Message from "./Message";
import Weather from "./components/Weather";
import Map from "./components/Map";
import "leaflet/dist/leaflet.css";

function App() {
  const [SelectedRegion, setSelectedRegion] = useState<any>(null);

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
      <Map onRegionSelect={setSelectedRegion} />
    </div>
  );
}
export default App;
