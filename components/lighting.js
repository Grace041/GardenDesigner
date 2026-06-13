import * as THREE from "../build/three.module.js";

export class LightingController {
    constructor(scene, state, materials, renderer) {
        this.state = state;
        this.materials = materials;
        this.renderer = renderer;

        this.ambientLight = new THREE.HemisphereLight("#eaf7ff", "#4b5b35", 1.15);
        scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight("#fff0cc", state.sunStrength);
        this.sunLight.position.set(-8, 14, 8);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(2048, 2048);
        this.sunLight.shadow.camera.left = -24;
        this.sunLight.shadow.camera.right = 24;
        this.sunLight.shadow.camera.top = 24;
        this.sunLight.shadow.camera.bottom = -24;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 60;
        scene.add(this.sunLight);

        this.moonLight = new THREE.DirectionalLight("#97b7ff", 0);
        this.moonLight.position.set(8, 12, -10);
        scene.add(this.moonLight);
    }

    update(scene, placed) {
        const night = this.state.time === "night";
        this.sunLight.intensity = night ? this.state.sunStrength * 0.08 : this.state.sunStrength;
        this.moonLight.intensity = night ? 0.62 : 0;
        this.ambientLight.intensity = night ? 0.32 : 1.15;
        this.materials.lamp.emissiveIntensity = night ? 1.4 : 0.15;
        this.renderer.toneMappingExposure = night ? 0.9 : 1.05;
        scene.background = new THREE.Color(night ? "#111827" : "#b9d7ed");
        scene.fog = new THREE.Fog(night ? "#111827" : "#b9d7ed", night ? 18 : 28, night ? 48 : 65);

        placed.forEach((item) => {
            if (item.light) item.light.intensity = night ? 2.8 : 0;
            if (item.type === "lamp") {
                item.root.traverse((child) => {
                    if (child.isMesh && child.material && "emissiveIntensity" in child.material) {
                        child.material.emissiveIntensity = night ? 1.4 : 0.15;
                    }
                });
            }
        });
    }
}
