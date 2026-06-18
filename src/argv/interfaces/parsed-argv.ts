import type { FlagOptions } from './argv-options.js';

type PositionalsEntry<Token extends string> =
    Token extends `:${infer Name}+` ? { [K in Name]: [string, ...string[]] } :
    Token extends `:${infer Name}*` ? { [K in Name]: string[] } :
    Token extends `:${infer Name}?` ? { [K in Name]?: string } :
    Token extends `:${infer Name}` ? { [K in Name]: string } :
    Record<never, never>;

type PositionalsResult<S extends string> =
    S extends `${infer Token} ${infer Rest}`
        ? PositionalsEntry<Token> & PositionalsResult<Rest>
        : PositionalsEntry<S>;

type FlagValue<T extends 'number' | 'string' | 'boolean'> =
    T extends 'string' ? string :
    T extends 'number' ? number :
    boolean;

// Boolean flags are always a single boolean at runtime (`array` is ignored),
// so the type must not widen them to an array regardless of `array`.
type FlagScalarOrArray<F extends FlagOptions> =
    F['type'] extends 'boolean'
        ? boolean
        : F['array'] extends true
            ? Array<FlagValue<F['type']>>
            : FlagValue<F['type']>;

type FlagResult<F extends FlagOptions> =
    F['required'] extends true
        ? FlagScalarOrArray<F>
        : FlagScalarOrArray<F> | undefined;

type FlagsResult<F extends Record<string, FlagOptions>> = {
    [K in keyof F]: FlagResult<F[K]>;
};

export type ParsedArgv<
    P extends string,
    F extends Record<string, FlagOptions> = Record<never, never>
> = {
    positionals: PositionalsResult<P>;
    flags: FlagsResult<F>;
    tail: string[];
};
