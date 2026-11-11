const path = require('node:path');

function createDocumentController({ service }) {
  return {
    upload(request, response, next) {
      if (!request.file) {
        return response.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
        });
      }

      try {
        const document = service.registerUpload(request.file);
        response
          .status(201)
          .location(`/documents/${document.id}/download`)
          .json(document);
      } catch (error) {
        next(error);
      }
    },

    list(request, response, next) {
      try {
        response.json(service.listDocuments());
      } catch (error) {
        next(error);
      }
    },

    download(request, response, next) {
      try {
        const document = service.getDownloadDocument(request.params.id);
        if (!document) {
          return response.status(404).json({
            error: {
              code: 'DOCUMENT_NOT_FOUND',
              message: 'Documento não encontrado.',
            },
          });
        }

        const downloadName = path.basename(document.originalName.replace(/\\/g, '/')) || 'documento';
        response.type(document.mimeType || 'application/octet-stream');
        response.download(
          document.filePath,
          downloadName,
          (error) => {
            if (!error) {
              return;
            }
            if (response.headersSent) {
              return next(error);
            }
            if (error.code === 'ENOENT') {
              return response.status(404).json({
                error: {
                  code: 'DOCUMENT_NOT_FOUND',
                  message: 'Documento não encontrado.',
                },
              });
            }
            return next(error);
          },
        );
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createDocumentController };