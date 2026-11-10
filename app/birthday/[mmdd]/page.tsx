import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoResult } from "@/components/result/NoResult";
import { YesResult } from "@/components/result/YesResult";
import { ALL_MMDD, isValidMmdd } from "@/lib/dates";
import { summarise } from "@/lib/goals";
import { CREATOR } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_MMDD.map((mmdd) => ({ mmdd }));
}

function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
}

export async function generateMetadata({ params }: PageProps<"/birthday/[mmdd]">): Promise<Metadata> {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) return {};
  const s = summarise(mmdd);
  // Titles keep saying "Ronaldo" on purpose: that's what people search for.
  const title = `Did Ronaldo score on ${s.label}? ${s.count ? `Yes — ${s.count} goal${s.count === 1 ? "" : "s"}` : "Not this day"}`;
  const description = s.count
    ? `Cristiano Ronaldo scored ${s.count} official goal${s.count === 1 ? "" : "s"} on ${s.label}, for ${listJoin(s.teams)} (${s.years.join(", ")}). A certified GOAT Day: watch them and check your own birthday.`
    : `Cristiano Ronaldo has never scored an official goal on ${s.label}. Even the GOAT takes a day off: see the nearest days he did, and check your own birthday.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/birthday/${mmdd}` },
    openGraph: { title, description, url: `/birthday/${mmdd}`, type: "website" },
    twitter: { card: "summary_large_image", title, description, creator: `@${CREATOR.handle}` },
  };
}

export default async function BirthdayPage({ params }: PageProps<"/birthday/[mmdd]">) {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) notFound();
  return summarise(mmdd).count > 0 ? <YesResult mmdd={mmdd} /> : <NoResult mmdd={mmdd} />;
}
