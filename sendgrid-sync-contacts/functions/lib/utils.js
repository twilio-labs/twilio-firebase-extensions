"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOwnProperty = exports.initialize = exports.sendGridClient = void 0;
const firebase_admin_1 = require("firebase-admin");
const config_1 = __importDefault(require("./config"));
const client_1 = require("@sendgrid/client");
const version_1 = require("./version");
let initialized = false;
function initialize() {
    if (initialized) {
        return;
    }
    if (config_1.default.sendgrid.apiKey) {
        (0, firebase_admin_1.initializeApp)();
        exports.sendGridClient = new client_1.Client();
        exports.sendGridClient.setApiKey(config_1.default.sendgrid.apiKey);
        // @ts-ignore The client has a defaultHeaders property, it just isn't exposed in the types
        const oldUserAgent = exports.sendGridClient.defaultHeaders["User-Agent"];
        const newUserAgent = `${oldUserAgent} twilio-firebase-extensions sendgrid-sync-contacts/${version_1.APP_VERSION}`;
        exports.sendGridClient.setDefaultHeader("User-Agent", newUserAgent);
        initialized = true;
        return;
    }
    else {
        throw new Error(`One or more of the Twilio API Key or Auth Token is missing. Please add all of your API credentials to your extension config.`);
    }
}
exports.initialize = initialize;
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
exports.hasOwnProperty = hasOwnProperty;
//# sourceMappingURL=utils.js.map