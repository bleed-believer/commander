export interface FlagOptions {
    type: 'number' | 'string' | 'boolean';
    short?: string;
    array?: boolean;
    required?: boolean;
}

export interface ArgvOptions {
    positionals: string;
    flags?: Record<string, FlagOptions>;
}