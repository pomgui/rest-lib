export declare type PiJstype = 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'any' | 'enum';
export declare const typeBitValue: {
    string: number;
    integer: number;
    number: number;
    boolean: number;
    date: number;
    any: number;
    enum: number;
};
export declare enum FieldData {
    required = 8,
    isArray = 16,
    mask = 31,
    bitcount = 5,
    maxBitsPerInt
}
