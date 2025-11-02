import { flatten, partition } from '@apollo-orbit/core';
import { describe, expect, it } from 'vitest';

describe('Array Utils', () => {
  describe('partition', () => {
    it('should partition array based on condition', () => {
      const numbers = [1, 2, 3, 4, 5, 6];
      const [evens, odds] = partition(numbers, n => n % 2 === 0);
      expect(evens).toEqual([2, 4, 6]);
      expect(odds).toEqual([1, 3, 5]);
    });
  });

  describe('flatten', () => {
    it('should flatten a nested array', () => {
      const array = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      const actual = flatten(array);
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      expect(actual).toEqual(expected);
    });
  });
});
