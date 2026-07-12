import { describe, expect, test } from '@jest/globals';
import { colorToHex, markHighlight, headingLevel } from '../src/colorMarker';

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
