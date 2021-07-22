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
exports.statusCallback = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const twilio_1 = require("twilio");
const utils_1 = require("./utils");
const config_1 = __importDefault(require("./config"));
const messageCollection = process.env.MESSAGE_COLLECTION || "messages";
exports.statusCallback = functions.handler.https.onRequest(async (req, res) => {
    utils_1.initialize();
    const { twilio: { authToken } } = config_1.default;
    const signature = req.get('x-twilio-signature');
    const url = utils_1.getFunctionsUrl("statusCallback");
    const params = req.body;
    if (!signature) {
        return res
            .type('text/plain')
            .status(400)
            .send('No signature header error - X-Twilio-Signature header does not exist, maybe this request is not coming from Twilio.');
    }
    if (typeof authToken !== "string") {
        return res
            .type("text/plain")
            .status(500)
            .send('Webhook Error - we attempted to validate this request without first configuring our auth token.');
    }
    if (!twilio_1.validateRequest(authToken, signature, url, params)) {
        return res
            .type('text/plain')
            .status(403)
            .send("Twilio Request Validation Failed");
    }
    const firestore = admin.firestore();
    const { MessageSid, MessageStatus } = req.body;
    const collection = firestore.collection(messageCollection);
    functions.logger.log(`Attempting status update for message: ${MessageSid}`);
    try {
        const query = await collection.where('delivery.info.messageSid', '==', MessageSid).limit(1).get();
        if (query.docs.length === 0) {
            functions.logger.error(`Could not find document for message with SID: ${MessageSid}`);
        }
        else {
            const ref = query.docs[0].ref;
            functions.logger.log(`Found document for message ${MessageSid} with ref ${ref.path}`);
            await admin.firestore().runTransaction((transaction) => {
                transaction.update(ref, 'delivery.info.status', MessageStatus);
                return Promise.resolve();
            });
        }
    }
    catch (error) {
        functions.logger.error(error);
    }
    res.contentType('text/xml');
    return res.send(new twilio_1.twiml.MessagingResponse().toString());
    ;
});
//# sourceMappingURL=statusCallback.js.map