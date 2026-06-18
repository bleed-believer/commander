import type { CommandResult, CommandDoc } from '@/command/interfaces/index.js';

export interface CommanderTarget {
    run(processLike?: { argv: string[] }): Promise<CommandResult>;
    docs(prefix?: string[]): CommandDoc[];
}