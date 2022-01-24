"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCartUpdate = void 0;
const firebase_admin_1 = require("firebase-admin");
const firebase_functions_1 = require("firebase-functions");
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const utils_1 = require("./utils");
function updateLastUpdated(snapshot) {
    const payload = snapshot.data();
    let update;
    if (payload?.metadata) {
        update = {
            metadata: {
                ...payload.metadata,
                lastUpdated: firebase_admin_1.firestore.FieldValue.serverTimestamp(),
            },
        };
    }
    else {
        update = {
            metadata: {
                lastUpdated: firebase_admin_1.firestore.FieldValue.serverTimestamp(),
                emailSent: false,
                error: "",
            },
        };
    }
    return (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
        transaction.update(snapshot.ref, update);
        return Promise.resolve();
    });
}
function processCreate(snapshot) {
    // In a transaction, store a metadata object that logs the time it was
    // updated
    return updateLastUpdated(snapshot);
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
    const beforeData = change.before.data();
    const afterData = change.after.data();
    // Deletes the metadata and checks to see if the rest of the document has
    // changed. If so, updates the lastUpdated metadata field.
    delete beforeData.metadata;
    delete afterData.metadata;
    if (!(0, lodash_isequal_1.default)(beforeData, afterData)) {
        return updateLastUpdated(change.after);
    }
}
exports.processCartUpdate = firebase_functions_1.handler.firestore.document.onWrite(async (change) => {
    // Initialize Firebase and Twilio clients
    (0, utils_1.initialize)();
    try {
        await processWrite(change);
    }
    catch (error) {
        firebase_functions_1.logger.error(error);
        return;
    }
    firebase_functions_1.logger.log("Completed execution of Abandoned Cart updates.");
});
//# sourceMappingURL=processCartUpdate.js.map