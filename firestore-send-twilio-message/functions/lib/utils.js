"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFunctionsUrl = exports.initialize = exports.twilioClient = void 0;
const admin = require("firebase-admin");
const twilio_1 = require("twilio");
const config_1 = require("./config");
let initialized = false;
function initialize() {
    if (initialized) {
        return;
    }
    if (config_1.default.twilio.accountSid && config_1.default.twilio.authToken) {
        admin.initializeApp();
        exports.twilioClient = new twilio_1.Twilio(config_1.default.twilio.accountSid, config_1.default.twilio.authToken, { lazyLoading: true });
        initialized = true;
        return;
    }
    else {
        throw new Error(`One or more of the Twilio API Key or Auth Token is missing. Please add all of your API credentials to your extension config.`);
    }
}
exports.initialize = initialize;
function getFunctionsUrl(functionName) {
    if (process.env.IS_FIREBASE_CLI) {
        const baseUrl = process.env.HTTP_TUNNEL ? `https://${process.env.HTTP_TUNNEL}/` : "http://localhost:5001/";
        return `${baseUrl}${config_1.default.projectId}/${config_1.default.location}/${functionName}`;
    }
    else {
        return `https://${config_1.default.location}-${config_1.default.projectId}.cloudfunctions.net/${functionName}`;
    }
}
exports.getFunctionsUrl = getFunctionsUrl;
//# sourceMappingURL=utils.js.map