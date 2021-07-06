"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const twilio_1 = require("twilio");
const config_1 = require("./config");
let initialized = false;
let twilioClient;
function initialize() {
    if (initialized) {
        return;
    }
    if (config_1.default.twilio.accountSid && config_1.default.twilio.authToken) {
        admin.initializeApp();
        twilioClient = new twilio_1.Twilio(config_1.default.twilio.accountSid, config_1.default.twilio.authToken);
        initialized = true;
        return;
    }
    else {
        throw new Error(`One or more of the Twilio API Key or Auth Token is missing. Please add all of your API credentials to your extension config.`);
    }
}
async function deliver(payload, ref) {
    functions.logger.log(`Attempting delivery for message: ${ref.path}`);
    const update = {
        "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
        "delivery.error": null,
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
        const { to, body } = payload;
        const message = await twilioClient.messages.create({ from, to, body });
        const info = {
            messageSid: message.sid,
            status: message.status,
            dateCreated: message.dateCreated
                ? admin.firestore.Timestamp.fromDate(message.dateCreated)
                : null,
            dateSent: message.dateSent
                ? admin.firestore.Timestamp.fromDate(message.dateSent)
                : null,
            dateUpdated: message.dateUpdated
                ? admin.firestore.Timestamp.fromDate(message.dateUpdated)
                : null,
            messagingServiceSid: message.messagingServiceSid,
            numMedia: message.numMedia,
            numSegments: message.numSegments,
            price: message.price,
            priceUnit: message.priceUnit,
        };
        update["delivery.state"] = "SUCCESS";
        update["delivery.info"] = info;
        functions.logger.log(`Delivered message: ${ref.path} successfully. MessageSid: ${info.messageSid}`);
    }
    catch (error) {
        update["delivery.state"] = "ERROR";
        update["delivery.errorCode"] = error.code;
        update["delivery.errorMessage"] = `${error.message} ${error.moreInfo}`;
        functions.logger.error(`Error when delivering message: ${ref.path}: ${error.toString()}`);
    }
    return admin.firestore().runTransaction((transaction) => {
        transaction.update(ref, update);
        return Promise.resolve();
    });
}
function processCreate(snapshot) {
    // In a transaction, store a delivery object that logs the time it was
    // updated, the initial state (PENDING), and empty properties for info about
    // the message or error codes and messages.
    return admin
        .firestore()
        .runTransaction((transaction) => {
        transaction.update(snapshot.ref, {
            delivery: {
                startTime: admin.firestore.FieldValue.serverTimestamp(),
                state: "PENDING",
                errorCode: null,
                errorMessage: null,
                info: null,
            },
        });
        return Promise.resolve();
    });
}
async function processWrite(change) {
    if (!change.after.exists) {
        // Document has been deleted, nothing to do here.
        return;
    }
    if (!change.before.exists && change.after.exists) {
        // Document has been created, initialize the delivery state
        return processCreate(change.after);
    }
    const payload = change.after.data();
    if (!payload.delivery) {
        // Document does not have a delivery object so something has gone wrong.
        // Log and exit.
        functions.logger.error(`message=${change.after.ref} is missing 'delivery' field`);
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
                return admin.firestore().runTransaction((transaction) => {
                    transaction.update(change.after.ref, {
                        "delivery.state": "ERROR",
                        error: "Message processing lease expired.",
                    });
                    return Promise.resolve();
                });
            }
            return;
        case "PENDING":
            // Update the message to the processing state and give it 60 seconds to
            // run. Then call the deliver function.
            await admin.firestore().runTransaction((transaction) => {
                transaction.update(change.after.ref, {
                    "delivery.state": "PROCESSING",
                    "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(Date.now() + 60000),
                });
                return Promise.resolve();
            });
            return deliver(payload, change.after.ref);
    }
}
exports.processQueue = functions.handler.firestore.document.onWrite(async (change, context) => {
    // Initialize connections
    initialize();
    // Try to process queue item
    try {
        await processWrite(change);
    }
    catch (error) {
        // Catch error and log it
        functions.logger.error(error);
        return;
    }
    // Log completion
    functions.logger.log("Completed execution of Twilio send message extension.");
});
//# sourceMappingURL=index.js.map