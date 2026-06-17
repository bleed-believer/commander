/**
 * Value returned by {@link Command.run} after an execution attempt.
 *
 * Detection semantics:
 * - `{ matches: false }` — static literal tokens did not match; this is not the right command.
 * - `{ matches: false, error }` — static tokens matched but a required positional param was missing.
 * - `{ matches: true, error }` — positionals matched but a flag had an invalid value, or the handler threw.
 * - `{ matches: true }` — the command matched and the handler completed cleanly.
 */
export interface CommandResult {
    /** `true` if the command's positionals template matched the input. */
    matches: boolean;

    /**
     * Present when an error occurred during parsing or handler execution.
     * Can be set regardless of `matches` — see type-level docs for semantics.
     */
    error?: Error;
}