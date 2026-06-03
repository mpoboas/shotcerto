import { useEffect, useId, useRef, type ChangeEvent } from "react";
import { userInitials } from "../lib/feedHelpers";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export const AVATAR_MAX_MB = MAX_AVATAR_BYTES / (1024 * 1024);

function validateAvatarFile(file: File): string | null {
  const type = file.type.toLowerCase();
  if (type && !ACCEPTED_TYPES.has(type) && !type.startsWith("image/")) {
    return "Escolhe uma imagem (JPEG, PNG ou WebP).";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return `A imagem deve ter no máximo ${AVATAR_MAX_MB} MB.`;
  }
  return null;
}

type AvatarPickerProps = {
  displayName: string;
  previewUrl: string | null;
  onPreviewUrlChange: (url: string | null) => void;
  onFileChange: (file: File | null) => void;
  onValidationError?: (message: string | null) => void;
};

export function AvatarPicker({
  displayName,
  previewUrl,
  onPreviewUrlChange,
  onFileChange,
  onValidationError,
}: AvatarPickerProps) {
  const galleryInputId = useId();
  const cameraInputId = useId();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function applyFile(file: File | undefined) {
    if (!file) return;
    const validationError = validateAvatarFile(file);
    if (validationError) {
      onValidationError?.(validationError);
      return;
    }
    onValidationError?.(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onPreviewUrlChange(URL.createObjectURL(file));
    onFileChange(file);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onPreviewUrlChange(null);
    onFileChange(null);
    onValidationError?.(null);
  }

  const label = displayName.trim() || "Utilizador";
  const initials = userInitials(label);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-accent/25 bg-accent-dim"
        aria-hidden={!!previewUrl}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Pré-visualização do avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-syne text-2xl font-bold text-accent">
            {initials}
          </span>
        )}
      </div>

      <input
        ref={galleryRef}
        id={galleryInputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onInputChange}
      />
      <input
        ref={cameraRef}
        id={cameraInputId}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={onInputChange}
      />

      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex-1 rounded-[var(--radius-sm)] border border-border2 bg-surface2 px-3 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent/40"
        >
          Galeria
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex-1 rounded-[var(--radius-sm)] border border-border2 bg-surface2 px-3 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent/40"
        >
          Tirar foto
        </button>
      </div>

      {previewUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-muted2 underline-offset-2 hover:text-text hover:underline"
        >
          Remover foto
        </button>
      )}

      <p className="text-center text-xs text-muted">
        Opcional · máx. {AVATAR_MAX_MB} MB
      </p>
    </div>
  );
}
