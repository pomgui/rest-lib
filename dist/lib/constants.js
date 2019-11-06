"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeBitValue = {
    string: 1,
    integer: 2,
    number: 3,
    boolean: 4,
    date: 5,
    any: 6,
    enum: 7
};
// Add inverted map. Ex. typeBitValue[0b0101] == 'date'...
Object.assign(exports.typeBitValue, Object.keys(exports.typeBitValue).reduce(function (s, type) { return (s[exports.typeBitValue[type]] = type, s); }, {}));
var FieldData;
(function (FieldData) {
    FieldData[FieldData["required"] = 8] = "required";
    FieldData[FieldData["isArray"] = 16] = "isArray";
    FieldData[FieldData["mask"] = 31] = "mask";
    FieldData[FieldData["bitcount"] = 5] = "bitcount";
    FieldData[FieldData["maxBitsPerInt"] = Math.trunc(31 / FieldData.bitcount) * FieldData.bitcount] = "maxBitsPerInt";
})(FieldData = exports.FieldData || (exports.FieldData = {}));