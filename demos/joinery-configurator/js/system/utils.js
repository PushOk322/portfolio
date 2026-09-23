import * as THREE from 'three';

const copyToClipboard = (infoSharingInput) => {
  var aux = document.createElement('input');
  aux.setAttribute('value', infoSharingInput.value);
  document.body.appendChild(aux);
  aux.select();
  document.execCommand('copy');
  document.body.removeChild(aux);
}

function waitFor(conditionFunction, { interval = 400, timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = setInterval(() => {
      if (conditionFunction()) {
        clearInterval(check);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(check);
        reject(new Error("waitFor: timeout exceeded"));
      }
    }, interval);
  });
}

function promiseDelay(time, callback) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
      if (callback != null) {
        callback();
      }
    }, time);
  });
}

async function detectOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'iOS';
  if (/visionOS|VisionPro/i.test(userAgent)) return 'VisionPro';

  if (/Macintosh/i.test(userAgent) && navigator.xr) {
    try {
      const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
      if (isVRSupported) {
        return 'VisionPro';
      }
    } catch (error) {
      console.warn('WebXR check failed:', error);
    }
  }

  if (/android/i.test(userAgent)) return 'Android';
  if (/Windows/i.test(userAgent) || /Win/i.test(userAgent)) return 'Windows';
  if (/Linux/i.test(userAgent) && !/android/i.test(userAgent)) return 'Linux';
  if (/Macintosh/i.test(userAgent)) return 'Macintosh';

  if (isTouchDevice) return 'TouchScreenDevice';
  return 'unknown';
}

function inchToMeter(inch) {
  return inch * 0.0254;
}

function meterToInch(meter) {
  return meter / 0.0254;
}

function feetToMeter(feet) {
  return feet * 0.3048;
}

function meterToFeet(meter) {
  return meter / 0.3048;
}

function generateMidpoints(vectorA, vectorB, numPoints, isFirstLastPointAdded = false) {
  const points = [];

  if (isFirstLastPointAdded) {
    points.push(vectorA);
  }

  for (let i = 1; i <= numPoints; i++) {
    const t = i / (numPoints + 1);
    const point = new THREE.Vector3().lerpVectors(vectorA, vectorB, t);

    points.push(point);
  }

  if (isFirstLastPointAdded) {
    points.push(vectorB);
  }

  return points;
}

function generateCenterMidpoints(vectorA, vectorB, numPoints, isFirstLastPointAdded = false, divide = 1) {
  const points = [];

  if (isFirstLastPointAdded) {
    points.push(vectorA);
  }

  for (let i = 1; i <= numPoints; i++) {
    const t = i / (numPoints + 1);
    const point = new THREE.Vector3().lerpVectors(vectorA, vectorB, t);
    points.push(point);
  }

  if (isFirstLastPointAdded) {
    points.push(vectorB);
  }

  if (points.length == 1) {
    return points;
  }

  var dividePoint = points;
  for (let index = 0; index < divide; index++) {
    dividePoint = pointDivideProcess(dividePoint);
  }

  return dividePoint;

  function pointDivideProcess(points) {
    const dividePoint = [];
  
    for (let i = 0; i < points.length; i++) {
      if (i + 1 >= points.length) { continue; }
  
      var point1 = points[i];
      var point2 = points[i + 1];
      const centerPoint = new THREE.Vector3().lerpVectors(point1, point2, 0.5);
  
      dividePoint.push(centerPoint);
    }
  
    return dividePoint;
  }
}

/* --------------------------------- */

export {
  copyToClipboard,
  waitFor,
  promiseDelay,
  detectOperatingSystem,
  inchToMeter,
  meterToInch,
  feetToMeter,
  meterToFeet,
  generateMidpoints,
  generateCenterMidpoints,
}
