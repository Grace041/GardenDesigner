import * as THREE from "../build/three.module.js";

export function createMaterials(renderer) {
    const textureLoader = new THREE.TextureLoader();
    const textures = makeTextures(textureLoader, renderer);
    return makeMaterials(textures);
}

function makeTextures(textureLoader, renderer) {
    const benchAlbedo = loadTexture(textureLoader, renderer, "./image/texture/wooden_bench/wooden_bench_Albedo.png", true);
    const benchRoughness = loadTexture(textureLoader, renderer, "./image/texture/wooden_bench/wooden_bench_Roughness.png", false);
    const benchMetal = loadTexture(textureLoader, renderer, "./image/texture/wooden_bench/wooden_bench_Metallic.png", false);
    const benchAO = loadTexture(textureLoader, renderer, "./image/texture/wooden_bench/wooden_bench_AO.png", false);
    const benchNormal = loadTexture(textureLoader, renderer, "./image/normal/wooden_bench_Normal.png", false);

    const lampBase = loadTexture(textureLoader, renderer, "./image/texture/lamp/lamp_basecolor.png", true);
    const lampRoughness = loadTexture(textureLoader, renderer, "./image/texture/lamp/lamp_roughness.png", false);
    const lampMetal = loadTexture(textureLoader, renderer, "./image/texture/lamp/lamp_metalness.png", false);
    const lampAO = loadTexture(textureLoader, renderer, "./image/texture/lamp/lamp_ao.png", false);
    const lampNormal = loadTexture(textureLoader, renderer, "./image/normal/lamp_normal.png", false);
    const lampEmissive = loadTexture(textureLoader, renderer, "./image/texture/lamp/lamp_emissive.png", true);

    const roseStone = loadTexture(textureLoader, renderer, "./image/texture/flower_bed/america014.jpg", true);
    const roseStoneBump = loadTexture(textureLoader, renderer, "./image/texture/flower_bed/america014b.jpg", false);
    const roseSoil = loadTexture(textureLoader, renderer, "./image/texture/flower_bed/GRAS01L.JPG", true);
    const roseSoilBump = loadTexture(textureLoader, renderer, "./image/texture/flower_bed/GRAS01LB.JPG", false);
    const rosePetal = loadTexture(textureLoader, renderer, "./image/texture/flower_bed/whitePetalHC.jpg", true);
    const floorGrass = loadTexture(textureLoader, renderer, "./image/texture/grass.jpeg", true);
    const treeBark = loadTexture(textureLoader, renderer, "./image/texture/GenTree/GenTree_1_Trunk_Limbs_AE3D_03312023-A-DIFFUSE.png", true);
    const treeBarkNormal = loadTexture(textureLoader, renderer, "./image/normal/GenTree_1_Trunk_Limbs_AE3D_03312023-A-NORMAL.png", false);
    const treeBarkBump = loadTexture(textureLoader, renderer, "./image/texture/GenTree/GenTree_1_Trunk_Limbs_AE3D_03312023-A-HEIGHT.png", false);
    const treeTwigs = loadTexture(textureLoader, renderer, "./image/texture/GenTree/GenTree_1_Twigs_AE3D_03312023-A-DIFFUSE.png", true);
    const treeLeaves = loadTexture(textureLoader, renderer, "./image/texture/GenTree/Maple_AE3D_03272021-A2-50pc.png", true);

    roseStone.repeat.set(2.5, 1.4);
    roseStoneBump.repeat.set(2.5, 1.4);
    roseSoil.repeat.set(5, 2);
    roseSoilBump.repeat.set(5, 2);
    rosePetal.repeat.set(1, 1);
    floorGrass.repeat.set(1, 1);
    treeBark.repeat.set(1, 1);
    treeBarkNormal.repeat.set(1, 1);
    treeBarkBump.repeat.set(1, 1);
    treeTwigs.repeat.set(1, 1);
    treeLeaves.repeat.set(1, 1);

    return {
        benchAlbedo,
        benchRoughness,
        benchMetal,
        benchAO,
        benchNormal,
        lampBase,
        lampRoughness,
        lampMetal,
        lampAO,
        lampNormal,
        lampEmissive,
        roseStone,
        roseStoneBump,
        roseSoil,
        roseSoilBump,
        rosePetal,
        treeBark,
        treeBarkNormal,
        treeBarkBump,
        treeTwigs,
        treeLeaves,
        grass: floorGrass,
        grassNormal: makeCanvasTexture(renderer, "grassNormal"),
        dirt: makeCanvasTexture(renderer, "dirt"),
        dirtNormal: makeCanvasTexture(renderer, "dirtNormal"),
        wood: makeCanvasTexture(renderer, "wood"),
        woodNormal: makeCanvasTexture(renderer, "woodNormal")
    };
}

function loadTexture(textureLoader, renderer, path, colorTexture) {
    const texture = textureLoader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    if (colorTexture) texture.encoding = THREE.sRGBEncoding;
    return texture;
}

function makeCanvasTexture(renderer, kind) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    if (kind === "grass" || kind === "grassNormal") {
        ctx.fillStyle = kind === "grass" ? "#5f8f43" : "#8080ff";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 900; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const length = 3 + Math.random() * 12;
            ctx.strokeStyle = kind === "grass"
                ? (Math.random() > 0.5 ? "#8ec36b" : "#416f35")
                : `rgb(${120 + Math.random() * 20},${120 + Math.random() * 20},255)`;
            ctx.globalAlpha = 0.35 + Math.random() * 0.35;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.random() * 5 - 2.5, y - length);
            ctx.stroke();
        }
    }

    if (kind === "dirt" || kind === "dirtNormal") {
        ctx.fillStyle = kind === "dirt" ? "#6f4a2e" : "#8080ff";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1500; i++) {
            const shade = kind === "dirt" ? 45 + Math.random() * 65 : 118 + Math.random() * 22;
            ctx.fillStyle = kind === "dirt"
                ? `rgb(${shade + 42},${shade * 0.72},${shade * 0.45})`
                : `rgb(${shade},${shade},255)`;
            ctx.globalAlpha = 0.25 + Math.random() * 0.45;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3);
        }
    }

    if (kind === "wood" || kind === "woodNormal") {
        ctx.fillStyle = kind === "wood" ? "#8a6040" : "#8080ff";
        ctx.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 9) {
            ctx.strokeStyle = kind === "wood"
                ? (y % 18 === 0 ? "#a4744e" : "#60442d")
                : (y % 18 === 0 ? "#9090ff" : "#7474ff");
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y + Math.sin(y) * 2);
            ctx.bezierCurveTo(70, y + 7, 150, y - 7, 256, y + Math.cos(y) * 2);
            ctx.stroke();
        }
    }

    ctx.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    if (!kind.includes("Normal")) texture.encoding = THREE.sRGBEncoding;
    return texture;
}

function makeMaterials(maps) {
    return {
        ground: new THREE.MeshStandardMaterial({
            map: maps.grass,
            normalMap: maps.grassNormal,
            normalScale: new THREE.Vector2(0.45, 0.45),
            roughness: 0.95
        }),
        dirt: new THREE.MeshStandardMaterial({
            map: maps.dirt,
            normalMap: maps.dirtNormal,
            normalScale: new THREE.Vector2(0.28, 0.28),
            roughness: 0.9
        }),
        wood: new THREE.MeshStandardMaterial({
            map: maps.wood,
            normalMap: maps.woodNormal,
            normalScale: new THREE.Vector2(0.4, 0.4),
            roughness: 0.74
        }),
        bench: new THREE.MeshStandardMaterial({
            map: maps.benchAlbedo,
            roughnessMap: maps.benchRoughness,
            metalnessMap: maps.benchMetal,
            aoMap: maps.benchAO,
            normalMap: maps.benchNormal,
            normalScale: new THREE.Vector2(0.72, 0.72),
            roughness: 0.82,
            metalness: 0.08
        }),
        lamp: new THREE.MeshStandardMaterial({
            map: maps.lampBase,
            roughnessMap: maps.lampRoughness,
            metalnessMap: maps.lampMetal,
            aoMap: maps.lampAO,
            normalMap: maps.lampNormal,
            emissiveMap: maps.lampEmissive,
            emissive: new THREE.Color("#ffd58a"),
            emissiveIntensity: 0.15,
            normalScale: new THREE.Vector2(0.4, 0.4),
            roughness: 0.45,
            metalness: 0.75
        }),
        treeBark: withKind(new THREE.MeshStandardMaterial({
            map: maps.treeBark,
            normalMap: maps.treeBarkNormal,
            bumpMap: maps.treeBarkBump,
            normalScale: new THREE.Vector2(0.62, 0.62),
            bumpScale: 0.035,
            roughness: 0.78
        }), "treeBark"),
        treeTwigs: withKind(new THREE.MeshStandardMaterial({
            map: maps.treeTwigs,
            color: "#8b6a47",
            roughness: 0.8
        }), "treeTwigs"),
        treeLeaves: withKind(new THREE.MeshStandardMaterial({
            map: maps.treeLeaves,
            color: "#79a64a",
            roughness: 0.82,
            alphaTest: 0.32,
            transparent: true,
            side: THREE.DoubleSide
        }), "treeLeaves"),
        terracotta: new THREE.MeshStandardMaterial({color: "#a9583b", roughness: 0.88}),
        flowerStem: new THREE.MeshStandardMaterial({color: "#3f8c45", roughness: 0.8}),
        flowerBloom: new THREE.MeshStandardMaterial({color: "#f3c453", roughness: 0.6}),
        mushroom: new THREE.MeshStandardMaterial({color: "#d85d4c", roughness: 0.76}),
        grassBlade: new THREE.MeshStandardMaterial({
            color: "#3f9a36",
            roughness: 0.78,
            side: THREE.DoubleSide
        }),
        rosePlanter: new THREE.MeshStandardMaterial({
            map: maps.roseStone,
            bumpMap: maps.roseStoneBump,
            bumpScale: 0.08,
            color: "#d6d1c5",
            roughness: 0.86
        }),
        roseSoil: new THREE.MeshStandardMaterial({
            map: maps.roseSoil,
            bumpMap: maps.roseSoilBump,
            bumpScale: 0.1,
            color: "#415637",
            roughness: 0.96
        }),
        roseStem: new THREE.MeshStandardMaterial({color: "#155f18", roughness: 0.72}),
        roseLeaf: new THREE.MeshStandardMaterial({color: "#1f8e24", roughness: 0.76}),
        rosePetal: new THREE.MeshStandardMaterial({
            map: maps.rosePetal,
            color: "#ff2a12",
            roughness: 0.54,
            side: THREE.DoubleSide
        })
    };
}

function withKind(material, kind) {
    material.userData.kind = kind;
    return material;
}
