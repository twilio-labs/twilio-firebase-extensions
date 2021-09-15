"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    },
    location: process.env.LOCATION || "us-central1",
    projectId: process.env.PROJECT_ID,
    messageCollection: process.env.MESSAGE_COLLECTION || "messages",
};
//# sourceMappingURL=config.js.map