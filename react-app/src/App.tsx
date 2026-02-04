import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Map from "./components/Map";
import AdminPage from "./components/AdminPage";
import "leaflet/dist/leaflet.css";

function App() {
  const [SelectedRegion, setSelectedRegion] = useState<any>(null);

  return (
    <Router basename="/mapPractice">
      <Routes>
        <Route path="/" element={<Map onRegionSelect={setSelectedRegion} />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
