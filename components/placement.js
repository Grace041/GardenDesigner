export function makePlacement(point, type, state, terrain, assetDefs) {
    const def = assetDefs[type];
    let x = point.x;
    let z = point.z;
    if (def.snap) {
        x = Math.round(x / def.snap) * def.snap;
        z = Math.round(z / def.snap) * def.snap;
    }

    const rotationY = state.rotationSteps * Math.PI * 0.5;
    const bounds = getFootprint(type, x, z, rotationY, assetDefs);
    const halfWidth = state.plotWidth / 2;
    const halfDepth = state.plotDepth / 2;
    x += Math.max(-halfWidth, bounds.minX) - bounds.minX;
    x += Math.min(halfWidth, bounds.maxX) - bounds.maxX;
    z += Math.max(-halfDepth, bounds.minZ) - bounds.minZ;
    z += Math.min(halfDepth, bounds.maxZ) - bounds.maxZ;

    return {
        position: {x, y: terrain.heightAt(x, z), z},
        rotationY
    };
}

export function canPlace(type, x, z, rotationY, state, placed, assetDefs) {
    const bounds = getFootprint(type, x, z, rotationY, assetDefs);
    if (bounds.minX < -state.plotWidth / 2 || bounds.maxX > state.plotWidth / 2) return false;
    if (bounds.minZ < -state.plotDepth / 2 || bounds.maxZ > state.plotDepth / 2) return false;

    return placed.every((item) => {
        const other = getFootprint(item.type, item.root.position.x, item.root.position.z, item.rotationY, assetDefs);
        return !overlap(bounds, other);
    });
}

export function getFootprint(type, x, z, rotationY, assetDefs) {
    const def = assetDefs[type];
    const quarterTurns = Math.abs(Math.round(rotationY / (Math.PI * 0.5))) % 2;
    const width = quarterTurns ? def.size.d : def.size.w;
    const depth = quarterTurns ? def.size.w : def.size.d;
    return {
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
    };
}

function overlap(a, b) {
    const padding = 0.08;
    return a.minX < b.maxX + padding &&
        a.maxX > b.minX - padding &&
        a.minZ < b.maxZ + padding &&
        a.maxZ > b.minZ - padding;
}
