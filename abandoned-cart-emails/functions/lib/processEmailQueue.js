"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEmailQueue = void 0;
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
        "delivery.errorMessage": "",
        "delivery.errors": new Array(),
    };
    try {
        const from = payload.from || config_1.default.sendgrid.defaultFrom;
        const templateId = payload.templateId || config_1.default.sendgrid.defaultTemplateId;
        if (!from) {
            update["delivery.state"] = "ERROR";
            update["delivery.errorMessage"] = "";
        }
        else if (!templateId) {
            update["delivery.state"] = "ERROR";
            update["delivery.errorMessage"] = "";
        }
        else {
            const mail = {
                to: payload.to,
                from,
                templateId,
                dynamicTemplateData: payload.dynamicTemplateData,
            };
            await utils_1.sendgridClient.send(mail);
        }
    }
    catch (error) {
        update["delivery.state"] = "ERROR";
        if (error instanceof Error) {
            update["delivery.errorMessage"] = error.message;
            const responseError = error;
            if (responseError.response) {
                if (responseError.response &&
                    responseError.response.body &&
                    responseError.response.body.errors) {
                    update["delivery.errors"] = responseError.response.body.errors;
                    firebase_functions_1.logger.error(`Error when sending email: ${String(ref.path)}: ${error.toString()}`);
                }
            }
        }
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
                errorMessage: null,
                errors: [],
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
exports.processEmailQueue = firebase_functions_1.handler.firestore.document.onWrite(async (change) => {
    // Initialize Firebase and Twilio clients
    (0, utils_1.initialize)();
    try {
        await processWrite(change);
    }
    catch (error) {
        firebase_functions_1.logger.error(error);
        return;
    }
    firebase_functions_1.logger.log("Completed execution of SendGrid email.");
});
//# sourceMappingURL=processEmailQueue.js.map