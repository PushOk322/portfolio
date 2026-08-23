import { ThreejsApplication } from '@/three'
import ModelLoader from '@/three/gltf-loader'
import AnnotationMaker from '@/three/utils/AnnotationMaker'
import Sizes from '@/three/utils/Sizes'
import useModelsUtils from '@/three/utils/use-models-utils'
import { gsap } from 'gsap/gsap-core'
import * as THREE from 'three'
import SceneLights from './helpers/SceneLights'
import Camera from './utils/Camera.js'
import Renderer from './utils/Renderer.js'
// import { GUI } from "dat.gui";

let instance = null
const { disposeSceneData, setAnimation } = useModelsUtils()

export default class BoatApplication extends ThreejsApplication {
	constructor(eventEmitter) {
		super()

		if (instance) return instance
		instance = this

		this.camera = null
		this.scene = new THREE.Scene()
		this.renderer = null
		this.debugObject = {}
		this.canvas = null
		this.canvasDomElement = null
		this.loadedModel = null
		this.editMode = false
		this.eventEmitter = eventEmitter
		this.raycaster = new THREE.Raycaster()
		this.pointer = new THREE.Vector2()
		this.textureLoader = new THREE.TextureLoader()
		this.intersected = null
		this.intersects = []
		this.canIntersect = true
		this.showRangeMaterialList = false
		this.sizes = null
		this.annotation = null
		this.colors = {}
		this.oldTexturePath = null
		this.onConsole = false
		this.onBoat = true
		// this.gui = new GUI();
		this.sceneLights = null
	}

	async build(canvas, canvasDomElement) {
		this.canvas = canvas
		this.canvasDomElement = canvasDomElement
		this.sizes = new Sizes(canvasDomElement)

		this.annotation = new AnnotationMaker(canvasDomElement, this)
		this.loader = new ModelLoader(this)

		this.camera = new Camera(this)
		this.renderer = new Renderer(this)
		this.sceneLights = new SceneLights(this)
		// resize event
		this.resize()
		this.sizes.subscribe('resize', () => {
			this.resize()
		})
	}

	/**
	 * INITIALIZATION
	 */
	animateFrame() {
		setAnimation(this)
		if (this.annotation && this.annotation.points.length) {
			this.annotation.calculatePointPosition()
		}
	}

	resize() {
		this.camera.resize()
		this.renderer.resize()
	}

	/**
	 * LOAD MODEL
	 */
	async initGLTFLoader() {
		const url = './models/boat-4.glb'

		this.loadedModel = await this.loader.initGLTFLoader(url)
		this.scene.add(this.loadedModel.scene)

		// const engine = await loader.initGLTFLoader('./models/engine.glb');
		// this.scene.add(engine.scene)

		this.scene.traverse((el) => {
			if (el.name === 'engine-point') {
				this.enginePoint = el
			}
			if (el.isMesh) {
				el.castShadow = true
				el.receiveShadow = true
				this.colors[el.name] = el.material.color
			}
		})

		this.toggleElectricAnchor(false)

		this.setModelTexture({
			objName: 'inner-carpet',
			texture: 'carpet',
			color: '#4e4e4e'
		})
	}

	async setEngine(enginePath) {
		this.scene.traverse?.((el) => {
			if (el.name.includes('engine-scene')) {
				this.scene.remove(el)
			}
		})

		let engineAttachment
		const engine = await this.loader.initGLTFLoader(enginePath)
		if (engine) {
			engine.scene.traverse((el) => {
				if (el.name.includes('engine-attachment')) {
					engineAttachment = el
				}
			})
			engine.scene.name = 'engine-scene'

			const enginePos = this.enginePoint?.position
			if (engineAttachment && this.enginePoint) {
				engineAttachment.position.set(enginePos.x, enginePos.y, enginePos.z)
			}
			this.scene.add(engine.scene)
		}
	}

	setColor(objName, color) {
		if (!this.loadedModel) {
			throw Error('No model provided')
		}

		this.loadedModel.scene.traverse((el) => {
			if (!el.name.includes(objName)) {
				return
			}

			let defaultColor

			for (const key in this.colors) {
				if (key.includes(objName)) {
					defaultColor = this.colors[key]
				}
			}

			if (el.material?.uniforms) {
				el.material.uniforms.color1.value = new THREE.Color(color || defaultColor)
			} else {
				el.material.color = new THREE.Color(color || defaultColor)
			}
			el.material.needsUpdate = true
		})
	}

	setModelTexture({ objName = 'boat-inner', texture, color = '#4e4e4e', multiplier = 100 }) {
		const multiplierValue = 100 / multiplier
		const textures = {
			normal: null,
			aoMap: null
		}
		let defaultColor

		if (texture) {
			textures.normal = this.textureLoader.load(`./textures/${texture}/normal_map.jpg`)
			textures.aoMap = this.textureLoader.load(`./textures/${texture}/ao_map.jpg`)
		}

		for (const key in this.colors) {
			if (key.includes(objName)) {
				defaultColor = this.colors[key]
			}
		}

		for (const item in textures) {
			if (textures[item]) {
				textures[item] = this.setTextureSettings(textures[item], {
					multiplier: multiplierValue
				})
			}
		}

		this.scene.traverse((el) => {
			if (el.name.includes(objName)) {
				el.material.aoMap = textures.aoMap || null
				el.material.normalMap = textures.normal || null
				el.material.color = new THREE.Color(color || defaultColor)
				el.material.roughness = 1.0
				el.material.metalness = 0.0
				el.material.needsUpdate = true
			}
		})
	}

	setTextureSettings(texture, settings = {}) {
		if (!texture) return

		texture.generateMipmaps = false
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping
		texture.colorSpace = THREE.SRGBColorSpace
		texture.repeat.set(1 * settings.multiplier || 1, 1 * settings.multiplier || 1)
		texture.flipY = false
		texture.rotation = settings.rotation || 0
		texture.center.set(settings.center || 1, settings.center || 1)
		texture.minFilter = THREE.LinearFilter
		texture.magFilter = THREE.LinearFilter
		return texture
	}

	setFillDeckColor(name, texturePath, multiplier = 100) {
		const multiplierValue = 100 / multiplier
		let mapTexture = null
		if (texturePath) {
			mapTexture = this.textureLoader.load(texturePath)
			mapTexture = this.setTextureSettings(mapTexture, {
				multiplier: multiplierValue,
				rotation: Math.PI / 2,
				center: 0.5
			})
		}

		this.scene.traverse((el) => {
			if (el.name.includes(name)) {
				el.material.map = mapTexture
				el.material.color = mapTexture ? new THREE.Color('white') : this.colors[el.name]
				el.material.needsUpdate = true
			}
		})
	}

	setDesign(texturePath, color) {
		if (!this.loadedModel) {
			throw Error('No model provided')
		}

		if (this.oldTexturePath !== texturePath) {
			this.oldTexturePath = texturePath

			let newMaterial
			let defaultColor

			for (const key in this.colors) {
				if (key.includes('board')) {
					defaultColor = this.colors[key]
				}
			}

			if (!texturePath) {
				newMaterial = new THREE.MeshStandardMaterial({
					color: new THREE.Color(color || defaultColor)
				})
			} else {
				const mapTexture = this.textureLoader.load(texturePath)
				mapTexture.generateMipmaps = false
				mapTexture.wrapS = mapTexture.wrapT = THREE.RepeatWrapping
				mapTexture.colorSpace = THREE.SRGBColorSpace
				mapTexture.flipY = false
				mapTexture.minFilter = THREE.LinearFilter
				mapTexture.magFilter = THREE.LinearFilter

				newMaterial = new THREE.ShaderMaterial({
					uniforms: {
						texture1: { type: 't', value: mapTexture },
						color1: { type: 'c', value: new THREE.Color(color || 0xffffff) },
						roughness: { type: 'f', value: 0.2 },
						metalness: { type: 'f', value: 1.82 },
						gamma: { type: 'f', value: 2.35 },
						lightColor: { value: new THREE.Color(0xffffff) },
						lightPosition: { value: new THREE.Vector3(3, 10, 3) }
					},
					vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
        
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
					fragmentShader: `
          uniform sampler2D texture1;
          uniform vec3 color1;
          uniform float roughness;
          uniform float metalness;
          uniform float gamma;
          uniform vec3 lightColor;
          uniform vec3 lightPosition;
        
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
        
          void main() {
            // Sample the texture
            vec4 texColor = texture2D(texture1, vUv);
            
            // Combine texture color with input color
            vec3 finalColor = mix(color1, texColor.rgb, texColor.a);
            
            // Basic ambient light approximation
            vec3 ambient = vec3(0.03);
            
            // Calculate diffuse lighting
            vec3 lightDir = normalize(lightPosition - vPosition);
            float diff = max(dot(vNormal, lightDir), 0.0);
            vec3 diffuse = finalColor * diff * (1.0 - metalness);
        
            // Specular lighting
            vec3 specular = mix(vec3(0.04), finalColor, metalness) * (1.0 - roughness);
        
            // Combine lighting
            vec3 color = ambient + diffuse + specular;
            
            // Apply gamma correction
            color = pow(color, vec3(1.0 / gamma));
            
            gl_FragColor = vec4(color, 1.0);
          }
        `,
					blending: THREE.NormalBlending,
					transparent: true
				})
			}

			this.loadedModel.scene.traverse((el) => {
				if (el.name.includes('board')) {
					// el.material.map = mapTexture;
					el.material = newMaterial
					el.material.aoMap = null
					el.material.normalMap = null
					el.material.needsUpdate = true
				}
			})
		}
	}
	
	moveCameraToConsole() {
		if (this.onBoat) {
			const animationDuration = 0.7
			this.prevCameraPos = { ...this.camera.instance.position }
			this.prevCameraTarget = { ...this.camera.controls.target }
			let cameraPos
			let cameraTarget

			this.scene.traverse((item) => {
				if (item.name === 'console-camera-position') {
					cameraPos = item.position
				}
				if (item.name === 'console-camera-target') {
					cameraTarget = item.position
				}
			})

			this.animPos = gsap.to(this.camera.instance.position, {
				x: cameraPos.x,
				y: cameraPos.y,
				z: cameraPos.z,
				duration: animationDuration,
				ease: '',
				onComplete: () => {
					this.camera.controls.enabled = false
					this.createEholotSegments()

					this.animPos = null
				}
			})

			this.animTarget = gsap.to(this.camera.controls.target, {
				x: cameraTarget.x,
				y: cameraTarget.y,
				z: cameraTarget.z,
				duration: animationDuration,
				ease: 'power1.out',
				onComplete: () => {
					this.animTarget = null
				}
			})
		}
	}

	moveCameraToBoat() {
		if (this.prevCameraPos) {
			const animationDuration = 0.5
			this.annotation.clearPoints()
			this.camera.controls.enabled = true

			gsap.to(this.camera.instance.position, {
				x: this.prevCameraPos.x,
				y: this.prevCameraPos.y,
				z: this.prevCameraPos.z,
				duration: animationDuration * 2,
				ease: 'power1.out'
			})
			gsap.to(this.camera.controls.target, {
				x: this.prevCameraTarget.x,
				y: this.prevCameraTarget.y,
				z: this.prevCameraTarget.z,
				duration: animationDuration * 2,
				ease: 'power1.out'
			})

			this.prevCameraPos = null
		}
	}

	createEholotSegments() {
		let segment1
		let segment2

		this.scene.traverse((item) => {
			if (item.name === 'console-model-1') {
				segment1 = item
			}

			if (item.name === 'console-model-2') {
				segment2 = item
			}
		})

		this.annotation.createPoint('segment-1', segment1.position, 'A')
		this.annotation.createPoint('segment-2', segment2.position, 'B')
	}

	toggleElectricAnchor(value) {
		const anchor = this.scene.getObjectByName('electric-anchor')

		if (!anchor) {
			console.error('Anchor is not defined')
			return
		}

		anchor.visible = value
	}

	clearScene() {
		while (this.scene.children.length > 0) {
			this.scene.remove(this.scene.children[0])
		}

		this.loadedModel = null
	}
}
