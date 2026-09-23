'use strict';

const CONFIGURATION_COMPRESSION_FORMAT = 'deflate';
const BASE64_CHUNK_SIZE = 0x8000;
const BASE64_TEXT_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const LEGACY_STATE_TOKEN_PATTERN = /(?:^|,)[a-z]+=/i;

export function isLegacyConfigurationStateParam(configurationState) {
  return typeof configurationState === 'string' && LEGACY_STATE_TOKEN_PATTERN.test(configurationState);
}

export async function encodeConfigurationStateParam(compactState) {
  if (!compactState || !isCompressionAvailable()) return compactState;

  try {
    const compressedBytes = await compressText(compactState);
    return bytesToBase64(compressedBytes);
  } catch (error) {
    console.warn('Unable to compress configuration URL state.', error);
    return compactState;
  }
}

export async function decodeConfigurationStateParam(configurationState) {
  if (!configurationState || isLegacyConfigurationStateParam(configurationState)) return configurationState;
  if (!isDecompressionAvailable() || !BASE64_TEXT_PATTERN.test(configurationState)) return configurationState;

  try {
    const compressedBytes = base64ToBytes(configurationState);
    return await decompressText(compressedBytes);
  } catch (error) {
    console.warn('Unable to decompress configuration URL state.', error);
    return configurationState;
  }
}

function isCompressionAvailable() {
  return typeof CompressionStream === 'function' &&
    typeof Blob === 'function' &&
    typeof Response === 'function' &&
    typeof globalThis.btoa === 'function';
}

function isDecompressionAvailable() {
  return typeof DecompressionStream === 'function' &&
    typeof Blob === 'function' &&
    typeof Response === 'function' &&
    typeof globalThis.atob === 'function';
}

async function compressText(text) {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream(CONFIGURATION_COMPRESSION_FORMAT));

  return responseToBytes(stream);
}

async function decompressText(bytes) {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream(CONFIGURATION_COMPRESSION_FORMAT));

  return new Response(stream).text();
}

async function responseToBytes(stream) {
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function bytesToBase64(bytes) {
  let binaryText = '';

  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + BASE64_CHUNK_SIZE);
    binaryText += String.fromCharCode(...chunk);
  }

  return globalThis.btoa(binaryText);
}

function base64ToBytes(base64Text) {
  const binaryText = globalThis.atob(base64Text);
  const bytes = new Uint8Array(binaryText.length);

  for (let index = 0; index < binaryText.length; index += 1) {
    bytes[index] = binaryText.charCodeAt(index);
  }

  return bytes;
}
