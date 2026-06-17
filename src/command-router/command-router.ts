import type { CommandRouterOptions } from './interfaces/index.js';
import type { SerializedArgv } from '@/argv';
import type { CommandResult } from '@/command';

import { parseLiteralNames } from '@/argv';

/**
 * Dispatches serialized argv to an ordered list of commands or nested routers,
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
 * await router.run(Argv.serialize());
 * ```
 */
export class CommandRouter {
    #options: CommandRouterOptions;

    constructor(options: CommandRouterOptions) {
        this.#options = options;
    }

    /**
     * Attempts to match and execute a target against the given serialized argv.
     *
     * If `options.path` is set, each space-separated token must match the
     * corresponding leading positional (aliases included). On a full prefix
     * match those positionals are stripped before targets are tried. A partial
     * or missing prefix match returns `{ matches: false }` immediately without
     * consulting any target.
     *
     * @param serialized - Pre-parsed argv produced by {@link Argv.serialize}.
     * @returns The result of the first matching target, or `{ matches: false }`
     *   if no target matched.
     */
    async run(serialized: SerializedArgv): Promise<CommandResult> {
        if (this.#options.path !== undefined) {
            const tokens = this.#options.path.split(' ');
            for (let i = 0; i < tokens.length; i++) {
                const validNames = parseLiteralNames(tokens[i]);
                if (!validNames.includes(serialized.positionals[i] ?? '')) {
                    return { matches: false };
                }
            }
            serialized = {
                ...serialized,
                positionals: serialized.positionals.slice(tokens.length)
            };
        }

        for (const target of this.#options.targets) {
            const result = await target.run(serialized);
            if (result.matches || result.error) {
                return result;
            }
        }

        return { matches: false };
    }
}
