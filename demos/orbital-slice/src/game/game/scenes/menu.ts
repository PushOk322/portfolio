import { gameState } from "@/game/game/state/state";
import { SCENE, TILE } from "@/game/utils/constants";

export class Menu extends Phaser.Scene {
	asteroids: Phaser.GameObjects.Particles.ParticleEmitter | undefined;
	private stars: Phaser.GameObjects.Particles.ParticleEmitter | undefined;

	constructor() {
		super(SCENE.MENU);

		gameState.setMenuScene(this)
	}

	create(): void {
		const { width, height } = this.scale;

		let starFrames = this.textures.get(TILE.STAR).getFrameNames();
		this.stars = this.add.particles(width / 2, height / 2, TILE.STAR, {
			frame: { frames: starFrames, cycle: true },
			quantity: 10,
			frequency: 250,
			lifespan: 3000,
			rotate: { start: 0, end: 100 },
			scale: { start: 0, end: 0.5 },
			alpha: { start: 1, end: 0 },
		});

		const starShape = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
		this.stars.addEmitZone({ type: 'random', source: starShape, quantity: 2 });
	}
}
