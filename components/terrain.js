import * as THREE from "../build/three.module.js";

export class GardenTerrain {
    constructor(scene, materials, state) {
        this.scene = scene;
        this.materials = materials;
        this.state = state;
        this.mesh = null;
        this.gridHelper = null;
        this.boundaryLine = null;
    }

    build() {
        if (this.mesh) this.scene.remove(this.mesh);
        if (this.gridHelper) this.scene.remove(this.gridHelper);
        if (this.boundaryLine) this.scene.remove(this.boundaryLine);

        const geometry = this.makeTerrainGeometry(this.state.plotWidth, this.state.plotDepth, 88, 72);
        this.mesh = new THREE.Mesh(geometry, this.materials.ground);
        this.mesh.receiveShadow = true;
        this.mesh.userData.isTerrain = true;
        this.scene.add(this.mesh);

        const gridSize = Math.max(this.state.plotWidth, this.state.plotDepth);
        this.gridHelper = new THREE.GridHelper(gridSize, gridSize, "#d5e7c0", "#98a683");
        this.gridHelper.material.opacity = 0.18;
        this.gridHelper.material.transparent = true;
        this.gridHelper.position.y = 0.035;
        this.scene.add(this.gridHelper);

        this.boundaryLine = this.makeBoundaryLine();
        this.scene.add(this.boundaryLine);
    }

    updatePlacedObjects(placed, getFootprint) {
        placed.forEach((item) => {
            const halfWidth = this.state.plotWidth / 2;
            const halfDepth = this.state.plotDepth / 2;
            const bounds = getFootprint(item.type, item.root.position.x, item.root.position.z, item.rotationY);
            let x = item.root.position.x;
            let z = item.root.position.z;
            x += Math.max(-halfWidth, bounds.minX) - bounds.minX;
            x += Math.min(halfWidth, bounds.maxX) - bounds.maxX;
            z += Math.max(-halfDepth, bounds.minZ) - bounds.minZ;
            z += Math.min(halfDepth, bounds.maxZ) - bounds.maxZ;
            item.root.position.set(x, this.heightAt(x, z), z);
        });
    }

    heightAt(x, z) {
        const edgeFadeX = 1 - smoothstep(this.state.plotWidth * 0.36, this.state.plotWidth * 0.5, Math.abs(x));
        const edgeFadeZ = 1 - smoothstep(this.state.plotDepth * 0.36, this.state.plotDepth * 0.5, Math.abs(z));
        const edgeFade = Math.max(0, edgeFadeX * edgeFadeZ);
        const rolling = Math.sin(x * 0.42) * Math.cos(z * 0.28) * 0.48;
        const ripple = Math.sin((x + z) * 0.65) * 0.16;
        const beds = this.raisedBedHeight(x, z);
        return (rolling + ripple) * this.state.terrainLift * edgeFade + beds;
    }

    raisedBedHeight(x, z) {
        const bedWidth = Math.min(5, this.state.plotWidth * 0.26);
        const bedDepth = Math.min(3.2, this.state.plotDepth * 0.22);
        const centers = [
            {x: -this.state.plotWidth * 0.22, z: -this.state.plotDepth * 0.2},
            {x: this.state.plotWidth * 0.2, z: this.state.plotDepth * 0.18}
        ];

        return centers.reduce((height, center) => {
            const dx = Math.abs(x - center.x);
            const dz = Math.abs(z - center.z);
            if (dx > bedWidth || dz > bedDepth) return height;
            const edge = Math.min(1 - dx / bedWidth, 1 - dz / bedDepth);
            return height + smoothstep(0, 0.34, edge) * 0.42 * this.state.terrainLift;
        }, 0);
    }

    makeTerrainGeometry(width, depth, columns, rows) {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        for (let zIndex = 0; zIndex <= rows; zIndex++) {
            const z = (zIndex / rows - 0.5) * depth;
            for (let xIndex = 0; xIndex <= columns; xIndex++) {
                const x = (xIndex / columns - 0.5) * width;
                positions.push(x, this.heightAt(x, z), z);
                normals.push(0, 1, 0);
                uvs.push(xIndex / columns * width / 5, zIndex / rows * depth / 5);
            }
        }

        for (let zIndex = 0; zIndex < rows; zIndex++) {
            for (let xIndex = 0; xIndex < columns; xIndex++) {
                const a = zIndex * (columns + 1) + xIndex;
                const b = a + 1;
                const c = a + columns + 1;
                const d = c + 1;
                indices.push(a, c, b, b, c, d);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    makeBoundaryLine() {
        const hw = this.state.plotWidth / 2;
        const hd = this.state.plotDepth / 2;
        const points = [
            new THREE.Vector3(-hw, this.heightAt(-hw, -hd) + 0.08, -hd),
            new THREE.Vector3(hw, this.heightAt(hw, -hd) + 0.08, -hd),
            new THREE.Vector3(hw, this.heightAt(hw, hd) + 0.08, hd),
            new THREE.Vector3(-hw, this.heightAt(-hw, hd) + 0.08, hd),
            new THREE.Vector3(-hw, this.heightAt(-hw, -hd) + 0.08, -hd)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({color: "#fff0bc", transparent: true, opacity: 0.85});
        return new THREE.Line(geometry, material);
    }
}

function smoothstep(edge0, edge1, x) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}
