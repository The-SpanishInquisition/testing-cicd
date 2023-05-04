"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_store_1 = __importDefault(require("electron-store"));
const settings = new electron_store_1.default({
    defaults: {
        check: false,
    },
});
exports.default = settings;
//# sourceMappingURL=settings.js.map