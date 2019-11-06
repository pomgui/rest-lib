import { FieldData, typeBitValue, PiField } from "./types";
import { PiValidationError, PiError } from "./PiError";

export class PiFieldDescriptor {
    private _field: PiField;
    constructor(field: PiField);
    constructor(name: string, data: number, values?: string[]);
    constructor(name: string | PiField, data?: number, values?: string[]) {
        if (typeof data == 'undefined' && typeof name == 'object' && ('name' in name)) {
            // PiField was sent in name, so get a copy
            this._field = Object.assign({}, name as PiField);
            if (typeBitValue[this._field.jsType] === void 0)
                throw new PiError(`Invalid type '${this._field.jsType}'. Valid types: ${Object.keys(typeBitValue).filter(k => !(<any>k | 0)).toString()}`)
        } else {
            this._field = <any>{};
            if (typeof name == 'string')
                this._field.name = name;
            else
                throw new PiError(`PiFieldDescriptor.constructor: Invalid name '${name}'`);
            if (typeof data != 'number')
                throw new PiError(`PiFieldDescriptor.constructor: Parameter data '${data}' must be number`);
            this._field.required = !!(data & FieldData.required);
            this._field.isArray = !!(data & FieldData.isArray);
            data &= ~(FieldData.required | FieldData.isArray);
            this._field.jsType = typeBitValue[data];
            this._field.values = values;
        }
        if (this.jsType == 'enum' && !this.values)
            throw new PiError(`Cannot define field '${this.name}' as enum without values`)
    }

    get name() { return this._field.name; }
    get comment() { return this._field.comment; }
    get jsType() { return this._field.jsType; }
    get isArray() { return this._field.isArray; }
    get values() { return this._field.values; }
    get required() { return this._field.required; }
    get type() {
        return this._field.type || (this._field.type = type(this._field.jsType, this.isArray));
        function type(js: string, isArray?: boolean): string {
            if (js == 'date') js = 'Date';
            else if (js == 'integer') js = 'number';
            else if (js == 'null' || js == 'undefined') return js;
            return js + ['', '[]'][<any>isArray | 0];
        }
    }

    optional(): string { return this.required ? '' : '?' }

    toInt(): number {
        return typeBitValue[this.jsType]
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
            switch (me.jsType) {
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
        if (this.jsType == 'date') {
            if (typeof value === 'undefined' || value === null || (value instanceof Date))
                return;
            if (typeof value != 'string' && typeof value != 'number')
                throw new PiValidationError(`'${name}' cannot be cast to a date`, name, value);
            let d = new Date(value);
            if (!(d instanceof Date) || isNaN(d.getTime()))
                throw new PiValidationError(`'${name}': ${JSON.stringify(value)} cannot be cast to a date`, name, value);
        }
        if (['number', 'integer'].includes(this.jsType) && isNaN(Number(value)))
            throw new PiValidationError(`'${name}': ${JSON.stringify(value)} cannot be cast to a ${this.jsType}`, name, value);
        if (this.jsType == 'enum') {
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