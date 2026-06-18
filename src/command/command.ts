import type { CommandContext, CommandDoc, CommandOptions, CommandResult, FlagDescriptor } from './interfaces/index.js';

import { Argv, StaticMismatchError, PositionalMismatchError, camelToKebab } from '@/argv/index.js';

/**
 * Represents a single CLI command with a typed positionals template,
 * typed flags schema, and a callback-based handler factory.
 *
 * Instantiate with {@link CommandOptions} and call {@link Command.run} from
 * a router to attempt execution against pre-parsed argv.
 *
 * @template P - Positionals template string (e.g. `'install(i) :packages*'`).
 * @template F - Record of flag names to their {@link FlagDescriptor} schemas.
 *
 * @example
 * ```ts
 * const installCommand = new Command({
 *     description: 'Install packages',
 *     positionals: 'install(i) :packages*',
 *     flags: {
 *         saveDev: { type: 'boolean', short: 'D', description: 'Install as dev dependency' }
 *     },
 *     callback: context => new class implements CommandTarget {
 *         onInit() {
 *             console.log(context.positionals.packages); // string[]
 *         }
 *     }
 * });
 * ```
 */
export class Command<
    P extends string,
    F extends Record<string, FlagDescriptor>
> {
    #options: CommandOptions<P, F>;
    #argv: Argv<P, F>;

    /** Human-readable summary of what this command does. */
    get description(): string | undefined {
        return this.#options.description;
    }

    /** The raw positionals template string used to match and parse argv. */
    get positionals(): P {
        return this.#options.positionals;
    }

    constructor(options: CommandOptions<P, F>) {
        this.#options = options;
        this.#argv = new Argv({
            positionals: options.positionals,
            flags: options.flags
        });
    }

    docs(prefix: string[] = []): CommandDoc[] {
        // Drop empty tokens the same way the parser does, so a flags-only or
        // default command (`positionals: ''`) does not emit a stray empty path
        // segment. The flag name is reported in the kebab-case form the parser
        // actually accepts on the CLI (`dryRun` → `dry-run`), not the raw
        // schema key, so help output matches what users must type.
        const tokens = this.#options.positionals.split(' ').filter(token => token.length > 0);
        const flags = Object.entries(this.#options.flags ?? {}).map(([name, descriptor]) => ({
            name: camelToKebab(name),
            type: descriptor.type,
            required: descriptor.required ?? false,
            description: descriptor.description,
        }));
        return [{ path: [...prefix, ...tokens], description: this.#options.description, flags }];
    }

    /**
     * Attempts to match and execute this command against serialized argv.
     *
     * Returns `{ matches: false }` immediately if the argv does not satisfy
     * the positionals template (parse error = no match). If parsing succeeds,
     * the handler returned by {@link CommandOptions.callback} is created and
     * its lifecycle methods are called in order: `onInit` → `onDestroy`.
     * Any error thrown by the handler is caught and returned in
     * `{ matches: true, error }` — propagating it is the caller's
     * responsibility.
     *
     * @param processLike - Object with an `argv` array. Defaults to `globalThis.process`.
     * @returns A {@link CommandResult} indicating whether the command matched
     *   and, if so, whether the handler completed without error.
     */
    async run(processLike?: { argv: string[] }): Promise<CommandResult> {
        let context: CommandContext<P, F>;
        try {
            context = this.#argv.parse(processLike);
        } catch (error: any) {
            if (error instanceof StaticMismatchError) {
                return { matches: false };
            } else if (error instanceof PositionalMismatchError) {
                return { matches: false, error };
            } else {
                return { matches: true, error };
            }
        }

        try {
            const handler = this.#options.callback(context);

            let initFailed = false;
            let initError: unknown;
            try {
                await handler.onInit();
            } catch (error) {
                initFailed = true;
                initError = error;
            }

            // onDestroy is teardown for resources allocated during onInit
            // (file handles, connections); it must run even when onInit threw
            // so a partially-initialized handler can clean up.
            try {
                await handler.onDestroy?.();
            } catch (destroyError) {
                // A cleanup failure must not mask the onInit failure, which is
                // the actual reason the command failed. Keep the init error and
                // attach the cleanup error as its cause; surface the cleanup
                // error on its own only when onInit succeeded.
                if (!initFailed) {
                    throw destroyError;
                }
                if (initError instanceof Error && initError.cause === undefined) {
                    initError.cause = destroyError;
                }
            }

            if (initFailed) {
                throw initError;
            }
            return { matches: true };

        } catch (error: any) {
            return { matches: true, error };

        }
    }
}
