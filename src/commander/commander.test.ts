import { describe, it } from 'node:test';
import { Commander } from './commander.js';
import { CommandRouter } from '@/command-router/command-router.js';
import { Command } from '@/command/command.js';

describe('Commander', () => {
    it('Generate docs', (t: it.TestContext) => {
        const app = new Commander([
            new CommandRouter({
                path: 'addons',
                targets: [
                    new Command({
                        description: 'Installs a new addon',
                        positionals: 'install(i) :packages+',
                        flags: {
                            beta:   { type: 'boolean', description: 'Installs a beta version' }
                        },

                        callback: _ => ({ onInit() {} })
                    }),
                    new Command({
                        description: 'Uninstalls an addon',
                        positionals: 'uninstall(u) :packages+',
                        callback: _ => ({ onInit() {} })
                    })
                ]
            }),
            new Command({
                description: 'Shows this help',
                positionals: 'help :pathParts*',
                callback: _ => ({ onInit() {} })
            })
        ]);

        const docs = app.docs();
        t.assert.deepStrictEqual(docs, [
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
                description: 'Installs a new addon',
                flags: []
            },
            {
                path: [ 'help', ':pathParts*' ],
                description: 'Shows this help',
                flags: []
            }
        ]);
    });
});