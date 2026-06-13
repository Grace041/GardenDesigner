import * as THREE from "/build/three.module.js";
import {scene, camera, renderer, setScene, setSceneElements, setSceneLighting, CLOCK} from "/setup.js";
import {OrbitControls} from "./build/controls/OrbitControls.js";
import {
    assetDefs,
    cloneModelMaterials,
    getPrototype,
    loadAssetPrototypes,
    randomizeFlower,
    randomizeGrass,
    randomizeMushroom,
    randomizeTree
} from "./components/assets.js";
import {LightingController} from "./components/lighting.js";
import {createMaterials} from "./components/materials.js";
import {GardenTerrain} from "./components/terrain.js";
import {canPlace, getFootprint, makePlacement} from "./components/placement.js";

setScene();
setSceneElements();
setSceneLighting();

const controls = new OrbitControls(camera, renderer.domElement);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const ui = {
    toolGrid: document.querySelector("#toolGrid"),
    rotateButton: document.querySelector("#rotateButton"),
    cursorButton: document.querySelector("#cursorButton"),
    scatterButton: document.querySelector("#scatterButton"),
    clearButton: document.querySelector("#clearButton"),
    status: document.querySelector("#statusText"),
    width: document.querySelector("#plotWidth"),
    depth: document.querySelector("#plotDepth"),
    terrain: document.querySelector("#terrainLift"),
    sun: document.querySelector("#sunStrength"),
    widthValue: document.querySelector("#plotWidthValue"),
    depthValue: document.querySelector("#plotDepthValue"),
    terrainValue: document.querySelector("#terrainLiftValue"),
    sunValue: document.querySelector("#sunStrengthValue"),
    timeButtons: document.querySelector("#timeButtons")
};

const state = {
    tool: "bench",
    rotationSteps: 0,
    plotWidth: Number(ui.width.value),
    plotDepth: Number(ui.depth.value),
    terrainLift: Number(ui.terrain.value),
    sunStrength: Number(ui.sun.value),
    time: "day",
    assetsReady: false,
    nextId: 1
};

const placed = [];
const materials = createMaterials(renderer);
const terrain = new GardenTerrain(scene, materials, state);
const lighting = new LightingController(scene, state, materials, renderer);

let prototypes = new Map();
let ghost = null;
let pointerDown = null;

terrain.build();
loadAssetPrototypes(materials).then((loadedPrototypes) => {
    prototypes = loadedPrototypes;
    state.assetsReady = true;
    setStatus("Ready");
    setTool("bench");
}).catch((error) => {
    console.error(error);
    setStatus("Model loading failed. Check the browser console.", true);
});

bindInterface();
renderer.setAnimationLoop(updateScene);

function bindInterface() {
    ui.toolGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-tool]");
        if (!button) return;
        setTool(button.dataset.tool);
    });

    ui.rotateButton.addEventListener("click", () => {
        state.rotationSteps = (state.rotationSteps + 1) % 4;
        updateGhostFromPointer();
        setStatus(`Rotation ${state.rotationSteps * 90} degrees`);
    });

    ui.cursorButton.addEventListener("click", () => setTool("remove"));
    ui.scatterButton.addEventListener("click", scatterGrass);
    ui.clearButton.addEventListener("click", clearGarden);

    ui.timeButtons.addEventListener("click", (event) => {
        const button = event.target.closest("[data-time]");
        if (!button) return;
        state.time = button.dataset.time;
        ui.timeButtons.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
        updateLighting();
    });

    const updateRange = () => {
        state.plotWidth = Number(ui.width.value);
        state.plotDepth = Number(ui.depth.value);
        state.terrainLift = Number(ui.terrain.value);
        state.sunStrength = Number(ui.sun.value);
        ui.widthValue.textContent = state.plotWidth;
        ui.depthValue.textContent = state.plotDepth;
        ui.terrainValue.textContent = state.terrainLift.toFixed(1);
        ui.sunValue.textContent = state.sunStrength.toFixed(1);
        terrain.build();
        terrain.updatePlacedObjects(placed, footprintFor);
        updateLighting();
        updateGhostFromPointer();
    };

    [ui.width, ui.depth, ui.terrain, ui.sun].forEach((range) => range.addEventListener("input", updateRange));

    renderer.domElement.addEventListener("pointermove", (event) => {
        updatePointer(event);
        updateGhostFromPointer();
    });
    renderer.domElement.addEventListener("pointerdown", (event) => {
        pointerDown = {x: event.clientX, y: event.clientY, button: event.button};
    });
    renderer.domElement.addEventListener("pointerup", (event) => {
        if (!pointerDown || pointerDown.button !== 0) return;
        const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
        pointerDown = null;
        if (moved > 5) return;
        updatePointer(event);
        handleCanvasClick();
    });
    renderer.domElement.addEventListener("pointerleave", () => {
        if (ghost) ghost.visible = false;
    });

    window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        if (key === "r") ui.rotateButton.click();
        if (event.key === "Escape") setTool("bench");
    });

    updateLighting();
}

function setTool(tool) {
    state.tool = tool;
    ui.toolGrid.querySelectorAll("[data-tool]").forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
    });

    if (tool === "remove") {
        removeGhost();
        setStatus("Cursor mode");
        return;
    }

    refreshGhost();
    setStatus(`${assetDefs[tool].label} selected`);
}

function refreshGhost() {
    removeGhost();
    if (!state.assetsReady || !prototypes.has(state.tool)) return;

    const source = getPrototype(prototypes, state.tool);
    ghost = source.clone(true);
    ghost.traverse((child) => {
        if (!child.isMesh) return;
        child.material = new THREE.MeshBasicMaterial({
            color: "#8ff07f",
            transparent: true,
            opacity: 0.46,
            depthWrite: false
        });
        child.castShadow = false;
        child.receiveShadow = false;
    });
    ghost.visible = false;
    scene.add(ghost);
}

function removeGhost() {
    if (!ghost) return;
    scene.remove(ghost);
    ghost = null;
}

function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function updateGhostFromPointer() {
    if (!ghost || state.tool === "remove") return;
    const point = getTerrainPointer();
    if (!point) {
        ghost.visible = false;
        return;
    }

    const placement = makePlacement(point, state.tool, state, terrain, assetDefs);
    ghost.position.set(placement.position.x, placement.position.y, placement.position.z);
    ghost.rotation.y = placement.rotationY;
    ghost.visible = true;

    const valid = canPlaceAt(state.tool, placement.position.x, placement.position.z, placement.rotationY);
    tintGhost(valid ? "#8ff07f" : "#ff705d");
}

function tintGhost(color) {
    if (!ghost) return;
    ghost.traverse((child) => {
        if (child.isMesh && child.material.color) child.material.color.set(color);
    });
}

function handleCanvasClick() {
    if (!state.assetsReady) return;

    if (state.tool === "remove") {
        removeObjectUnderPointer();
        return;
    }

    const point = getTerrainPointer();
    if (!point) return;
    const placement = makePlacement(point, state.tool, state, terrain, assetDefs);

    if (!canPlaceAt(state.tool, placement.position.x, placement.position.z, placement.rotationY)) {
        setStatus("Collision or outside plot", true);
        return;
    }

    placeObject(state.tool, placement.position, placement.rotationY);
}

function getTerrainPointer() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(terrain.mesh);
    return hits.length ? hits[0].point : null;
}

function placeObject(type, position, rotationY, randomize = false) {
    const source = getPrototype(prototypes, type);
    const root = source.clone(true);
    cloneModelMaterials(root);
    root.position.set(position.x, position.y, position.z);
    root.rotation.y = rotationY;

    if (randomize) {
        const scaleJitter = 0.85 + Math.random() * 0.32;
        root.scale.multiplyScalar(scaleJitter);
    }

    if (type === "flower") randomizeFlower(root);
    if (type === "grass") randomizeGrass(root);
    if (type === "tree") randomizeTree(root);
    if (type === "mushroom") randomizeMushroom(root);

    const item = {
        id: state.nextId++,
        type,
        root,
        rotationY,
        light: null
    };

    root.userData.placedId = item.id;
    root.traverse((child) => {
        child.userData.placedId = item.id;
    });

    if (type === "lamp") {
        const lampLight = new THREE.PointLight("#ffc56f", state.time === "night" ? 2.8 : 0, 10, 2);
        lampLight.position.set(0, 250, 0);
        root.add(lampLight);
        item.light = lampLight;
    }

    placed.push(item);
    scene.add(root);
    setStatus(`${assetDefs[type].label} placed`);
}

function removeObjectUnderPointer() {
    raycaster.setFromCamera(pointer, camera);
    const roots = placed.map((item) => item.root);
    const hits = raycaster.intersectObjects(roots, true);
    if (!hits.length) {
        setStatus("No object selected", true);
        return;
    }

    const placedId = hits[0].object.userData.placedId;
    const index = placed.findIndex((item) => item.id === placedId);
    if (index === -1) return;

    scene.remove(placed[index].root);
    placed.splice(index, 1);
    setStatus("Object removed");
}

function scatterGrass() {
    if (!state.assetsReady) return;
    let made = 0;
    let attempts = 0;
    const target = 36;

    while (made < target && attempts < 500) {
        attempts++;
        const x = THREE.MathUtils.randFloat(-state.plotWidth * 0.43, state.plotWidth * 0.43);
        const z = THREE.MathUtils.randFloat(-state.plotDepth * 0.43, state.plotDepth * 0.43);
        const rotationY = Math.floor(Math.random() * 4) * Math.PI * 0.5;
        if (!canPlaceAt("grass", x, z, rotationY)) continue;
        placeObject("grass", {x, y: terrain.heightAt(x, z), z}, rotationY, true);
        made++;
    }

    setStatus(`${made} random grass clumps placed`);
}

function clearGarden() {
    placed.forEach((item) => scene.remove(item.root));
    placed.length = 0;
    setStatus("Garden cleared");
}

function updateLighting() {
    lighting.update(scene, placed);
    setStatus(state.time === "night" ? "Night lighting" : "Day lighting");
}

function canPlaceAt(type, x, z, rotationY) {
    return canPlace(type, x, z, rotationY, state, placed, assetDefs);
}

function footprintFor(type, x, z, rotationY) {
    return getFootprint(type, x, z, rotationY, assetDefs);
}

function setStatus(message, isBad = false) {
    ui.status.textContent = message;
    ui.status.classList.toggle("bad", isBad);
}

function updateScene() {
    controls.update();
    if (ghost && ghost.visible) {
        const pulse = 0.055 * Math.sin(CLOCK.getElapsedTime() * 5);
        ghost.position.y = terrain.heightAt(ghost.position.x, ghost.position.z) + pulse;
    }
    renderer.render(scene, camera);
}
