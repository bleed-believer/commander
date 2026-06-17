import type { FlagOptions } from './interfaces/index.js';
import type { ParsedArgv } from './interfaces/index.js';

import { parseLiteralNames } from './parse-literal.js';
import { camelToKebab } from './camel-to-kebab.js';

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
                if (token.endsWith('*')) {
                    result[token.slice(1, -1)] = positionals.slice(posIdx);
                    break;
                } else if (token.endsWith('?')) {
                    result[token.slice(1, -1)] = positionals[posIdx];
                    posIdx++;
                } else {
                    result[token.slice(1)] = positionals[posIdx] ?? '';
                    posIdx++;
                }
            } else {
                const validNames = parseLiteralNames(token);
                const actual = positionals[posIdx];
                if (actual !== undefined && !validNames.includes(actual)) {
                    throw new Error(`Expected "${validNames.join('" or "')}" at position ${posIdx}, got "${actual}"`);
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
                result[name] = undefined;
                continue;
            }

            if (opt.type === 'boolean') {
                result[name] = true;
            } else if (opt.type === 'number') {
                result[name] = opt.array === true ? values.map(Number) : Number(values[0]);
            } else {
                result[name] = opt.array === true ? values : values[0];
            }
        }

        return result;
    }

    /**
     * Tokenizes raw argv using the flags schema to correctly distinguish
     * boolean flags (no value consumed) from value-taking flags.
     * This prevents e.g. `--save mssql` from consuming `mssql` as the flag
     * value when `--save` is declared as boolean.
     */
    #tokenize(args: string[]): { positionals: string[]; flags: Record<string, string[]> } {
        const positionals: string[] = [];
        const flags: Record<string, string[]> = {};

        const booleanKeys = new Set<string>();
        for (const [name, opt] of Object.entries(this.#options.flags ?? {})) {
            if (opt.type === 'boolean') {
                booleanKeys.add(`--${camelToKebab(name)}`);
                if (opt.short !== undefined) {
                    booleanKeys.add(`-${opt.short}`);
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
                if (booleanKeys.has(arg)) {
                    flags[arg] ??= [];
                    i++;
                } else {
                    const next = args[i + 1];
                    if (next !== undefined && !next.startsWith('-')) {
                        flags[arg] ??= [];
                        flags[arg].push(next);
                        i += 2;
                    } else {
                        flags[arg] ??= [];
                        i++;
                    }
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
     * - `:name*` — variadic capture, typed as `string[]` (consumes all remaining positionals).
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
