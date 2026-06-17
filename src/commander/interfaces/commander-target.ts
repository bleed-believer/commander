import type { CommandResult } from '@/command/interfaces/index.js';

export interface CommanderTarget {
    run(processLike?: { argv: string[] }): Promise<CommandResult>;
}