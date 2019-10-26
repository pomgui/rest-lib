"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");
var PiError_1 = require("./PiError");
var PiFieldDescriptor = /** @class */ (function () {
    function PiFieldDescriptor(name, data, required, values) {
        var _a;
        if (typeof data == 'undefined' && typeof name == 'object' && ('name' in name)) {
            // PiField was sent in name
            (_a = name, this.name = _a.name, this.comment = _a.comment, this.type = _a.type, this.isArray = _a.isArray, this.values = _a.values, this.required = _a.required);
        }
        else {
            if (typeof name == 'string')
                this.name = name;
            else
                throw new PiError_1.PiError("PiFieldDescriptor.constructor: Invalid name '" + name + "'");
            if (typeof data == 'number') {
                this.required = !!(data & constants_1.FieldData.required);
                this.isArray = !!(data & constants_1.FieldData.isArray);
                data &= ~(constants_1.FieldData.required | constants_1.FieldData.isArray);
                this.type = Object.keys(constants_1.typeBitValue).find(function (type) { return constants_1.typeBitValue[type] === data; });
                if (required !== undefined)
                    this.required = required; // override the data 'required' bit
                this.values = values;
            }
            else if (typeof data == 'string') {
                this.isArray = false;
                if (data.endsWith('[]')) {
                    this.isArray = true;
                    data = data.substr(0, data.length - 2);
                }
                this.type = data;
                this.required = required;
                this.values = values;
            }
            else
                throw new PiError_1.PiError("PiFieldDescriptor.constructor: Invalid type '" + data + "'");
        }
        if (this.type == 'enum' && !values)
            throw new PiError_1.PiError("Cannot define field '" + this.name + "' as enum without values");
    }
    PiFieldDescriptor.prototype.optional = function () { return this.required ? '' : '?'; };
    PiFieldDescriptor.prototype.toInt = function () {
        return constants_1.typeBitValue[this.type]
            | (this.required ? constants_1.FieldData.required : 0)
            | (this.isArray ? constants_1.FieldData.isArray : 0);
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
        if (this.type == 'date') {
            if (typeof value === 'undefined' || value === null || (value instanceof Date))
                return;
            if (typeof value != 'string' && typeof value != 'number')
                throw new PiError_1.PiValidationError("'" + name + "' cannot be cast to a date", name, value);
            var d = new Date(value);
            if (!(d instanceof Date) || isNaN(d.getTime()))
                throw new PiError_1.PiValidationError("'" + name + "': " + JSON.stringify(value) + " cannot be cast to a date", name, value);
        }
        if (['number', 'integer'].includes(this.type) && isNaN(Number(value)))
            throw new PiError_1.PiValidationError("'" + name + "': " + JSON.stringify(value) + " cannot be cast to a " + this.type, name, value);
        if (this.type == 'enum') {
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
