export declare class PiError extends Error {
    message: string;
    constructor(message: string);
}
export declare class PiRestError extends PiError {
    message: string;
    status: number;
    data?: any;
    constructor(message: string, status?: number, data?: any);
}
export declare class PiValidationError extends PiRestError {
    constructor(message: string, field?: string, value?: any);
}
