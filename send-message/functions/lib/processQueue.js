"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = void 0;
const firebase_admin_1 = require("firebase-admin");
const firebase_functions_1 = require("firebase-functions");
const config_1 = __importDefault(require("./config"));
const utils_1 = require("./utils");
async function deliverMessage(payload, ref) {
    firebase_functions_1.logger.log(`Attempting delivery for message: ${String(ref.path)}`);
    const update = {
        "delivery.endTime": firebase_admin_1.firestore.FieldValue.serverTimestamp(),
        "delivery.leaseExpireTime": null,
        "delivery.state": "SUCCESS",
        "delivery.info": {},
        "delivery.errorCode": "",
        "delivery.errorMessage": "",
    };
    try {
        const from = payload.from ||
            config_1.default.twilio.messagingServiceSid ||
            config_1.default.twilio.phoneNumber;
        const { to, body, mediaUrls } = payload;
        const message = await utils_1.twilioClient.messages.create({
            from,
            to,
            body,
            mediaUrl: mediaUrls,
            statusCallback: (0, utils_1.getFunctionsUrl)("statusCallback"),
        });
        const info = {
            messageSid: message.sid,
            status: message.status,
            dateCreated: message.dateCreated
                ? firebase_admin_1.firestore.Timestamp.fromDate(message.dateCreated)
                : null,
            dateSent: message.dateSent
                ? firebase_admin_1.firestore.Timestamp.fromDate(message.dateSent)
                : null,
            dateUpdated: message.dateUpdated
                ? firebase_admin_1.firestore.Timestamp.fromDate(message.dateUpdated)
                : null,
            messagingServiceSid: message.messagingServiceSid,
            numMedia: message.numMedia,
            numSegments: message.numSegments,
        };
        update["delivery.state"] = "SUCCESS";
        update["delivery.info"] = info;
        firebase_functions_1.logger.log(`Delivered message: ${String(ref.path)} successfully. MessageSid: ${info.messageSid}`);
    }
    catch (error) {
        update["delivery.state"] = "ERROR";
        update["delivery.errorCode"] = error.code.toString();
        update["delivery.errorMessage"] = `${error.message} ${error.moreInfo}`;
        firebase_functions_1.logger.error(`Error when delivering message: ${String(ref.path)}: ${error.toString()}`);
    }
    return (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
        transaction.update(ref, update);
        return Promise.resolve();
    });
}
function processCreate(snapshot) {
    // In a transaction, store a delivery object that logs the time it was
    // updated, the initial state (PENDING), and empty properties for info about
    // the message or error codes and messages.
    return (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
        transaction.update(snapshot.ref, {
            delivery: {
                startTime: firebase_admin_1.firestore.FieldValue.serverTimestamp(),
                state: "PENDING",
                errorCode: null,
                errorMessage: null,
                info: null,
            },
        });
        return Promise.resolve();
    });
}
// This method is called by `processQueue` when a document is added to the
// collection, updated, or deleted.
async function processWrite(change) {
    if (!change.after.exists) {
        // Document has been deleted, nothing to do here.
        return;
    }
    if (!change.before.exists && change.after.exists) {
        // Document has been created, initialize the delivery state
        return processCreate(change.after);
    }
    // The document has been updated, so we fetch the data in the document to
    // determine what to do next.
    const payload = change.after.data();
    if (!payload.delivery) {
        // Document does not have a delivery object so something has gone wrong.
        // Log and exit.
        firebase_functions_1.logger.error(`message=${String(change.after.ref.path)} is missing 'delivery' field`);
        return;
    }
    switch (payload.delivery.state) {
        case "SUCCESS":
        case "ERROR":
            // Processing complete, nothing more to do.
            return;
        case "PROCESSING":
            if (payload.delivery.leaseExpireTime &&
                payload.delivery.leaseExpireTime.toMillis() < Date.now()) {
                // It has taken too long to process the message, mark it as an error.
                return (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
                    transaction.update(change.after.ref, {
                        "delivery.state": "ERROR",
                        errorMessage: "Message processing lease expired.",
                    });
                    return Promise.resolve();
                });
            }
            return;
        case "PENDING":
            // Update the message to the processing state and give it 60 seconds to
            // run. Then call the deliver function.
            await (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
                transaction.update(change.after.ref, {
                    "delivery.state": "PROCESSING",
                    "delivery.leaseExpireTime": firebase_admin_1.firestore.Timestamp.fromMillis(Date.now() + 60000),
                });
                return Promise.resolve();
            });
            return deliverMessage(payload, change.after.ref);
    }
}
exports.processQueue = firebase_functions_1.handler.firestore.document.onWrite(async (change) => {
    // Initialize Firebase and Twilio clients
    (0, utils_1.initialize)();
    try {
        await processWrite(change);
    }
    catch (error) {
        firebase_functions_1.logger.error(error);
        return;
    }
    firebase_functions_1.logger.log("Completed execution of Twilio send message extension.");
});
//# sourceMappingURL=processQueue.js.map