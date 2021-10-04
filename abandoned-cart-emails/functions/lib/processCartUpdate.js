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
exports.processCartUpdate = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const utils_1 = require("./utils");
function updateLastUpdated(snapshot) {
    const payload = snapshot.data();
    let update;
    if (payload?.metadata) {
        update = {
            metadata: {
                ...payload.metadata,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            },
        };
    }
    else {
        update = {
            metadata: {
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                emailSent: false,
                error: "",
            },
        };
    }
    return admin
        .firestore()
        .runTransaction((transaction) => {
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
exports.processCartUpdate = functions.handler.firestore.document.onWrite(async (change) => {
    // Initialize Firebase and Twilio clients
    (0, utils_1.initialize)();
    try {
        await processWrite(change);
    }
    catch (error) {
        functions.logger.error(error);
        return;
    }
    functions.logger.log("Completed execution of Abandoned Cart updates.");
});
//# sourceMappingURL=processCartUpdate.js.map