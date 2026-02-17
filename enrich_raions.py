import json
from shapely.geometry import shape, Point, MultiPolygon, Polygon

def enrich_geojson(oblasts_path, raions_path, output_path):
    with open(oblasts_path, 'r', encoding='utf-8') as f:
        oblasts = json.load(f)
    
    with open(raions_path, 'r', encoding='utf-8') as f:
        raions = json.load(f)

    # Convert oblast features to shapely geometries
    oblast_geoms = []
    for feature in oblasts['features']:
        geom = shape(feature['geometry'])
        name = feature['properties']['NAME_1']
        oblast_geoms.append((name, geom))

    found_count = 0
    total_count = len(raions['features'])

    for raion in raions['features']:
        raion_geom = shape(raion['geometry'])
        raion_centroid = raion_geom.centroid
        
        assigned_oblast = "Unknown"
        max_intersection = 0
        
        # Determine parent oblast by max intersection area (robust for overlapping boundaries)
        for name, geom in oblast_geoms:
            if geom.contains(raion_centroid) or geom.intersects(raion_geom):
                intersection_area = geom.intersection(raion_geom).area
                if intersection_area > max_intersection:
                    max_intersection = intersection_area
                    assigned_oblast = name
        
        raion['properties']['parent_oblast'] = assigned_oblast
        if assigned_oblast != "Unknown":
            found_count += 1

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(raions, f, ensure_ascii=False, indent=2)

    print(f"Enrichment complete. Mapped {found_count}/{total_count} raions.")

if __name__ == "__main__":
    enrich_geojson(
        '/home/ihor/Desktop/map/mapPractice/react-app/src/components/UKR_adm1.json',
        '/home/ihor/Desktop/map/mapPractice/react-app/src/components/UKR_adm2.json',
        '/home/ihor/Desktop/map/mapPractice/react-app/src/components/UKR_adm2_enriched.json'
    )
