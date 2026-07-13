// Maps a PDF highlight/underline colour to the vault's one-marker-per-meaning scheme,
// so each colour produces exactly one unambiguous marker (mirrors the
// obsidian-moon-reader `formatHighlight`). pdf.js exposes the colour as
// `annotation.color` (a Uint8ClampedArray [r,g,b]); we match on its hex.
//
// The colour -> marker map is user-configurable via the "Colour marker rules"
// plugin setting (DEFAULT_COLOR_MARKER_RULES below is the built-in default). Each
// rule is one line "<hex colours> = <line template>", where the template is a full
// Markdown line lead (a "- " list item for most meanings, a "# " heading for
// headers) with two placeholders:
//   {{text}}     the highlighted text
//   {{heading}}  Markdown heading marks derived from the leading section number
//                ("1." -> #, "2.1" -> ##, "2.1.1" -> ###)
// The default reproduces the previous hard-coded scheme:
//   general        "- text"          quote          "- 💬 text"
//   super-important "- ❗ text"        concept/entity "- [[text]]" (wikilink)
//   vocabulary     "- ✨ text"        image/figure   "- 🖼️ text"
//   header         "# text" (heading; level from the leading section number)
//
// EACH TEMPLATE ACCEPTS MULTIPLE COLOURS so the same scheme works across the apps
// used — the Zotero reader AND GNOME "Papers" — which have different palettes.
// Any colour with no rule becomes a plain "- text" item.

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

// Built-in default rules — reproduces the previous hard-coded scheme. Users can
// override this via the "Colour marker rules" setting. One rule per line:
//   <hex colours, comma/space separated> = <line template>
// LHS: any number of #RRGGBB colours (inline /* */ notes are ignored).
// RHS: a Markdown line template with the {{text}} and {{heading}} placeholders.
// Lines starting with "//" are comments; unparseable lines are ignored.
//   Z = Zotero default palette; G = GNOME palette (used by the "Papers" app).
export const DEFAULT_COLOR_MARKER_RULES = [
	"// <hex colours, comma/space separated> = <line template>   (placeholders: {{text}}, {{heading}})",
	"// Z = Zotero default palette; G = GNOME palette (\"Papers\" app). Any unlisted colour -> plain \"- text\".",
	"#FF6666 /*Z*/, #F66151, #ED333B, #E01B24, #C01C28, #A51D2D /*G reds*/    = - ❗ {{text}}",
	"#2EA8E5 /*Z*/, #99C1F1, #62A0EA, #3584E4, #1C71D8, #1A5FB4 /*G blues*/   = - 💬 {{text}}",
	"#5FB236 /*Z*/, #8FF0A4, #57E389, #33D17A, #2EC27E, #26A269 /*G greens*/  = - [[{{text}}]]",
	"#A28AE5 /*Z*/, #DC8ADD, #C061CB, #9141AC, #813D9C, #613583 /*G purples*/ = {{heading}} {{text}}",
	"#E56EEE /*Z*/                                                            = - ✨ {{text}}",
	"#F19837 /*Z*/, #FFBE6F, #FFA348, #FF7800, #E66100, #C64600 /*G oranges*/ = - 🖼️ {{text}}",
	"#FFD400 /*Z*/, #F9F06B, #F8E45C, #F5C211, #E5A50A /*G yellows*/          = - {{text}}",
].join("\n");

const HEX_RE = /#[0-9A-Fa-f]{6}/g;

// Parse the rules text into a hex(UPPER) -> line-template lookup. On a duplicate
// colour the later rule wins. Blank lines, "//" comments, and lines without a
// valid "#hex … = template" shape are ignored.
export function parseColorMarkerRules(rules: string): Map<string, string> {
	const lookup = new Map<string, string>();
	for (const raw of rules.split("\n")) {
		const line = raw.trim();
		if (!line || line.startsWith("//")) continue;
		const eq = line.indexOf("=");
		if (eq < 0) continue;
		const template = line.slice(eq + 1).trim();
		const hexes = line.slice(0, eq).match(HEX_RE);
		if (!template || !hexes) continue;
		for (const hex of hexes) lookup.set(hex.toUpperCase(), template);
	}
	return lookup;
}

// Expand a line template for a given highlighted text. {{heading}} is resolved
// first (from the section number) so any braces inside the text stay literal.
export function applyMarker(template: string, text: string): string {
	return template
		.split("{{heading}}").join("#".repeat(headingLevel(text)))
		.split("{{text}}").join(text);
}

// The default scheme, parsed once — used when no explicit lookup is passed.
const defaultLookup = parseColorMarkerRules(DEFAULT_COLOR_MARKER_RULES);

export function markHighlight(
	color: Uint8ClampedArray | number[] | undefined | null,
	text: string,
	lookup: Map<string, string> = defaultLookup
): string {
	const template = lookup.get(colorToHex(color));
	return template ? applyMarker(template, text) : `- ${text}`; // unmapped colour — plain list item
}
