import type { CommanderInject, CommanderTarget } from './interfaces/index.js';

/**
 * Top-level dispatcher that tries each registered target in order and
 * executes the first one that matches the current process argv.
 *
 * Targets are tried sequentially; iteration stops as soon as one returns
 * `matches: true` or any result carries an `error` (including
 * `{ matches: false, error }` from a missing required positional or a bad
 * flag value). Errors are re-thrown so the caller can handle them.
 *
 * If no target matches, `run` returns normally without throwing.
 *
 * @example
 * ```ts
 * const commander = new Commander([
 *     installCommand,
 *     uninstallCommand,
 *     helpCommand,
 * ]);
 *
 * await commander.run();
 * ```
 */
export class Commander {
    #injected: Required<CommanderInject>;
    #targets: CommanderTarget[];

    /**
     * @param targets - Ordered list of commands or routers to try.
     * @param inject  - Optional overrides for testing; defaults to `globalThis.process`.
     */
    constructor(targets: CommanderTarget[], inject?: CommanderInject) {
        this.#targets = targets;
        this.#injected = {
            process:    inject?.process ?? globalThis.process,
            console:    inject?.console ?? globalThis.console
        };
    }

    /**
     * Dispatches argv to the registered targets.
     *
     * Iterates targets in order, stopping at the first match or error.
     * Re-throws any error carried in the result so unhandled parse or
     * handler failures surface to the caller.
     */
    async run(): Promise<void> {
        for (const target of this.#targets) {
            const result = await target.run(this.#injected.process);
            if (result.error) {
                throw result.error;
            } else if (result.matches) {
                return;
            }
        }
    }

    docs(): unknown {
        throw new Error('Not implemented yet');
    }
}
