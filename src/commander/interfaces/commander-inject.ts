export interface CommanderInject {
    process?: {
        argv: string[];
    };

    console?: {
        log(...a: any[]): void;
    }
}