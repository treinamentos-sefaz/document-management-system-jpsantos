import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/formatFileSize.js';

export default function DocumentList({ documents, isLoading }) {
  if (isLoading) {
    return <div className="list-state" role="status">Carregando documentos...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <h3>Nenhum documento ainda</h3>
        <p>Os documentos enviados aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Enviado</th>
            <th scope="col">Tamanho</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="document-name-cell">
                <span className="document-mark" aria-hidden="true">DOC</span>
                <span className="document-name" title={document.originalName}>{document.originalName}</span>
              </td>
              <td className="metadata-cell">{formatDate(document.uploadedAt)}</td>
              <td className="metadata-cell">{formatFileSize(document.size)}</td>
              <td className="action-cell">
                <DownloadButton documentId={document.id} fileName={document.originalName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
