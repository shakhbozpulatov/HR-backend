"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchema = void 0;
const Joi = require("joi");
exports.validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),
    DB_HOST: Joi.string().default('localhost'),
    DB_PORT: Joi.number().default(5432),
    DB_USERNAME: Joi.string().default('postgres'),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().default('hr_backend'),
    JWT_SECRET: Joi.string().required(),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    WEBHOOK_SECRET: Joi.string().required(),
    DEFAULT_TIMEZONE: Joi.string().default('Asia/Tashkent'),
    GRACE_IN_MINUTES: Joi.number().default(5),
    GRACE_OUT_MINUTES: Joi.number().default(0),
    ROUNDING_MINUTES: Joi.number().default(5),
    OVERTIME_THRESHOLD_MINUTES: Joi.number().default(15),
    OVERTIME_MULTIPLIER: Joi.number().default(1.5),
});
//# sourceMappingURL=validation.schema.js.map