// @ts-nocheck

import PlanetSlice from "@/game/game/entities/planet-slice";
import { State } from "@/game/game/state";
import { PHYSIC } from "@/game/utils/constants";

export default class PlanetTest extends Phaser.GameObjects.Image {
	private point: number;
	private gameState: State;
	private id: number;

	constructor(scene: Phaser.Scene, texture: string, point: number, id: number) {
		super(
			scene,
			Phaser.Math.Between(PHYSIC.PLANET.minX, PHYSIC.PLANET.maxX),
			PHYSIC.PLANET.y,
			texture
		);

		this.point = point;
		this.gameState = new State();
		this.id = id;

		this.x = 400;
		this.y = 400;

		this.scene.add.existing(this);

		this.setScale(PHYSIC.PLANET.scale[id], PHYSIC.PLANET.scale[id]);
	}

	jump() {
		this.body.isCircle = true;
		this.body.setAllowGravity(false);
		// this.body.setVelocity(
		// 	Phaser.Math.Between(-PHYSIC.PLANET.radius, PHYSIC.PLANET.radius),
		// 	Phaser.Math.Between(PHYSIC.PLANET.maxVelocityY, PHYSIC.PLANET.minVelocityY)
		// );

		// this.body.setAngularAcceleration(
		// 	Phaser.Math.Between(-PHYSIC.PLANET.radius, PHYSIC.PLANET.radius)
		// );
	}

	divide(angle) {
		const velocity = this.body?.velocity;
		const deg = Phaser.Math.RadToDeg(angle);

		let startTan, endTan;
		let velocityXOne, velocityXTwo, velocityYOne, velocityYTwo;

		if (deg < 0) {
			startTan = Math.PI * 2 + angle;

			endTan = startTan - Math.PI;
		} else {
			startTan = angle;

			endTan = startTan + Math.PI;
		}

		const slice2 = new PlanetSlice(
			this.scene,
			this.x,
			this.y,
			startTan,
			endTan,
			true,
			this.texture,
			this.id,
			'planet-core2'
		);

		const slice1 = new PlanetSlice(
			this.scene,
			this.x,
			this.y,
			startTan,
			endTan,
			false,
			this.texture,
			this.id,
			'planet-core1'
		);

		velocityXOne = 50 * Math.sin(angle) * -15;
		velocityXTwo = 50 * Math.sin(angle) * 15;
		velocityYOne = 25 * Math.cos(angle) * 15;
		velocityYTwo = 25 * Math.cos(angle) * -15;

		slice1.setVelocity(velocityXOne, velocityYOne);
		slice2.setVelocity(velocityXTwo, velocityYTwo);

		this.scene.time.delayedCall(4000, () => {
			slice1.destroyAll();
			slice2.destroyAll();
		});
	}
}
