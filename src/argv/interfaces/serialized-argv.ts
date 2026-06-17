export interface SerializedArgv {
    positionals: string[];
    flags: Record<string, string[]>;
}