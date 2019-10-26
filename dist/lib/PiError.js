"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PiError = /** @class */ (function (_super) {
    tslib_1.__extends(PiError, _super);
    function PiError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        return _this;
    }
    return PiError;
}(Error));
exports.PiError = PiError;
var PiRestError = /** @class */ (function (_super) {
    tslib_1.__extends(PiRestError, _super);
    function PiRestError(message, status, data) {
        if (status === void 0) { status = 500; }
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.status = status;
        _this.data = data;
        return _this;
    }
    return PiRestError;
}(PiError));
exports.PiRestError = PiRestError;
var PiValidationError = /** @class */ (function (_super) {
    tslib_1.__extends(PiValidationError, _super);
    function PiValidationError(message, field, value) {
        return _super.call(this, message, 400, { type: 'validation', field: field, value: value }) || this;
    }
    return PiValidationError;
}(PiRestError));
exports.PiValidationError = PiValidationError;
