// Maps a PDF highlight colour to the vault's one-marker-per-colour scheme, so each
// Zotero highlight colour produces exactly one unambiguous marker (mirrors the
// obsidian-moon-reader `formatHighlight`). pdf.js exposes the highlight colour as
// `annotation.color` (a Uint8ClampedArray [r,g,b]); we match on its hex.
//
// The result is a full Markdown line lead: a "- " list item for most colours,
// but a "# " heading for the header colour (so it isn't a bullet).
// Grounded in Zotero's default annotation palette:
//   Yellow  #FFD400 -> general           "- text"
//   Red     #FF6666 -> super-important   "- ❗ text"
//   Green   #5FB236 -> concept/key term/fact/place/person/date -> "- [[text]]" (wikilink)
//   Blue    #2EA8E5 -> quote             "- 💬 text"
//   Purple  #A28AE5 -> header            "# text"  (Markdown heading, not a list item;
//                                          level from the leading section number:
//                                          "1. …" -> #, "2.1 …" -> ##, "2.1.1 …" -> ###)
//   Magenta #E56EEE -> vocabulary        "- ✨ text"
//   Orange  #F19837 -> image/figure      "- 🖼️ text"
// Any other colour (e.g. Zotero grey #AAAAAA) becomes a plain "- text" item.

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

export function markHighlight(
	color: Uint8ClampedArray | number[] | undefined | null,
	text: string
): string {
	switch (colorToHex(color)) {
		case "#FF6666": return `- ❗ ${text}`;   // red — super-important
		case "#2EA8E5": return `- 💬 ${text}`;   // blue — quote
		case "#FFD400": return `- ${text}`;      // yellow — general (no marker)
		case "#E56EEE": return `- ✨ ${text}`;   // magenta — vocabulary
		case "#F19837": return `- 🖼️ ${text}`;  // orange — image/figure
		case "#A28AE5": return `${"#".repeat(headingLevel(text))} ${text}`; // purple — header
		case "#5FB236": return `- [[${text}]]`;  // green — concept/entity wikilink
		default: return `- ${text}`;             // unknown colour — plain list item
	}
}
