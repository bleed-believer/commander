import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { parseLiteralNames } from './parse-literal.js';

describe('parseLiteralNames', () => {
    it('plain token returns single name', () => {
        deepStrictEqual(parseLiteralNames('run'), ['run']);
    });

    it('token with alias returns main name and alias', () => {
        deepStrictEqual(parseLiteralNames('install(i)'), ['install', 'i']);
    });

    it('token with multiple aliases returns all names', () => {
        deepStrictEqual(parseLiteralNames('install(i,inst)'), ['install', 'i', 'inst']);
    });

    it('drops empty aliases', () => {
        deepStrictEqual(parseLiteralNames('cmd()'), ['cmd']);
        deepStrictEqual(parseLiteralNames('cmd(a,,b)'), ['cmd', 'a', 'b']);
    });
});
