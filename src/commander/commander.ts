import type { CommanderInject, CommanderTarget } from './interfaces/index.js';

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
        for (const target of this.#targets) {
            const result = await target.run(this.#injected.process);
            if (result.error) {
                throw result.error;
            } else if (result.matches) {
                return;
            }
        }
    }
}
