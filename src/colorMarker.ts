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
//   Purple  #A28AE5 -> header            "# text"  (Markdown heading, not a list item)
//   Magenta #E56EEE -> vocabulary        "- ✨ text"
//   Orange  #F19837 -> image/figure      "- 🖼️ text"
// Any other colour (e.g. Zotero grey #AAAAAA) becomes a plain "- text" item.

export function colorToHex(color: Uint8ClampedArray | number[] | undefined | null): string {
	if (!color || color.length < 3) return "";
	const h = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
	return `#${h(color[0])}${h(color[1])}${h(color[2])}`;
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
		case "#A28AE5": return `# ${text}`;      // purple — header (Markdown heading, no bullet)
		case "#5FB236": return `- [[${text}]]`;  // green — concept/entity wikilink
		default: return `- ${text}`;             // unknown colour — plain list item
	}
}
