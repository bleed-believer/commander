import type { FlagDescriptor } from './flag-descriptor.js';
import type { Argv } from '@/argv/index.js';

/**
 * The fully-typed result of parsing `process.argv` against a command's
 * positionals template and flags schema.
 *
 * Equivalent to `ReturnType<Argv<P, F>['parse']>`, so positional captures
 * and flag values are narrowed to their exact types based on `P` and `F`.
 *
 * @template P - Positionals template string (e.g. `'run :target?'`).
 * @template F - Flags descriptor record.
 */
export type CommandContext<
    P extends string,
    F extends Record<string, FlagDescriptor>
> = ReturnType<Argv<P, F>['parse']>;
