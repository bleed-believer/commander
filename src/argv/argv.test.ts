import { describe, it } from 'node:test';

import { Argv } from './argv.js';

describe('Argv.serialize', () => {
    it('hola mundo', (t: it.TestContext) => {
        const resp = Argv.serialize({
            argv: [
                ...process.argv.slice(0, 2),
                'hola', 'mundo'
            ]
        });

        t.assert.deepStrictEqual(resp, {
            positionals: [ 'hola', 'mundo' ],
            flags: { }
        });
    });

    it('hola mundo -c ./tsconfig.json', (t: it.TestContext) => {
        const resp = Argv.serialize({
            argv: [
                ...process.argv.slice(0, 2),
                'hola', 'mundo', '-c', './tsconfig.json'
            ]
        });

        t.assert.deepStrictEqual(resp, {
            positionals: [ 'hola', 'mundo' ],
            flags: {
                '-c': [ './tsconfig.json' ]
            }
        });
    });

    it('hola -c ./tsconfig.json mundo -c ./tsconfig.build.json', (t: it.TestContext) => {
        const resp = Argv.serialize({
            argv: [
                ...process.argv.slice(0, 2),
                'hola',
                '-c', './tsconfig.json',
                'mundo',
                '-c', './tsconfig.build.json',
            ]
        });

        t.assert.deepStrictEqual(resp, {
            positionals: [ 'hola', 'mundo' ],
            flags: {
                '-c': [ './tsconfig.json', './tsconfig.build.json' ]
            }
        });
    });

    it('hola mundo -c ./tsconfig.json -- foo --bar bak', (t: it.TestContext) => {
        const resp = Argv.serialize({
            argv: [
                ...process.argv.slice(0, 2),
                'hola', 'mundo', '-c', './tsconfig.json',
                '--', 'foo', '--bar', 'bak'
            ]
        });

        t.assert.deepStrictEqual(resp, {
            positionals: [ 'hola', 'mundo' ],
            flags: {
                '--': [ 'foo', '--bar', 'bak' ],
                '-c': [ './tsconfig.json' ]
            }
        });
    });
});

describe('new Argv(...).parse(...)', () => {
    it('throws when positional does not match any alias', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'install(i) :packages*'
        });

        t.assert.throws(() => argv.parse({
            positionals: [ 'add', 'typescript' ],
            flags: {}
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
            positionals: [ 'i', 'typescript', '@types/node' ],
            flags: {
                '--save-dev': [ ]
            }
        });

        t.assert.deepStrictEqual(resp, {
            positionals: {
                packages: [ 'typescript', '@types/node' ]
            },
            flags: {
                saveDev: true
            },
            tail: []
        })
    });

    it('run (optional :target omitted)', (t: it.TestContext) => {
        const argv = new Argv({
            positionals: 'run :target?'
        });

        const resp = argv.parse({
            positionals: [ 'run' ],
            flags: {}
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
            positionals: [ 'run', './src/index.ts' ],
            flags: {}
        });

        t.assert.deepStrictEqual(resp, {
            positionals: { target: './src/index.ts' },
            flags: {},
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
            positionals: [ 'run', './src/index.ts' ],
            flags: {
                '--': [ 'serve', '--port', '8080' ],
                '-c': [ './tsconfig.json' ]
            }
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