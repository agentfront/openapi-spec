import { findingKind } from '../finding-kind';

/** The expression `findingKind` replaces: the oracle its result must equal. */
const byExpression = (message: string): string => message.replace(/"(?:[^"\\]|\\.)*"/g, '"…"').replace(/[0-9]+/g, '#');

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

describe('findingKind', () => {
  it('replaces every quoted value and every number', () => {
    expect(findingKind('Parameter name "id" is a number 2024')).toBe('Parameter name "…" is a number #');
    expect(findingKind('"a\\"b" and "c" in 3 places')).toBe('"…" and "…" in # places');
    expect(findingKind('an empty "" value')).toBe('an empty "…" value');
    expect(findingKind('no quote at all')).toBe('no quote at all');
  });

  it('keeps an unclosed string as written, as the expression does', () => {
    for (const message of [
      '"unclosed',
      'a "b\\"c',
      '"x\\',
      `"a\\\nb" then "c"`,
      `"a\\\rb" then "c"`,
      `"a\\${LINE_SEPARATOR}b" then "c"`,
      `"a\\${PARAGRAPH_SEPARATOR}b" then "c"`,
      '"a\nb"',
    ]) {
      expect(findingKind(message)).toBe(byExpression(message));
    }
  });

  it('gives the result of the expression for every string up to seven characters of quote, backslash, line feed, letter and digit', () => {
    const alphabet = ['"', '\\', '\n', 'a', '1'];
    let strings = [''];
    let compared = 0;
    for (let length = 0; length <= 7; length++) {
      for (const message of strings) {
        if (findingKind(message) !== byExpression(message)) throw new Error(`differs for ${JSON.stringify(message)}`);
        compared++;
      }
      strings = strings.flatMap((prefix) => alphabet.map((char) => prefix + char));
    }
    expect(compared).toBe((5 ** 8 - 1) / 4);
  });

  it('reads an unclosed string of escaped quotes in one pass', () => {
    // The expression scans again from each of these quotes: about 2 * 10^10 steps
    const message = `"${'\\"'.repeat(100_000)}`;
    expect(findingKind(message)).toBe(message);
  }, 2_000);
});
