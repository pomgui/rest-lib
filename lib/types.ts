import { PiTypeDescriptor } from './PiTypeDescriptor';

export type PiJstype =
    'string' | 'integer' | 'number' | 'boolean' | 'date' | 'any' | 'enum';

export const typeBitValue: any = {
    string: 0b0001,
    integer: 0b0010,
    number: 0b0011,
    boolean: 0b0100,
    date: 0b0101,
    any: 0b0110,
    enum: 0b0111
};
// Add inverted map. Ex. typeBitValue[0b0101] == 'date'...
Object.assign(typeBitValue,
    Object.keys(typeBitValue).reduce((s, type) => (s[typeBitValue[type]] = type, s), <any>{})
);

export enum FieldData {
    required = 0b1000,
    isArray = 0b10000,
    mask = 0b11111,
    bitcount = 5,
    maxBitsPerInt = Math.trunc(31 / bitcount) * bitcount
}

export type PiDescriptor = {
    /** names */
    n: string[];
    /** binary field data */
    d: number[];
    /** enum values */
    v?: { [id: number]: string[] },
    /** descriptor's parsed version */
    o?: PiTypeDescriptor
};

export interface PiApiParams {
    path?: { [name: string]: any };
    query?: { [name: string]: any };
    body?: { [name: string]: any };
    headers?: { [name: string]: any };
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
