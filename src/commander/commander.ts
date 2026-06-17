import type { CommanderInject, CommanderTarget } from './interfaces/index.js';

import { Argv } from '@/argv';

export class Commander {
    #injected: Required<CommanderInject>;
    #targets: CommanderTarget[];

    constructor(targets: CommanderTarget[], inject?: CommanderInject) {
        this.#targets = targets;
        this.#injected = {
            process:    inject?.process ?? globalThis.process
        };
    }

    async run(): Promise<void> {
        const serialized = Argv.serialize(this.#injected.process);
        for (const target of this.#targets) {
            const result = await target.run(serialized);
            if (result.error) {
                throw result.error;
            } else if (result.matches) {
                return;
            }
        }
    }
}