import { describe, it } from 'node:test';

import { Argv } from './argv.js';

describe('new Argv(...).parse(...)', () => {
    it('throws when positional does not match any alias', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'install(i) :packages*'
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'add', 'typescript']
        }), /Expected "install" or "i" at position 0, got "add"/);
    });

    it('i --save-dev typescript @types/node', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'install(i) :packages*',
            flags: {
                saveDev: {
                    type: 'boolean',
                    short: 'D'
                }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'i', '--save-dev', 'typescript', '@types/node']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {
                packages: [ 'typescript', '@types/node' ]
            },
            flags: {
                saveDev: true
            },
            tail: []
        });
    });

    it('i --save mssql typeorm (boolean flag before positionals)', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'install(i) :packages*',
            flags: {
                save: {
                    type: 'boolean',
                    short: 'd'
                }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'i', '--save', 'mssql', 'typeorm']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {
                packages: [ 'mssql', 'typeorm' ]
            },
            flags: {
                save: true
            },
            tail: []
        });
    });

    it('run (optional :target omitted)', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target?'
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { target: undefined },
            flags: {},
            tail: []
        });
    });

    it('run ./src/index.ts (optional :target provided)', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target?'
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', './src/index.ts']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { target: './src/index.ts' },
            flags: {},
            tail: []
        });
    });

    it('unknown flag does not swallow the following positional', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target'
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', '--foo', 'prod']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { target: 'prod' },
            flags: {},
            tail: []
        });
    });

    it('boolean flag does not swallow the following positional', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target',
            flags: {
                verbose: {
                    type: 'boolean',
                    short: 'v'
                }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', '--verbose', 'prod']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { target: 'prod' },
            flags: { verbose: true },
            tail: []
        });
    });

    it('declared value flag still consumes its value', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target',
            flags: {
                config: {
                    type: 'string',
                    short: 'c'
                }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', '--config', './tsconfig.json', 'prod']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { target: 'prod' },
            flags: { config: './tsconfig.json' },
            tail: []
        });
    });

    it('throws when a required flag is missing', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target?',
            flags: {
                config: {
                    type: 'string',
                    short: 'c',
                    required: true
                }
            }
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run']
        }), /Flag "--config" is required/);
    });

    it('does not throw when a required flag is provided', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target?',
            flags: {
                config: {
                    type: 'string',
                    short: 'c',
                    required: true
                }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', '-c', './tsconfig.json']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { target: undefined },
            flags: { config: './tsconfig.json' },
            tail: []
        });
    });

    it('run ./src/index.ts -c ./tsconfig.json -- serve --port 8080', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target',
            flags: {
                config: {
                    type: 'string',
                    short: 'c'
                }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', './src/index.ts', '-c', './tsconfig.json', '--', 'serve', '--port', '8080']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {
                target: './src/index.ts'
            },
            flags: {
                config: './tsconfig.json'
            },
            tail: [ 'serve', '--port', '8080' ]
        });
    });
});
