import { useEffect, useState } from "react";

export interface MetricConfig {
  id: number;
  name: string;
  slug: string;
  color_theme: string;
  suffix: string;
}

export interface RegionData {
  region: string;
  [key: string]: any;
}

export interface MapData {
  data: RegionData[];
  metrics: MetricConfig[];
}

export function useMapData(): MapData {
  const [data, setData] = useState<RegionData[]>([]);
  const [metrics, setMetrics] = useState<MetricConfig[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        // 1. Fetch Layers (Metrics)
        const layersRes = await fetch("/api/layers", { signal: controller.signal });
        if (!layersRes.ok) throw new Error("Failed to fetch layers");
        const layers: MetricConfig[] = await layersRes.json();
        setMetrics(layers);

        // 2. Fetch Data for each layer
        // We will build a unified object where key = region name
        const combinedData: Record<string, RegionData> = {};

        // Initialize with default regions if needed or rely on first response
        // Better: Fetch all layer data in parallel
        await Promise.all(layers.map(async (layer) => {
          try {
            const res = await fetch(`/api/data/${layer.slug}`, { signal: controller.signal });
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
            console.error(`Failed to fetch data for ${layer.slug}`, e);
          }
        }));

        setData(Object.values(combinedData));

      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      }
    }

    fetchData();
    // Poll every 10 seconds to keep data fresh from Admin Panel
    const intervalId = setInterval(fetchData, 10000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  return { data, metrics };
}
