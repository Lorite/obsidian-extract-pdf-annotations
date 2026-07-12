import { describe, expect, test } from '@jest/globals';
import { colorToHex, markHighlight } from '../src/colorMarker';

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
	test('purple -> Markdown heading (no bullet)', () => {
		expect(markHighlight(rgb(162, 138, 229), 'TEXT')).toEqual('# TEXT');
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
