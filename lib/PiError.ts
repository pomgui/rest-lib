export class PiError extends Error {
    constructor(public message: string) { super(message); }
}

export class PiRestError extends PiError {
    constructor(public message: string, public status: number = 500, public data?: any) {
        super(message);
    }
}

export class PiValidationError extends PiRestError {
    constructor(message: string, field?: string, value?: any) {
        super(message, 400, { type: 'validation', field, value });
    }
}

