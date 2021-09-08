"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = exports.sendgridClient = void 0;
const admin = __importStar(require("firebase-admin"));
const config_1 = __importDefault(require("./config"));
const mail_1 = require("@sendgrid/mail");
let initialized = false;
function initialize() {
    if (initialized) {
        return;
    }
    if (config_1.default.sendgrid.apiKey) {
        admin.initializeApp();
        exports.sendgridClient = new mail_1.MailService();
        exports.sendgridClient.setApiKey(config_1.default.sendgrid.apiKey);
        initialized = true;
        return;
    }
    else {
        throw new Error(`Your SendGrid API key is missing. Please add all your API credentials to your extension config.`);
    }
}
exports.initialize = initialize;
//# sourceMappingURL=utils.js.map