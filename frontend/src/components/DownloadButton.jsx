import { useState } from 'react';
import { downloadDocument } from '../services/documentService.js';

export default function DownloadButton({ documentId, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    try {
      const file = await downloadDocument(documentId);
      const objectUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        className="download-link"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`${isDownloading ? 'Baixando' : 'Baixar'} ${fileName}`}
      >
        {isDownloading ? 'Baixando...' : 'Baixar'} <span aria-hidden="true">↓</span>
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </div>
  );
}