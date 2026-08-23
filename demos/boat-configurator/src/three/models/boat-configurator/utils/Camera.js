import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {
	constructor(application) {
		this.application = application
		this.sizes = application.sizes
		this.scene = application.scene
		this.canvas = application.canvas

		this.cameraZPos = 1
		this.defaultValues = {
			minDistance: 1.3,
			maxDistance: 6,
			position: {
				x: -1.5,
				z: -1,
				y: 1
			}
		}

		this.setInstance()
		this.setOrbitControls()
	}

	setInstance() {
		this.instance = new THREE.PerspectiveCamera(45, this.sizes.aspect, 0.1, 100)
		// this.instance.position.x = -1.5;
		// this.instance.position.z = -1;
		// this.instance.position.y = 1;

		// this.instance.position.set(-2, 3, 6)
		this.instance.position.set(4, 3, 6)

		if (window.innerWidth < 600) {
			// this.instance.position.set(-2, 3, 12)
			this.instance.position.set(4, 5, 15)
		}
	}


	setOrbitControls() {
		this.controls = new OrbitControls(this.instance, this.canvas)
		// this.controls.enableDamping = true
		this.controls.target.set(0, 1, 0)
		this.controls.enabled = true
		// TODO uncomment under line
		this.controls.enablePan = false;
		// this.controls.enableZoom = true;
		// this.controls.enableDamping = false;
		// this.controls.enableRotate = false;
		// Zoom in / zoom out

		this.controls.minDistance = 5
		this.controls.maxDistance = window.innerWidth < 600 ? 20 : 15
		// Where to stop rotation :

		this.controls.minPolarAngle = 0.2 // radians
		this.controls.maxPolarAngle = Math.PI / 2 - 0.05
	}

	resize() {
		this.instance.aspect = this.sizes.aspect
		this.instance.updateProjectionMatrix()
	}

	update() {
		if (this.controls && this.controls.update) this.controls.update()
	}
}
