import fs from 'fs';

function isPointInPolygon(point, polygon) {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getCentroid(geometry) {
    let coords = [];
    if (geometry.type === 'Polygon') {
        coords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
        // Just use the first large polygon's coords for centroid
        coords = geometry.coordinates[0][0];
    }

    let x = 0, y = 0;
    for (let p of coords) {
        x += p[0];
        y += p[1];
    }
    return [x / coords.length, y / coords.length];
}

const oblasts = JSON.parse(fs.readFileSync('react-app/src/components/UKR_adm1.json', 'utf8'));
const raions = JSON.parse(fs.readFileSync('react-app/src/components/UKR_adm2.json', 'utf8'));

const oblastGeoms = oblasts.features.map(f => ({
    name: f.properties.NAME_1,
    geometry: f.geometry
}));

raions.features.forEach(raion => {
    const centroid = getCentroid(raion.geometry);
    let parent = "Unknown";

    for (const oblast of oblastGeoms) {
        let inside = false;
        if (oblast.geometry.type === 'Polygon') {
            inside = isPointInPolygon(centroid, oblast.geometry.coordinates[0]);
        } else if (oblast.geometry.type === 'MultiPolygon') {
            for (const poly of oblast.geometry.coordinates) {
                if (isPointInPolygon(centroid, poly[0])) {
                    inside = true;
                    break;
                }
            }
        }

        if (inside) {
            parent = oblast.name;
            break;
        }
    }
    raion.properties.parent_oblast = parent;
});

fs.writeFileSync('react-app/src/components/UKR_adm2.json', JSON.stringify(raions, null, 2));
console.log('Enrichment complete.');
