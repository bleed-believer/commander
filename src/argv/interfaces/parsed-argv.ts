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

type FlagResult<F extends FlagOptions> =
    F['required'] extends true
        ? F['array'] extends true ? Array<FlagValue<F['type']>> : FlagValue<F['type']>
        : F['array'] extends true ? Array<FlagValue<F['type']>> | undefined : FlagValue<F['type']> | undefined;

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
