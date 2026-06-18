const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Parses a finite decimal number from a token, returning `NaN` for anything
 * that is not a plain decimal literal. Unlike `Number`, it rejects empty or
 * whitespace-only strings (which `Number` coerces to `0`), hexadecimal
 * (`0x10`), and the `Infinity`/`NaN` keywords.
 */
export function parseNumber(token: string): number {
    return NUMBER.test(token) ? Number(token) : NaN;
}
