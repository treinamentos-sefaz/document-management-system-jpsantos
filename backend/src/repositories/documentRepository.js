const path = require('node:path');

function toPublicDocument(document) {
  const { storageName, mimeType, ...metadata } = document;
  return metadata;
}

function createDocumentRepository({ storageDir }) {
  const documents = new Map();

  return {
    create(document) {
      documents.set(document.id, document);
      return toPublicDocument(document);
    },

    list() {
      return Array.from(documents.values(), toPublicDocument);
    },

    findById(id) {
      return documents.get(id) || null;
    },

    findDownloadById(id) {
      const document = documents.get(id);
      if (!document) {
        return null;
      }

      return {
        filePath: path.join(storageDir, document.storageName),
        originalName: document.originalName,
        mimeType: document.mimeType,
      };
    },
  };
}

module.exports = { createDocumentRepository };