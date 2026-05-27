# Shot Certo

Web app mobile-first para grupos de amigos competirem em desafios de bebida em
vídeo. Compressão e medição de duração acontecem inteiramente no browser com
FFmpeg.wasm; o vídeo vai direto do dispositivo para o Cloudflare R2 via
presigned URL. O PocketBase no Oracle Cloud apenas guarda metadados e gere
autenticação.

## Stack

- React 19 + Vite + TypeScript + Tailwind v4 (deploy: Netlify)
- PocketBase 0.27 (auth + dados, no Oracle ARM)
- Cloudflare R2 (vídeos)
- Cloudflare Worker (presigned PUT URLs com `@aws-sdk/client-s3`)
- `@ffmpeg/ffmpeg` 0.12.x (compressão e probe de duração no browser)

## Arquitetura

```
Browser ──▶ Worker /presign ──▶ R2 (PUT direto)
   │                                  │
   ├──▶ PocketBase (auth, metadados) ◀┘
```

O vídeo nunca passa pelo PocketBase. O Worker valida o token PB antes de
emitir cada URL, e a chave inclui o `userId` do utilizador autenticado.

## Estrutura

```
.
├── src/                    React app
│   ├── lib/                pocketbase, ffmpeg, upload, queries, format
│   ├── hooks/              useAuth, useFfmpeg
│   ├── components/         AppShell, BottomNav, ChallengeCard, etc.
│   └── pages/              Login, Home, Submit, Ranking, Profile
├── worker/                 Cloudflare Worker para presigned URLs
├── netlify.toml            Headers COOP/COEP + SPA redirect
└── vite.config.ts          Headers COOP/COEP em dev/preview
```

## Setup local

```bash
cp .env.example .env
# Editar .env com os teus URLs:
#   VITE_POCKETBASE_URL=https://...
#   VITE_PRESIGN_URL=https://...

npm install
npm run dev          # http://localhost:5173 já com COOP/COEP
```

O FFmpeg.wasm precisa de **SharedArrayBuffer**, que só funciona com os headers
`Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy:
require-corp`. Em desenvolvimento já estão aplicados via [`vite.config.ts`](vite.config.ts);
em produção via [`netlify.toml`](netlify.toml).

## Setup inicial dos serviços

Ordem recomendada:

1. **R2** — criar bucket, ativar acesso público (ou custom domain), configurar
   CORS com `PUT`/`GET` para o domínio da app, criar API token S3-compatible.
2. **Worker** — ver [`worker/README.md`](worker/README.md): `npx wrangler login`,
   carregar secrets com `npx wrangler secret put <NOME>`, depois `npm run deploy`
   dentro de `worker/`. Anotar o URL final para `VITE_PRESIGN_URL`.
3. **PocketBase** — criar as collections no admin (users, challenges,
   submissions, reactions, comments, etc.) conforme o modelo em produção.
   Criar utilizadores no admin (sem registo público) e alguns desafios para
   testar.
4. **Netlify** — ligar o repo, definir `VITE_POCKETBASE_URL` e
   `VITE_PRESIGN_URL` nas env vars do site, build automático.

## Build e deploy

```bash
npm run build                    # gera dist/
cd worker && npm install && npm run deploy
```

Netlify usa [`netlify.toml`](netlify.toml) automaticamente (`npm run build` →
publica `dist`).

## Lógica de scoring

| Tipo de desafio | Ranking                                  |
| --------------- | ---------------------------------------- |
| `exact_time`    | `abs(duration - target)` ASC (menor melhor) |
| `speed_run`     | `duration_seconds` ASC (mais rápido melhor) |

A `duration_seconds` é sempre extraída via FFmpeg.wasm parsing dos logs do
ffmpeg sobre o vídeo comprimido — nunca dos metadados do ficheiro original
nem de `HTMLVideoElement.duration`.

## Limites

- Ficheiro original máximo: **500MB** (rejeitado no frontend).
- Output esperado: MP4 H.264 720p ~1Mbps, `<` 20MB para clipes curtos.

## Checklist de validação manual

1. Login com utilizador criado no admin do PocketBase.
2. Câmara abre no mobile via `capture="environment"`.
3. Compressão mostra barra de progresso; tamanho final reduzido vs original.
4. Upload PUT vai direto para R2 (verificar `dev tools → Network`); aparece
   record em `submissions`.
5. Ranking `exact_time` ordena por menor `delta_seconds`.
6. Ranking `speed_run` ordena por menor `duration_seconds`.
7. Feed mostra leaderboard inline (top 3) de cada desafio.
8. Perfil lista as minhas submissões e tem botão de logout.

## Troubleshooting

- **`SharedArrayBuffer is not defined`** (só no fluxo Submeter) — confirmar headers
  COOP/COEP em `/ffmpeg/*` no `netlify.toml`.
- **Vídeo no feed não reproduz** — confirmar CORS do R2 com `GET` para o domínio da
  app; não aplicar `COEP: require-corp` em `/*` (bloqueia R2 sem CORP).
- **CORS bloqueado no PUT R2** — verificar `AllowedOrigins` no bucket R2 (tem
  de incluir o domínio Netlify exato).
- **401 do Worker** — (1) volta a iniciar sessão; (2) confirma que o secret `POCKETBASE_URL` do Worker é **igual** a `VITE_POCKETBASE_URL` (mesmo host, `https`); (3) confirma que o PocketBase é acessível publicamente a partir da internet (o Worker chama `auth-refresh` no servidor).
- **403 do Worker** — origem não consta em `ALLOWED_ORIGINS` (ex. `http://localhost:5173,https://shotcerto.netlify.app`).
- **FFmpeg lento no iPhone** — primeira carga descarrega ~30MB; mostra spinner.
