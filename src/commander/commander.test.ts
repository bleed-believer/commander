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
    });
});