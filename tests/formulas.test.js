import { parseIfabsent, colIndexToLetter, buildFormula } from '../lib/utils/formulas';

// ---------------------------------------------------------------------------
// parseIfabsent
// ---------------------------------------------------------------------------

test.each([
  // falsy inputs → null
  [undefined, null],
  [null,      null],
  ['',        null],
  // formula(...) type always → null (handled separately as a live formula)
  ['formula(=A1+B1)',                                    null],
  ['formula(=CONCATENATE({field_a}, {field_b}))',        null],
  // typed ifabsent expressions → inner value as string
  ['string(hello)',               'hello'],
  ['string(value with spaces)',   'value with spaces'],
  ['int(42)',                     '42'],
  ['float(3.14)',                 '3.14'],
  ['boolean(true)',               'true'],
  // plain value (no wrapper function) → returned as-is
  ['hello',                       'hello'],
])('parseIfabsent(%s)', (input, expected) => {
  expect(parseIfabsent(input)).toBe(expected);
});

// ---------------------------------------------------------------------------
// colIndexToLetter
// ---------------------------------------------------------------------------

test.each([
  // single-letter columns
  [0,  'A'],
  [1,  'B'],
  [25, 'Z'],
  // two-letter columns
  [26, 'AA'],
  [27, 'AB'],
  [51, 'AZ'],
  [52, 'BA'],
  [701, 'ZZ'],
  // three-letter columns
  [702, 'AAA'],
  // string input is coerced to number
  ['3', 'D'],
])('colIndexToLetter(%s)', (input, expected) => {
  expect(colIndexToLetter(input)).toBe(expected);
});

// ---------------------------------------------------------------------------
// buildFormula
// ---------------------------------------------------------------------------

describe('buildFormula', () => {
  const slots = { field_a: 0, field_b: 1, field_c: 25 };

  test.each([
    // no tokens — formula returned unchanged
    ['=A1',                                    0, slots, '=A1'],
    // single token substitution
    ['=SUM({field_a})',                         0, slots, '=SUM(A1)'],
    // row offset: HOT row 4 → HF row 5
    ['=SUM({field_a})',                         4, slots, '=SUM(A5)'],
    // multiple tokens in one template
    ['=CONCATENATE({field_a}, {field_b})',      0, slots, '=CONCATENATE(A1, B1)'],
    ['=CONCATENATE({field_a}, {field_b})',      2, slots, '=CONCATENATE(A3, B3)'],
    // column 25 → 'Z'
    ['={field_c}',                              0, slots, '=Z1'],
    // unknown slot name left unchanged
    ['={unknown_slot}',                         0, slots, '={unknown_slot}'],
  ])('buildFormula(%s, row=%s)', (template, row, slotToCol, expected) => {
    expect(buildFormula(template, row, slotToCol)).toBe(expected);
  });

  test('string column index is coerced to number', () => {
    expect(buildFormula('={field_a}', 0, { field_a: '5' })).toBe('=F1');
  });

  test('multiple rows produce correct row numbers', () => {
    for (let row = 0; row < 5; row++) {
      expect(buildFormula('={field_a}', row, slots)).toBe(`=A${row + 1}`);
    }
  });
});
