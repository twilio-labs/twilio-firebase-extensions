"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = exports.sendgridClient = void 0;
const app_1 = require("firebase-admin/app");
const config_1 = __importDefault(require("./config"));
const client_1 = require("@sendgrid/client");
const mail_1 = require("@sendgrid/mail");
const version_1 = require("./version");
let initialized = false;
function initialize() {
    if (initialized) {
        return;
    }
    if (config_1.default.sendgrid.apiKey) {
        (0, app_1.initializeApp)();
        const httpClient = new client_1.Client();
        // @ts-ignore The client has a defaultHeaders property, it just isn't exposed in the types
        const oldUserAgent = httpClient.defaultHeaders["User-Agent"];
        const newUserAgent = `${oldUserAgent} twilio-firebase-extensions abandoned-cart-emails/${version_1.APP_VERSION}`;
        httpClient.setDefaultHeader("User-Agent", newUserAgent);
        exports.sendgridClient = new mail_1.MailService();
        exports.sendgridClient.setClient(httpClient);
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