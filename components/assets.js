import * as THREE from "../build/three.module.js";
import {OBJLoader} from "../build/loaders/OBJLoader.js";

export const assetDefs = {
    bench: {
        file: "./models/wooden_bench.obj",
        scale: 0.018,
        size: {w: 3.2, d: 0.95},
        label: "Bench"
    },
    tree: {
        file: "./models/GenTree_105_AE3D_03122023-F2.obj",
        scale: 0.22,
        size: {w: 2.35, d: 2.35},
        label: "Tree",
        normalize: true
    },
    lamp: {
        file: "./models/Street_Lamp.obj",
        scale: 0.018,
        size: {w: 1.15, d: 1.15},
        label: "Lamp"
    },
    fence: {
        file: "./models/fence_piece.obj",
        scale: 1,
        size: {w: 2.45, d: 0.34},
        label: "Fence",
        snap: 1
    },
    flower: {
        file: "./models/flower_pot.obj",
        scale: 0.82,
        size: {w: 0.72, d: 0.72},
        label: "Flower"
    },
    mushroom: {
        file: "./models/Mushroom_1.obj",
        alternates: ["./models/Mushroom_1.obj", "./models/Mushroom_2.obj", "./models/Mushroom_3.obj"],
        scale: 8.2,
        size: {w: 0.78, d: 0.78},
        label: "Mushroom"
    },
    grass: {
        file: "./models/Grass.obj",
        scale: 0.014,
        size: {w: 0.28, d: 0.28},
        label: "Grass",
        normalize: true
    },
    roses: {
        file: "./models/ObjRoses.obj",
        scale: 0.19,
        size: {w: 5.4, d: 2.35},
        label: "Roses",
        normalize: true
    }
};

export async function loadAssetPrototypes(materials) {
    const objLoader = new OBJLoader();
    const prototypes = new Map();
    const entries = Object.entries(assetDefs);

    const loadJobs = entries.map(async ([type, def]) => {
        if (type === "mushroom") {
            const alternates = await Promise.all(def.alternates.map((file) => loadModel(objLoader, file, type, def, materials)));
            prototypes.set(type, alternates);
            return;
        }

        const model = await loadModel(objLoader, def.file, type, def, materials);
        prototypes.set(type, model);
    });

    await Promise.all(loadJobs);
    return prototypes;
}

export function getPrototype(prototypes, type) {
    const prototype = prototypes.get(type);
    if (Array.isArray(prototype)) {
        return prototype[Math.floor(Math.random() * prototype.length)];
    }
    return prototype;
}

export function cloneModelMaterials(root) {
    root.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        child.material = Array.isArray(child.material)
            ? child.material.map((material) => material.clone())
            : child.material.clone();
    });
}

export function randomizeFlower(root) {
    const colors = ["#f2c94c", "#f29c50", "#e85d75", "#c86de0", "#ffffff"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    root.traverse((child) => {
        if (!child.isMesh) return;
        const name = child.name.toLowerCase();
        if (name.includes("bloom")) child.material.color.set(color);
        if (name.includes("pot")) child.material.color.offsetHSL(0, 0, Math.random() * 0.08 - 0.04);
    });
}

export function randomizeTree(root) {
    root.traverse((child) => {
        if (child.isMesh && child.material?.userData.kind === "treeLeaves") {
            child.material.color.offsetHSL(Math.random() * 0.04 - 0.02, Math.random() * 0.08 - 0.03, Math.random() * 0.08 - 0.04);
        }
    });
}

export function randomizeMushroom(root) {
    root.traverse((child) => {
        if (child.isMesh) child.material.color.offsetHSL(Math.random() * 0.08 - 0.04, 0, Math.random() * 0.14 - 0.06);
    });
}

export function randomizeGrass(root) {
    root.traverse((child) => {
        if (child.isMesh) {
            child.material.color.offsetHSL(Math.random() * 0.05 - 0.025, Math.random() * 0.12 - 0.03, Math.random() * 0.16 - 0.08);
        }
    });
}

function loadModel(objLoader, file, type, def, materials) {
    return new Promise((resolve, reject) => {
        objLoader.load(file, (object) => {
            object.scale.setScalar(def.scale);
            if (def.normalize) normalizeModelGeometry(object, def.scale);
            prepareModel(object, type, materials);
            resolve(object);
        }, undefined, reject);
    });
}

function normalizeModelGeometry(object, scale) {
    const bounds = new THREE.Box3().setFromObject(object);
    const center = bounds.getCenter(new THREE.Vector3());
    const xShift = -center.x / scale;
    const yShift = -bounds.min.y / scale;
    const zShift = -center.z / scale;

    object.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry.translate(xShift, yShift, zShift);
    });
}

function prepareModel(object, type, materials) {
    object.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        child.geometry.computeVertexNormals();
        addAmbientUV(child.geometry);
        child.material = remapMaterial(type, child.name, child.material, materials);
    });
}

function addAmbientUV(geometry) {
    if (!geometry.attributes.uv || geometry.attributes.uv2) return;
    geometry.setAttribute("uv2", new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
}

function remapMaterial(type, meshName, sourceMaterial, materials) {
    if (Array.isArray(sourceMaterial)) {
        return sourceMaterial.map((material) => getMaterialForMesh(type, meshName, material.name, materials).clone());
    }
    return getMaterialForMesh(type, meshName, sourceMaterial?.name || "", materials).clone();
}

function getMaterialForMesh(type, name, materialName, materials) {
    const meshName = name.toLowerCase();
    const material = materialName.toLowerCase();
    if (type === "bench") return materials.bench;
    if (type === "lamp") return materials.lamp;
    if (type === "tree") return getTreeMaterial(meshName, material, materials);
    if (type === "fence") return materials.wood;
    if (type === "flower" && meshName.includes("pot")) return materials.terracotta;
    if (type === "flower" && meshName.includes("soil")) return materials.dirt;
    if (type === "flower" && meshName.includes("stem")) return materials.flowerStem;
    if (type === "flower" && meshName.includes("bloom")) return materials.flowerBloom;
    if (type === "mushroom") return materials.mushroom;
    if (type === "grass") return materials.grassBlade;
    if (type === "roses") return getRoseMaterial(material, materials);
    return materials.wood;
}

function getRoseMaterial(material, materials) {
    if (material.includes("flower")) return materials.rosePetal;
    if (material.includes("leaf")) return materials.roseLeaf;
    if (material.includes("rosered1shader")) return materials.roseStem;
    if (material.includes("lambert2")) return materials.roseSoil;
    if (material.includes("lambert3") || material.includes("lambert4")) return materials.rosePlanter;
    return materials.rosePlanter;
}

function getTreeMaterial(meshName, material, materials) {
    const key = `${meshName} ${material}`;
    if (key.includes("leaves")) return materials.treeLeaves;
    if (key.includes("twigs")) return materials.treeTwigs;
    if (key.includes("trunk") || key.includes("limbs") || key.includes("branches")) return materials.treeBark;
    return materials.treeBark;
}
