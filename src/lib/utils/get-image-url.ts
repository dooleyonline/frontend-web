export default function getImageURL(src: string | null | undefined): string {
  if (!src) return "/images/fallback.png";

  const path = src.replace(/^\/+/, "");
  return `/images/${path}`;
}
