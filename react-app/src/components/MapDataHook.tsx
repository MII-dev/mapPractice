import { useEffect, useState } from "react";

import { MetricConfig, RegionData, MapData } from "../types";

export type { MetricConfig, RegionData, MapData };

export function useMapData(selectedDate: string | null): MapData & { availableDates: string[] } {
  const [data, setData] = useState<RegionData[]>([]);
  const [raionData, setRaionData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<MetricConfig[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        // 1. Fetch Layers (Metrics)
        const layersRes = await fetch("/api/layers", { signal: controller.signal });
        if (!layersRes.ok) throw new Error("Failed to fetch layers");
        const layers: MetricConfig[] = await layersRes.json();
        setMetrics(layers);

        if (layers.length > 0) {
          // Fetch available dates for the first layer
          try {
            const datesRes = await fetch(`/api/periods/${layers[0].slug}`, { signal: controller.signal });
            if (datesRes.ok) {
              const dates = await datesRes.json();
              setAvailableDates(dates);
            }
          } catch (e) {
            console.error("Failed to fetch dates", e);
          }
        }

        // 2. Fetch Oblast Data
        const combinedData: Record<string, RegionData> = {};
        await Promise.all(layers.map(async (layer) => {
          try {
            const url = selectedDate
              ? `/api/data/${layer.slug}?period=${selectedDate}`
              : `/api/data/${layer.slug}`;
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
              const values = await res.json();
              values.forEach((item: any) => {
                if (!combinedData[item.region]) {
                  combinedData[item.region] = { region: item.region };
                }
                combinedData[item.region][layer.slug] = item.value;
              });
            }
          } catch (e) {
            console.error(`Failed to fetch oblast data for ${layer.slug}`, e);
          }
        }));
        setData(Object.values(combinedData));

        // 3. Fetch Raion Data
        const combinedRaionData: Record<string, any> = {};
        await Promise.all(layers.map(async (layer) => {
          try {
            const url = selectedDate
              ? `/api/raion-data/${layer.slug}?period=${selectedDate}`
              : `/api/raion-data/${layer.slug}`;
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
              const values = await res.json();
              values.forEach((item: any) => {
                if (!combinedRaionData[item.raion]) {
                  combinedRaionData[item.raion] = { raion: item.raion, parent_oblast: item.parent_oblast };
                }
                combinedRaionData[item.raion][layer.slug] = item.value;
              });
            }
          } catch (e) {
            console.error(`Failed to fetch raion data for ${layer.slug}`, e);
          }
        }));
        setRaionData(Object.values(combinedRaionData));

      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      }
    }

    fetchData();
    const intervalId = setInterval(fetchData, 15000); // 15s polling

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [selectedDate]); // Add selectedDate as dependency

  return { data, raionData, metrics, availableDates };
}
