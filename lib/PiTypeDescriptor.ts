import { FieldData, PiDescriptor, PiApiParams } from "./types";
import { PiFieldDescriptor } from "./PiFieldDescriptor";
import { PiValidationError } from './PiError';

export class PiTypeDescriptor {
    private _fields: { [name: string]: { index: number, field: PiFieldDescriptor } } = {};
    private _index: number = 0;
    private _arrayCache: {
        all?: PiFieldDescriptor[],
        required?: PiFieldDescriptor[]
    } = {};

    constructor(desc?: PiDescriptor | PiFieldDescriptor[]) {
        if (desc)
            if ('n' in desc)
                this.parse(<PiDescriptor>desc);
            else
                (<PiFieldDescriptor[]>desc).forEach(f => this.set(f));
    }

    set(field: PiFieldDescriptor): void {
        this._fields[field.name] = { index: this._index++, field };
        this._arrayCache = {};
    }

    get(name: string): PiFieldDescriptor {
        let data = this._fields[name];
        if (!data)
            throw new Error(`Field '${name}' unknown.`)
        return data.field;
    }

    has(name: string): boolean {
        return !!this._fields[name];
    }

    clear() {
        this._fields = {};
        this._index = 0;
        this._arrayCache = {};
    }

    /**
     * Returns the fields as an array in the same order that it was created
     */
    asArray(): PiFieldDescriptor[] {
        return this._arrayCache.all || (
            this._arrayCache.all = Object.keys(this._fields)
                .sort((a, b) => this._fields[a].index - this._fields[b].index)
                .map(name => this._fields[name].field)
        );
    }

    getRequired(): PiFieldDescriptor[] {
        return this._arrayCache.required || (
            this._arrayCache.required = this.asArray().filter(f => f.required)
        );
    }

    render(): PiDescriptor {
        const names: string[] = [], data: number[] = [], values = <any>{};
        let i = 0, d = 0;
        this.asArray()
            .forEach((field, idx) => {
                names.push(field.name);
                if (field.values) values[idx] = field.values;
                d |= field.toInt() << i;
                if ((i += FieldData.bitcount) >= FieldData.maxBitsPerInt) {
                    data.push(d);
                    d = 0; i = 0;
                }
            });
        if (d) data.push(d);
        const n = names.join('|');
        const hasEnums = !!Object.keys(values).length;
        return hasEnums ? { n, d: data, v: values } : { n, d: data };
    }

    parse({ n, d: data, v: enums }: PiDescriptor) {
        this.clear();
        if (!enums) enums = {};
        let all: PiFieldDescriptor[] = [];
        let i = 0, d = 0;
        const names = n.split('|');
        for (let n = 0; n < names.length; n++) {
            let value: number = (data[d] >> i) & FieldData.mask;
            let field = new PiFieldDescriptor(names[n], value, enums![n]);
            this.set(field);
            all.push(field);

            if ((i += FieldData.bitcount) >= FieldData.maxBitsPerInt) {
                d++; i = 0;
            }
        }
        this._arrayCache.all = all;
    }

    cast(params: PiApiParams) {
        let me = this;
        let sent: string[] = [];
        normalize(params.path);
        normalize(params.query);
        normalize(params.headers, true);
        normalize(params.body);
        validateNotSentRequired();
        return;

        function normalize(obj: any, skipUnknown?: boolean) {
            if (!obj) return;
            Object.keys(obj)
                .forEach(name => {
                    let entry = me._fields[name];
                    if (entry) {
                        entry.field.cast(obj);
                        sent.push(name);
                    } else if (!skipUnknown)
                        throw new Error(`Field '${name}' unknown.`)
                });
        }
        function validateNotSentRequired() {
            let reqNotSent = me.getRequired()
                .filter(f => !sent.includes(f.name))
                .map(f => f.name);
            if (reqNotSent.length)
                throw new PiValidationError(`Fields [${reqNotSent.toString()}] are required, but not found`, String(reqNotSent));
        }
    }
}