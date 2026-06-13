import * as THREE from "/build/three.module.js"

export let scene;
export let camera;
export let renderer;

export const CLOCK = new THREE.Clock();

export function setScene() {
    scene = new THREE.Scene();
    const renderView = document.querySelector(".render-view");
    const aspectRatio = renderView.clientWidth / renderView.clientHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);

    camera.position.set(9, 10, 14);
    camera.lookAt(0,0,0);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(renderView.clientWidth, renderView.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    scene.background = new THREE.Color("#b9d7ed");
    scene.fog = new THREE.Fog("#b9d7ed", 28, 65);
    renderView.appendChild(renderer.domElement);
}

export function setSceneElements() {
}

export function setSceneLighting() {
    scene.add(camera);
}

//Event Listeners
function resize() {
    if(!renderer || !camera) return;
    const renderView = document.querySelector(".render-view");
    const width = renderView.clientWidth;
    const height = renderView.clientHeight;
    renderer.setSize(width,height);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
