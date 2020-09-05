import { PiTypeDescriptor } from './PiTypeDescriptor';
export declare type PiJstype = 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'any' | 'enum';
export declare const typeBitValue: any;
export declare enum FieldData {
    required = 8,
    isArray = 16,
    mask = 31,
    bitcount = 5,
    maxBitsPerInt
}
export declare type PiDescriptor = {
    /** names separated by '|' */
    n: string;
    /** binary field data */
    d: number[];
    /** enum values */
    v?: {
        [id: number]: string[];
    };
    /** descriptor's parsed version */
    o?: PiTypeDescriptor;
};
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
export interface PiField {
    name: string;
    comment?: string;
    jsType: PiJstype;
    type?: string;
    isArray?: boolean;
    values?: string[];
    required: boolean;
}
