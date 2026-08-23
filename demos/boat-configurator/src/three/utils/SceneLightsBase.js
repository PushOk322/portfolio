import * as THREE from 'three'

export default class SceneLightsBase {
  constructor() {
    this.lightsList = []
    this.defaultBias = -0.003
    this.SHADOW_SIZE = 1024
  }

  getDirectionalLights(options = {}) {
    const light = new THREE.DirectionalLight()
    return this.setDefaultLightValues(light, options)
  }

  getPointLights(options = {}) {
    const light = new THREE.PointLight()
    return this.setDefaultLightValues(light, options)
  }

  setDefaultLightValues(light, options) {
    const pos = options.position || {
      x: 0,
      y: 0,
      z: 0,
    }
    light.color = new THREE.Color(options.color || 0xffffff)
    light.position.set(pos.x, pos.y, pos.z)
    light.intensity = options.intensity || 1
    light.castShadow =
      options.castShadow !== undefined
        ? options.castShadow
        : false
    light.shadow.bias = this.defaultBias
    light.shadow.mapSize.set(this.SHADOW_SIZE, this.SHADOW_SIZE)
    light.shadow.camera.far = 10
    light.shadow.camera.near = 0
    light.shadow.camera.top = 10
    light.shadow.camera.right = 10
    light.shadow.camera.left = -10
    light.shadow.camera.bottom = -10
    light.lookAt(0, 0, 0)
    return light
  }

  initializeLights() {
    throw new Error('method "initializeLights" not implemented')
  }
}
