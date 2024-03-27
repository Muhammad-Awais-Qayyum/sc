"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatchAsync = void 0;
const CatchAsync = (func) => (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch(next);
};
exports.CatchAsync = CatchAsync;
