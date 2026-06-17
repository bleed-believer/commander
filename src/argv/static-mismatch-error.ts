export class StaticMismatchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StaticMismatchError';
    }
}
