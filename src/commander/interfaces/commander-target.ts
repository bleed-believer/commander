import type { CommandResult } from '@/command/interfaces';

export interface CommanderTarget {
    run(processLike?: { argv: string[] }): Promise<CommandResult>;
}