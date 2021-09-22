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
exports.processCartCheck = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const utils_1 = require("./utils");
const config_1 = __importDefault(require("./config"));
const MS_PER_MINUTE = 60000;
exports.processCartCheck = functions.handler.pubsub.schedule.onRun(async (context) => {
    (0, utils_1.initialize)();
    const firestore = admin.firestore();
    const collection = firestore.collection(config_1.default.cartCollection);
    const now = new Date();
    if (!config_1.default.abandonedTimeout) {
        functions.logger.error("ABANDONED_TIMEOUT not set");
        return;
    }
    const abandonedTimeout = parseInt(config_1.default.abandonedTimeout, 10);
    if (Number.isNaN(abandonedTimeout)) {
        functions.logger.error("ABANDONED_TIMEOUT is not set to an integer.");
        return;
    }
    const abandonedThreshold = new Date(now.valueOf() - abandonedTimeout * MS_PER_MINUTE);
    try {
        const query = await collection
            .where("metadata.lastUpdated", "<", abandonedThreshold)
            .where("metadata.emailSent", "==", false)
            .where("metadata.error", "==", "")
            .get();
        if (query.docs.length > 0) {
            query.docs.forEach(async (doc) => {
                try {
                    const templateData = doc.data();
                    const userId = templateData.userId || doc.ref.id;
                    const user = await admin.auth().getUser(userId);
                    delete templateData.metadata;
                    await admin.firestore().collection(config_1.default.emailCollection).add({
                        to: user.email,
                        dynamicTemplateData: templateData,
                    });
                    await admin.firestore().runTransaction((transaction) => {
                        transaction.update(doc.ref, {
                            "metadata.emailSent": true,
                            "metadata.emailSentAt": admin.firestore.FieldValue.serverTimestamp(),
                        });
                        return Promise.resolve();
                    });
                }
                catch (error) {
                    // User not found, we should not try to send again
                    await admin.firestore().runTransaction((transaction) => {
                        transaction.update(doc.ref, {
                            "metadata.error": error.message,
                        });
                        return Promise.resolve();
                    });
                    functions.logger.error(error);
                }
            });
        }
    }
    catch (error) {
        functions.logger.error(error);
        return;
    }
    functions.logger.log("Completed execution of Abandoned Cart scheduled cart checker.");
    return;
});
//# sourceMappingURL=processCartCheck.js.map