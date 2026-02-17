import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import raionGeoJSon from "./UKR_adm2.json";

interface Props {
    focusRegion: string | null;
    bounds: L.LatLngBounds;
    geojsonRef: React.RefObject<L.GeoJSON>;
    onReset: () => void;
    onRegionFound?: (props: any) => void;
    onFocusComplete?: () => void;
}

const MapController = ({ focusRegion, bounds, geojsonRef, onReset, onRegionFound, onFocusComplete }: Props) => {
    const map = useMap();

    useEffect(() => {
        if (!focusRegion) return;

        if (focusRegion === "-reset-") {
            map.fitBounds(bounds, { padding: [20, 20], duration: 1.5 });
            onReset();
            return;
        }

        if (focusRegion.startsWith("raion:")) {
            const raionName = focusRegion.replace("raion:", "");
            const feature = (raionGeoJSon as any).features.find((f: any) => f.properties.rayon === raionName);
            if (feature) {
                const raionLayer = L.geoJSON(feature);
                map.fitBounds(raionLayer.getBounds(), { padding: [50, 50], duration: 1.2, maxZoom: 10 });
                if (onFocusComplete) {
                    onFocusComplete();
                }
            }
            return;
        }

        if (geojsonRef.current) {
            geojsonRef.current.eachLayer((layer: any) => {
                if (layer.feature?.properties?.NAME_1 === focusRegion) {
                    const layerBounds = layer.getBounds();
                    map.flyToBounds(layerBounds, { padding: [50, 50], duration: 1.5 });

                    if (onRegionFound) {
                        onRegionFound(layer.feature.properties);
                    }
                    if (onFocusComplete) {
                        onFocusComplete();
                    }
                }
            });
        }
    }, [focusRegion, map, bounds, geojsonRef, onRegionFound, onReset]);

    return null;
};

export default MapController;
