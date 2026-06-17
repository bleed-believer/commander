/**
 * Value returned by {@link Command.run} after an execution attempt.
 *
 * `matches` indicates whether the argv satisfied the positionals template.
 * `error` is only present when the command matched but the handler threw;
 * a missing `error` with `matches: true` means the handler completed cleanly.
 */
export interface CommandResult {
    /** `true` if the command's positionals template matched the input. */
    matches: boolean;

    /**
     * The error thrown by the handler's `onInit` or `onDestroy` method,
     * if any. Only set when `matches` is `true`.
     */
    error?: Error;
}