import { useEffect, useState } from "react";

const SPREADSHEET_ID = "1A0MhR4jl1w_N2Qyr0-Y9EbjMT-6Jc5xcl5HKoZjAkvQ";
const API_KEY = "AIzaSyCiEj9W9Ten-8zFSC9HdqqPKXLqHPXwWAc";
const RANGE = "Ветерани_по_регіонах_очищено!A1:B";

export function SheedData() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
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
        if (!rows) return;

        const headers = rows[0];
        const body = rows.slice(1);

        const formatted = body.map((row: any[]) => ({
          region: row[0],
          total: row[1],
        }));

        setData(formatted);
      });
  }, []);

  return data;
}
