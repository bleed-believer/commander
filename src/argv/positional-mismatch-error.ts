export class PositionalMismatchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PositionalMismatchError';
    }
}
