import * as THREE from 'three';

//* ###################################################################### /
//! function captureCanvas
//* Creates a "screenshot" of a Three.js scene with the given parameters.

//****** Example usage: as freescreenshot
// captureCanvas({
//   renderer: renderer,
//   scene: scene,
//   mainCamera: camera,
//   cameraOffset: 0,
//   useCurrentCamera: true,
//   width: 1920,
//   height: 1080,
//   filename: 'my_table.jpg',
//   format: 'image/jpeg',
//   download: true,
// });

//****** Example usage: as fixed screenshot
// captureCanvas({
//   renderer: renderer,
//   scene: scene,
//   cameraPosition: new THREE.Vector3(1.1, 1.5, 2.35),
//   cameraLookAt: new THREE.Vector3(0.1, 0.5, 0),
//   width: 1920,
//   height: 1080,
//   filename: 'my_table.jpg',
//   format: 'image/jpeg',
//   download: true,
// });

//****** Example usage: as image for PDF
// const pdfImg = await captureCanvas({
//   renderer: renderer,
//   scene: scene,
//   cameraPosition: new THREE.Vector3(1.1, 1.5, 2.35),
//   cameraLookAt: new THREE.Vector3(0.1, 0.5, 0),
//   width: 1920,
//   height: 1080,
//   filename: 'my_table.jpg',
//   format: 'image/jpeg',
//   download: false,
// });

//* ###################################################################### /

/**
 * Creates a "screenshot" of a Three.js scene with the given parameters.
 * Returns a Promise that resolves to a Data URL (base64) of the image.
 *
 * @param {object} options - Object with parameters for capturing the image.
 * @param {THREE.Renderer} options.renderer - Three.js renderer (required !!!). 
 * @param {THREE.Scene} options.scene - Three.js scene (required !!!).
 *
 * @param {THREE.Camera} [options.mainCamera] - The user's main camera. Required if `useCurrentCamera` is true.
 * @param {number} [options.cameraOffset=0] - Additional offset from the camera's position. Works only with `useCurrentCamera`. Positive values move the camera away from the center.
 * @param {boolean} [options.useCurrentCamera=false] - If true, uses the position of `mainCamera`.
 *
 * @param {number} [options.fov=50] - Camera field of view.
 * @param {THREE.Vector3} [options.cameraPosition] - Camera position (new THREE.Vector3(x, y, z)). Ignored if `useCurrentCamera` is true.
 * @param {THREE.Vector3} [options.cameraLookAt=new THREE.Vector3(0, 0, 0)] - The point the camera is looking at. Ignored if `useCurrentCamera` is true.
 *
 * @param {number} [options.width=1920] - Output image width in pixels.
 * @param {number} [options.height=1080] - Output image height in pixels.
 * @param {string} [options.filename='screenshot.png'] - Filename for the downloaded image.
 * @param {string} [options.format='image/png'] - Image format ('image/png' or 'image/jpeg').
 *
 * @param {boolean} [options.download=false] - If true, the image will be downloaded.
 * @returns {Promise<string>} Promise that resolves to a Data URL (base64) of the image.
 **/

async function captureCanvas(options) {
  // default options
  const config = {
    width: 1920,
    height: 1080,
    fov: 50,
    download: false,
    filename: 'screenshot.png',
    format: 'image/png',
    useCurrentCamera: false,
    cameraOffset: 0,
    cameraLookAt: new THREE.Vector3(0, 0, 0),
    ...options,
  };

  if (!config.renderer || !config.scene) {
    return Promise.reject("Renderer and scene are required!");
  }
  if (config.useCurrentCamera && !config.mainCamera) {
    return Promise.reject("mainCamera is required if useCurrentCamera is true.");
  }
  if (!config.useCurrentCamera && !config.cameraPosition) {
    return Promise.reject("cameraPosition is required if useCurrentCamera is false.");
  }

  const { renderer, scene, width, height, fov, download, filename, format } = config;

  let finalCameraPosition = new THREE.Vector3();
  let finalLookAt = new THREE.Vector3(0, 0, 0);

  if (config.useCurrentCamera) {
    finalCameraPosition.copy(config.mainCamera.position);

    if (config.cameraOffset !== 0) {
      const offsetDirection = finalCameraPosition.clone().normalize();
      finalCameraPosition.add(offsetDirection.multiplyScalar(config.cameraOffset));
    }
    finalLookAt = new THREE.Vector3(0, 0, 0);
  } else {
    finalCameraPosition.copy(config.cameraPosition);
    finalLookAt.copy(config.cameraLookAt);
  }

  const originalSize = new THREE.Vector2();
  renderer.getSize(originalSize);

  const captureCamera = new THREE.PerspectiveCamera(fov, width / height, 0.01, 1000);
  captureCamera.position.copy(finalCameraPosition);
  captureCamera.lookAt(finalLookAt);
  captureCamera.updateProjectionMatrix();

  let imageDataUrl;

  try {
    renderer.setSize(width, height, false);
    renderer.render(scene, captureCamera);
    imageDataUrl = renderer.domElement.toDataURL(format);
  } catch (e) {
    console.error("Error capturing canvas:", e);
    return Promise.reject(e);
  } finally {
    renderer.setSize(originalSize.x, originalSize.y, false);
  }

  if (download) {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return Promise.resolve(imageDataUrl);
}

//* ###################################################################### /
//! function loadImageAsDataUrl
//* Loads an image from a URL and converts it to a Data URL (Base64).
/**
 * - All formats (PNG, JPG, WEBP, GIF, SVG, etc.) are forcibly
 *   converted to PNG for compatibility with pdfMake.
 *
 * @param {string} url - Direct URL of the image.
 * @param {number} [scaleFactor=3] - Scale factor for the image.
 * @returns {Promise<string>} Promise that resolves to a Data URL string.
 * @throws {Error} Throws an error in case of failure.
 */

async function loadImageAsDataUrl(url, scaleFactor = 3) {
  try {
    // const response = await fetch(url);
    const separator = url.includes('?') ? '&' : '?';
    const uniqueUrl = `${url}${separator}t=${Date.now()}`;
    const response = await fetch(uniqueUrl);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;
        canvas.width = originalWidth * scaleFactor;
        canvas.height = originalHeight * scaleFactor;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(objectUrl);
        resolve(pngDataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Error loading image: ${url}`));
      };

      img.src = objectUrl;
    });
  } catch (error) {
    console.error(`Error fetching image: ${url}`, error);
    throw error;
  }
}

/* --------------------------------- */

export {
  captureCanvas,
  loadImageAsDataUrl,
};
