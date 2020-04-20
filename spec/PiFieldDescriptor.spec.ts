import { PiFieldDescriptor } from "../lib/PiFieldDescriptor";
import { typeBitValue, FieldData, PiJstype, PiField } from "../lib";

const
    fields: PiFieldDescriptor[] = [
        new PiFieldDescriptor({ name: 'name', jsType: 'string', required: true }),
        new PiFieldDescriptor({ name: 'when', jsType: 'date', required: false }),
        new PiFieldDescriptor({ name: 'age', jsType: 'integer', required: true }),
        new PiFieldDescriptor({ name: 'isMale', jsType: 'boolean', required: true }),
    ];

var fd: PiFieldDescriptor;

describe('PiFieldDescriptor', () => {

    describe('constructors', () => {

        it('Created with name and numeric data (string, required)', () => {
            fd = new PiFieldDescriptor('name', typeBitValue.string | FieldData.required);
            expect(fd).toBeTruthy();
            expect(fd.name).toEqual('name');
            expect(fd.required).toEqual(true);
            expect(fd.jsType).toEqual('string');
        })

        it('Created with name and numeric data (integer, not required)', () => {
            fd = new PiFieldDescriptor('name', typeBitValue.integer);
            expect(fd).toBeTruthy();
            expect(fd.name).toEqual('name');
            expect(fd.required).toEqual(false);
            expect(fd.jsType).toEqual('integer');
        })

        it('Created with name, type=integer, required=false', () => {
            fd = new PiFieldDescriptor(F('name', 'integer', false));
            expect(fd).toBeTruthy();
            expect(fd.name).toEqual('name');
            expect(fd.required).toEqual(false);
            expect(fd.jsType).toEqual('integer');
            expect(fd.type).toEqual('number');
        })

        it('Created with field:PiField', () => {
            let field: PiField = { name: 'name', required: true, isArray: true, comment: 'xpto', jsType: 'date' };
            fd = new PiFieldDescriptor(field);
            expect(fd).toBeTruthy();
            Object.keys(field).forEach(key => expect((<any>fd)[key]).toEqual((<any>field)[key]))
        })

        it('Created enum without values', () => {
            let field: PiField = { name: 'xpto', required: true, isArray: true, jsType: 'enum' };
            expect(() => fd = new PiFieldDescriptor(field))
                .toThrowError(/Cannot define field 'xpto' as enum without values/);
        })

        it('Invalid value for name parameter', () => {
            let d: any = new Date('2019-01-01');
            expect(() => fd = new PiFieldDescriptor(d))
                .toThrowError(/PiFieldDescriptor.constructor: Invalid name '.*'/)
        })

        it('Invalid value for type parameter', () => {
            let d: any = new Date('2019-01-01');
            expect(() => fd = new PiFieldDescriptor('field12', d))
                .toThrowError(/Parameter data '.*' must be number/)
        })

        it('Created with a unknown type', () => {
            expect(() => fd = new PiFieldDescriptor(F('field1', <any>'PitoStatus', true)))
                .toThrowError('Invalid type \'PitoStatus\'. Valid types: string,integer,number,boolean,date,any,enum')
        })
    });

    describe('Miscelaneus methods', () => {
        let init = (req: boolean) => fd = new PiFieldDescriptor(F('name', 'integer', req));

        it('toInt()', () => { init(false); expect(fd.toInt()).toEqual(typeBitValue.integer); })
        it('optional() when required==false', () => { init(false); expect(fd.optional()).toEqual('?'); })
        it('optional() when required==true', () => { init(true); expect(fd.optional()).toEqual(''); })
        
        it('type returns "[]" when is an array', ()=>{
            fd = new PiFieldDescriptor({name:'name', jsType:'date', required: true, isArray: true});
            expect(fd.type).toEqual('Date[]');
        })
    })

    describe('Required String Validation', () => {
        let fd: PiFieldDescriptor;
        beforeEach(() => fd = new PiFieldDescriptor(F('name', 'string', true)));

        it('with number: no error', () => {
            expect(() => fd.validate(1)).not.toThrow();
        })
        it('with date: no error', () => {
            expect(() => fd.validate(new Date())).not.toThrow();
        })
        it('with boolean: no error', () => {
            expect(() => fd.validate(false)).not.toThrow();
        })
        it('with null | undefined: error is required!', () => {
            expect(() => fd.validate(null)).toThrowError(/'.*' is required!/);
            expect(() => fd.validate(void 0)).toThrowError(/'.*' is required!/);
        })
    })

    describe('Required Date Validation', () => {
        let fd: PiFieldDescriptor;
        beforeEach(() => fd = new PiFieldDescriptor(F('birthdate', 'date', true)));

        it('with number: no error', () => {
            expect(() => fd.validate(1)).not.toThrow();
        })
        it('with date string: no error', () => {
            expect(() => fd.validate('2019-01-01')).not.toThrow();
        })
        it('with not date string: error cannot be cast to a date', () => {
            expect(() => fd.validate('abcde')).toThrowError(/cannot be cast to a date/);
        })
        it('with boolean: error cannot be cast to a date', () => {
            expect(() => fd.validate(false)).toThrowError(/'.*' cannot be cast to a date/);
        })
        it('with null | undefined: error is required!', () => {
            expect(() => fd.validate(null)).toThrowError(/'.*' is required!/);
            expect(() => fd.validate(void 0)).toThrowError(/'.*' is required!/);
        })
    })

    describe('Cast To String', () => {
        let fd: PiFieldDescriptor;
        beforeEach(() => fd = new PiFieldDescriptor(F('address', 'string', true)));

        let test = (val: any, res: string) => {
            let d = { address: val };
            fd.cast(d); expect(d.address).toEqual(res);
        };

        it('with string', () => test('abcd', 'abcd'));
        it('with number', () => test(12345, '12345'));
        it('with date', () => test(new Date('2019-01-01'), '2019-01-01T00:00:00.000Z'));
        it('with boolean', () => test(true, 'true'));
        it('with array', () => test([12, 345], '12,345'));
        it('with object', () => test({ a: 1 }, '[object Object]'));
    })

    describe('Cast To Enum', () => {
        let test = (caption: string, val: any, result: any, error: any) => {
            it(caption, () => {
                let data = { sex: val };
                let fd = new PiFieldDescriptor(F('sex', 'enum', true, ['male', 'female']))
                if (error) expect(() => fd.cast(data)).toThrowError(error);
                else expect(fd.cast(data)).toEqual(result);
            })
        };

        test('with valid value', 'male', 'male', null);
        test('with valid value, different case', 'Male', 'male', null);
        test('with invalid value', 'Few', null, /'sex': "Few" must be one of \[male,female\]/);
    })

    describe('Cast To Number', () => {
        let fd: PiFieldDescriptor;
        let err = /cannot be cast to a number/;
        beforeEach(() => fd = new PiFieldDescriptor(F('weight', 'number', true)));

        let test = (val: any, res: number | RegExp) => {
            let d = { weight: val };
            if (typeof res == 'number') {
                fd.cast(d); expect(d.weight).toEqual(res);
            } else
                expect(() => fd.cast(d)).toThrowError(err);
        };

        it('with valid number string', () => test('12345.67', 12345.67));
        it('with invalid number string', () => test('abc', err));
        it('with date', () => test(new Date('2019-01-01'), 1546300800000));
        it('with boolean', () => test(true, 1));
        it('with array', () => test([12, 345], err));
        it('with object', () => test({ a: 1 }, err));
    })

    describe('Cast To Integer', () => {
        let fd: PiFieldDescriptor;
        let err = /cannot be cast to a integer/;
        beforeEach(() => fd = new PiFieldDescriptor(F('age', 'integer', true)));

        let test = (val: any, res: number | RegExp) => {
            let d = { age: val };
            if (typeof res == 'number') {
                fd.cast(d); expect(d.age).toEqual(res);
            } else
                expect(() => fd.cast(d)).toThrowError(err);
        };

        it('with a floating point number', () => test(12345.67, 12345));
        it('with valid number string', () => test('12345.67', 12345));
        it('with invalid number string', () => test('abc', err));
        it('with date', () => test(new Date('2019-01-01'), 1546300800000));
        it('with boolean', () => test(true, 1));
        it('with array', () => test([12, 345], err));
        it('with object', () => test({ a: 1 }, err));
    })

    describe('Cast To Date', () => {
        let fd: PiFieldDescriptor;
        let err = /cannot be cast to a date/;
        beforeEach(() => fd = new PiFieldDescriptor(F('birthdate', 'date', false)));

        let test = (val: any, res?: string | RegExp | null) => {
            let d = { birthdate: val };
            if (typeof res == 'string') {
                fd.cast(d); expect(d.birthdate).toEqual(new Date(res));
            } else if (res === null || res === undefined) {
                fd.cast(d); expect(d.birthdate).toBe(res);
            } else
                expect(() => fd.cast(d)).toThrowError(err);
        };

        it('with date', () => test(new Date(12345), '1970-01-01T00:00:12.345Z'));
        it('with undefined', () => test('undefined', undefined))
        it('with null', () => test('null', null))
        it('with number', () => test(12345, '1970-01-01T00:00:12.345Z'));
        it('with boolean', () => test(true, err));
        it('with array', () => test([12, 345], err));
        it('with object', () => test({ a: 1 }, err));
        it('with date ISO string', () => test('2019-01-01', '2019-01-01T00:00:00.000Z'));
        it('with a valid date string format', () => test('12/24/2019', '2019-12-24T02:00:00.000Z'));
        it('with an invalid date string format', () => test('12/ab/2019', err));
    })

    describe('Cast To Boolean', () => {
        let fd: PiFieldDescriptor;
        beforeEach(() => fd = new PiFieldDescriptor(F('isStudent', 'boolean', true)));

        let test = (val: any, res: boolean) => {
            let d = { isStudent: val };
            fd.cast(d); expect(d.isStudent).toEqual(res);
        };

        it('with number', () => test(12345.67, true));
        it('with string', () => test('abc', true));
        it('with "false"', () => test('false', false));
        it('with "true"', () => test('true', true));
        it('with date', () => test(new Date('2019-01-01'), true));
        it('with boolean', () => test(true, true));
        it('with array', () => test([12, 345], true));
        it('with object', () => test({ a: 1 }, true));
    })

    describe('Cast To Any', () => {
        let fd: PiFieldDescriptor;
        beforeEach(() => fd = new PiFieldDescriptor(F('tag', 'any', true)));

        let test = (val: any) => {
            let d = { tag: val };
            fd.cast(d); expect(d.tag).toEqual(val);
        };

        it('with number', () => test(12345.67));
        it('with string', () => test('abc'));
        it('with date', () => test(new Date('2019-01-01')));
        it('with boolean', () => test(true));
        it('with array', () => test([12, 345]));
        it('with object', () => test({ a: 1 }));
    })

    describe('Cast To Array<Date>', () => {
        let fd: PiFieldDescriptor;
        let err = /cannot be cast to a date/;
        beforeEach(() => fd = new PiFieldDescriptor(F('datearray', 'date', true, undefined, true)));

        let test = (val: any, res: string[] | RegExp) => {
            let d = { datearray: val };
            if (Array.isArray(res)) {
                fd.cast(d); expect(d.datearray).toEqual(res.map(r => new Date(r)));
            } else
                expect(() => fd.cast(d)).toThrowError(err);
        };

        it('with number', () => test(12345, ['1970-01-01T00:00:12.345Z']));
        it('with boolean', () => test(true, err));
        it('with number array', () => test([12, 345], ['1970-01-01T00:00:00.012Z', '1970-01-01T00:00:00.345Z']));
        it('with object', () => test({ a: 1 }, err));
        it('with date ISO string', () => test('2019-01-01', ['2019-01-01T00:00:00.000Z']));
        it('with a valid date string format', () => test('12/24/2019', ['2019-12-24T02:00:00.000Z']));
        it('with an invalid date string format', () => test('12/ab/2019', err));
        it('with date valid mix types array', () => test(['2019-01-01', '2015-12-31', 12345, '12/24/2019'], ['2019-01-01T00:00:00.000Z', '2015-12-31T00:00:00.000Z', '1970-01-01T00:00:12.345Z', '2019-12-24T02:00:00.000Z']));
    })
});

function F(name: string, jsType: PiJstype, required: boolean, values?: string[], isArray?: boolean): PiField {
    return { name, jsType, required, values, isArray };
}
