import { useEffect, useState } from "react";

// Константи для підключення до Google Sheets API 
// (Constants for connecting to Google Sheets API)
const SPREADSHEET_ID = "1A0MhR4jl1w_N2Qyr0-Y9EbjMT-6Jc5xcl5HKoZjAkvQ";
const API_KEY = "AIzaSyCiEj9W9Ten-8zFSC9HdqqPKXLqHPXwWAc";
const RANGE = "Ветерани_по_регіонах_очищено!A1:B";

export function useSheetData() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAll() {
      try {
        const sheetsRes = await fetch(
          "https://sheets.googleapis.com/v4/spreadsheets/" + 
          SPREADSHEET_ID +
          "/values/" +
          RANGE +
          "?key=" +
          API_KEY,
          { signal: controller.signal }
        );
        const sheetsJson = await sheetsRes.json();
        const rows = sheetsJson.values;
        if (rows) {
          const body = rows.slice(1);
          const formatted = body.map((row: any[]) => ({
            region: row[0],
            total: row[1],
          }));
          setData(formatted);
        }

        const regionsRes = await fetch("http://localhost:5173/api/regions", {
          signal: controller.signal,
        });
        const regionsJson = await regionsRes.json();
        console.log("Region data:", regionsJson);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      }
    }

    fetchAll();
    const intervalId = setInterval(fetchAll, 6000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  return data;
}
