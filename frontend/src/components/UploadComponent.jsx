import { useRef, useState } from 'react';
import { formatFileSize } from '../utils/formatFileSize.js';

export default function UploadComponent({ onUpload, isUploading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) {
      return;
    }

    const uploaded = await onUpload(file);
    if (uploaded) {
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-picker${file ? ' has-file' : ''}`}>
        <input
          ref={inputRef}
          type="file"
          name="file"
          onChange={(event) => setFile(event.currentTarget.files?.[0] || null)}
          disabled={isUploading}
        />
        <span className="upload-symbol" aria-hidden="true">+</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolher arquivo'}</strong>
          <small>{file ? formatFileSize(file.size) : 'Qualquer formato'}</small>
        </span>
        <span className="picker-arrow" aria-hidden="true">↗</span>
      </label>
      <button className="submit-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
        <span aria-hidden="true">→</span>
      </button>
      <p className="upload-footnote">Arquivos salvos nesta instância.</p>
    </form>
  );
}