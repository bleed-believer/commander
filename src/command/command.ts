import type { CommandContext, CommandOptions, CommandResult, FlagDescriptor } from './interfaces/index.js';

import { Argv, StaticMismatchError, PositionalMismatchError } from '@/argv';

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
            await handler.onInit();
            await handler.onDestroy?.();
            return { matches: true };

        } catch (error: any) {
            return { matches: true, error };

        }
    }
}
