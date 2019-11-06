"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
var PiError_1 = require("./PiError");
var PiFieldDescriptor = /** @class */ (function () {
    function PiFieldDescriptor(name, data, values) {
        if (typeof data == 'undefined' && typeof name == 'object' && ('name' in name)) {
            // PiField was sent in name, so get a copy
            this._field = Object.assign({}, name);
            if (types_1.typeBitValue[this._field.jsType] === void 0)
                throw new PiError_1.PiError("Invalid type '" + this._field.jsType + "'. Valid types: " + Object.keys(types_1.typeBitValue).filter(function (k) { return !(k | 0); }).toString());
        }
        else {
            this._field = {};
            if (typeof name == 'string')
                this._field.name = name;
            else
                throw new PiError_1.PiError("PiFieldDescriptor.constructor: Invalid name '" + name + "'");
            if (typeof data != 'number')
                throw new PiError_1.PiError("PiFieldDescriptor.constructor: Parameter data '" + data + "' must be number");
            this._field.required = !!(data & types_1.FieldData.required);
            this._field.isArray = !!(data & types_1.FieldData.isArray);
            data &= ~(types_1.FieldData.required | types_1.FieldData.isArray);
            this._field.jsType = types_1.typeBitValue[data];
            this._field.values = values;
        }
        if (this.jsType == 'enum' && !this.values)
            throw new PiError_1.PiError("Cannot define field '" + this.name + "' as enum without values");
    }
    Object.defineProperty(PiFieldDescriptor.prototype, "name", {
        get: function () { return this._field.name; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PiFieldDescriptor.prototype, "comment", {
        get: function () { return this._field.comment; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PiFieldDescriptor.prototype, "jsType", {
        get: function () { return this._field.jsType; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PiFieldDescriptor.prototype, "isArray", {
        get: function () { return this._field.isArray; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PiFieldDescriptor.prototype, "values", {
        get: function () { return this._field.values; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PiFieldDescriptor.prototype, "required", {
        get: function () { return this._field.required; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PiFieldDescriptor.prototype, "type", {
        get: function () {
            return this._field.type || (this._field.type = type(this._field.jsType, this.isArray));
            function type(js, isArray) {
                if (js == 'date')
                    js = 'Date';
                else if (js == 'integer')
                    js = 'number';
                else if (js == 'null' || js == 'undefined')
                    return js;
                return js + ['', '[]'][isArray | 0];
            }
        },
        enumerable: true,
        configurable: true
    });
    PiFieldDescriptor.prototype.optional = function () { return this.required ? '' : '?'; };
    PiFieldDescriptor.prototype.toInt = function () {
        return types_1.typeBitValue[this.jsType]
            | (this.required ? types_1.FieldData.required : 0)
            | (this.isArray ? types_1.FieldData.isArray : 0);
    };
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
    PiFieldDescriptor.prototype.cast = function (obj) {
        var _this = this;
        var me = this;
        var value = obj[this.name];
        if (this.isArray && !Array.isArray(value))
            value = [value];
        if (this.isArray)
            value.forEach(function (val, i) { return value[i] = docast(val, _this.name + "[" + i + "]"); });
        else
            value = docast(value, this.name);
        if (typeof value == 'undefined')
            delete obj[this.name];
        else
            obj[this.name] = value;
        return value;
        function docast(value, name) {
            if (typeof value == 'string') {
                if (value == 'undefined')
                    value = void 0;
                if (value == 'null')
                    value = null;
            }
            var enumValue = me._dovalidate(value, name);
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
    };
    /**
     *
     * @param value what to validate
     * @param name field name (just to throw error)
     * @returns <undefined>, unless it's an enum validation when it returns the enum value defined in values[] for the found value.
     */
    PiFieldDescriptor.prototype._dovalidate = function (value, name) {
        if (this.required && (value === null || value === void 0))
            throw new PiError_1.PiValidationError("'" + name + "' is required!", name);
        if (this.jsType == 'date') {
            if (typeof value === 'undefined' || value === null || (value instanceof Date))
                return;
            if (typeof value != 'string' && typeof value != 'number')
                throw new PiError_1.PiValidationError("'" + name + "' cannot be cast to a date", name, value);
            var d = new Date(value);
            if (!(d instanceof Date) || isNaN(d.getTime()))
                throw new PiError_1.PiValidationError("'" + name + "': " + JSON.stringify(value) + " cannot be cast to a date", name, value);
        }
        if (['number', 'integer'].includes(this.jsType) && isNaN(Number(value)))
            throw new PiError_1.PiValidationError("'" + name + "': " + JSON.stringify(value) + " cannot be cast to a " + this.jsType, name, value);
        if (this.jsType == 'enum') {
            var enumValue = void 0;
            if (!(enumValue = this.values.find(function (v) { return 0 === v.localeCompare(value, void 0, { sensitivity: 'base' }); })))
                throw new PiError_1.PiValidationError("'" + name + "': " + JSON.stringify(value) + " must be one of [" + String(this.values) + "]", name, value);
            return enumValue;
        }
    };
    PiFieldDescriptor.prototype.validate = function (value) {
        this._dovalidate(value, this.name);
    };
    return PiFieldDescriptor;
}());
exports.PiFieldDescriptor = PiFieldDescriptor;
