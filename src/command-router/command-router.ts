import type { CommandDoc, CommandResult } from '@/command/index.js';
import type { CommandRouterOptions } from './interfaces/index.js';

import { parseLiteralNames } from '@/argv/index.js';

/**
 * Dispatches argv to an ordered list of commands or nested routers,
 * optionally consuming a path prefix before delegating.
 *
 * Targets are tried in declaration order; the first one that returns
 * `matches: true` short-circuits the rest. If no target matches,
 * `{ matches: false }` is returned.
 *
 * Both {@link Command} and `CommandRouter` itself satisfy
 * {@link CommandRouterTarget}, so routers can be nested arbitrarily deep.
 *
 * @example
 * ```ts
 * const router = new CommandRouter({
 *     targets: [
 *         new CommandRouter({
 *             path: 'pkg',
 *             targets: [installCommand, uninstallCommand]
 *         }),
 *         helpCommand
 *     ]
 * });
 *
 * await router.run();
 * ```
 */
export class CommandRouter {
    #options: CommandRouterOptions;

    constructor(options: CommandRouterOptions) {
        this.#options = options;
    }

    docs(prefix: string[] = []): CommandDoc[] {
        const pathTokens = this.#options.path ? this.#options.path.split(' ') : [];
        const newPrefix = [...prefix, ...pathTokens];
        const result: CommandDoc[] = [];
        for (const target of this.#options.targets) {
            result.push(...target.docs(newPrefix));
        }
        return result;
    }

    /**
     * Attempts to match and execute a target against the given argv.
     *
     * If `options.path` is set, each space-separated token must match the
     * corresponding leading argv token (aliases included). On a full prefix
     * match those tokens are stripped before targets are tried. A partial
     * or missing prefix match returns `{ matches: false }` immediately.
     *
     * Path prefix tokens are expected to appear at the start of argv (after
     * the node/script entries), before any flags.
     *
     * @param processLike - Object with an `argv` array. Defaults to `globalThis.process`.
     * @returns The result of the first matching target, or `{ matches: false }`
     *   if no target matched.
     */
    async run(processLike?: { argv: string[] }): Promise<CommandResult> {
        let current = processLike ?? { argv: globalThis.process.argv };

        if (this.#options.path !== undefined) {
            const tokens = this.#options.path.split(' ');
            const args = current.argv.slice(2);

            for (let i = 0; i < tokens.length; i++) {
                const validNames = parseLiteralNames(tokens[i]);
                if (!validNames.includes(args[i] ?? '')) {
                    return { matches: false };
                }
            }

            current = {
                argv: [
                    ...current.argv.slice(0, 2),
                    ...current.argv.slice(2 + tokens.length)
                ]
            };
        }

        for (const target of this.#options.targets) {
            const result = await target.run(current);
            if (result.matches || result.error) {
                return result;
            }
        }

        return { matches: false };
    }
}
