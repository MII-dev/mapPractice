import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface MapControllerProps {
    focusRegion: string | null;
    bounds: L.LatLngBounds;
    geojsonRef: React.MutableRefObject<L.GeoJSON | null>;
    onFlyToComplete?: () => void;
    // Callback to trigger visual selection if needed
    onRegionFound?: (props: any) => void;
    onReset?: () => void;
}

const MapController: React.FC<MapControllerProps> = ({
    focusRegion,
    bounds,
    geojsonRef,
    onRegionFound,
    onReset
}) => {
    const map = useMap();

    useEffect(() => {
        if (focusRegion === "-reset-") {
            map.flyToBounds(bounds, { duration: 1.5 });
            if (onReset) onReset();
            return;
        }

        if (focusRegion && geojsonRef.current) {
            // Find the layer corresponding to the region
            geojsonRef.current.eachLayer((layer: any) => {
                if (layer.feature?.properties?.NAME_1 === focusRegion) {
                    const layerBounds = layer.getBounds();
                    map.flyToBounds(layerBounds, { padding: [50, 50], duration: 1.5 });

                    if (onRegionFound) {
                        onRegionFound(layer.feature.properties);
                    }
                }
            });
        }
    }, [focusRegion, map, bounds, geojsonRef, onRegionFound, onReset]);

    return null;
};

export default MapController;
