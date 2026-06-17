import type { SerializedArgv } from '@/argv';
import type { CommandResult } from '@/command/interfaces';

export interface CommanderTarget {
    run(serialized: SerializedArgv): Promise<CommandResult>;
}