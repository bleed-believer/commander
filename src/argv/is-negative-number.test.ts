import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { isNegativeNumber } from './is-negative-number.js';

describe('isNegativeNumber', () => {
    it('matches plain negative integers', () => {
        strictEqual(isNegativeNumber('-10'), true);
    });

    it('matches negative decimals', () => {
        strictEqual(isNegativeNumber('-3.14'), true);
        strictEqual(isNegativeNumber('-.5'), true);
    });

    it('matches negative exponential notation', () => {
        strictEqual(isNegativeNumber('-1e3'), true);
        strictEqual(isNegativeNumber('-1.5e-3'), true);
    });

    it('rejects positive numbers', () => {
        strictEqual(isNegativeNumber('10'), false);
    });

    it('rejects flags and dashes', () => {
        strictEqual(isNegativeNumber('-'), false);
        strictEqual(isNegativeNumber('--foo'), false);
        strictEqual(isNegativeNumber('-abc'), false);
    });

    it('rejects partial numbers', () => {
        strictEqual(isNegativeNumber('-10x'), false);
        strictEqual(isNegativeNumber('-1.2.3'), false);
    });
});
