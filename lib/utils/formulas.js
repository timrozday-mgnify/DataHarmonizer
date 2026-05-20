/**
 * Extracts the default value from a LinkML ifabsent expression.
 * e.g. "string(hello)" → "hello", "int(42)" → "42", "hello" → "hello"
 * Returns null for formula(...) expressions (handled separately) and falsy input.
 */
export function parseIfabsent(ifabsent) {
  if (!ifabsent) return null;
  if (ifabsent.startsWith('formula(')) return null;
  const match = ifabsent.match(/^\w+\((.+)\)$/);
  return match ? match[1] : ifabsent;
}

/** Convert 0-based column index to Excel column letter(s): 0→'A', 25→'Z', 26→'AA'. */
export function colIndexToLetter(col) {
  let letter = '', n = Number(col) + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/**
 * Translate {slot_name} tokens in a formula template to A1-notation for a given row.
 * Unknown slot names are left as-is.
 * @param {string} formulaTemplate  e.g. '=CONCATENATE({field_a}, "_", {field_b})'
 * @param {number} row              0-based Handsontable row index
 * @param {object} slotToColumn     map of slot name → column index (numeric or string)
 */
export function buildFormula(formulaTemplate, row, slotToColumn) {
  const hfRow = row + 1;
  return formulaTemplate.replace(/\{([^}]+)\}/g, (match, slotName) => {
    const col = slotToColumn[slotName];
    const colNum = col !== undefined ? Number(col) : undefined;
    return colNum !== undefined && !isNaN(colNum) ? colIndexToLetter(colNum) + hfRow : match;
  });
}
