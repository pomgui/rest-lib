import { PiDescriptor, PiApiParams } from "./types";
import { PiFieldDescriptor } from "./PiFieldDescriptor";
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
    parse({ n, d: data, v: enums }: PiDescriptor): void;
    cast(params: PiApiParams): void;
}
