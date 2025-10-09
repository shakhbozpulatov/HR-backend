"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtils = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
let CryptoUtils = class CryptoUtils {
    verifyHmacSignature(payload, signature, secret) {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        const providedSignature = signature.replace('sha256=', '');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
    }
    generateHmacSignature(payload, secret) {
        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }
    hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }
    comparePassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }
};
exports.CryptoUtils = CryptoUtils;
exports.CryptoUtils = CryptoUtils = __decorate([
    (0, common_1.Injectable)()
], CryptoUtils);
//# sourceMappingURL=crypto.utils.js.map