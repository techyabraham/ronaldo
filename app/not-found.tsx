import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-12 text-center">
      <p className="text-6xl" aria-hidden="true">
        🥅
      </p>
      <h1 className="mt-4 text-3xl font-black">Off target</h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist. Try picking a date instead.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-gold px-6 font-black text-gold-ink"
      >
        Check a birthday
      </Link>
    </div>
  );
}
