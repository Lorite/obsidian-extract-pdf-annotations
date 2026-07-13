import { describe, expect, test } from '@jest/globals';
import {
	colorToHex,
	markHighlight,
	headingLevel,
	parseColorMarkerRules,
	applyMarker,
	DEFAULT_COLOR_MARKER_RULES,
} from '../src/colorMarker';

// pdf.js delivers annotation.color as a Uint8ClampedArray [r,g,b].
const rgb = (r: number, g: number, b: number) => new Uint8ClampedArray([r, g, b]);

describe('colorToHex', () => {
	test('formats a Zotero yellow to #FFD400', () => {
		expect(colorToHex(rgb(255, 212, 0))).toEqual('#FFD400');
	});
	test('empty / missing colour yields empty string', () => {
		expect(colorToHex(undefined)).toEqual('');
		expect(colorToHex(new Uint8ClampedArray([]))).toEqual('');
	});
});

describe('headingLevel from the leading section number', () => {
	test('top-level "1." -> 1', () => expect(headingLevel('1. INTRODUCTION')).toEqual(1));
	test('"2.1" -> 2', () => expect(headingLevel('2.1 The first pass')).toEqual(2));
	test('"2.1.1" -> 3', () => expect(headingLevel('2.1.1 Details')).toEqual(3));
	test('un-numbered -> 1', () => expect(headingLevel('Abstract')).toEqual(1));
	test('capped at 6', () => expect(headingLevel('1.1.1.1.1.1.1.1 deep')).toEqual(6));
});

describe('markHighlight maps the Zotero palette to one marker each', () => {
	test('yellow -> general list item (no marker)', () => {
		expect(markHighlight(rgb(255, 212, 0), 'TEXT')).toEqual('- TEXT');
	});
	test('red -> super-important', () => {
		expect(markHighlight(rgb(255, 102, 102), 'TEXT')).toEqual('- ❗ TEXT');
	});
	test('blue -> quote', () => {
		expect(markHighlight(rgb(46, 168, 229), 'TEXT')).toEqual('- 💬 TEXT');
	});
	test('green -> concept wikilink', () => {
		expect(markHighlight(rgb(95, 178, 54), 'TEXT')).toEqual('- [[TEXT]]');
	});
	test('purple -> Markdown heading, level from section number', () => {
		expect(markHighlight(rgb(162, 138, 229), 'TEXT')).toEqual('# TEXT');           // un-numbered
		expect(markHighlight(rgb(162, 138, 229), '1. INTRODUCTION')).toEqual('# 1. INTRODUCTION');
		expect(markHighlight(rgb(162, 138, 229), '2.1 The first pass')).toEqual('## 2.1 The first pass');
		expect(markHighlight(rgb(162, 138, 229), '2.1.1 Details')).toEqual('### 2.1.1 Details');
	});
	test('magenta -> vocabulary', () => {
		expect(markHighlight(rgb(229, 110, 238), 'TEXT')).toEqual('- ✨ TEXT');
	});
	test('orange -> image', () => {
		expect(markHighlight(rgb(241, 152, 55), 'TEXT')).toEqual('- 🖼️ TEXT');
	});
	test('unknown colour (grey) -> plain list item', () => {
		expect(markHighlight(rgb(170, 170, 170), 'TEXT')).toEqual('- TEXT');
	});
});

describe('applyMarker expands the template placeholders', () => {
	test('{{text}} is substituted', () => {
		expect(applyMarker('- ❗ {{text}}', 'hi')).toEqual('- ❗ hi');
	});
	test('{{heading}} expands from the section number', () => {
		expect(applyMarker('{{heading}} {{text}}', '2.1 Method')).toEqual('## 2.1 Method');
	});
	test('braces inside the text stay literal', () => {
		expect(applyMarker('- {{text}}', 'see {{heading}}')).toEqual('- see {{heading}}');
	});
});

describe('parseColorMarkerRules', () => {
	test('maps every listed colour (upper-cased) to its template', () => {
		const lookup = parseColorMarkerRules('#aabbcc, #DDEEFF = - ❗ {{text}}');
		expect(lookup.get('#AABBCC')).toEqual('- ❗ {{text}}');
		expect(lookup.get('#DDEEFF')).toEqual('- ❗ {{text}}');
	});
	test('ignores // comments, blank lines and shapeless lines', () => {
		const lookup = parseColorMarkerRules('// a comment\n\nno equals here\n#123456 = - {{text}}');
		expect(lookup.size).toEqual(1);
		expect(lookup.get('#123456')).toEqual('- {{text}}');
	});
	test('inline /* */ notes on the left are ignored', () => {
		const lookup = parseColorMarkerRules('#123456 /*note*/ = - {{text}}');
		expect(lookup.get('#123456')).toEqual('- {{text}}');
	});
	test('the default rules reproduce the built-in scheme', () => {
		const lookup = parseColorMarkerRules(DEFAULT_COLOR_MARKER_RULES);
		expect(lookup.get('#FF6666')).toEqual('- ❗ {{text}}');
		expect(lookup.get('#5FB236')).toEqual('- [[{{text}}]]');
		expect(lookup.get('#A28AE5')).toEqual('{{heading}} {{text}}');
		expect(lookup.get('#FFD400')).toEqual('- {{text}}');
	});
});

describe('markHighlight honours a custom lookup', () => {
	const lookup = parseColorMarkerRules('#123456 = > {{text}}');
	test('mapped colour uses the custom template', () => {
		expect(markHighlight(rgb(0x12, 0x34, 0x56), 'TEXT', lookup)).toEqual('> TEXT');
	});
	test('colour absent from the custom lookup falls back to a plain item', () => {
		expect(markHighlight(rgb(255, 212, 0), 'TEXT', lookup)).toEqual('- TEXT');
	});
});

describe('multiple colours per meaning — GNOME "Papers" palette maps like Zotero', () => {
	test('GNOME purple #C061CB -> header', () => {
		expect(markHighlight(rgb(0xC0, 0x61, 0xCB), '2.1 Method')).toEqual('## 2.1 Method');
	});
	test('GNOME yellow #F5C211 -> general', () => {
		expect(markHighlight(rgb(0xF5, 0xC2, 0x11), 'TEXT')).toEqual('- TEXT');
	});
	test('GNOME green #33D17A -> concept wikilink', () => {
		expect(markHighlight(rgb(0x33, 0xD1, 0x7A), 'TEXT')).toEqual('- [[TEXT]]');
	});
	test('GNOME red #ED333B -> super-important', () => {
		expect(markHighlight(rgb(0xED, 0x33, 0x3B), 'TEXT')).toEqual('- ❗ TEXT');
	});
});
