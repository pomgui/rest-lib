import { PiFieldDescriptor } from "./PiFieldDescriptor";
export declare type PiDescriptor = [string[], number[], {
    [id: number]: string[];
}?];
export interface PiApiParams {
    path?: {
        [name: string]: any;
    };
    query?: {
        [name: string]: any;
    };
    body?: {
        [name: string]: any;
    };
    headers?: {
        [name: string]: any;
    };
}
export declare class PiTypeDescriptor {
    private _fields;
    private _index;
    private _arrayCache;
    constructor(desc?: PiDescriptor | PiFieldDescriptor[]);
    set(field: PiFieldDescriptor): void;
    get(name: string): PiFieldDescriptor;
    has(name: string): boolean;
    clear(): void;
    /**
     * Returns the fields as an array in the same order that it was created
     */
    asArray(): PiFieldDescriptor[];
    getRequired(): PiFieldDescriptor[];
    render(): PiDescriptor;
    parse([names, data, enums]: PiDescriptor): void;
    cast(params: PiApiParams): void;
}
