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
    raionData: any[];
    metrics: MetricConfig[];
}
