"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
var PiFieldDescriptor_1 = require("./PiFieldDescriptor");
var PiError_1 = require("./PiError");
var PiTypeDescriptor = /** @class */ (function () {
    function PiTypeDescriptor(desc) {
        var _this = this;
        this._fields = {};
        this._index = 0;
        this._arrayCache = {};
        if (desc)
            if ('n' in desc)
                this.parse(desc);
            else
                desc.forEach(function (f) { return _this.set(f); });
    }
    PiTypeDescriptor.prototype.set = function (field) {
        this._fields[field.name] = { index: this._index++, field: field };
        this._arrayCache = {};
    };
    PiTypeDescriptor.prototype.get = function (name) {
        var data = this._fields[name];
        if (!data)
            throw new Error("Field '" + name + "' unknown.");
        return data.field;
    };
    PiTypeDescriptor.prototype.has = function (name) {
        return !!this._fields[name];
    };
    PiTypeDescriptor.prototype.clear = function () {
        this._fields = {};
        this._index = 0;
        this._arrayCache = {};
    };
    /**
     * Returns the fields as an array in the same order that it was created
     */
    PiTypeDescriptor.prototype.asArray = function () {
        var _this = this;
        return this._arrayCache.all || (this._arrayCache.all = Object.keys(this._fields)
            .sort(function (a, b) { return _this._fields[a].index - _this._fields[b].index; })
            .map(function (name) { return _this._fields[name].field; }));
    };
    PiTypeDescriptor.prototype.getRequired = function () {
        return this._arrayCache.required || (this._arrayCache.required = this.asArray().filter(function (f) { return f.required; }));
    };
    PiTypeDescriptor.prototype.render = function () {
        var names = [], data = [], values = {};
        var i = 0, d = 0;
        this.asArray()
            .forEach(function (field, idx) {
            names.push(field.name);
            if (field.values)
                values[idx] = field.values;
            d |= field.toInt() << i;
            if ((i += types_1.FieldData.bitcount) >= types_1.FieldData.maxBitsPerInt) {
                data.push(d);
                d = 0;
                i = 0;
            }
        });
        if (d)
            data.push(d);
        var n = names.join('|');
        var hasEnums = !!Object.keys(values).length;
        return hasEnums ? { n: n, d: data, v: values } : { n: n, d: data };
    };
    PiTypeDescriptor.prototype.parse = function (_a) {
        var n = _a.n, data = _a.d, enums = _a.v;
        this.clear();
        if (!enums)
            enums = {};
        var all = [];
        var i = 0, d = 0;
        var names = n.split('|');
        for (var n_1 = 0; n_1 < names.length; n_1++) {
            var value = (data[d] >> i) & types_1.FieldData.mask;
            var field = new PiFieldDescriptor_1.PiFieldDescriptor(names[n_1], value, enums[n_1]);
            this.set(field);
            all.push(field);
            if ((i += types_1.FieldData.bitcount) >= types_1.FieldData.maxBitsPerInt) {
                d++;
                i = 0;
            }
        }
        this._arrayCache.all = all;
    };
    PiTypeDescriptor.prototype.cast = function (params) {
        var me = this;
        var sent = [];
        normalize(params.path);
        normalize(params.query);
        normalize(params.headers, true);
        normalize(params.body);
        validateNotSentRequired();
        return;
        function normalize(obj, skipUnknown) {
            if (!obj)
                return;
            Object.keys(obj)
                .forEach(function (name) {
                var entry = me._fields[name];
                if (entry) {
                    entry.field.cast(obj);
                    sent.push(name);
                }
                else if (!skipUnknown)
                    throw new Error("Field '" + name + "' unknown.");
            });
        }
        function validateNotSentRequired() {
            var reqNotSent = me.getRequired()
                .filter(function (f) { return !sent.includes(f.name); })
                .map(function (f) { return f.name; });
            if (reqNotSent.length)
                throw new PiError_1.PiValidationError("Fields [" + reqNotSent.toString() + "] are required, but not found", String(reqNotSent));
        }
    };
    return PiTypeDescriptor;
}());
exports.PiTypeDescriptor = PiTypeDescriptor;
