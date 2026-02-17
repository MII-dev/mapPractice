const fs = require('fs');
const path = require('path');

const raionsPath = path.join(__dirname, 'react-app/src/components/UKR_adm2.json');
const raionsData = JSON.parse(fs.readFileSync(raionsPath, 'utf8'));

let sql = '-- Seed Raions\n';
sql += 'INSERT INTO public.raions (name, parent_region_id) VALUES\n';

const values = [];

raionsData.features.forEach(feature => {
    const name = feature.properties.rayon;
    const parentOblast = feature.properties.parent_oblast;

    // Skip unknown parents or handle them
    if (parentOblast && parentOblast !== 'Unknown') {
        const escapedName = name.replace(/'/g, "''");
        const escapedParent = parentOblast.replace(/'/g, "''");
        values.push(`('${escapedName}', (SELECT id FROM regions WHERE name = '${escapedParent}'))`);
    }
});

sql += values.join(',\n') + '\n';
sql += 'ON CONFLICT (name, parent_region_id) DO NOTHING;';

fs.writeFileSync('seed_raions.sql', sql);
console.log('Seed file generated: seed_raions.sql');
