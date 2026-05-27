# shot-certo-presign

Cloudflare Worker que valida o token do PocketBase e devolve uma presigned
PUT URL para upload direto de vídeos para o Cloudflare R2.

## Pré-requisitos

- Node.js 18+
- Conta Cloudflare com R2 configurado (bucket, CORS, API token S3-compatible)

O Wrangler **não** precisa de instalação global — usa `npx wrangler` (já está em
`devDependencies`).

## Secrets

```bash
cd worker
npm install

# Primeira vez
npx wrangler login

# Um comando por secret (o CLI pede o valor)
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put R2_PUBLIC_URL
npx wrangler secret put POCKETBASE_URL
npx wrangler secret put ALLOWED_ORIGINS

# Opcional:
npx wrangler secret put PRESIGN_TTL_SECONDS
```

## Dev e deploy

```bash
npm install
npm run dev      # http://127.0.0.1:8787 (usa wrangler via package.json)
npm run deploy   # equivalente a npx wrangler deploy
```

## API

`POST /presign`

- Header: `Authorization: <token PB>` (vai pelo `pb.authStore.token`)
- Body: `{ "contentType": "video/mp4" }` (opcional, default `video/mp4`)
- Resposta 200:

  ```json
  {
    "presignedUrl": "https://...r2.cloudflarestorage.com/...?X-Amz-...",
    "r2Key": "submissions/<userId>/<ts>-<rand>.mp4",
    "publicUrl": "https://pub-xxx.r2.dev/submissions/<userId>/<ts>-<rand>.mp4",
    "expiresIn": 900
  }
  ```

- 401 se o token PB for inválido/expirado ou se `POCKETBASE_URL` no Worker não for **exatamente** o mesmo URL que `VITE_POCKETBASE_URL` na app (sem barra final). O corpo inclui `hint` com mais detalhe.
- 403 se a origem não estiver em `ALLOWED_ORIGINS` (incluir `http://localhost:5173` em dev).

### Verificar configuração

```bash
cd worker
npx wrangler secret list
# POCKETBASE_URL deve ser igual a VITE_POCKETBASE_URL (ex. https://pb.example.com)
# ALLOWED_ORIGINS deve incluir todas as origens da app, separadas por vírgula
```

Opcional: `PB_AUTH_COLLECTION` se a coleção de login não se chama `users`.
