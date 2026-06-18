import { describe, it } from 'node:test';

import { CommandRouter } from './command-router.js';
import { Command } from '@/command/index.js';

describe('CommandRouter', () => {
    function buildRouter() {
        const pkgInstallCommand = new Command({
            positionals: 'install(i) :packages*',
            callback: _ => ({ onInit() {} })
        });
        const pkgUninstallCommand = new Command({
            positionals: 'uninstall(u) :packages*',
            callback: _ => ({ onInit() {} })
        });

        const pkgRouter = new CommandRouter({
            path: 'pkg',
            targets: [pkgInstallCommand, pkgUninstallCommand]
        });

        const helpCommand = new Command({
            positionals: 'help(h)',
            callback: _ => ({ onInit() {} })
        });

        return new CommandRouter({
            targets: [pkgRouter, helpCommand]
        });
    }

    it('Matches nested command using short alias', async (t: it.TestContext) => {
        let capturedContext: unknown;

        const pkgInstallCommand = new Command({
            positionals: 'install(i) :packages*',
            callback: context => ({
                onInit() { capturedContext = context; }
            })
        });

        const router = new CommandRouter({
            targets: [
                new CommandRouter({
                    path: 'pkg',
                    targets: [pkgInstallCommand]
                })
            ]
        });

        const result = await router.run({
            argv: ['node', 'script', 'pkg', 'i', 'mssql', 'typeorm']
        });

        t.assert.deepStrictEqual(result, { matches: true });
        t.assert.deepStrictEqual(capturedContext, {
            positionals: { packages: ['mssql', 'typeorm'] },
            flags: {},
            tail: []
        });
    });

    it('Matches nested command using long name', async (t: it.TestContext) => {
        let capturedContext: unknown;

        const pkgInstallCommand = new Command({
            positionals: 'install(i) :packages*',
            callback: context => ({
                onInit() { capturedContext = context; }
            })
        });

        const router = new CommandRouter({
            targets: [
                new CommandRouter({
                    path: 'pkg',
                    targets: [pkgInstallCommand]
                })
            ]
        });

        const result = await router.run({
            argv: ['node', 'script', 'pkg', 'install', 'mssql', 'typeorm']
        });

        t.assert.deepStrictEqual(result, { matches: true });
        t.assert.deepStrictEqual(capturedContext, {
            positionals: { packages: ['mssql', 'typeorm'] },
            flags: {},
            tail: []
        });
    });

    it('Does not match when path segment is wrong', async (t: it.TestContext) => {
        const result = await buildRouter().run({
            argv: ['node', 'script', 'npm', 'i', 'mssql']
        });
        t.assert.deepStrictEqual(result, { matches: false });
    });

    it('Matches a flat command', async (t: it.TestContext) => {
        let capturedContext: unknown;

        const helpCommand = new Command({
            positionals: 'help(h)',
            callback: context => ({
                onInit() { capturedContext = context; }
            })
        });

        const router = new CommandRouter({ targets: [helpCommand] });
        const result = await router.run({
            argv: ['node', 'script', 'help']
        });

        t.assert.deepStrictEqual(result, { matches: true });
        t.assert.deepStrictEqual(capturedContext, {
            positionals: {},
            flags: {},
            tail: []
        });
    });

    it('Matches a flat command using alias', async (t: it.TestContext) => {
        let capturedContext: unknown;

        const helpCommand = new Command({
            positionals: 'help(h)',
            callback: context => ({
                onInit() { capturedContext = context; }
            })
        });

        const router = new CommandRouter({ targets: [helpCommand] });
        const result = await router.run({
            argv: ['node', 'script', 'h']
        });

        t.assert.deepStrictEqual(result, { matches: true });
        t.assert.deepStrictEqual(capturedContext, {
            positionals: {},
            flags: {},
            tail: []
        });
    });

    it('Does not match any command', async (t: it.TestContext) => {
        const result = await buildRouter().run({
            argv: ['node', 'script', 'unknown']
        });
        t.assert.deepStrictEqual(result, { matches: false });
    });

    it('Matches nested command with multi-segment path', async (t: it.TestContext) => {
        let capturedContext: unknown;

        const runCommand = new Command({
            positionals: 'run :script',
            callback: context => ({
                onInit() { capturedContext = context; }
            })
        });

        const root = new CommandRouter({
            targets: [
                new CommandRouter({
                    path: 'pkg scripts',
                    targets: [runCommand]
                })
            ]
        });

        const result = await root.run({
            argv: ['node', 'script', 'pkg', 'scripts', 'run', 'build']
        });

        t.assert.deepStrictEqual(result, { matches: true });
        t.assert.deepStrictEqual(capturedContext, {
            positionals: { script: 'build' },
            flags: {},
            tail: []
        });
    });

    it('falls through to a sibling command when an earlier one is missing a required positional', async (t: it.TestContext) => {
        let matched = false;

        const router = new CommandRouter({
            targets: [
                new Command({
                    positionals: 'deploy :env',
                    callback: _ => ({ onInit() {} })
                }),
                new Command({
                    positionals: 'deploy',
                    callback: _ => ({ onInit() { matched = true; } })
                })
            ]
        });

        const result = await router.run({
            argv: ['node', 'script', 'deploy']
        });

        t.assert.deepStrictEqual(result, { matches: true });
        t.assert.strictEqual(matched, true);
    });

    it('surfaces the deferred error when no sibling matches', async (t: it.TestContext) => {
        const router = new CommandRouter({
            targets: [
                new Command({
                    positionals: 'deploy :env',
                    callback: _ => ({ onInit() {} })
                })
            ]
        });

        const result = await router.run({
            argv: ['node', 'script', 'deploy']
        });

        t.assert.strictEqual(result.matches, false);
        t.assert.ok(result.error instanceof Error);
    });

    it('Does not match multi-segment path when second segment is wrong', async (t: it.TestContext) => {
        const runCommand = new Command({
            positionals: 'run :script',
            callback: _ => ({ onInit() {} })
        });

        const root = new CommandRouter({
            targets: [
                new CommandRouter({
                    path: 'pkg scripts',
                    targets: [runCommand]
                })
            ]
        });

        const result = await root.run({
            argv: ['node', 'script', 'pkg', 'other', 'run', 'build']
        });

        t.assert.deepStrictEqual(result, { matches: false });
    });
});
