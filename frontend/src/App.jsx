// Seed do componente raiz do Document Management System.
//
// Este é apenas um ponto de partida mínimo. Durante o Passo 3 você vai usar o
// Agent Mode do GitHub Copilot para construir os componentes:
//   - components/UploadComponent
//   - components/DocumentList
//   - components/DownloadButton
// e o serviço services/ que consome a API do backend via fetch.

import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentService.js';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    listDocuments(controller.signal)
      .then(setDocuments)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [refreshVersion]);

  async function handleUpload(file) {
    setError('');
    setNotice('');
    setIsUploading(true);

    try {
      const createdDocument = await uploadDocument(file);
      setDocuments((currentDocuments) => [createdDocument, ...currentDocuments]);
      setNotice('Documento enviado com sucesso.');
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark">D</span>
          <span className="brand-name">arquivo<span>local</span></span>
        </a>
        <div className="topbar-meta">
          <span className="status-dot" aria-hidden="true" />
          <span>Biblioteca local</span>
        </div>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">DOCUMENT MANAGEMENT SYSTEM</p>
            <h1 id="page-title">Seus documentos,<br />em um só lugar.</h1>
          </div>
          <p className="heading-note">
            <span className="heading-count">{documents.length.toString().padStart(2, '0')}</span>
            <span>documentos<br />na biblioteca</span>
          </p>
        </section>

        <div className="content-grid">
          <aside className="upload-panel" aria-labelledby="upload-title">
            <div className="panel-heading">
              <span className="section-index">01</span>
              <h2 id="upload-title">Adicionar documento</h2>
            </div>
            <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
          </aside>

          <section className="documents-panel" aria-labelledby="documents-title">
            <div className="documents-heading">
              <div className="panel-heading">
                <span className="section-index">02</span>
                <h2 id="documents-title">Biblioteca</h2>
              </div>
              <span className="document-total">{documents.length} {documents.length === 1 ? 'item' : 'itens'}</span>
            </div>

            {error && (
              <div className="feedback feedback-error" role="alert">
                <span>{error}</span>
                <button type="button" className="text-button" onClick={() => setRefreshVersion((version) => version + 1)}>
                  Tentar novamente
                </button>
              </div>
            )}
            {notice && <p className="feedback feedback-success" role="status">{notice}</p>}

            <DocumentList documents={documents} isLoading={isLoading} />
          </section>
        </div>

        <footer className="page-footer">
          <span>ARMAZENAMENTO LOCAL</span>
          <span>METADADOS DISPONÍVEIS NESTA SESSÃO</span>
        </footer>
      </main>
    </div>
  );
}
