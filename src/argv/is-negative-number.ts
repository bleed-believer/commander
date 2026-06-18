const NEGATIVE_NUMBER = /^-(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Returns `true` when the token is a negative number literal (e.g. `-10`,
 * `-3.14`, `-.5`, `-1e3`). Used during tokenization so that negative numbers
 * are treated as values/positionals instead of being mistaken for flags.
 */
export function isNegativeNumber(token: string): boolean {
    return NEGATIVE_NUMBER.test(token);
}
