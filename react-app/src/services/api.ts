import { MetricConfig } from "../types";

// ─── Auth helpers ────────────────────────────────────────────

function buildAuthHeaders(password: string): Record<string, string> {
    return {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("admin:" + password),
    };
}

// ─── Public API ──────────────────────────────────────────────

export async function verifyAdmin(password: string): Promise<boolean> {
    const res = await fetch("/api/verify-admin", {
        headers: { Authorization: "Basic " + btoa("admin:" + password) },
    });
    return res.ok;
}

export async function getLayers(): Promise<MetricConfig[]> {
    const res = await fetch("/api/layers");
    if (!res.ok) throw new Error("Failed to fetch layers");
    return res.json();
}

export async function createLayer(
    layer: { name: string; slug: string; color_theme: string; suffix: string },
    password: string
): Promise<MetricConfig> {
    const res = await fetch("/api/layers", {
        method: "POST",
        headers: buildAuthHeaders(password),
        body: JSON.stringify(layer),
    });
    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error("Failed to create layer");
    return res.json();
}

export async function deleteLayer(
    slug: string,
    password: string
): Promise<void> {
    const res = await fetch(`/api/layers/${slug}`, {
        method: "DELETE",
        headers: buildAuthHeaders(password),
    });
    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error("Failed to delete layer");
}

// ─── Data API ────────────────────────────────────────────────

export interface RegionValueRow {
    region: string;
    value: number;
    suffix: string;
    is_aggregated?: boolean;
    period?: string;
}

export async function getLayerData(
    slug: string,
    period?: string
): Promise<RegionValueRow[]> {
    const url = period
        ? `/api/data/${slug}?period=${period}`
        : `/api/data/${slug}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch layer data");
    const data = await res.json();
    return data.map((r: any) => ({ ...r, value: Number(r.value) || 0 }));
}

export interface RaionValueRow {
    raion: string;
    parent_oblast: string;
    value: number;
    suffix?: string;
}

export async function getRaionData(
    slug: string,
    period?: string
): Promise<RaionValueRow[]> {
    const url = period
        ? `/api/raion-data/${slug}?period=${period}`
        : `/api/raion-data/${slug}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch raion data");
    return res.json();
}

export async function saveLayerData(
    slug: string,
    data: { region_name: string; value: number }[],
    period: string,
    password: string
): Promise<void> {
    const res = await fetch("/api/data", {
        method: "POST",
        headers: buildAuthHeaders(password),
        body: JSON.stringify({ layer_slug: slug, data, period }),
    });
    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error("Failed to save layer data");
}

export async function saveRaionData(
    slug: string,
    data: { raion_name: string; value: number }[],
    period: string,
    password: string
): Promise<void> {
    const res = await fetch("/api/raion-data", {
        method: "POST",
        headers: buildAuthHeaders(password),
        body: JSON.stringify({ layer_slug: slug, data, period }),
    });
    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error("Failed to save raion data");
}

// ─── History / Periods API ───────────────────────────────────

export async function getPeriods(slug: string): Promise<string[]> {
    const res = await fetch(`/api/periods/${slug}`);
    if (!res.ok) throw new Error("Failed to fetch periods");
    return res.json();
}

export async function getLayerHistory(
    slug: string
): Promise<Record<string, { value: number; period: string }[]>> {
    const res = await fetch(`/api/layer-history/${slug}`);
    if (!res.ok) throw new Error("Failed to fetch layer history");
    return res.json();
}

export async function deleteHistory(
    slug: string,
    password: string,
    period?: string
): Promise<void> {
    let url = `/api/history/${slug}`;
    if (period) url += `?period=${period}`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: buildAuthHeaders(password),
    });
    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error("Failed to delete history");
}

// ─── Custom error ────────────────────────────────────────────

export class AuthError extends Error {
    constructor() {
        super("Authentication failed");
        this.name = "AuthError";
    }
}
