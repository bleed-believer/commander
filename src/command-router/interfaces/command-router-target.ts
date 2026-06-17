/**
 * Contract that any command or nested router must satisfy to participate
 * in a {@link CommandRouter} targets list.
 *
 * Both {@link Command} and {@link CommandRouter} implement this interface
 * structurally, so they can be freely composed without explicit declarations.
 */
export interface CommandRouterTarget {
    /**
     * Attempts to match and execute against the given argv.
     *
     * @param processLike - Object with an `argv` array. Defaults to `globalThis.process`.
     * @returns `{ matches: true }` if the target handled the input,
     *   `{ matches: false }` if it did not apply,
     *   or `{ matches: true, error }` if the handler matched but threw.
     */
    run(processLike?: { argv: string[] }): Promise<{
        matches: boolean;
        error?: Error;
    }>;
}
