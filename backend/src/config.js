const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function parsePositiveInteger(value, defaultValue, variableName) {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${variableName} deve ser um inteiro positivo.`);
  }

  return parsedValue;
}

function loadConfig(environment = process.env) {
  const backendRoot = path.resolve(__dirname, '..');

  return {
    port: parsePositiveInteger(environment.PORT, 3000, 'PORT'),
    storageDir: path.resolve(environment.STORAGE_DIR || path.join(backendRoot, 'storage')),
    maxFileSizeBytes: parsePositiveInteger(
      environment.MAX_FILE_SIZE_BYTES,
      DEFAULT_MAX_FILE_SIZE_BYTES,
      'MAX_FILE_SIZE_BYTES',
    ),
    owner: environment.DMS_DEFAULT_OWNER || 'local-user',
  };
}

module.exports = { loadConfig };