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
exports.processQueue = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const utils_1 = require("./utils");
const sendgrid_1 = require("./sendgrid");
async function createSendGridContact(opts) {
    // This will cut out any keys added to the item in the collection that do not
    // appear in a contact.
    const contact = {
        email: opts.email,
        altername_emails: opts.altername_emails,
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
        const jobId = await sendgrid_1.createContact(contact);
        return { state: "SUCCESS", jobId: jobId };
    }
    catch (error) {
        return { state: "ERROR", error: error.message };
    }
}
async function startUpdate(snapshot) {
    // In a transaction, store a meta object that logs the time it was
    // updated and the initial state, PENDING.
    return admin
        .firestore()
        .runTransaction((transaction) => {
        transaction.update(snapshot.ref, { meta: { state: "PENDING" } });
        return Promise.resolve();
    });
}
async function processDelete(snapshot) {
    const contact = snapshot.data();
    try {
        const id = await sendgrid_1.getContactId(contact.email);
        if (id) {
            return sendgrid_1.deleteContact(id);
        }
        else {
            functions.logger.error("Cannot delete email that isn't present in the contacts list.");
            return;
        }
    }
    catch (error) {
        functions.logger.error(error.message);
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
        functions.logger.error(`contact=${change.after.ref} is missing 'meta' field`);
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
                    if (!lodash_isequal_1.default(beforeData, afterData)) {
                        return startUpdate(change.after);
                    }
                }
            }
            return;
        case "PENDING":
            const result = await createSendGridContact(payload);
            return admin.firestore().runTransaction((transaction) => {
                transaction.update(change.after.ref, {
                    meta: result,
                });
                return Promise.resolve();
            });
    }
}
exports.processQueue = functions.handler.firestore.document.onWrite(async (change) => {
    // Initialize Firebase and SendGrid clients
    utils_1.initialize();
    try {
        await processWrite(change);
    }
    catch (error) {
        functions.logger.error(error);
        return;
    }
    functions.logger.log("Completed execution of SendGrid Marketing Campaigns sync extension.");
});
//# sourceMappingURL=processQueue.js.map