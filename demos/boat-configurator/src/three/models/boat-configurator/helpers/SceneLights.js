import * as THREE from "three";
// import { GUI } from 'dat.gui';

export default class SceneLights {
  constructor(application) {
    this.application = application;
    this.scene = application.scene;
    this.lightsList = [];

    this.initializeLights();
  }

  getlLights(options = {}) {
    const SHADOW_SIZE = 2048;
    const pos = options.position || {
      x: 0,
      y: 0,
      z: 0,
    };
    const light = options.type || new THREE.DirectionalLight();
    light.intensity = options.intensity || 10;
    light.color = new THREE.Color(options.color || 0xffffff);
    light.castShadow = true;
    light.shadow.bias = -0.003;
    light.shadow.mapSize.set(SHADOW_SIZE, SHADOW_SIZE);
    light.shadow.camera.far = 10;
    light.shadow.camera.near = 0.05;
    light.shadow.camera.top = 5;
    light.shadow.camera.right = 5;
    light.shadow.camera.left = -5;
    light.shadow.camera.bottom = -5;
    light.position.set(pos.x, pos.y, pos.z);
    light.lookAt(0, 0, 0);
    return light;
  }

  initializeLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    const directionLight = this.getlLights({
      position: { x: 0, y: 3.5, z: 0 },
      intensity: 0.7,
    });

    this.scene.add(directionLight);

    const pointLight = this.getlLights({
      type: new THREE.PointLight(),
      position: { x: 0, y: -0.5, z: 5 },
      intensity: 0.5,
    });
    pointLight.castShadow = false;

    this.scene.add(pointLight);

    const pointLight2 = this.getlLights({
      type: new THREE.PointLight(),
      position: { x: 0, y: -0.5, z: -5 },
      intensity: 0.5,
    });
    pointLight2.castShadow = false;

    this.scene.add(pointLight2);
  }
}
