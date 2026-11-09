/** Minimal wikitext helpers: brace-matched template extraction + parameter splitting. */

export type Template = { name: string; params: Record<string, string>; positional: string[]; start: number };

/** Find every top-level occurrence of templates whose name matches `re`. */
export function findTemplates(text: string, re: RegExp): Template[] {
  const out: Template[] = [];
  let i = 0;
  while ((i = text.indexOf("{{", i)) !== -1) {
    const end = matchBraces(text, i);
    if (end < 0) break;
    const inner = text.slice(i + 2, end - 2);
    const name = inner.split("|")[0].trim();
    if (re.test(name)) {
      out.push({ ...parseParams(inner), name, start: i });
      i = end;
    } else {
      i += 2;
    }
  }
  return out;
}

/** Index just past the "}}" that closes the "{{" at `start`. */
export function matchBraces(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length - 1; i++) {
    if (text[i] === "{" && text[i + 1] === "{") {
      depth++;
      i++;
    } else if (text[i] === "}" && text[i + 1] === "}") {
      depth--;
      i++;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Split a template body on top-level "|" (ignoring pipes inside {{ }} and [[ ]]). */
export function splitTop(inner: string): string[] {
  const parts: string[] = [];
  let depthT = 0;
  let depthL = 0;
  let cur = "";
  for (let i = 0; i < inner.length; i++) {
    const two = inner.slice(i, i + 2);
    if (two === "{{" || two === "}}" || two === "[[" || two === "]]") {
      if (two === "{{") depthT++;
      else if (two === "}}") depthT--;
      else if (two === "[[") depthL++;
      else depthL--;
      cur += two;
      i++;
    } else if (inner[i] === "|" && depthT === 0 && depthL === 0) {
      parts.push(cur);
      cur = "";
    } else cur += inner[i];
  }
  parts.push(cur);
  return parts;
}

function parseParams(inner: string) {
  const parts = splitTop(inner).slice(1);
  const params: Record<string, string> = {};
  const positional: string[] = [];
  for (const p of parts) {
    const eq = p.indexOf("=");
    const key = eq > 0 ? p.slice(0, eq).trim() : "";
    if (eq > 0 && /^[\w\s-]+$/.test(key)) params[key.toLowerCase()] = p.slice(eq + 1).trim();
    else positional.push(p.trim());
  }
  return { params, positional };
}

/** Strip links, templates, refs, comments and tags to plain text. */
export function plain(s: string): string {
  return s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{(?:aet|a\.e\.t\.)\}\}/gi, " (a.e.t.)")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/'''?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain-text section heading in effect at each offset of the document. */
export function headingsAt(text: string) {
  const heads: { pos: number; level: number; title: string }[] = [];
  const re = /^(={2,6})\s*(.*?)\s*\1\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) heads.push({ pos: m.index, level: m[1].length, title: plain(m[2]) });
  return (pos: number) => {
    const chain: Record<number, string> = {};
    for (const h of heads) {
      if (h.pos > pos) break;
      chain[h.level] = h.title;
      for (let l = h.level + 1; l <= 6; l++) delete chain[l];
    }
    return chain;
  };
}
