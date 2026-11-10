import { PHOTOS, src, srcSet, type PhotoKey } from "@/lib/photos";

/**
 * Responsive celebration photo (pre-sized WebP in public/siu). Fills its positioned parent by default.
 * `decorative` photos get empty alt text; heroes describe the image.
 */
export function TeamPhoto({
  photo,
  sizes,
  className = "absolute inset-0 h-full w-full",
  priority = false,
  decorative = false,
  grayscale = false,
}: {
  photo: PhotoKey;
  sizes: string;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
  grayscale?: boolean;
}) {
  const p = PHOTOS[photo];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src(p)}
      srcSet={srcSet(p)}
      sizes={sizes}
      width={p.width}
      height={p.height}
      alt={decorative ? "" : p.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      className={`object-cover ${grayscale ? "grayscale" : ""} ${className}`}
      style={{ objectPosition: p.focus }}
    />
  );
}
