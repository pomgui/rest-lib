import { PiTypeDescriptor, PiDescriptor } from "../lib/PiTypeDescriptor";
import { PiFieldDescriptor } from "../lib/PiFieldDescriptor";

const
    fields: PiFieldDescriptor[] = [
        new PiFieldDescriptor('str', 'string', true),
        new PiFieldDescriptor('int1', 'integer', false),
        new PiFieldDescriptor('num', 'number', false),
        new PiFieldDescriptor('bools', 'boolean[]', true),
        new PiFieldDescriptor('date1', 'date', true),
        new PiFieldDescriptor('any1', 'any', false),
        new PiFieldDescriptor('nums', 'number[]', true),
        new PiFieldDescriptor('enum', 'enum', true, ['value1', 'value2', 'value3']),
        new PiFieldDescriptor('int2', 'integer', false)
    ],
    rendered: PiDescriptor = [
        ['str', 'int1', 'num', 'bools', 'date1', 'any1', 'nums', 'enum', 'int2'],
        [0b00110_01101_11100_00011_00010_01001, 0b00010_01111_11011],
        { 7: ['value1', 'value2', 'value3'] }
    ];

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
            let fieldArray2 = fields.concat([new PiFieldDescriptor('str', 'integer[]', true)]);
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

        it('Has() with existgent', ()=>{
            fd.set(fields[0]);
            expect(fd.has(fields[0].name)).toEqual(true);
        })
        it('Has() with unexistgent', ()=>{
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

        it('Parse with enums', () => {
            fd.parse(rendered);
            fields.forEach(f =>
                expect(fd.get(f.name)).toEqual(f)
            );
        });

        it('Parse without enums', () => {
            let fields2 = fields.filter(f => f.type != 'enum');
            let rendered2 = new PiTypeDescriptor(fields2).render();
            fd.parse(rendered2);
            fields2.forEach(f =>
                expect(fd.get(f.name)).toEqual(f)
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
            expect(()=>fd.cast(params)).toThrowError(/Fields \[bools\] are required, but not found/);
        })

        it('unknown fields', () => {
            setup(['str', 'int1', 'bools', 'enum']);
            let params: any = { path: { str: 123, unk1: 456 }, query: { int1: 123.56, enum: 'value2' }, headers: { bools: 'false' } };
            expect(()=>fd.cast(params)).toThrowError(/Field 'unk1' unknown/);
        })
    })
});