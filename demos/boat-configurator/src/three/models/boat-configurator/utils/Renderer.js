import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

export default class Renderer {
  constructor(application) {
    this.application = application;
    this.canvas = application.canvas;
    this.sizes = application.sizes;
    this.scene = application.scene;
    this.camera = application.camera;
    this.raycaster = application.raycaster;
    this.gui = application.gui;
    this.fps = 30;
    this.interval = 1000 / this.fps;
    this.then = Date.now();

    this.setRenderer();
  }

  setRenderer() {
    this.instance = new THREE.WebGLRenderer({
      alpha: true,
      canvas: this.canvas,
      powerPreference: "high-performance",
      antialias: true,
    });
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.shadowMap.needsUpdate = true;
    this.instance.toneMapping = THREE.LinearToneMapping;
    this.instance.toneMappingExposure = 0.5;
    this.instance.autoClear = false;
    this.instance.setClearColor(0xffffff, 1);
    this.instance.useLegacyLights = true;
    this.instance.physicallyCorrectLights = true;

    this.instance.outputColorSpace = THREE.SRGBColorSpace;

    this.loadEnv("./textures/lake_env.hdr");
  }

  loadEnv(file) {
    const generator = new THREE.PMREMGenerator(this.instance);
    new RGBELoader().load(file, (hdrmap) => {
      const envmap = generator.fromEquirectangular(hdrmap);
      envmap.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = envmap.texture;
      this.scene.environment.colorSpace = THREE.sRGBEncoding;
    });
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    if(window.innerWidth < 1024) {
      this.instance.setPixelRatio(2);
    } else {
      this.instance.setPixelRatio(1.5);
    }
  }

  update() {
    const now = Date.now();
    const elapsed = now - this.then;

    if (elapsed > this.interval) {
      this.instance.render(this.scene, this.camera.instance);
    }
  }
}
