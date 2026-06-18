import type { CommanderInject, CommanderTarget } from './interfaces/index.js';
import type { CommandDoc } from '@/command/interfaces/index.js';

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
     * Iterates targets in order. A target that matched short-circuits the
     * loop; if it also carries an error (a bad flag value or a throwing
     * handler) that error is re-thrown. A target that did not match but
     * reported an error — a matched command name with a missing required
     * positional — is remembered and only thrown if no later target matches,
     * so more permissive sibling commands still get a chance to handle the
     * input. If no target matches and none deferred an error, `run` returns
     * normally.
     */
    async run(): Promise<void> {
        let deferred: Error | undefined;
        for (const target of this.#targets) {
            const result = await target.run(this.#injected.process);
            if (result.matches) {
                if (result.error) {
                    throw result.error;
                }
                return;
            } else if (result.error && deferred === undefined) {
                deferred = result.error;
            }
        }

        if (deferred) {
            throw deferred;
        }
    }

    docs(): CommandDoc[] {
        const result: CommandDoc[] = [];
        for (const target of this.#targets) {
            result.push(...target.docs([]));
        }
        return result;
    }
}
