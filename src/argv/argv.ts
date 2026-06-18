import type { FlagOptions } from './interfaces/index.js';
import type { ParsedArgv } from './interfaces/index.js';

import { parseLiteralNames } from './parse-literal.js';
import { camelToKebab } from './camel-to-kebab.js';
import { StaticMismatchError } from './static-mismatch-error.js';
import { PositionalMismatchError } from './positional-mismatch-error.js';
import { FlagParseError } from './flag-parse-error.js';

/**
 * Parses command-line arguments against a typed schema, providing
 * fully-inferred result types for both positional captures and flags.
 *
 * @template P - Positionals template string (e.g. `'run :target?'`).
 * @template F - Flags options record.
 */
export class Argv<P extends string, F extends Record<string, FlagOptions> = Record<never, never>> {
    #options: { positionals: P; flags?: F };

    /**
     * @param options - Schema describing expected positionals and flags.
     */
    constructor(options: { positionals: P; flags?: F }) {
        this.#options = options;
    }

    #parsePositionals(positionals: string[]): Record<string, string | string[] | undefined> {
        const tokens = this.#options.positionals.split(' ');
        const result: Record<string, string | string[] | undefined> = {};
        let posIdx = 0;

        for (const token of tokens) {
            if (token.startsWith(':')) {
                if (token.endsWith('+')) {
                    const vals = positionals.slice(posIdx);
                    if (vals.length === 0) {
                        throw new PositionalMismatchError(
                            `Positional "${token.slice(1, -1)}" requires at least one value`
                        );
                    }
                    result[token.slice(1, -1)] = vals;
                    break;
                } else if (token.endsWith('*')) {
                    result[token.slice(1, -1)] = positionals.slice(posIdx);
                    break;
                } else if (token.endsWith('?')) {
                    result[token.slice(1, -1)] = positionals[posIdx];
                    posIdx++;
                } else {
                    const val = positionals[posIdx];
                    if (val === undefined) {
                        throw new PositionalMismatchError(
                            `Required positional "${token.slice(1)}" at position ${posIdx} is missing`
                        );
                    }
                    result[token.slice(1)] = val;
                    posIdx++;
                }
            } else {
                const validNames = parseLiteralNames(token);
                const actual = positionals[posIdx];
                if (actual === undefined || !validNames.includes(actual)) {
                    throw new StaticMismatchError(
                        `Expected "${validNames.join('" or "')}" at position ${posIdx}, got "${actual ?? ''}"`
                    );
                }
                posIdx++;
            }
        }

        return result;
    }

    #parseFlags(rawFlags: Record<string, string[]>): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        const opts: Record<string, FlagOptions> = this.#options.flags ?? {};

        for (const [name, opt] of Object.entries(opts)) {
            const longKey = `--${camelToKebab(name)}`;
            const shortKey = opt.short !== undefined ? `-${opt.short}` : undefined;
            const values = rawFlags[longKey] ?? (shortKey !== undefined ? rawFlags[shortKey] : undefined);

            if (values === undefined) {
                if (opt.required === true) {
                    throw new FlagParseError(
                        `Flag "${longKey}" is required`
                    );
                }
                result[name] = undefined;
                continue;
            }

            if (opt.type === 'boolean') {
                result[name] = values[0] !== 'false';
            } else if (opt.type === 'number') {
                if (opt.array === true) {
                    const nums = values.map(Number);
                    const badIdx = nums.findIndex(n => isNaN(n));
                    if (badIdx !== -1) {
                        throw new FlagParseError(
                            `Flag "${longKey}" expects a number but got "${values[badIdx]}"`
                        );
                    }
                    result[name] = nums;
                } else {
                    const num = Number(values[0]);
                    if (isNaN(num)) {
                        throw new FlagParseError(
                            `Flag "${longKey}" expects a number but got "${values[0]}"`
                        );
                    }
                    result[name] = num;
                }
            } else {
                result[name] = opt.array === true ? values : values[0];
            }
        }

        return result;
    }

    /**
     * Tokenizes raw argv using the flags schema so that only declared
     * value-taking flags (`string`/`number`) consume the following token.
     * Boolean flags and flags absent from the schema never consume a value,
     * which prevents e.g. `--save mssql` from eating `mssql` when `--save`
     * is boolean, and stops an unknown/typo'd flag from silently swallowing
     * the next positional.
     */
    #tokenize(args: string[]): { positionals: string[]; flags: Record<string, string[]> } {
        const positionals: string[] = [];
        const flags: Record<string, string[]> = {};

        const valueKeys = new Set<string>();
        for (const [name, opt] of Object.entries(this.#options.flags ?? {})) {
            if (opt.type !== 'boolean') {
                valueKeys.add(`--${camelToKebab(name)}`);
                if (opt.short !== undefined) {
                    valueKeys.add(`-${opt.short}`);
                }
            }
        }

        let i = 0;
        while (i < args.length) {
            const arg = args[i];

            if (arg === '--') {
                flags['--'] = args.slice(i + 1);
                break;
            } else if (arg.startsWith('-')) {
                const eqIdx = arg.indexOf('=');
                if (eqIdx !== -1) {
                    const key = arg.slice(0, eqIdx);
                    const val = arg.slice(eqIdx + 1);
                    flags[key] ??= [];
                    flags[key].push(val);
                    i++;
                } else if (valueKeys.has(arg)) {
                    const next = args[i + 1];
                    if (next !== undefined && !next.startsWith('-')) {
                        flags[arg] ??= [];
                        flags[arg].push(next);
                        i += 2;
                    } else {
                        flags[arg] ??= [];
                        i++;
                    }
                } else {
                    // Boolean flags and unknown flags never consume the next
                    // token, so a following positional is preserved instead of
                    // being silently swallowed as a flag value.
                    flags[arg] ??= [];
                    i++;
                }
            } else {
                positionals.push(arg);
                i++;
            }
        }

        return { positionals, flags };
    }

    /**
     * Parses `process.argv` directly against the schema defined in the constructor.
     *
     * Uses the flags schema during tokenization so that boolean flags never
     * accidentally consume the next token as their value.
     *
     * **Positionals template syntax:**
     * - `literal` — must match exactly (e.g. `run`).
     * - `cmd(alias)` — matches the main name or any alias (e.g. `install(i)`).
     * - `:name` — required capture, typed as `string`.
     * - `:name?` — optional capture, typed as `string | undefined`.
     * - `:name*` — variadic capture, zero or more values, typed as `string[]`.
     * - `:name+` — variadic capture, one or more values, typed as `[string, ...string[]]`; throws if empty.
     *
     * @param processLike - Object with an `argv` array. Defaults to `globalThis.process`.
     * @returns A fully-typed object with `positionals`, `flags`, and `tail`.
     * @throws {Error} When a literal token does not match the expected name or alias.
     */
    parse(processLike?: { argv: string[] }): ParsedArgv<P, F> {
        const args = (processLike?.argv ?? globalThis.process.argv).slice(2);
        const { positionals, flags } = this.#tokenize(args);
        return {
            positionals: this.#parsePositionals(positionals) as ParsedArgv<P, F>['positionals'],
            flags: this.#parseFlags(flags) as ParsedArgv<P, F>['flags'],
            tail: flags['--'] ?? []
        };
    }
}
