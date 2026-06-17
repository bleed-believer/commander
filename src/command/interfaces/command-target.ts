/**
 * Lifecycle interface for command handler objects returned by
 * {@link CommandOptions.callback}.
 *
 * `onInit` is required and runs immediately after the handler is created.
 * `onDestroy` is optional and runs after `onInit` completes, allowing
 * cleanup of resources such as open file handles or network connections.
 */
export interface CommandTarget {
    /** Called once when the command handler is executed. */
    onInit(): void | Promise<void>;

    /** Called after {@link onInit} completes. Use for teardown logic. */
    onDestroy?(): void | Promise<void>;
}
