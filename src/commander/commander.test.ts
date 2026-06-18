import { describe, it } from 'node:test';

import { CommandRouter } from '@/command-router/index.js';
import { Commander } from './commander.js';
import { Command } from '@/command/command.js';

const noop = { onInit() {} };

describe('Commander', () => {
    describe('docs()', () => {
        it('returns empty array when there are no targets', (t: it.TestContext) => {
            const app = new Commander([]);
            t.assert.deepStrictEqual(app.docs(), []);
        });

        it('flattens router+commands into prefixed paths', (t: it.TestContext) => {
            const app = new Commander([
                new CommandRouter({
                    path: 'addons',
                    targets: [
                        new Command({
                            description: 'Installs a new addon',
                            positionals: 'install(i) :packages+',
                            flags: {
                                beta: { type: 'boolean', description: 'Installs a beta version' }
                            },
                            callback: _ => noop
                        }),
                        new Command({
                            description: 'Uninstalls an addon',
                            positionals: 'uninstall(u) :packages+',
                            callback: _ => noop
                        })
                    ]
                }),
                new Command({
                    description: 'Shows this help',
                    positionals: 'help :pathParts*',
                    callback: _ => noop
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                {
                    path: [ 'addons', 'install(i)', ':packages+' ],
                    description: 'Installs a new addon',
                    flags: [
                        {
                            name: 'beta',
                            type: 'boolean',
                            required: false,
                            description: 'Installs a beta version',
                        }
                    ]
                },
                {
                    path: [ 'addons', 'uninstall(u)', ':packages+' ],
                    description: 'Uninstalls an addon',
                    flags: []
                },
                {
                    path: [ 'help', ':pathParts*' ],
                    description: 'Shows this help',
                    flags: []
                }
            ]);
        });

        it('router without path does not add tokens to the path', (t: it.TestContext) => {
            const app = new Commander([
                new CommandRouter({
                    targets: [
                        new Command({
                            description: 'Start the server',
                            positionals: 'start',
                            callback: _ => noop
                        }),
                        new Command({
                            description: 'Stop the server',
                            positionals: 'stop',
                            callback: _ => noop
                        })
                    ]
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                { path: [ 'start' ], description: 'Start the server', flags: [] },
                { path: [ 'stop' ],  description: 'Stop the server',  flags: [] }
            ]);
        });

        it('nested routers produce fully concatenated paths', (t: it.TestContext) => {
            const app = new Commander([
                new CommandRouter({
                    path: 'pkg',
                    targets: [
                        new CommandRouter({
                            path: 'scripts',
                            targets: [
                                new Command({
                                    description: 'Run a script',
                                    positionals: 'run :name',
                                    callback: _ => noop
                                })
                            ]
                        })
                    ]
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                { path: [ 'pkg', 'scripts', 'run', ':name' ], description: 'Run a script', flags: [] }
            ]);
        });

        it('multi-segment router path splits into individual tokens', (t: it.TestContext) => {
            const app = new Commander([
                new CommandRouter({
                    path: 'db migrate',
                    targets: [
                        new Command({
                            description: 'Apply pending migrations',
                            positionals: 'up',
                            callback: _ => noop
                        }),
                        new Command({
                            description: 'Revert last migration',
                            positionals: 'down',
                            callback: _ => noop
                        })
                    ]
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                { path: [ 'db', 'migrate', 'up' ],   description: 'Apply pending migrations', flags: [] },
                { path: [ 'db', 'migrate', 'down' ], description: 'Revert last migration',    flags: [] }
            ]);
        });

        it('flag with required:true is reflected in docs', (t: it.TestContext) => {
            const app = new Commander([
                new Command({
                    description: 'Deploy the app',
                    positionals: 'deploy',
                    flags: {
                        env: { type: 'string', required: true, description: 'Target environment' }
                    },
                    callback: _ => noop
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                {
                    path: [ 'deploy' ],
                    description: 'Deploy the app',
                    flags: [
                        { name: 'env', type: 'string', required: true, description: 'Target environment' }
                    ]
                }
            ]);
        });

        it('multiple flags of different types are all listed', (t: it.TestContext) => {
            const app = new Commander([
                new Command({
                    description: 'Build the project',
                    positionals: 'build',
                    flags: {
                        watch:   { type: 'boolean',                          description: 'Watch mode' },
                        target:  { type: 'string',  required: true,          description: 'Output target' },
                        workers: { type: 'number',                           description: 'Worker threads' }
                    },
                    callback: _ => noop
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                {
                    path: [ 'build' ],
                    description: 'Build the project',
                    flags: [
                        { name: 'watch',   type: 'boolean', required: false, description: 'Watch mode'      },
                        { name: 'target',  type: 'string',  required: true,  description: 'Output target'   },
                        { name: 'workers', type: 'number',  required: false, description: 'Worker threads'  }
                    ]
                }
            ]);
        });

        it('command without description produces undefined in docs', (t: it.TestContext) => {
            const app = new Commander([
                new Command({
                    positionals: 'run',
                    callback: _ => noop
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                { path: [ 'run' ], description: undefined, flags: [] }
            ]);
        });

        it('flags-only command produces no empty path segment', (t: it.TestContext) => {
            const app = new Commander([
                new Command({
                    description: 'Build everything',
                    positionals: '',
                    flags: {
                        dryRun: { type: 'boolean', description: 'Do not write output' }
                    },
                    callback: _ => noop
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                {
                    path: [],
                    description: 'Build everything',
                    flags: [
                        { name: 'dry-run', type: 'boolean', required: false, description: 'Do not write output' }
                    ]
                }
            ]);
        });

        it('multi-word flag name is reported in kebab-case', (t: it.TestContext) => {
            const app = new Commander([
                new Command({
                    description: 'Serve the app',
                    positionals: 'serve',
                    flags: {
                        maxConnections: { type: 'number', description: 'Connection cap' }
                    },
                    callback: _ => noop
                })
            ]);

            t.assert.deepStrictEqual(app.docs(), [
                {
                    path: [ 'serve' ],
                    description: 'Serve the app',
                    flags: [
                        { name: 'max-connections', type: 'number', required: false, description: 'Connection cap' }
                    ]
                }
            ]);
        });
    });

    describe('run()', () => {
        it('falls through to a sibling command when an earlier one is missing a required positional', async (t: it.TestContext) => {
            let matched = false;
            const app = new Commander([
                new Command({ positionals: 'deploy :env', callback: _ => ({ onInit() {} }) }),
                new Command({ positionals: 'deploy', callback: _ => ({ onInit() { matched = true; } }) })
            ], { process: { argv: ['node', 'script', 'deploy'] } });

            await app.run();
            t.assert.strictEqual(matched, true);
        });

        it('throws the deferred error when no target matches', async (t: it.TestContext) => {
            const app = new Commander([
                new Command({ positionals: 'deploy :env', callback: _ => ({ onInit() {} }) })
            ], { process: { argv: ['node', 'script', 'deploy'] } });

            await t.assert.rejects(() => app.run());
        });

        it('returns normally when nothing matches and no error was deferred', async (t: it.TestContext) => {
            const app = new Commander([
                new Command({ positionals: 'deploy', callback: _ => ({ onInit() {} }) })
            ], { process: { argv: ['node', 'script', 'unknown'] } });

            await t.assert.doesNotReject(() => app.run());
        });
    });
});