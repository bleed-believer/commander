import { describe, it } from 'node:test';

import {
    Argv,
    Commander,
    Command,
    FlagParseError,
    StaticMismatchError,
    PositionalMismatchError
} from './index.js';

describe('package entrypoint', () => {
    it('exposes the low-level Argv layer', (t: it.TestContext) => {
        t.assert.strictEqual(typeof Argv, 'function');
    });

    it('re-exports the error types thrown across the public boundary', (t: it.TestContext) => {
        t.assert.strictEqual(typeof FlagParseError, 'function');
        t.assert.strictEqual(typeof StaticMismatchError, 'function');
        t.assert.strictEqual(typeof PositionalMismatchError, 'function');
    });

    it('Commander.run throws an error narrowable with the exported type', async (t: it.TestContext) => {
        const app = new Commander([
            new Command({
                positionals: 'build',
                flags: { workers: { type: 'number', required: true } },
                callback: _ => ({ onInit() {} })
            })
        ], { process: { argv: ['node', 'script', 'build'] } });

        await t.assert.rejects(
            () => app.run(),
            (error: unknown) => error instanceof FlagParseError
        );
    });
});
