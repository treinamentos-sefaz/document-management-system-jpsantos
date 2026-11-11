const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');

function createDocumentService({ repository, owner }) {
  return {
    registerUpload(file) {
      try {
        return repository.create({
          id: randomUUID(),
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          owner,
          storageName: file.filename,
          mimeType: file.mimetype,
        });
      } catch (error) {
        fs.rm(file.path, { force: true }).catch(() => {});
        throw error;
      }
    },

    listDocuments() {
      return repository.list();
    },

    getDownloadDocument(id) {
      return repository.findDownloadById(id);
    },
  };
}

module.exports = { createDocumentService };