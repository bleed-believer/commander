import type { CommandRouterTarget } from './command-router-target.js';

/**
 * Configuration object passed to the {@link CommandRouter} constructor.
 */
export interface CommandRouterOptions {
    /**
     * Optional path prefix that must be consumed from the beginning of
     * `positionals` before delegating to `targets`.
     *
     * Supports space-separated multi-segment paths and per-segment aliases
     * using the same `name(alias)` syntax as positionals templates.
     *
     * @example
     * `'pkg'`            — matches a single segment: `pkg`
     * `'pkg(p)'`         — matches `pkg` or its alias `p`
     * `'pkg scripts'`    — matches two consecutive segments: `pkg scripts`
     */
    path?: string;

    /**
     * Ordered list of commands or nested routers to try in sequence.
     * The first target whose {@link CommandRouterTarget.run} returns
     * `matches: true` short-circuits the iteration.
     */
    targets: CommandRouterTarget[];
}
