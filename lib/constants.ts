export type PiJstype =
    'string' | 'integer' | 'number' | 'boolean' | 'date' | 'any' | 'enum';

export const typeBitValue = {
    string: 0b0001,
    integer: 0b0010,
    number: 0b0011,
    boolean: 0b0100,
    date: 0b0101,
    any: 0b0110,
    enum: 0b0111
};

export enum FieldData {
    required = 0b1000,
    isArray = 0b10000,
    mask = 0b11111,
    bitcount = 5,
    maxBitsPerInt = Math.trunc(31 / bitcount) * bitcount
}
