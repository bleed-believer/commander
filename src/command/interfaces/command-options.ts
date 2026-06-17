import type { FlagDescriptor } from './flag-descriptor.js';
import type { CommandContext } from './command-context.js';
import type { CommandTarget } from './command-target.js';

/**
 * Configuration object passed to the {@link Command} constructor.
 *
 * @template P - Positionals template string (e.g. `'install(i) :packages*'`).
 * @template F - Record of flag names to their {@link FlagDescriptor} schemas.
 */
export interface CommandOptions<
    P extends string,
    F extends Record<string, FlagDescriptor>
> {
    /** Human-readable summary of what the command does, shown in help output. */
    description?: string;

    /**
     * Positionals template that defines the command name, optional aliases,
     * and named captures. Matched against `process.argv` at runtime.
     *
     * **Syntax:**
     * - `literal` — must match exactly (e.g. `run`).
     * - `cmd(alias)` — matches the main name or any alias (e.g. `install(i)`).
     * - `:name` — required string capture.
     * - `:name?` — optional string capture.
     * - `:name*` — variadic capture, consumes all remaining positionals.
     */
    positionals: P;

    /** Flag definitions keyed by camelCase name. */
    flags?: F;

    /**
     * Factory called with the fully-typed {@link CommandContext} once the
     * argv is parsed successfully. Must return a {@link CommandTarget}
     * instance whose lifecycle methods (`onInit`, `onDestroy`) will be
     * invoked by {@link Command.run}.
     *
     * Errors thrown inside the returned handler are the caller's
     * responsibility; the framework logs them but does not re-throw.
     */
    callback(context: CommandContext<P, F>): CommandTarget;
}
