import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface Env {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
  POCKETBASE_URL: string;
  /** Nome ou id da coleção auth (default: users). */
  PB_AUTH_COLLECTION?: string;
  ALLOWED_ORIGINS: string;
  PRESIGN_TTL_SECONDS?: string;
}

interface PresignRequestBody {
  contentType?: string;
}

interface PresignResponse {
  presignedUrl: string;
  r2Key: string;
  publicUrl: string;
  expiresIn: number;
}

function allowedOrigin(env: Env, request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const list = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  return list.includes(origin) ? origin : null;
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

function pocketBaseBase(env: Env): string {
  return env.POCKETBASE_URL.replace(/\/+$/, "");
}

function normalizeAuthHeader(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  // PocketBase espera o JWT direto; aceitar também "Bearer <jwt>".
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : value;
}

function authCollectionCandidates(
  env: Env,
  token: string,
): string[] {
  const configured = env.PB_AUTH_COLLECTION?.trim();
  const fromEnv = configured ? [configured] : [];
  const defaults = ["users", "_pb_users_auth_"];

  let fromJwt: string | undefined;
  const parts = token.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      ) as { collectionId?: string };
      if (payload.collectionId) fromJwt = payload.collectionId;
    } catch {
      // ignore
    }
  }

  const ordered = [
    ...fromEnv,
    ...(fromJwt ? [fromJwt] : []),
    ...defaults,
  ];
  return [...new Set(ordered)];
}

async function tryAuthRefresh(
  base: string,
  collection: string,
  token: string,
): Promise<{ id: string } | null> {
  const url = `${base}/api/collections/${encodeURIComponent(collection)}/auth-refresh`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { record?: { id?: string } };
  if (!data.record?.id) return null;
  return { id: data.record.id };
}

async function validatePocketBaseAuth(
  env: Env,
  authHeader: string | null,
): Promise<{ id: string } | null> {
  const token = normalizeAuthHeader(authHeader);
  if (!token) return null;

  const base = pocketBaseBase(env);
  for (const collection of authCollectionCandidates(env, token)) {
    const user = await tryAuthRefresh(base, collection, token);
    if (user) return user;
  }
  return null;
}

function buildS3Client(env: Env): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(env, request);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/presign") {
      return jsonResponse({ error: "not_found" }, 404, origin);
    }

    if (!origin) {
      return jsonResponse(
        {
          error: "origin_not_allowed",
          hint: "Adiciona o domínio da app (ex. http://localhost:5173) ao secret ALLOWED_ORIGINS do Worker.",
        },
        403,
        null,
      );
    }

    const auth = await validatePocketBaseAuth(
      env,
      request.headers.get("Authorization"),
    );
    if (!auth) {
      return jsonResponse(
        {
          error: "unauthorized",
          hint:
            "Token PocketBase inválido ou expirado, ou POCKETBASE_URL do Worker não coincide com a app. Volta a iniciar sessão e confirma o secret POCKETBASE_URL.",
        },
        401,
        origin,
      );
    }

    let body: PresignRequestBody = {};
    try {
      const text = await request.text();
      body = text ? (JSON.parse(text) as PresignRequestBody) : {};
    } catch {
      return jsonResponse({ error: "invalid_json" }, 400, origin);
    }

    const contentType = body.contentType ?? "video/mp4";
    if (!/^video\/(mp4|quicktime|webm)$/.test(contentType)) {
      return jsonResponse({ error: "invalid_content_type" }, 400, origin);
    }

    const ttl = Number(env.PRESIGN_TTL_SECONDS ?? "900");
    const r2Key = `submissions/${auth.id}/${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}.mp4`;

    const s3 = buildS3Client(env);
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: r2Key,
      ContentType: contentType,
    });
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: ttl });

    const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${r2Key}`;

    const payload: PresignResponse = {
      presignedUrl,
      r2Key,
      publicUrl,
      expiresIn: ttl,
    };
    return jsonResponse(payload, 200, origin);
  },
};
