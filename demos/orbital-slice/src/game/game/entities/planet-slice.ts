// @ts-nocheck

import { PHYSIC, SPRITE } from "@/game/utils/constants";

export default class PlanetSlice extends Phaser.GameObjects.Image {
	startAngle: number;
	endAngle: number;
	anticlockwise: boolean;
	maskPlaceholder: Phaser.GameObjects.Graphics | undefined;
	core: Phaser.GameObjects.Image | undefined;
	planetCore: string;
	id: number;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		startAngle: number,
		endAngle: number,
		anticlockwise: boolean,
		texture: Phaser.Textures.Texture | string,
		id: number,
		planetCore: string,
		scale: number
	) {
		super(scene, x, y, texture);

		this.startAngle = startAngle;
		this.endAngle = endAngle;
		this.anticlockwise = anticlockwise;
		this.planetCore = planetCore;
		this.id = id;

		this.scene.add.existing(this);

		this.init();
		this.scale = scale
		this.setScaleAll();
	}

	init() {
		this.scene.physics.add.existing(this);

		this.core = this.scene.add.image(this.x, this.y, this.planetCore);

		this.core.setRotation(this.startAngle - Math.PI / 2);

		if (this.planetCore === SPRITE.CORE2) {
			this.core.setFlipX(true);
		}

		this.maskPlaceholder = this.scene.add
			.graphics({ x: this.x, y: this.y })
			.fillStyle(0xffffff, 0)
			.arc(0, 0, PHYSIC.PLANET.radius, this.startAngle, this.endAngle, this.anticlockwise)
			.closePath()
			.fill();

		this.mask = this.maskPlaceholder?.createGeometryMask();

		this.scene.physics.add.existing(this.maskPlaceholder);
		this.scene.physics.add.existing(this.core);
	}

	setScaleAll() {
		this.setScale(this.scale);
		this.core.setScale(this.scale);
		this.maskPlaceholder.setScale(this.scale);
	}

	setVelocity(x: number, y: number) {
		this.body.setVelocity(x, y);
		this.maskPlaceholder?.body.setVelocity(x, y);
		this.core?.body.setVelocity(x, y);

		this.setGravityY(650);
	}

	setGravityY(y: number) {
		this.body.setGravityY(y);
		this.maskPlaceholder?.body.setGravityY(y);
		this.core?.body.setGravityY(y);
	}

	destroyAll() {
		this.destroy();
		this.maskPlaceholder?.destroy();
		this.core?.destroy();
	}
}
