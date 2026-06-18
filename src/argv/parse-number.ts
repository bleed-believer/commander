const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Parses a finite decimal number from a token, returning `NaN` for anything
 * that is not a plain decimal literal. Unlike `Number`, it rejects empty or
 * whitespace-only strings (which `Number` coerces to `0`), hexadecimal
 * (`0x10`), the `Infinity`/`NaN` keywords, and literals that overflow to a
 * non-finite value (`1e999` → `Infinity`).
 */
export function parseNumber(token: string): number {
    if (!NUMBER.test(token)) return NaN;
    const value = Number(token);
    return Number.isFinite(value) ? value : NaN;
}
