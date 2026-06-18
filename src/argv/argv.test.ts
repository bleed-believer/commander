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

    it('throws on extra positionals beyond the template', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'build'
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'build', 'extra']
        }), /Unexpected positional "extra" at position 1/);
    });

    it('throws on extra positionals after a fixed capture', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target'
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run', 'a', 'b']
        }), /Unexpected positional "b" at position 2/);
    });

    it('does not throw when a variadic consumes the rest', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'install :packages*'
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'install', 'a', 'b', 'c']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { packages: ['a', 'b', 'c'] },
            flags: {},
            tail: []
        });
    });

    it('throws when a variadic token is not the last in the template', (t: it.TestContext) => {
        t.assert.throws(() => new Argv({
            positionals: 'cp :srcs* :dest'
        }), /Variadic positional ":srcs\*" must be the last token/);
    });

    it('throws when a one-or-more variadic is not the last in the template', (t: it.TestContext) => {
        t.assert.throws(() => new Argv({
            positionals: 'cp :srcs+ :dest'
        }), /Variadic positional ":srcs\+" must be the last token/);
    });

    it('matches a flags-only command with an empty positionals template', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: '',
            flags: {
                verbose: { type: 'boolean', short: 'v' }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', '--verbose']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {},
            flags: { verbose: true },
            tail: []
        });
    });

    it('throws on positionals given to an empty template', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: ''
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'extra']
        }), /Unexpected positional "extra" at position 0/);
    });

    it('boolean flag with array:true still yields a single boolean', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                verbose: { type: 'boolean', array: true }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', '--verbose']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {},
            flags: { verbose: true },
            tail: []
        });
    });

    it('throws when a non-array value flag is given more than once', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                name: { type: 'string' }
            }
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run', '--name', 'a', '--name', 'b']
        }), /Flag "--name" expects a single value but received 2/);
    });

    it('accepts repeated values for an array flag', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                name: { type: 'string', array: true }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', '--name', 'a', '--name', 'b']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {},
            flags: { name: ['a', 'b'] },
            tail: []
        });
    });

    it('throws when a string flag is given without a value', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                config: { type: 'string', short: 'c' }
            }
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run', '--config']
        }), /Flag "--config" expects a value/);
    });

    it('throws when a number flag is given without a value', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                count: { type: 'number' }
            }
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run', '--count']
        }), /Flag "--count" expects a value/);
    });

    it('throws on an empty number flag value', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                count: { type: 'number' }
            }
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run', '--count=']
        }), /Flag "--count" expects a value/);
    });

    it('accepts an explicit empty string value for a string flag', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                message: { type: 'string', short: 'm' }
            }
        });

        t.assert.deepStrictEqual(argv.parse({
            argv: ['node', 'script', 'run', '--message=']
        }), {
            positionals: {},
            flags: { message: '' },
            tail: []
        });

        t.assert.deepStrictEqual(argv.parse({
            argv: ['node', 'script', 'run', '--message', '']
        }), {
            positionals: {},
            flags: { message: '' },
            tail: []
        });
    });

    it('throws on Infinity and hexadecimal number flag values', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                count: { type: 'number' }
            }
        });

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run', '--count=Infinity']
        }), /expects a number but got "Infinity"/);

        t.assert.throws(() => argv.parse({
            argv: ['node', 'script', 'run', '--count=0x10']
        }), /expects a number but got "0x10"/);
    });

    it('captures a negative number as a value flag', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run',
            flags: {
                temp: {
                    type: 'number',
                    short: 't'
                }
            }
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'run', '--temp', '-10']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {},
            flags: { temp: -10 },
            tail: []
        });
    });

    it('treats a lone dash as a positional', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'cat :file'
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'cat', '-']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { file: '-' },
            flags: {},
            tail: []
        });
    });

    it('treats a standalone negative number as a positional', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'calc :a :b'
        });

        const resp = argv.parse({
            argv: ['node', 'script', 'calc', '-1', '-2.5']
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { a: '-1', b: '-2.5' },
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
