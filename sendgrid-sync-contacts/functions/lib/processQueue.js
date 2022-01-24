"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = void 0;
const firebase_admin_1 = require("firebase-admin");
const firebase_functions_1 = require("firebase-functions");
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const utils_1 = require("./utils");
const sendgrid_1 = require("./sendgrid");
async function createSendGridContact(opts) {
    // This will cut out any keys added to the item in the collection that do not
    // appear in a contact.
    const contact = {
        email: opts.email,
        alternate_emails: opts.alternate_emails,
        first_name: opts.first_name,
        last_name: opts.last_name,
        address_line_1: opts.address_line_1,
        address_line_2: opts.address_line_2,
        city: opts.city,
        postal_code: opts.postal_code,
        state_province_region: opts.state_province_region,
        country: opts.country,
        phone_number: opts.phone_number,
        whatsapp: opts.whatsapp,
        line: opts.line,
        facebook: opts.facebook,
        unique_name: opts.unique_name,
        custom_fields: opts.custom_fields,
    };
    try {
        const jobId = await (0, sendgrid_1.createContact)(contact);
        return { state: "SUCCESS", jobId: jobId };
    }
    catch (error) {
        if (error instanceof Error) {
            return { state: "ERROR", error: error.message };
        }
        else {
            return { state: "ERROR", error: `Unknown error: ${String(error)}` };
        }
    }
}
async function startUpdate(snapshot) {
    // In a transaction, store a meta object that logs the time it was
    // updated and the initial state, PENDING.
    return (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
        transaction.update(snapshot.ref, { meta: { state: "PENDING" } });
        return Promise.resolve();
    });
}
async function processDelete(snapshot) {
    const contact = snapshot.data();
    try {
        const id = await (0, sendgrid_1.getContactId)(contact.email);
        if (id) {
            return (0, sendgrid_1.deleteContact)(id);
        }
        else {
            firebase_functions_1.logger.error("Cannot delete email that isn't present in the contacts list.");
            return;
        }
    }
    catch (error) {
        if (error instanceof Error) {
            firebase_functions_1.logger.error(error.message);
        }
        else {
            firebase_functions_1.logger.error(`Unknown error: ${String(error)}`);
        }
        return;
    }
}
async function processWrite(change) {
    if (!change.after.exists) {
        // Document has been deleted, remove from the contacts list
        return processDelete(change.before);
    }
    if (!change.before.exists && change.after.exists) {
        return startUpdate(change.after);
    }
    // Document has been created or updated, upsert the information to the
    // marketing campaign contacts list
    const payload = change.after.data();
    if (!payload.meta) {
        // Document does not have a delivery object so something has gone wrong.
        // Log and exit.
        firebase_functions_1.logger.error(`contact=${change.after.ref} is missing 'meta' field`);
        return;
    }
    switch (payload.meta.state) {
        case "SUCCESS":
        case "ERROR":
            // If something outside of meta has changed, this is an update and we
            // should set the state to "PENDING" so that the update will be processed.
            if (change.before.exists) {
                const compareBefore = change.before.data();
                if (compareBefore) {
                    const { meta: metaBefore, ...beforeData } = compareBefore;
                    const { meta: metaAfter, ...afterData } = payload;
                    if (!(0, lodash_isequal_1.default)(beforeData, afterData)) {
                        return startUpdate(change.after);
                    }
                }
            }
            return;
        case "PENDING":
            const result = await createSendGridContact(payload);
            return (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
                transaction.update(change.after.ref, {
                    meta: result,
                });
                return Promise.resolve();
            });
    }
}
exports.processQueue = firebase_functions_1.handler.firestore.document.onWrite(async (change) => {
    // Initialize Firebase and SendGrid clients
    (0, utils_1.initialize)();
    try {
        await processWrite(change);
    }
    catch (error) {
        firebase_functions_1.logger.error(error);
        return;
    }
    firebase_functions_1.logger.log("Completed execution of SendGrid Marketing Campaigns sync extension.");
});
//# sourceMappingURL=processQueue.js.map