"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCallback = void 0;
const firebase_admin_1 = require("firebase-admin");
const firebase_functions_1 = require("firebase-functions");
const twilio_1 = require("twilio");
const utils_1 = require("./utils");
const config_1 = __importDefault(require("./config"));
exports.statusCallback = firebase_functions_1.handler.https.onRequest(async (req, res) => {
    (0, utils_1.initialize)();
    const { twilio: { authToken }, } = config_1.default;
    const signature = req.get("x-twilio-signature");
    const url = (0, utils_1.getFunctionsUrl)("statusCallback");
    const params = req.body;
    if (!signature) {
        return res
            .type("text/plain")
            .status(400)
            .send("No signature header error - X-Twilio-Signature header does not exist, maybe this request is not coming from Twilio.");
    }
    if (typeof authToken !== "string") {
        return res
            .type("text/plain")
            .status(500)
            .send("Webhook Error - we attempted to validate this request without first configuring our auth token.");
    }
    if (!(0, twilio_1.validateRequest)(authToken, signature, url, params)) {
        return res
            .type("text/plain")
            .status(403)
            .send("Twilio Request Validation Failed");
    }
    const { MessageSid, MessageStatus } = req.body;
    if (typeof MessageSid !== "string") {
        return res
            .type("text/plain")
            .status(400)
            .send("Webhook error - No MessageSid found.");
    }
    const firestore = (0, firebase_admin_1.firestore)();
    const collection = firestore.collection(config_1.default.messageCollection);
    firebase_functions_1.logger.log(`Attempting status update for message: ${MessageSid}`);
    try {
        const query = await collection
            .where("delivery.info.messageSid", "==", MessageSid)
            .limit(1)
            .get();
        if (query.docs.length === 0) {
            firebase_functions_1.logger.error(`Could not find document for message with SID: ${MessageSid}`);
        }
        else {
            const ref = query.docs[0].ref;
            firebase_functions_1.logger.log(`Found document for message ${MessageSid} with ref ${String(ref.path)}`);
            await (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
                transaction.update(ref, "delivery.info.status", MessageStatus);
                return Promise.resolve();
            });
        }
    }
    catch (error) {
        firebase_functions_1.logger.error(error);
    }
    res.contentType("text/xml");
    res.send(new twilio_1.twiml.MessagingResponse().toString());
    return;
});
//# sourceMappingURL=statusCallback.js.map