const { parseNumberRange, parseArrayFromString } = require('../src/utilities');

test('Utilities parse number range', () => {
  expect(parseNumberRange('1,4,34,7')).toEqual([1, 4, 34, 7]);
  expect(parseNumberRange(' 5, 2, 8, 0 ')).toEqual([5, 2, 8, 0]);
  expect(parseNumberRange('14')).toEqual([14]);
  expect(parseNumberRange('3-6')).toEqual([3, 4, 5, 6]);
  expect(parseNumberRange('5,7-9')).toEqual([5, 7, 8, 9]);
  expect(parseNumberRange('1-4,6,9-11')).toEqual([1, 2, 3, 4, 6, 9, 10, 11]);
  expect(parseNumberRange('five')).toEqual(NaN);
  expect(parseNumberRange('two, 91')).toEqual([NaN, 91]);
  expect(parseNumberRange()).toEqual(NaN);
});

test('Utilities parse array from string', () => {
  expect(parseArrayFromString('1,4,34,7')).toEqual(['1', '4', '34', '7']);
  expect(parseArrayFromString('19')).toEqual(['19']);
  expect(parseArrayFromString('ru, en, jp')).toEqual(['ru', 'en', 'jp']);
  expect(parseArrayFromString('nl,pt,es')).toEqual(['nl', 'pt', 'es']);
  expect(parseArrayFromString('uk')).toEqual(['uk']);
  expect(parseArrayFromString('')).toEqual([]);
  expect(parseArrayFromString()).toEqual([]);
});
