import { PiTypeDescriptor } from "../lib/PiTypeDescriptor";
import { PiFieldDescriptor } from "../lib/PiFieldDescriptor";
import { PiJstype, PiDescriptor, PiField } from '../lib';

const
    fields: PiFieldDescriptor[] = [
        new PiFieldDescriptor(F('str', 'string', true)),
        new PiFieldDescriptor(F('int1', 'integer', false)),
        new PiFieldDescriptor(F('num', 'number', false)),
        new PiFieldDescriptor(F('bools', 'boolean', true, undefined, true)),
        new PiFieldDescriptor(F('date1', 'date', true)),
        new PiFieldDescriptor(F('any1', 'any', false)),
        new PiFieldDescriptor(F('nums', 'number', true, undefined, true)),
        new PiFieldDescriptor(F('enum', 'enum', true, ['value1', 'value2', 'value3'])),
        new PiFieldDescriptor(F('int2', 'integer', false))
    ],
    rendered: PiDescriptor = {
        n:['str', 'int1', 'num', 'bools', 'date1', 'any1', 'nums', 'enum', 'int2'],
        d:[0b00110_01101_11100_00011_00010_01001, 0b00010_01111_11011],
        v:{ 7: ['value1', 'value2', 'value3'] }
    };

describe('PiTypeDescriptor', () => {
    let fd: PiTypeDescriptor;

    beforeEach(() => {
        fd = new PiTypeDescriptor();
    })

    describe('Constructors', () => {
        it('Created without parameters', () => {
            expect(fd).toBeTruthy();
        })

        it('Created with rendered parameter to parse', () => {
            fd = new PiTypeDescriptor(rendered);
            expect(fd).toBeTruthy();
        })

        it('Created with unique field array', () => {
            fd = new PiTypeDescriptor(fields);
            expect(fd.asArray()).toEqual(fields);
        })

        it('Created with field array with duplicated names', () => {
            let fieldArray2 = fields.concat([new PiFieldDescriptor(F('str', 'integer', true, undefined, true))]);
            fd = new PiTypeDescriptor(fieldArray2);
            expect(fd.asArray()).not.toEqual(fieldArray2);
        })
    })

    describe('Methods', () => {
        it('Set & Get fields', () => {
            fields.forEach(f => {
                fd.set(f);
                let a = fd.get(f.name);
                expect(a).toEqual(f);
            });
        })

        it('Get nonexistent field', () => {
            expect(() => fd.get('nonexistent'))
                .toThrowError(/Field 'nonexistent' unknown/);
        })

        it('Has() with existgent', () => {
            fd.set(fields[0]);
            expect(fd.has(fields[0].name)).toEqual(true);
        })
        it('Has() with unexistgent', () => {
            expect(fd.has('unknown')).toEqual(false);
        })

        it('Get array', () => {
            fields.forEach(f => fd.set(f));
            expect(fd.asArray()).toEqual(fields);
        })

        it('Get required array', () => {
            fields.forEach(f => fd.set(f));
            expect(fd.getRequired()).toEqual(fields.filter(f => f.required));
        })

        it('Render', () => {
            fields.forEach(f => fd.set(f));
            expect(fd.render()).toEqual(rendered);
        });

        function complete(f:any){
            f._field.isArray = !!f._field.isArray;
            return f;
        }
        it('Parse with enums', () => {
            fd.parse(rendered);
            fields.forEach(f =>
                expect(fd.get(f.name)).toEqual(complete(f))
            );
        });

        it('Parse without enums', () => {
            let fields2 = fields.filter(f => f.jsType != 'enum');
            let rendered2 = new PiTypeDescriptor(fields2).render();
            fd.parse(rendered2);
            fields2.forEach(f =>
                expect(fd.get(f.name)).toEqual(complete(f))
            );
        });
    });

    describe('Validation & conversions', () => {
        function setup(names: string[]) { names.forEach(name => fd.set(fields.find(f => f.name == name)!)) }

        it('succesful conversions', () => {
            setup(['str', 'int1', 'bools', 'enum']);
            let params: any = { path: { str: 123 }, query: { int1: 123.56, enum: 'value2' }, headers: { bools: 'false' } };
            fd.cast(params);
            expect(params).toEqual({ path: { str: '123' }, query: { int1: 123, enum: 'value2' }, headers: { bools: [false] } });
        })

        it('missing required fields', () => {
            setup(['str', 'int1', 'bools', 'enum']);
            let params: any = { path: { str: 123 }, query: { int1: 123.56, enum: 'value2' }, headers: {} };
            expect(() => fd.cast(params)).toThrowError(/Fields \[bools\] are required, but not found/);
        })

        it('unknown fields', () => {
            setup(['str', 'int1', 'bools', 'enum']);
            let params: any = { path: { str: 123, unk1: 456 }, query: { int1: 123.56, enum: 'value2' }, headers: { bools: 'false' } };
            expect(() => fd.cast(params)).toThrowError(/Field 'unk1' unknown/);
        })
    })
});

function F(name: string, jsType: PiJstype, required: boolean, values?: string[], isArray?: boolean): PiField {
    return { name, jsType, required, values, isArray };
}