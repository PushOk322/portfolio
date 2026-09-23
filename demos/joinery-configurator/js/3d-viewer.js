/* global jQuery, $ */

// Created by Marevo (Pavlo Voronin)
// Welcome to our custom script!

'use strict';

//#region PUBLIC VALUES

// Side-effect import: registers all three products before mount() runs.
import './dev-products.js';

import { getActiveModel } from './model-manager.js';
import { mount } from './integration/configurator-api.js';

import { copyToClipboard } from './system/utils.js';
import { scene } from './3d-scene.js';
import * as ARManager from './system/ARManager.js';
import { createMenu } from './ui-controller.js';
import { encodeText, toDataURL } from './libs/qr/qrcode.js';

let loaded = false;

let tblInfo;
let tblInfoItemQr;
let tblInfoItemSharing;

let uiCallbackForAR = () => { };

let qrcode;
let theModel;

//#endregion

//! === START APP HERE ===
start();
//! ======================

async function start() {
  // The demo page boots through the same entry point Joinery uses, so the public
  // API is exercised by our own daily work rather than only by its tests.
  await mount(document.getElementById('ar_model_viewer'), {
    onError: result => console.warn('[Configurator] rejected:', result.errors),
  });

  theModel = getActiveModel();

  if (!theModel) console.error("Failed to load the main model!");

  prepareUI();

  if (loaded) return;

  startSettings();
  loaded = true;
}

async function startSettings() {
  if (!theModel) {
    console.error('theModel is undefined');
    return;
  }

  await createMenu();

  $('#js-loader').addClass('invisible');

  const modelViewerElement = document.querySelector('#marevo_model');
  const arPromptElement = document.querySelector('#ar-prompt');

  ARManager.init(modelViewerElement, {
    arPrompt: arPromptElement,
    androidLightIntensity: 0,
    textureOptimization: {
      enabled: true,
      maxSize: 1024,
      quality: 0.7
    },
    onExitAR: () => {
      console.log("Returned from AR");
    }
  });
}

//#region QR

export function createQR() {
  const qr = qrcode[0];
  if (qr == null) { return; }

  while (qr.hasChildNodes()) {
    qr.removeChild(qr.lastChild);
  }

  // Generated locally rather than fetched from quickchart.io. The old call sent the
  // page URL — configuration state and all — to a third party on every AR open, and
  // put a live demo at the mercy of someone else's uptime. Same module the stairs
  // configurator uses.
  const qrImg = new Image();
  qrImg.width = 200;
  qrImg.height = 200;
  qrImg.alt = 'QR code linking to this configuration';
  qrImg.src = toDataURL(encodeText(window.location.href, 'M'), { scale: 6, margin: 4 });
  qr.appendChild(qrImg);
}

//#endregion

//#region UI FUNCTIONS

async function prepareUI() {
  // *****   POP-UPs   *****
  jQuery(document).ready(function ($) {
    const tblWindowArBtnCanvas = $('#button_ar_qr'); // button AR on the canvas
    const tblWindowShareBtnCanvas = $('#button_share_url'); // button SHARE on the canvas

    tblWindowArBtnCanvas.removeClass('hidden');

    tblInfo = $('.tbl-info');
    tblInfoItemSharing = $('#tbl-info-item-share');
    tblInfoItemQr = $('#tbl-info-item-qr');
    qrcode = $('#qrcode');

    const tblInfoSharingIco = $('.tbl-info-sharing-ico');
    const infoSharingInput = $('#info-sharing-input');
    const tblInfoClose = $('.tbl-info-close');
    const tblInfoOverlay = $('.tbl-info-overlay');

    tblInfoSharingIco.on('click', function () {
      copyToClipboard(infoSharingInput[0]);
    });

    tblInfoClose.on('click', function () {
      tblInfo?.removeClass('active');
      tblInfoItemQr?.removeClass('active');
      tblInfoItemSharing?.removeClass('active');

      document.documentElement.classList.remove('popup-open');
    });

    tblInfoOverlay.on('click', function () {
      tblInfo?.removeClass('active');
      tblInfoItemQr?.removeClass('active');
      tblInfoItemSharing?.removeClass('active');

      document.documentElement.classList.remove('popup-open');
    });

    tblWindowShareBtnCanvas?.on('click', function () {
      sharingHandler();
    });

    tblWindowArBtnCanvas.on('click', function () {
      openAR(uiCallbackForAR);
    });

    const sharingHandler = () => {
      tblInfo.toggleClass('active');
      tblInfoItemSharing.toggleClass('active');
      tblInfoItemQr.removeClass('active');

      document.documentElement.classList.add('popup-open');

      infoSharingInput[0].value = window.location.href;
    }
  });

  uiCallbackForAR = () => {
    tblInfo.toggleClass('active');
    tblInfoItemQr.toggleClass('active');
    tblInfoItemSharing.removeClass('active');
  }
}

//#endregion

function openAR(uiCallback = () => { }) {
  const sceneToExport = scene.clone();

  sceneToExport.traverse(child => {
    if (child.name === 'scene_floor') child.visible = false;
  });

  const showSpinner = () => $('#ar-spinner').show();
  const hideSpinner = () => $('#ar-spinner').hide();

  const showQR = () => {
    createQR();
    uiCallback();
  };

  ARManager.openAR(sceneToExport, showQR, showSpinner, hideSpinner);
}
