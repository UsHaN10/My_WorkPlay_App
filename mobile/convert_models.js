const { execSync } = require('child_process');

console.log('Converting Pet Models...');
const pets = ['animal-cat', 'animal-dog', 'animal-fox', 'animal-pig', 'animal-lion', 'animal-polar'];
const petPaths = pets.map(m => `./kenney_cube-pets_1.0/Models/GLB format/${m}`);

const chars = ['Knight', 'Ranger', 'Mage', 'Rogue', 'Barbarian'];
const charPaths = chars.map(m => `./KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/${m}`);

const allPaths = [...petPaths, ...charPaths];

allPaths.forEach(p => {
    console.log(`Processing: ${p}`);
    try {
        execSync(`npx -y gltf-pipeline -i "${p}.glb" -o "${p}-emb.glb"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to convert ${p}`);
    }
});
console.log('Done.');
