/* global THREE, gsap */

import { camera, controls } from '../3d-scene.js';

// ANIMATION OF MODEL - "SCALE" - appearing or disappearing
function animateScale(
  model,
  callback = () => springScale(model),
  duration = 500,
  startScale = 0,
  endScale = 1,
  timingKeyword = 'ease-in-out',
) {
  const easingMap = {
    'ease-in': 'power2.in',
    'ease-out': 'power2.out',
    'ease-in-out': 'power2.inOut',
    'linear': 'none',
  };

  const easing = easingMap[timingKeyword] || 'power2.in';

  if (!model || !model.scale) {
    console.error('Invalid model for animateScale');
    return;
  }

  const scaleProxy = { value: startScale };

  gsap.to(scaleProxy, {
    value: endScale,
    duration: duration / 1000,
    ease: easing,
    onUpdate: () => {
      model.scale.set(scaleProxy.value, scaleProxy.value, scaleProxy.value);
    },
    onComplete: () => {
      model.scale.set(endScale, endScale, endScale);
      callback();
    }
  });
}

// ANIMATION OF MODEL - "SPRING-SCALE"
function springScale(model, duration = 2500, oscillations = 0, callback = () => {}) {
  if (!model || !model.scale) {
    console.error('Invalid model for springScale');
    return;
  }

  const startScale = model.scale.x;
  const maxScale = startScale * 1.1;

  const scaleProxy = { value: startScale };

  const tl = gsap.timeline({
    onComplete: () => {
      model.scale.set(startScale, startScale, startScale);
      callback();
    }
  });

  tl.to(scaleProxy, {
    value: maxScale,
    duration: 0.1,
    ease: 'power2.out',
    onUpdate: () => {
      model.scale.set(scaleProxy.value, scaleProxy.value, scaleProxy.value);
    }
  });

  tl.to(scaleProxy, {
    value: startScale,
    duration: (duration - 100) / 1000,
    ease: `elastic.out(${1 + oscillations}, 0.2)`,
    onUpdate: () => {
      model.scale.set(scaleProxy.value, scaleProxy.value, scaleProxy.value);
    }
  });
}

// FlYING CAMERA TO TARGET POSITION
function smoothCameraTransition(
  targetCameraPosition,
  targetControlPosition = new THREE.Vector3(0, 0, 0),
  duration = 750,
  targetControlMinDist = 0.1,
  targetCameraFOV = 50,
  maxPolarAngle = Math.PI / 1.88,
  easing = 'power2.inOut',
  callback = () => { },
) {
if (!targetCameraPosition) {
  console.error('Invalid targetCameraPosition for smoothCameraTransition');
  return;
}

const delta = 0;
const correctedTargetPosition = new THREE.Vector3(
    targetCameraPosition.x + delta,
    targetCameraPosition.y,
    targetCameraPosition.z - delta,
);

const animationProps = {
  cameraX: camera.position.x,
  cameraY: camera.position.y,
  cameraZ: camera.position.z,
  controlX: controls.target.x,
  controlY: controls.target.y,
  controlZ: controls.target.z,
  controlMinDist: controls.minDistance,
  cameraFOV: camera.fov,
  maxPolarAngle: controls.maxPolarAngle,
};

gsap.to(animationProps, {
  cameraX: correctedTargetPosition.x,
  cameraY: correctedTargetPosition.y,
  cameraZ: correctedTargetPosition.z,
  controlX: targetControlPosition.x,
  controlY: targetControlPosition.y,
  controlZ: targetControlPosition.z,
  controlMinDist: targetControlMinDist !== undefined ?
      targetControlMinDist : controls.minDistance,
  cameraFOV: targetCameraFOV !== undefined ? targetCameraFOV : camera.fov,
  maxPolarAngle: maxPolarAngle,
  duration: duration / 1000,
  ease: easing,
  // onStart: () => {
  // },
  onUpdate: () => {
    camera.position.set(
        animationProps.cameraX,
        animationProps.cameraY,
        animationProps.cameraZ,
    );
    controls.target.set(
        animationProps.controlX,
        animationProps.controlY,
        animationProps.controlZ,
    );

    controls.minDistance = animationProps.controlMinDist;
    controls.maxPolarAngle = animationProps.maxPolarAngle;
    camera.fov = animationProps.cameraFOV;
    camera.updateProjectionMatrix();
    controls.update();
  },
  onComplete: () => {
    camera.position.copy(correctedTargetPosition);
    controls.target.set(targetControlPosition);
    controls.minDistance = targetControlMinDist !== undefined ?
        targetControlMinDist : controls.minDistance;
    controls.maxPolarAngle = maxPolarAngle;
    camera.fov = targetCameraFOV !== undefined ? targetCameraFOV : camera.fov;
    camera.updateProjectionMatrix();
    controls.update();

    if (typeof callback === 'function') {
      callback();
    }
  },
});
}

/* --------------------------------- */

export {
  animateScale,
  springScale,
  smoothCameraTransition,
};
