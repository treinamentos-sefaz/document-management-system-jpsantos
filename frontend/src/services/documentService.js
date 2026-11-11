async function parseResponse(response) {
  if (response.ok) {
    return response.json();
  }

  const body = await response.json().catch(() => null);
  throw new Error(body?.error?.message || 'Não foi possível concluir a solicitação.');
}

export async function listDocuments(signal) {
  const response = await fetch('/api/documents', { signal });
  return parseResponse(response);
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  return parseResponse(response);
}

export async function downloadDocument(documentId) {
  const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/download`);
  if (!response.ok) {
    return parseResponse(response);
  }

  return response.blob();
}