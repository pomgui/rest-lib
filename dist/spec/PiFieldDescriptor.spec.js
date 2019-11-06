"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PiFieldDescriptor_1 = require("../lib/PiFieldDescriptor");
var lib_1 = require("../lib");
var fields = [
    new PiFieldDescriptor_1.PiFieldDescriptor({ name: 'name', jsType: 'string', required: true }),
    new PiFieldDescriptor_1.PiFieldDescriptor({ name: 'when', jsType: 'date', required: false }),
    new PiFieldDescriptor_1.PiFieldDescriptor({ name: 'age', jsType: 'integer', required: true }),
    new PiFieldDescriptor_1.PiFieldDescriptor({ name: 'isMale', jsType: 'boolean', required: true }),
];
var fd;
describe('PiFieldDescriptor', function () {
    describe('constructors', function () {
        it('Created with name and numeric data (string, required)', function () {
            fd = new PiFieldDescriptor_1.PiFieldDescriptor('name', lib_1.typeBitValue.string | lib_1.FieldData.required);
            expect(fd).toBeTruthy();
            expect(fd.name).toEqual('name');
            expect(fd.required).toEqual(true);
            expect(fd.jsType).toEqual('string');
        });
        it('Created with name and numeric data (integer, not required)', function () {
            fd = new PiFieldDescriptor_1.PiFieldDescriptor('name', lib_1.typeBitValue.integer);
            expect(fd).toBeTruthy();
            expect(fd.name).toEqual('name');
            expect(fd.required).toEqual(false);
            expect(fd.jsType).toEqual('integer');
        });
        it('Created with name, type=integer, required=false', function () {
            fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('name', 'integer', false));
            expect(fd).toBeTruthy();
            expect(fd.name).toEqual('name');
            expect(fd.required).toEqual(false);
            expect(fd.jsType).toEqual('integer');
            expect(fd.type).toEqual('number');
        });
        it('Created with field:PiField', function () {
            var field = { name: 'name', required: true, isArray: true, comment: 'xpto', jsType: 'date' };
            fd = new PiFieldDescriptor_1.PiFieldDescriptor(field);
            expect(fd).toBeTruthy();
            Object.keys(field).forEach(function (key) { return expect(fd[key]).toEqual(field[key]); });
        });
        it('Created enum without values', function () {
            var field = { name: 'xpto', required: true, isArray: true, jsType: 'enum' };
            expect(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(field); })
                .toThrowError(/Cannot define field 'xpto' as enum without values/);
        });
        it('Invalid value for name parameter', function () {
            var d = new Date('2019-01-01');
            expect(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(d); })
                .toThrowError(/PiFieldDescriptor.constructor: Invalid name '.*'/);
        });
        it('Invalid value for type parameter', function () {
            var d = new Date('2019-01-01');
            expect(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor('field12', d); })
                .toThrowError(/Parameter data '.*' must be number/);
        });
        it('Created with a unknown type', function () {
            expect(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('field1', 'PitoStatus', true)); })
                .toThrowError('Invalid type \'PitoStatus\'. Valid types: string,integer,number,boolean,date,any,enum');
        });
    });
    describe('Miscelaneus methods', function () {
        var init = function (req) { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('name', 'integer', req)); };
        it('toInt()', function () { init(false); expect(fd.toInt()).toEqual(lib_1.typeBitValue.integer); });
        it('optional() when required==false', function () { init(false); expect(fd.optional()).toEqual('?'); });
        it('optional() when required==true', function () { init(true); expect(fd.optional()).toEqual(''); });
        it('type returns "[]" when is an array', function () {
            fd = new PiFieldDescriptor_1.PiFieldDescriptor({ name: 'name', jsType: 'date', required: true, isArray: true });
            expect(fd.type).toEqual('Date[]');
        });
    });
    describe('Required String Validation', function () {
        var fd;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('name', 'string', true)); });
        it('with number: no error', function () {
            expect(function () { return fd.validate(1); }).not.toThrow();
        });
        it('with date: no error', function () {
            expect(function () { return fd.validate(new Date()); }).not.toThrow();
        });
        it('with boolean: no error', function () {
            expect(function () { return fd.validate(false); }).not.toThrow();
        });
        it('with null | undefined: error is required!', function () {
            expect(function () { return fd.validate(null); }).toThrowError(/'.*' is required!/);
            expect(function () { return fd.validate(void 0); }).toThrowError(/'.*' is required!/);
        });
    });
    describe('Required Date Validation', function () {
        var fd;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('birthdate', 'date', true)); });
        it('with number: no error', function () {
            expect(function () { return fd.validate(1); }).not.toThrow();
        });
        it('with date string: no error', function () {
            expect(function () { return fd.validate('2019-01-01'); }).not.toThrow();
        });
        it('with not date string: error cannot be cast to a date', function () {
            expect(function () { return fd.validate('abcde'); }).toThrowError(/cannot be cast to a date/);
        });
        it('with boolean: error cannot be cast to a date', function () {
            expect(function () { return fd.validate(false); }).toThrowError(/'.*' cannot be cast to a date/);
        });
        it('with null | undefined: error is required!', function () {
            expect(function () { return fd.validate(null); }).toThrowError(/'.*' is required!/);
            expect(function () { return fd.validate(void 0); }).toThrowError(/'.*' is required!/);
        });
    });
    describe('Cast To String', function () {
        var fd;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('address', 'string', true)); });
        var test = function (val, res) {
            var d = { address: val };
            fd.cast(d);
            expect(d.address).toEqual(res);
        };
        it('with string', function () { return test('abcd', 'abcd'); });
        it('with number', function () { return test(12345, '12345'); });
        it('with date', function () { return test(new Date('2019-01-01'), '2019-01-01T00:00:00.000Z'); });
        it('with boolean', function () { return test(true, 'true'); });
        it('with array', function () { return test([12, 345], '12,345'); });
        it('with object', function () { return test({ a: 1 }, '[object Object]'); });
    });
    describe('Cast To Enum', function () {
        var test = function (caption, val, result, error) {
            it(caption, function () {
                var data = { sex: val };
                var fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('sex', 'enum', true, ['male', 'female']));
                if (error)
                    expect(function () { return fd.cast(data); }).toThrowError(error);
                else
                    expect(fd.cast(data)).toEqual(result);
            });
        };
        test('with valid value', 'male', 'male', null);
        test('with valid value, different case', 'Male', 'male', null);
        test('with invalid value', 'Few', null, /'sex': "Few" must be one of \[male,female\]/);
    });
    describe('Cast To Number', function () {
        var fd;
        var err = /cannot be cast to a number/;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('weight', 'number', true)); });
        var test = function (val, res) {
            var d = { weight: val };
            if (typeof res == 'number') {
                fd.cast(d);
                expect(d.weight).toEqual(res);
            }
            else
                expect(function () { return fd.cast(d); }).toThrowError(err);
        };
        it('with valid number string', function () { return test('12345.67', 12345.67); });
        it('with invalid number string', function () { return test('abc', err); });
        it('with date', function () { return test(new Date('2019-01-01'), 1546300800000); });
        it('with boolean', function () { return test(true, 1); });
        it('with array', function () { return test([12, 345], err); });
        it('with object', function () { return test({ a: 1 }, err); });
    });
    describe('Cast To Integer', function () {
        var fd;
        var err = /cannot be cast to a integer/;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('age', 'integer', true)); });
        var test = function (val, res) {
            var d = { age: val };
            if (typeof res == 'number') {
                fd.cast(d);
                expect(d.age).toEqual(res);
            }
            else
                expect(function () { return fd.cast(d); }).toThrowError(err);
        };
        it('with a floating point number', function () { return test(12345.67, 12345); });
        it('with valid number string', function () { return test('12345.67', 12345); });
        it('with invalid number string', function () { return test('abc', err); });
        it('with date', function () { return test(new Date('2019-01-01'), 1546300800000); });
        it('with boolean', function () { return test(true, 1); });
        it('with array', function () { return test([12, 345], err); });
        it('with object', function () { return test({ a: 1 }, err); });
    });
    describe('Cast To Date', function () {
        var fd;
        var err = /cannot be cast to a date/;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('birthdate', 'date', false)); });
        var test = function (val, res) {
            var d = { birthdate: val };
            if (typeof res == 'string') {
                fd.cast(d);
                expect(d.birthdate).toEqual(new Date(res));
            }
            else if (res === null || res === undefined) {
                fd.cast(d);
                expect(d.birthdate).toBe(res);
            }
            else
                expect(function () { return fd.cast(d); }).toThrowError(err);
        };
        it('with date', function () { return test(new Date(12345), '1970-01-01T00:00:12.345Z'); });
        it('with undefined', function () { return test('undefined', undefined); });
        it('with null', function () { return test('null', null); });
        it('with number', function () { return test(12345, '1970-01-01T00:00:12.345Z'); });
        it('with boolean', function () { return test(true, err); });
        it('with array', function () { return test([12, 345], err); });
        it('with object', function () { return test({ a: 1 }, err); });
        it('with date ISO string', function () { return test('2019-01-01', '2019-01-01T00:00:00.000Z'); });
        it('with a valid date string format', function () { return test('12/24/2019', '2019-12-24T02:00:00.000Z'); });
        it('with an invalid date string format', function () { return test('12/ab/2019', err); });
    });
    describe('Cast To Boolean', function () {
        var fd;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('isStudent', 'boolean', true)); });
        var test = function (val, res) {
            var d = { isStudent: val };
            fd.cast(d);
            expect(d.isStudent).toEqual(res);
        };
        it('with number', function () { return test(12345.67, true); });
        it('with string', function () { return test('abc', true); });
        it('with "false"', function () { return test('false', false); });
        it('with "true"', function () { return test('true', true); });
        it('with date', function () { return test(new Date('2019-01-01'), true); });
        it('with boolean', function () { return test(true, true); });
        it('with array', function () { return test([12, 345], true); });
        it('with object', function () { return test({ a: 1 }, true); });
    });
    describe('Cast To Any', function () {
        var fd;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('tag', 'any', true)); });
        var test = function (val) {
            var d = { tag: val };
            fd.cast(d);
            expect(d.tag).toEqual(val);
        };
        it('with number', function () { return test(12345.67); });
        it('with string', function () { return test('abc'); });
        it('with date', function () { return test(new Date('2019-01-01')); });
        it('with boolean', function () { return test(true); });
        it('with array', function () { return test([12, 345]); });
        it('with object', function () { return test({ a: 1 }); });
    });
    describe('Cast To Array<Date>', function () {
        var fd;
        var err = /cannot be cast to a date/;
        beforeEach(function () { return fd = new PiFieldDescriptor_1.PiFieldDescriptor(F('datearray', 'date', true, undefined, true)); });
        var test = function (val, res) {
            var d = { datearray: val };
            if (Array.isArray(res)) {
                fd.cast(d);
                expect(d.datearray).toEqual(res.map(function (r) { return new Date(r); }));
            }
            else
                expect(function () { return fd.cast(d); }).toThrowError(err);
        };
        it('with number', function () { return test(12345, ['1970-01-01T00:00:12.345Z']); });
        it('with boolean', function () { return test(true, err); });
        it('with number array', function () { return test([12, 345], ['1970-01-01T00:00:00.012Z', '1970-01-01T00:00:00.345Z']); });
        it('with object', function () { return test({ a: 1 }, err); });
        it('with date ISO string', function () { return test('2019-01-01', ['2019-01-01T00:00:00.000Z']); });
        it('with a valid date string format', function () { return test('12/24/2019', ['2019-12-24T02:00:00.000Z']); });
        it('with an invalid date string format', function () { return test('12/ab/2019', err); });
        it('with date valid mix types array', function () { return test(['2019-01-01', '2015-12-31', 12345, '12/24/2019'], ['2019-01-01T00:00:00.000Z', '2015-12-31T00:00:00.000Z', '1970-01-01T00:00:12.345Z', '2019-12-24T02:00:00.000Z']); });
    });
});
function F(name, jsType, required, values, isArray) {
    return { name: name, jsType: jsType, required: required, values: values, isArray: isArray };
}
