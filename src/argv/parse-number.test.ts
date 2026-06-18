import { strictEqual, ok } from 'node:assert';
import { describe, it } from 'node:test';

import { parseNumber } from './parse-number.js';

describe('parseNumber', () => {
    it('parses integers and signs', () => {
        strictEqual(parseNumber('10'), 10);
        strictEqual(parseNumber('-10'), -10);
        strictEqual(parseNumber('+10'), 10);
    });

    it('parses decimals and exponentials', () => {
        strictEqual(parseNumber('3.14'), 3.14);
        strictEqual(parseNumber('.5'), 0.5);
        strictEqual(parseNumber('1e3'), 1000);
    });

    it('rejects empty and whitespace-only strings', () => {
        ok(Number.isNaN(parseNumber('')));
        ok(Number.isNaN(parseNumber('   ')));
    });

    it('rejects hexadecimal and Infinity', () => {
        ok(Number.isNaN(parseNumber('0x10')));
        ok(Number.isNaN(parseNumber('Infinity')));
        ok(Number.isNaN(parseNumber('-Infinity')));
    });

    it('rejects non-numeric tokens', () => {
        ok(Number.isNaN(parseNumber('abc')));
        ok(Number.isNaN(parseNumber('1e')));
        ok(Number.isNaN(parseNumber('1.2.3')));
    });
});
