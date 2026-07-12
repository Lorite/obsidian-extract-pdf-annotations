// Maps a PDF highlight/underline colour to the vault's one-marker-per-meaning scheme,
// so each colour produces exactly one unambiguous marker (mirrors the
// obsidian-moon-reader `formatHighlight`). pdf.js exposes the colour as
// `annotation.color` (a Uint8ClampedArray [r,g,b]); we match on its hex.
//
// The result is a full Markdown line lead: a "- " list item for most meanings,
// but a "# " heading for headers (so it isn't a bullet). Meanings:
//   general        "- text"
//   super-important "- ❗ text"
//   concept/entity "- [[text]]" (wikilink)  — key term / fact / place / person / date
//   quote          "- 💬 text"
//   header         "# text" (heading; level from the leading section number:
//                   "1. …" -> #, "2.1 …" -> ##, "2.1.1 …" -> ###)
//   vocabulary     "- ✨ text"
//   image/figure   "- 🖼️ text"
//
// EACH MEANING ACCEPTS MULTIPLE COLOURS (COLOUR_MARKERS below) so the same scheme
// works across the apps used — the Zotero reader AND GNOME "Papers" — which have
// different palettes. Add colours to the relevant hue as you adopt new ones.
// Any unmapped colour becomes a plain "- text" item.

export function colorToHex(color: Uint8ClampedArray | number[] | undefined | null): string {
	if (!color || color.length < 3) return "";
	const h = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
	return `#${h(color[0])}${h(color[1])}${h(color[2])}`;
}

// Heading level for a header highlight, from the depth of its leading section
// number: "1. Introduction" -> 1 (#), "2.1 The first pass" -> 2 (##),
// "2.1.1 …" -> 3 (###). Un-numbered headers (e.g. "Abstract") default to 1.
// Capped at 6 (deepest Markdown heading).
export function headingLevel(text: string): number {
	const m = text.match(/^\s*(\d+(?:\.\d+)*)/);
	const depth = m ? m[1].split(".").length : 1;
	return Math.min(Math.max(depth, 1), 6);
}

type Marker = (text: string) => string;

const MARKERS: Record<string, Marker> = {
	general:   (t) => `- ${t}`,
	important: (t) => `- ❗ ${t}`,
	quote:     (t) => `- 💬 ${t}`,
	concept:   (t) => `- [[${t}]]`,
	vocabulary:(t) => `- ✨ ${t}`,
	image:     (t) => `- 🖼️ ${t}`,
	header:    (t) => `${"#".repeat(headingLevel(t))} ${t}`,
};

// Every highlight/underline colour that maps to each meaning, across the apps used.
// Colours are UPPER-CASE hex. Extend any hue with new palettes as needed.
//   Z = Zotero default palette; G = GNOME palette (used by the "Papers" app).
const COLOUR_MARKERS: { meaning: keyof typeof MARKERS; hexes: string[] }[] = [
	{ meaning: "important",  hexes: ["#FF6666" /*Z*/, "#F66151", "#ED333B", "#E01B24", "#C01C28", "#A51D2D" /*G reds*/] },
	{ meaning: "quote",      hexes: ["#2EA8E5" /*Z*/, "#99C1F1", "#62A0EA", "#3584E4", "#1C71D8", "#1A5FB4" /*G blues*/] },
	{ meaning: "concept",    hexes: ["#5FB236" /*Z*/, "#8FF0A4", "#57E389", "#33D17A", "#2EC27E", "#26A269" /*G greens*/] },
	{ meaning: "header",     hexes: ["#A28AE5" /*Z*/, "#DC8ADD", "#C061CB", "#9141AC", "#813D9C", "#613583" /*G purples*/] },
	{ meaning: "vocabulary", hexes: ["#E56EEE" /*Z*/] },
	{ meaning: "image",      hexes: ["#F19837" /*Z*/, "#FFBE6F", "#FFA348", "#FF7800", "#E66100", "#C64600" /*G oranges*/] },
	{ meaning: "general",    hexes: ["#FFD400" /*Z*/, "#F9F06B", "#F8E45C", "#F5C211", "#E5A50A" /*G yellows*/] },
];

const HEX_TO_MARKER = new Map<string, Marker>();
for (const g of COLOUR_MARKERS)
	for (const hex of g.hexes) HEX_TO_MARKER.set(hex.toUpperCase(), MARKERS[g.meaning]);

export function markHighlight(
	color: Uint8ClampedArray | number[] | undefined | null,
	text: string
): string {
	const mark = HEX_TO_MARKER.get(colorToHex(color));
	return mark ? mark(text) : `- ${text}`; // unmapped colour — plain list item
}
