# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web local que permita enviar, listar e baixar documentos, armazenando os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos metadados dos documentos disponíveis na instância em execução.
- Download de um documento pelo identificador.
- Uso local de usuário único, sem autenticação; a coleção é compartilhada pela instância.
- Configuração de porta, diretório de armazenamento, tamanho máximo do arquivo e identificador do dono por variáveis de ambiente.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Persistência durável dos metadados ou recuperação do índice após reinício.
- Autenticação, autorização e isolamento entre múltiplos usuários.
- Versionamento, exclusão, busca, filtros, pré-visualização e conversão de documentos.
- Restrição de tipos de arquivo por regra de negócio.

### Premissas e limitações

- A aplicação atende uma instância local compartilhada. O campo `owner` identifica o dono configurado para a instância, mas não representa autenticação nem fornece isolamento de acesso.
- Os arquivos permanecem no disco após o encerramento do processo, mas os metadados em memória são perdidos ao reiniciar. Portanto, arquivos anteriores ao reinício não são listáveis nem baixáveis pela API nesta versão.
- A reconciliação ou remoção automática de arquivos sem metadados não faz parte desta versão.
- As rotas abaixo são caminhos do backend. No desenvolvimento, o frontend pode chamá-las sob o prefixo `/api`, removido pelo proxy do Vite.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar exatamente um arquivo por requisição `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema rejeita o envio sem arquivo, com mais de um arquivo ou acima do limite configurado. |
| RF-03 | O sistema grava o conteúdo em `backend/storage` por padrão, usando `multer` com `diskStorage`, e atribui ao arquivo um nome interno gerado pelo servidor. |
| RF-04 | Após salvar o arquivo, o sistema registra em memória seus metadados, incluindo ID único, nome original, tamanho, data de envio e dono configurado. |
| RF-05 | O sistema não aceita `owner` como fonte de identidade no corpo ou nos campos enviados pelo cliente. O dono é determinado pela configuração do servidor. |
| RF-06 | O usuário pode listar os metadados dos documentos registrados na instância atual. A listagem não revela caminhos locais nem nomes internos de armazenamento. |
| RF-07 | O usuário pode baixar um documento registrado pelo seu ID. O download usa o nome original de forma segura no cabeçalho de resposta. |
| RF-08 | IDs inexistentes ou documentos cujo arquivo não esteja disponível retornam `404 Not Found`, sem revelar caminhos locais. |
| RF-09 | Falhas de armazenamento ou leitura são tratadas sem expor detalhes internos do filesystem na resposta HTTP. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados exclusivamente no filesystem local da aplicação por `multer` com `diskStorage`; não são usados serviços externos de armazenamento. |
| RNF-02 | Os metadados são mantidos em memória e podem ser perdidos ao reiniciar o processo. |
| RNF-03 | Configurações operacionais são obtidas por variáveis de ambiente, conforme o princípio 12-Factor. |
| RNF-04 | O nome original do arquivo não é usado para construir caminhos no filesystem. Nomes internos são gerados pelo servidor e IDs não são derivados do nome fornecido pelo cliente. |
| RNF-05 | A API não expõe caminhos absolutos, nomes internos de armazenamento, stack traces ou detalhes sensíveis de erros. |
| RNF-06 | Respostas de erro usam um formato JSON consistente, exceto respostas de download bem-sucedidas, que são binárias. |

### Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP da aplicação. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de gravação dos arquivos. O caminho padrão deve ser resolvido de forma estável, independentemente do diretório de trabalho do processo. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Tamanho máximo por arquivo, em bytes (10 MiB). Valores ausentes usam o padrão; valores inválidos devem impedir configuração insegura e produzir erro claro no início da aplicação. |
| `DMS_DEFAULT_OWNER` | `local-user` | Identificador descritivo do dono associado aos documentos desta instância. Não constitui credencial nem mecanismo de autenticação. |

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único e opaco, gerado pelo servidor. |
| `originalName` | string | Nome original fornecido pelo cliente, preservado como metadado e tratado com segurança ao compor o nome de download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do registro em ISO 8601, em UTC. |
| `owner` | string | Identificador definido por `DMS_DEFAULT_OWNER`; não é fornecido nem autenticado pelo cliente. |

### Dados internos de armazenamento

Para associar metadados ao arquivo, o repositório mantém internamente o nome gerado para gravação e, se necessário, o tipo de mídia informado no upload. Esses dados não fazem parte do contrato público e nunca incluem caminhos ou nomes controlados pelo cliente como caminho de destino.

## 6. Contratos de API

Os contratos são descritos no caminho do backend. Durante o desenvolvimento, o proxy do frontend encaminha `/api/upload`, `/api/documents` e `/api/documents/:id/download` para os caminhos correspondentes do backend sem o prefixo `/api`.

### Formato de erro

Respostas de erro JSON seguem o formato:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

`code` é estável para uso pelo cliente; `message` é uma mensagem segura para apresentação. Erros inesperados usam mensagem genérica e não incluem stack trace nem caminhos locais.

### POST /upload

- Entrada: `multipart/form-data` com exatamente um arquivo no campo `file`.
- Limite: `MAX_FILE_SIZE_BYTES`, padrão de 10 MiB.
- Tipos de arquivo: não há lista de tipos permitidos nesta versão. A validação do nome e do destino de armazenamento continua obrigatória.
- `owner` e outros campos de identidade enviados pelo cliente não alteram a identidade configurada no servidor.
- Sucesso: `201 Created`, corpo JSON com os metadados públicos criados.
- Cabeçalho `Location`: `/documents/{id}/download`.

Exemplo de resposta:

```json
{
  "id": "7f2a...",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-11T12:00:00.000Z",
  "owner": "local-user"
}
```

### GET /documents

- Entrada: nenhuma.
- Sucesso: `200 OK`, corpo JSON contendo a lista de metadados públicos registrados em memória.
- A lista pode estar vazia. A resposta não contém conteúdo binário nem detalhes internos do filesystem.

Exemplo de resposta:

```json
[
  {
    "id": "7f2a...",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-11-11T12:00:00.000Z",
    "owner": "local-user"
  }
]
```

### GET /documents/:id/download

- Entrada: ID do documento no caminho.
- Sucesso: `200 OK` com o conteúdo binário do arquivo; `Content-Disposition` apresenta o nome original de forma segura. O tipo de conteúdo é o tipo registrado quando disponível, ou `application/octet-stream`.
- ID desconhecido ou arquivo indisponível: `404 Not Found`.
- Falha inesperada de leitura: `500 Internal Server Error`, com erro JSON seguro se a resposta binária ainda não tiver começado.

### Status e códigos de erro

| Status | Código | Situação |
| --- | --- | --- |
| `400 Bad Request` | `FILE_REQUIRED` | Campo `file` ausente. |
| `400 Bad Request` | `INVALID_UPLOAD` | Requisição multipart inválida ou quantidade de arquivos diferente de um. |
| `404 Not Found` | `DOCUMENT_NOT_FOUND` | ID não registrado ou arquivo correspondente indisponível. |
| `413 Payload Too Large` | `FILE_TOO_LARGE` | Arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `500 Internal Server Error` | `STORAGE_ERROR` | Falha inesperada ao salvar, registrar ou ler o arquivo. |

## 7. Decisões arquiteturais

- Backend em Node.js e Express, com dependências direcionadas em uma Clean Architecture simples: `routes -> controllers -> services -> repositories`.
- `routes` registram os endpoints e delegam o tratamento HTTP; `controllers` traduzem entrada, validação básica e resposta HTTP; `services` coordenam regras de negócio; `repositories` mantêm os metadados em memória e acessam os arquivos locais.
- A integração de upload utiliza `multer` com `diskStorage` e destino no `STORAGE_DIR`, cujo valor padrão corresponde a `backend/storage`.
- Frontend em React, organizado em componentes, páginas e serviços. A comunicação com o backend usa `fetch` pelo prefixo `/api` no desenvolvimento.
- O filesystem local guarda o conteúdo dos arquivos; a memória do processo guarda os metadados. Não há banco de dados nem armazenamento externo nesta fase.
- Uma gravação pode deixar um arquivo sem metadados se o registro em memória falhar; metadados não sobrevivem ao reinício. A reconciliação dessas situações não é garantida nesta fase.
- A instância não implementa autenticação. `owner` é apenas um rótulo configurado e não deve ser interpretado como controle de acesso.

## 8. Critérios de aceitação

- Um arquivo válido enviado no campo `file` é gravado localmente e retorna `201` com todos os metadados públicos.
- Envio sem arquivo, multipart inválido e arquivo acima do limite retornam os erros definidos, sem resposta de sucesso parcial.
- A listagem retorna os metadados dos documentos da execução atual e não expõe caminhos locais ou nomes internos.
- O download pelo ID correto retorna os bytes enviados e um nome de arquivo seguro; IDs inexistentes ou arquivos indisponíveis retornam `404`.
- O valor de `owner` vem da configuração do servidor, não dos campos enviados pelo cliente.
- Porta, diretório, limite de arquivo e dono podem ser configurados por ambiente, com padrões documentados.
- O comportamento de perda dos metadados após reinício está documentado e não sugere persistência que o sistema não fornece.

## 9. Plano de execução

1. Implementar o fluxo de envio local com validação do arquivo, limite configurável e registro dos metadados.
2. Disponibilizar a listagem dos metadados da instância em execução.
3. Disponibilizar o download por ID e tratar documento ou arquivo indisponível.
4. Integrar no frontend os fluxos de envio, listagem e download, incluindo estados de erro.
5. Validar os contratos, limites, erros e a limitação de persistência em testes e no fluxo integrado.

Este plano descreve etapas funcionais futuras. Não especifica alterações por arquivo nem executa implementação de backend ou frontend.