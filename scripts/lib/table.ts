import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

export type Cell = { text: string; html: string; links: string[] };

/**
 * Expand an HTML table into a rectangular grid, copying rowspan/colspan cells
 * into every position they cover. Header rows (all <th>) are skipped.
 */
export function tableToGrid($: CheerioAPI, table: Element): Cell[][] {
  const grid: Cell[][] = [];
  const pending: Record<number, { cell: Cell; left: number }> = {};
  $(table)
    .find("> tbody > tr, > tr")
    .each((_, tr) => {
      const cells = $(tr).children("td, th");
      if (cells.length && cells.toArray().every((c) => c.tagName === "th") && grid.length === 0) {
        // header row
        return;
      }
      const row: Cell[] = [];
      let col = 0;
      const take = () => {
        while (pending[col] && pending[col].left > 0) {
          row[col] = pending[col].cell;
          pending[col].left--;
          col++;
        }
      };
      cells.each((__, el) => {
        take();
        const $el = $(el);
        $el.find("sup.reference, .reference, style").remove();
        const cell: Cell = {
          text: $el.text().replace(/\s+/g, " ").trim(),
          html: $el.html() ?? "",
          links: $el
            .find("a")
            .toArray()
            .map((a) => $(a).attr("href") ?? ""),
        };
        const rs = parseInt($el.attr("rowspan") ?? "1", 10) || 1;
        const cs = parseInt($el.attr("colspan") ?? "1", 10) || 1;
        for (let k = 0; k < cs; k++) {
          row[col] = cell;
          if (rs > 1) pending[col] = { cell, left: rs - 1 };
          col++;
        }
      });
      take();
      if (row.length) grid.push(row);
    });
  return grid;
}
