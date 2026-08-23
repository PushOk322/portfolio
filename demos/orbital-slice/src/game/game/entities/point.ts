// @ts-nocheck

import { Space } from '../scenes/space';

export default class Point extends Phaser.GameObjects.Ellipse {
	scene: Space;
	active: boolean;

	constructor(scene: Space) {
		super(scene, 0, 0, 10, 10, 0xff0000);

		this.scene = scene;
		this.setActive(false)

		this.scene.add.existing(this);
		this.init();
	}

	init() {
		this.scene.physics.add.existing(this);

		this.body.setAllowGravity(false);
		this.body.isCircle = true;

		this.scene.input.on('pointermove', (e: { x: number; y: number; }) => {
			if (this.active) {
				this.x = e.x;
				this.y = e.y;
			}
		});

		this.scene.point = this;
	}

	setActive(value: boolean): void {
		this.active = value
		if (!this.active) {
			this.x = -1000
			this.y = -1000
		}
	}
}
