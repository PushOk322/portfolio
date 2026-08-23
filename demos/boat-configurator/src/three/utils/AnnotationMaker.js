import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer";

export default class AnnotationMaker {
  constructor(container, application) {
    this.application = application;
    this.element = null;
    this.parent = null;

    this.container = container;
    this.points = [];
    this.counter = 1;
    this.box = null;

    this.createContainer();

    // `/textures/bicycle-textures/circle.png` in the original — a path left over from an
    // earlier configurator. The folder does not exist in this project, so the annotation
    // sprite 404'd upstream too. Replaced with a local dot.
    this.circleTexture = new THREE.TextureLoader().load(
      "./textures/annotation-dot.png"
    );
  }

  createContainer() {
    const annotationsContainer = document.createElement("div");
    annotationsContainer.className = "annotations-container";
    annotationsContainer.style = `position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;`;
    this.box = annotationsContainer;
    this.container.appendChild(annotationsContainer);
  }

  setAction(id) {
    this.application.eventEmitter.notify("setActiveClientSlide", id);
  }

  createAnnotation({ pointId, position, text, name }) {
    const annotationSpriteMaterial = new THREE.SpriteMaterial({
      map: this.circleTexture,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
    });
    const annotationSprite = new THREE.Sprite(annotationSpriteMaterial);
    annotationSprite.scale.set(0.066, 0.066, 0.066);
    annotationSprite.position.copy(position);
    annotationSprite.userData.id = pointId;
    annotationSprite.renderOrder = 1;
    annotationSprite.name = name
    this.application.scene.add(annotationSprite);
    this.points.push(annotationSprite);

    const annotationDiv = document.createElement("div");
    annotationDiv.className = "annotationLabel";
    annotationDiv.innerHTML = pointId;
    const annotationLabel = new CSS2DObject(annotationDiv);
    annotationLabel.position.copy(position);
    this.application.scene.add(annotationLabel);

    if (text) {
      const annotationDescriptionDiv = document.createElement("div");
      annotationDescriptionDiv.className = "annotationDescription";
      annotationDescriptionDiv.innerHTML = text;
      annotationDiv.appendChild(annotationDescriptionDiv);
      annotationSprite.descriptionDomElement = annotationDescriptionDiv;
    }
  }

  createPoint(pointId, position, text) {
    const exists = document.getElementById(pointId);
    if (exists) return;
    const div = document.createElement("div");
    // div.addEventListener('click', () => this.setAction(pointId))
    div.dataset.id = pointId;

    const labelEl = document.createElement("span");
    // labelEl.innerHTML = this.counter;
    labelEl.className = "annotation-point__label";
    div.appendChild(labelEl);

    if (text) {
      const textEl = document.createElement("p");
      textEl.innerHTML = text || "";
      textEl.className = "point-text";
      div.appendChild(textEl);
    }

    div.className = "annotation-point";
    div.id = pointId;

    this.points.push({
      position,
      element: div,
      id: pointId,
      domId: pointId,
    });
    this.counter += 1;

    this.box.append(div);
    return div;
  }

  calculatePointPosition() {
    for (const point of this.points) {
      const screenPosition = point.position.clone();

      screenPosition.project(this.application.camera.instance);

      const translateX =
        (screenPosition.x * 0.5 + 0.5) * this.application.sizes.width;
      const translateY =
        (-screenPosition.y * 0.5 + 0.5) * this.application.sizes.height;

      point.element.style.transform = `translate(${translateX}px, ${translateY - 35}px)`;
    }
  }

  clearPoints() {
    if (this.points.length) {
      for (const el of this.points) {
        const element = document.getElementById(el.domId);
        element.remove();
      }
      this.points = [];
      this.counter = 1;
    }
  }
}
