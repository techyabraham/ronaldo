import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoResult } from "@/components/result/NoResult";
import { YesResult } from "@/components/result/YesResult";
import { ALL_MMDD, isValidMmdd } from "@/lib/dates";
import { summarise } from "@/lib/goals";
import { dateDescription, dateTitle, socialMeta } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_MMDD.map((mmdd) => ({ mmdd }));
}

export async function generateMetadata({ params }: PageProps<"/birthday/[mmdd]">): Promise<Metadata> {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) return {};
  // Titles keep saying "Ronaldo" on purpose: that's what people search for. Absolute (no brand) so they fit in 60.
  const title = dateTitle(mmdd);
  const description = dateDescription(mmdd);
  return {
    title: { absolute: title },
    description,
    ...socialMeta({ title, description, path: `/birthday/${mmdd}` }),
  };
}

export default async function BirthdayPage({ params }: PageProps<"/birthday/[mmdd]">) {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) notFound();
  return summarise(mmdd).count > 0 ? <YesResult mmdd={mmdd} /> : <NoResult mmdd={mmdd} />;
}
