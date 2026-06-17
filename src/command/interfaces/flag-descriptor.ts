import type { FlagOptions } from '@/argv/index.js';

/**
 * Extends {@link FlagOptions} with an optional human-readable description,
 * used to generate help text for a command flag.
 */
export interface FlagDescriptor extends FlagOptions {
    /** Short explanation of what the flag does, shown in help output. */
    description?: string;
}
