"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PiTypeDescriptor_1 = require("../lib/PiTypeDescriptor");
var PiFieldDescriptor_1 = require("../lib/PiFieldDescriptor");
var fields = [
    new PiFieldDescriptor_1.PiFieldDescriptor(F('str', 'string', true)),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('int1', 'integer', false)),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('num', 'number', false)),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('bools', 'boolean', true, undefined, true)),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('date1', 'date', true)),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('any1', 'any', false)),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('nums', 'number', true, undefined, true)),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('enum', 'enum', true, ['value1', 'value2', 'value3'])),
    new PiFieldDescriptor_1.PiFieldDescriptor(F('int2', 'integer', false))
], rendered = {
    n: ['str', 'int1', 'num', 'bools', 'date1', 'any1', 'nums', 'enum', 'int2'],
    d: [215878729, 2555],
    v: { 7: ['value1', 'value2', 'value3'] }
};
describe('PiTypeDescriptor', function () {
    var fd;
    beforeEach(function () {
        fd = new PiTypeDescriptor_1.PiTypeDescriptor();
    });
    describe('Constructors', function () {
        it('Created without parameters', function () {
            expect(fd).toBeTruthy();
        });
        it('Created with rendered parameter to parse', function () {
            fd = new PiTypeDescriptor_1.PiTypeDescriptor(rendered);
            expect(fd).toBeTruthy();
        });
        it('Created with unique field array', function () {
            fd = new PiTypeDescriptor_1.PiTypeDescriptor(fields);
            expect(fd.asArray()).toEqual(fields);
        });
        it('Created with field array with duplicated names', function () {
            var fieldArray2 = fields.concat([new PiFieldDescriptor_1.PiFieldDescriptor(F('str', 'integer', true, undefined, true))]);
            fd = new PiTypeDescriptor_1.PiTypeDescriptor(fieldArray2);
            expect(fd.asArray()).not.toEqual(fieldArray2);
        });
    });
    describe('Methods', function () {
        it('Set & Get fields', function () {
            fields.forEach(function (f) {
                fd.set(f);
                var a = fd.get(f.name);
                expect(a).toEqual(f);
            });
        });
        it('Get nonexistent field', function () {
            expect(function () { return fd.get('nonexistent'); })
                .toThrowError(/Field 'nonexistent' unknown/);
        });
        it('Has() with existgent', function () {
            fd.set(fields[0]);
            expect(fd.has(fields[0].name)).toEqual(true);
        });
        it('Has() with unexistgent', function () {
            expect(fd.has('unknown')).toEqual(false);
        });
        it('Get array', function () {
            fields.forEach(function (f) { return fd.set(f); });
            expect(fd.asArray()).toEqual(fields);
        });
        it('Get required array', function () {
            fields.forEach(function (f) { return fd.set(f); });
            expect(fd.getRequired()).toEqual(fields.filter(function (f) { return f.required; }));
        });
        it('Render', function () {
            fields.forEach(function (f) { return fd.set(f); });
            expect(fd.render()).toEqual(rendered);
        });
        function complete(f) {
            f._field.isArray = !!f._field.isArray;
            return f;
        }
        it('Parse with enums', function () {
            fd.parse(rendered);
            fields.forEach(function (f) {
                return expect(fd.get(f.name)).toEqual(complete(f));
            });
        });
        it('Parse without enums', function () {
            var fields2 = fields.filter(function (f) { return f.jsType != 'enum'; });
            var rendered2 = new PiTypeDescriptor_1.PiTypeDescriptor(fields2).render();
            fd.parse(rendered2);
            fields2.forEach(function (f) {
                return expect(fd.get(f.name)).toEqual(complete(f));
            });
        });
    });
    describe('Validation & conversions', function () {
        function setup(names) { names.forEach(function (name) { return fd.set(fields.find(function (f) { return f.name == name; })); }); }
        it('succesful conversions', function () {
            setup(['str', 'int1', 'bools', 'enum']);
            var params = { path: { str: 123 }, query: { int1: 123.56, enum: 'value2' }, headers: { bools: 'false' } };
            fd.cast(params);
            expect(params).toEqual({ path: { str: '123' }, query: { int1: 123, enum: 'value2' }, headers: { bools: [false] } });
        });
        it('missing required fields', function () {
            setup(['str', 'int1', 'bools', 'enum']);
            var params = { path: { str: 123 }, query: { int1: 123.56, enum: 'value2' }, headers: {} };
            expect(function () { return fd.cast(params); }).toThrowError(/Fields \[bools\] are required, but not found/);
        });
        it('unknown fields', function () {
            setup(['str', 'int1', 'bools', 'enum']);
            var params = { path: { str: 123, unk1: 456 }, query: { int1: 123.56, enum: 'value2' }, headers: { bools: 'false' } };
            expect(function () { return fd.cast(params); }).toThrowError(/Field 'unk1' unknown/);
        });
    });
});
function F(name, jsType, required, values, isArray) {
    return { name: name, jsType: jsType, required: required, values: values, isArray: isArray };
}
