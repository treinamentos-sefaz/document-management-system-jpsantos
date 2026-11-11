const express = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const { mkdir } = require('node:fs/promises');
const { createDocumentController } = require('./controllers/documentController');
const { loadConfig } = require('./config');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createDocumentRoutes } = require('./routes/documentRoutes');
const { createDocumentService } = require('./services/documentService');

function createApp(overrides = {}) {
  const config = { ...loadConfig(), ...overrides };
  const app = express();
  const repository = createDocumentRepository({ storageDir: config.storageDir });
  const service = createDocumentService({ repository, owner: config.owner });
  const controller = createDocumentController({ service });
  const upload = multer({
    storage: multer.diskStorage({
      destination: (request, file, callback) => {
        mkdir(config.storageDir, { recursive: true })
          .then(() => callback(null, config.storageDir), callback);
      },
      filename: (request, file, callback) => callback(null, randomUUID()),
    }),
    limits: { fileSize: config.maxFileSizeBytes, files: 1 },
  });

  app.use(express.json());
  app.get('/health', (request, response) => {
    response.json({ status: 'ok' });
  });
  app.use(createDocumentRoutes({ controller, upload }));

  app.use((request, response) => {
    response.status(404).json({
      error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada.' },
    });
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return response.status(tooLarge ? 413 : 400).json({
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
          message: tooLarge
            ? 'O arquivo excede o tamanho máximo permitido.'
            : 'A requisição de envio é inválida.',
        },
      });
    }

    if (
      error.type === 'entity.parse.failed'
      || error.message === 'Unexpected end of form'
      || error.message === 'Multipart: Boundary not found'
    ) {
      return response.status(400).json({
        error: { code: 'INVALID_UPLOAD', message: 'A requisição enviada é inválida.' },
      });
    }

    return response.status(500).json({
      error: { code: 'STORAGE_ERROR', message: 'Não foi possível processar o documento.' },
    });
  });
  return app;
}

const app = createApp();
app.createApp = createApp;

if (require.main === module) {
  app.listen(loadConfig().port, () => {
    console.log(`DMS backend ouvindo na porta ${loadConfig().port}`);
  });
}

module.exports = app;
