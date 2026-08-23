// @ts-nocheck

import { Space } from '../scenes/space';
import Point from '../entities/point';
import { State } from '../state';
import { gameState } from '../state/state';

export default class Laser {
    constructor(scene: Space, texture: string) {
        this.scene = scene;
        this.texture = texture;
        this.lastCoords = { x: null, y: null };
        this.newCoords = { x: 0, y: 0 };
        this.vector = { x: 0, y: 0 };
        this.particles = [];
        this.pointer = null;
        this.collisionPoint = null;
        this.createLaser = false;
        this.globalPointerUp = false;

        this.gameState = new State()

        const scaleCoef = window.innerWidth >= 1024 ? 1 :
            window.innerWidth < 1024 && window.innerWidth > 720 ? 0.9 : 0.75
        this.scale = 1 * scaleCoef;

        this.create();
    }

    create() {
        this.collisionPoint = new Point(this.scene);
        this.pointer = this.scene.add.image(0, 0, '')
        this.pointer.alpha = 0;
        this.collisionPoint.alpha = 0;

        let laserFrames = this.scene.textures.get(this.texture).getFrameNames();
        const createEmitter = (frame) => {
            return this.scene.add.particles(0, 0, this.texture, {
                frame: frame,
                quantity: 0,
                lifespan: 150,
                scaleX: this.scale,
                scaleY: { start: this.scale, end: 0.03 },
                alpha: { start: 0.5, end: 0 },
                frequency: -1,
                explode: true,
                blendMode: 'ADD'
            }).setDepth(10);
        };

        this.particles.push(
            createEmitter(laserFrames[0]),
            createEmitter(laserFrames[1]),
            createEmitter(laserFrames[2])
        );

        this.scene.input.on('pointerdown', this.handleMouseDown, this);

        const canvas = this.scene.sys.canvas;

        canvas.onmouseleave = () => {
            this.handleMouseLeave()
        };

        let tempFix = false

        canvas.onmouseenter = (e) => {
            if (this.globalPointerUp) this.handleMouseUp()
            else {
                if (tempFix) this.handleMouseEnter(e)
            }
            if (!tempFix) tempFix = true
        };

        document.onpointerup = () => {
            this.globalPointerUp = true
        }

    }

    update(delta: number) {
        if (!this.createLaser) return;

        const steps = Math.floor(delta);

        this.vector.x = this.newCoords.x - this.lastCoords.x;
        this.vector.y = this.newCoords.y - this.lastCoords.y;
        const stepX = this.vector.x / steps;
        const stepY = this.vector.y / steps;

        const stepDiff = Math.abs(Math.sqrt(Math.pow(this.vector.x, 2) + Math.pow(this.vector.y, 2))) / steps;
        if (stepDiff === 0) return

        this.particles.forEach(el => el.stop());

        const currentParticle = (stepDiff <= 4) ? this.particles[0] :
            (stepDiff > 4 && stepDiff < 8) ? this.particles[1] : this.particles[2];

        currentParticle.start();

        if (stepDiff > 12) {
            currentParticle.particleScaleX = this.scale * (stepDiff / 12);
        } else if (currentParticle.particleScaleX !== this.scale) {
            currentParticle.particleScaleX = this.scale;
        }

        for (let i = 0; i < steps; i++) {
            this.pointer.x += stepX;
            this.pointer.y += stepY;

            let angle = this.angleBetweenXAxisAndSegment(this.lastCoords.x, this.lastCoords.y, this.newCoords.x, this.newCoords.y);
            if (angle) currentParticle.particleRotate = angle;

            if (this.lastCoords.x !== null) currentParticle.emitParticleAt(this.pointer.x, this.pointer.y, 1);
        }

        this.lastCoords.x = this.newCoords.x;
        this.lastCoords.y = this.newCoords.y;
    }

    angleBetweenXAxisAndSegment(x2: number, y2: number, x1: number, y1: number): number | null {
        const angleRad = Phaser.Math.Angle.Between(x2, y2, x1, y1);
        const angleDeg = Phaser.Math.RadToDeg(angleRad);
        return (Math.abs(angleDeg) < 1) ? null : angleDeg;
    }

    handleMouseDown(e: { x: number; y: number; }) {
        this.handleMouseEnter(e)

        this.scene.input.on('pointermove', this.handleMouseMove, this);
        this.scene.input.once('pointerup', this.handleMouseUp, this);
    }
    handleMouseUp() {
        this.handleMouseLeave()
        this.scene.input.off('pointermove', this.handleMouseMove, this);
    }

    handleMouseEnter(e: { x: number; y: number; }) {
        const { x, y } = e;
        this.lastCoords = { x, y };
        this.newCoords = { x, y };
        this.pointer.setPosition(x, y);
        this.createLaser = true;
        this.collisionPoint.setActive(true)
        this.globalPointerUp = false;
    }

    handleMouseLeave() {
        this.particles.forEach(el => {
            el.stop()
        });
        this.createLaser = false;
        this.collisionPoint.setActive(false)
    }

    handleMouseMove(e: { x: number; y: number; }) {
        const { x, y } = e;
        this.newCoords = { x, y };
    }
}