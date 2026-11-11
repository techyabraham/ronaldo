import Link from "next/link";
import type { Crumb } from "@/lib/seo";

/**
 * Visible trail (Home / Calendar / June / 23 June). Built from the same Crumb list as the BreadcrumbList JSON-LD,
 * so the two always match. Server component; 44px-tall row so every link is a comfortable tap target.
 */
export function Breadcrumb({ crumbs, className = "" }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex min-h-11 flex-wrap items-center gap-x-1.5 text-xs text-faint">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="inline-flex items-center gap-x-1.5">
              {last ? (
                <span aria-current="page" className="font-bold text-text">
                  {c.name}
                </span>
              ) : (
                <>
                  <Link
                    href={c.path}
                    className="inline-flex min-h-11 items-center text-muted underline-offset-2 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
