import { Link } from "react-router-dom";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function UserAvatar({
  name,
  imageUrl,
  size = 32,
  linkToProfile = true,
}: {
  name: string;
  imageUrl?: string;
  size?: number;
  linkToProfile?: boolean;
}) {
  const inner = imageUrl ? (
    <img
      src={imageUrl}
      alt={name}
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <span className="font-syne text-xs font-bold text-accent">
      {initials(name)}
    </span>
  );

  const box = (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent/20 bg-accent-dim"
      style={{ width: size, height: size }}
    >
      {inner}
    </div>
  );

  if (!linkToProfile) return box;
  return (
    <Link to="/profile" className="block">
      {box}
    </Link>
  );
}
