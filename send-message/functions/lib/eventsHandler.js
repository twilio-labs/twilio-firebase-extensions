"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onsend = void 0;
const config_1 = __importDefault(require("./config"));
const utils_1 = require("./utils");
const v2_1 = require("firebase-functions/v2");
exports.onsend = v2_1.eventarc.onCustomEventPublished("firebase.extensions.twilio.send.sms", async (event) => {
    try {
        // Initialize Twilio client
        (0, utils_1.initialize)();
        const from = event.data.from ||
            config_1.default.twilio.messagingServiceSid ||
            config_1.default.twilio.phoneNumber;
        const { to, body, mediaUrl } = event.data;
        return await utils_1.twilioClient.messages.create({
            from,
            to,
            body,
            mediaUrl,
            statusCallback: (0, utils_1.getFunctionsUrl)("statusCallback"),
        });
    }
    catch (err) {
        return Promise.reject(err);
    }
});
//# sourceMappingURL=eventsHandler.js.map