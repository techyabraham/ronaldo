import type { Graph } from "@/lib/jsonld";

/** Server-rendered JSON-LD. "<" is escaped so no string in the data can close the script tag. */
export function JsonLd({ data }: { data: Graph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
