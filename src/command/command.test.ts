import type { CommandTarget } from './interfaces/index.js';

import { describe, it } from 'node:test';

import { Command } from './command.js';

describe('Command', () => {
    it('Matches the criteria', async (t: it.TestContext) => {
        let capturedContext: unknown;

        const target = new Command({
            description: 'Install a new package',
            positionals: 'install(i) :packages*',
            flags: {
                save: {
                    type: 'boolean',
                    short: 'd',
                    description: 'Install as a production dependency'
                },
                saveDev: {
                    type: 'boolean',
                    short: 'D',
                    description: 'Install as a development dependency'
                }
            },
            callback: context => new class implements CommandTarget {
                onInit(): void {
                    capturedContext = context;
                }
            }
        });

        const result = await target.run({
            argv: ['node', 'script', 'i', '--save-dev', 'typescript', '@types/node']
        });

        t.assert.deepStrictEqual(result, { matches: true });
        t.assert.deepStrictEqual(capturedContext, {
            positionals: {
                packages: [ 'typescript', '@types/node' ]
            },
            flags: {
                save: undefined,
                saveDev: true
            },
            tail: []
        });
    });

    it('Matches the criteria and fail', async (t: it.TestContext) => {
        const target = new Command({
            description: 'Install a new package',
            positionals: 'install(i) :packages*',
            flags: {
                save: {
                    type: 'boolean',
                    short: 'd',
                    description: 'Install as a production dependency'
                },
                saveDev: {
                    type: 'boolean',
                    short: 'D',
                    description: 'Install as a development dependency'
                }
            },
            callback: _ => new class implements CommandTarget {
                onInit(): void {
                    throw new Error('jajaja');
                }
            }
        });

        const matches = await target.run({
            argv: ['node', 'script', 'i', '--save-dev', 'typescript', '@types/node']
        });

        t.assert.deepStrictEqual(matches, { matches: true, error: new Error('jajaja') });
    });

    it('Doesn\'t match the criteria', async (t: it.TestContext) => {
        let capturedContext: unknown;

        const target = new Command({
            description: 'Install a new package',
            positionals: 'install(i) :packages*',
            flags: {
                save: {
                    type: 'boolean',
                    short: 'd',
                    description: 'Install as a production dependency'
                },
                saveDev: {
                    type: 'boolean',
                    short: 'D',
                    description: 'Install as a development dependency'
                }
            },
            callback: context => new class implements CommandTarget {
                onInit(): void {
                    capturedContext = context;
                }
            }
        });

        const result = await target.run({
            argv: ['node', 'script', 'add', '--save', 'typescript']
        });

        t.assert.deepStrictEqual(result, { matches: false });
        t.assert.deepStrictEqual(capturedContext, undefined);
    });
});
