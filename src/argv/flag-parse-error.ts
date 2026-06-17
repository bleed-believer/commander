export class FlagParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FlagParseError';
    }
}
