import { PiField } from "./types";
export declare class PiFieldDescriptor {
    private _field;
    constructor(field: PiField);
    constructor(name: string, data: number, values?: string[]);
    readonly name: string;
    readonly comment: string | undefined;
    readonly jsType: import("./types").PiJstype;
    readonly isArray: boolean | undefined;
    readonly values: string[] | undefined;
    readonly required: boolean;
    readonly type: string;
    optional(): string;
    toInt(): number;
    /**
     * Algorithm:
     * - Some previous conversions are made for the values: 'null' -> null, 'undefined' -> undefined
     * - Try to convert the value into the declared type (this.type). If it's an array
     *   this conversion will be executed for all array items.
     * - Validate impossible conversions and required missing values. If it's an array,
     *   this validation is made for all items.
     * - The undefined values are removed from the object (unnecessary network traffic)
     * @param obj Any object which field with name == this.name will be 'prepared'.
     */
    cast(obj: any): any;
    /**
     *
     * @param value what to validate
     * @param name field name (just to throw error)
     * @returns <undefined>, unless it's an enum validation when it returns the enum value defined in values[] for the found value.
     */
    private _dovalidate;
    validate(value: any): void;
}
