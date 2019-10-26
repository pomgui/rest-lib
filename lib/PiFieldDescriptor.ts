import { FieldData, typeBitValue, PiJstype } from "./constants";
import { PiValidationError, PiError } from "./PiError";

export interface PiField {
    name: string;
    comment?: string;
    type: PiJstype;
    isArray: boolean;
    values?: string[];
    required: boolean;
}

export class PiFieldDescriptor implements PiField {
    name: string;
    comment?: string;
    type: PiJstype;
    isArray: boolean;
    values?: string[];
    required: boolean;
    constructor(field: PiField);
    constructor(name: string, data: number);
    constructor(name: string, data: number, required?: boolean, values?: string[]);
    constructor(name: string, type: string, required: boolean, values?: string[]);
    constructor(name: string | PiField, data?: string | number, required?: boolean, values?: string[]) {
        if (typeof data == 'undefined' && typeof name == 'object' && ('name' in name)) {
            // PiField was sent in name
            ({
                name: this.name, comment: this.comment, type: this.type,
                isArray: this.isArray, values: this.values, required: this.required
            } = name as PiField);
        } else {
            if (typeof name == 'string')
                this.name = name;
            else
                throw new PiError(`PiFieldDescriptor.constructor: Invalid name '${name}'`);
            if (typeof data == 'number') {
                this.required = !!(data & FieldData.required);
                this.isArray = !!(data & FieldData.isArray);
                data &= ~(FieldData.required | FieldData.isArray);
                this.type = <any>Object.keys(typeBitValue).find(type => (<any>typeBitValue)[type] === data);
                if (required !== undefined) this.required = required; // override the data 'required' bit
                this.values = values;
            } else if (typeof data == 'string') {
                this.isArray = false;
                if (data.endsWith('[]')) {
                    this.isArray = true;
                    data = data.substr(0, data.length - 2);
                }
                this.type = data as any as PiJstype;
                this.required = required!;
                this.values = values;
            } else
                throw new PiError(`PiFieldDescriptor.constructor: Invalid type '${data}'`);
        }
        if (this.type == 'enum' && !values)
            throw new PiError(`Cannot define field '${this.name}' as enum without values`)
    }

    optional(): string { return this.required ? '' : '?' }

    toInt(): number {
        return typeBitValue[this.type]
            | (this.required ? FieldData.required : 0)
            | (this.isArray ? FieldData.isArray : 0);
    }

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
    cast(obj: any): any {
        let me = this;
        let value = obj[this.name];
        if (this.isArray && !Array.isArray(value))
            value = [value];
        if (this.isArray)
            (<any[]>value).forEach((val, i) => value[i] = docast(val, `${this.name}[${i}]`));
        else
            value = docast(value, this.name);

        if (typeof value == 'undefined')
            delete obj[this.name];
        else
            obj[this.name] = value;
        return value;

        function docast(value: any, name: string): any {
            if (typeof value == 'string') {
                if (value == 'undefined') value = void 0;
                if (value == 'null') value = null;
            }
            let enumValue = me._dovalidate(value, name);
            if (typeof value === 'undefined' || value === null)
                return value;
            switch (me.type) {
                case 'enum':
                    return enumValue;
                case 'string':
                    if (value instanceof Date)
                        return value.toISOString();
                    else
                        return typeof value == 'string' ? value : String(value);
                case 'number':
                    return Number(value);
                case 'integer':
                    return Math.trunc(Number(value));
                case 'date':
                    return value instanceof Date ? value : new Date(value);
                case 'boolean':
                    return value === 'false' ? false : Boolean(value);
                case 'any':
                    return value;
            }
        }
    }

    /**
     * 
     * @param value what to validate
     * @param name field name (just to throw error)
     * @returns <undefined>, unless it's an enum validation when it returns the enum value defined in values[] for the found value.
     */
    private _dovalidate(value: any, name: string): string | undefined {
        if (this.required && (value === null || value === void 0))
            throw new PiValidationError(`'${name}' is required!`, name);
        if (this.type == 'date') {
            if (typeof value === 'undefined' || value === null || (value instanceof Date))
                return;
            if (typeof value != 'string' && typeof value != 'number')
                throw new PiValidationError(`'${name}' cannot be cast to a date`, name, value);
            let d = new Date(value);
            if (!(d instanceof Date) || isNaN(d.getTime()))
                throw new PiValidationError(`'${name}': ${JSON.stringify(value)} cannot be cast to a date`, name, value);
        }
        if (['number', 'integer'].includes(this.type) && isNaN(Number(value)))
            throw new PiValidationError(`'${name}': ${JSON.stringify(value)} cannot be cast to a ${this.type}`, name, value);
        if (this.type == 'enum') {
            let enumValue: string | undefined;
            if (!(enumValue = this.values!.find(v => 0 === v.localeCompare(value, void 0, { sensitivity: 'base' }))))
                throw new PiValidationError(`'${name}': ${JSON.stringify(value)} must be one of [${String(this.values!)}]`, name, value);
            return enumValue;
        }
    }

    validate(value: any): void {
        this._dovalidate(value, this.name);
    }
}