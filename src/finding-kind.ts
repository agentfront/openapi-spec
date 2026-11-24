/**
 * The kind of a finding (internal: not exported from the package).
 *
 * @module
 */

/**
 * The kind of a finding, from its message: every quoted value (as
 * `describeValue` writes it) and every number replaced, so findings that
 * differ only in the value they quote are one kind.
 *
 * The same result as `message.replace(/"(?:[^"\\]|\\.)*"/g, '"…"')` in one
 * pass: that expression scans again from every `"` of an unclosed string,
 * quadratic in its length. A scan that finds no closing quote stops where
 * the expression would, and no quote it passed can open a string either
 * (each was escaped, so a scan from it reads what follows alike).
 */
export function findingKind(message: string): string {
  let kind = '';
  let index = 0;
  while (index < message.length) {
    const open = message.indexOf('"', index);
    if (open === -1) {
      kind += message.slice(index);
      break;
    }
    kind += message.slice(index, open);
    const end = quotedEnd(message, open + 1);
    kind += end.closed ? '"…"' : message.slice(open, end.at);
    index = end.closed ? end.at + 1 : end.at;
  }
  return kind.replace(/[0-9]+/g, '#');
}

/** LF, CR, LINE SEPARATOR, PARAGRAPH SEPARATOR: the characters a regular expression's `.` does not match. */
const LINE_TERMINATORS = new Set([0x0a, 0x0d, 0x2028, 0x2029]);

/**
 * Where the string opened before `from` ends: its closing `"`, or where it
 * cannot go on (the end, or a `\` before nothing or a line terminator, which
 * the expression's `.` does not match).
 */
function quotedEnd(message: string, from: number): { closed: boolean; at: number } {
  for (let index = from; index < message.length; index++) {
    const char = message[index];
    if (char === '"') return { closed: true, at: index };
    if (char === '\\') {
      if (index + 1 === message.length || LINE_TERMINATORS.has(message.charCodeAt(index + 1))) {
        return { closed: false, at: index };
      }
      index++;
    }
  }
  return { closed: false, at: message.length };
}
