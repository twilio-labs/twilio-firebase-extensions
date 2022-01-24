"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCartCheck = void 0;
const firebase_admin_1 = require("firebase-admin");
const firebase_functions_1 = require("firebase-functions");
const utils_1 = require("./utils");
const config_1 = __importDefault(require("./config"));
const MS_PER_MINUTE = 60000;
exports.processCartCheck = firebase_functions_1.handler.pubsub.schedule.onRun(async () => {
    (0, utils_1.initialize)();
    const firestore = (0, firebase_admin_1.firestore)();
    const collection = firestore.collection(config_1.default.cartCollection);
    const now = new Date();
    if (!config_1.default.abandonedTimeout) {
        firebase_functions_1.logger.error("ABANDONED_TIMEOUT not set");
        return;
    }
    const abandonedTimeout = parseInt(config_1.default.abandonedTimeout, 10);
    if (Number.isNaN(abandonedTimeout)) {
        firebase_functions_1.logger.error("ABANDONED_TIMEOUT is not set to an integer.");
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
                    const user = await (0, firebase_admin_1.auth)().getUser(userId);
                    delete templateData.metadata;
                    templateData.user = {
                        email: user.email,
                        displayName: user.displayName,
                    };
                    const email = user.email;
                    if (!email) {
                        await (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
                            transaction.update(doc.ref, {
                                "metadata.error": "User does not have email address",
                            });
                            return Promise.resolve();
                        });
                    }
                    else {
                        if (templateData.items && templateData.items.length > 0) {
                            await (0, firebase_admin_1.firestore)().collection(config_1.default.emailCollection).add({
                                to: email,
                                dynamicTemplateData: templateData,
                            });
                            await (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
                                transaction.update(doc.ref, {
                                    "metadata.emailSent": true,
                                    "metadata.emailSentAt": firebase_admin_1.firestore.FieldValue.serverTimestamp(),
                                });
                                return Promise.resolve();
                            });
                        }
                    }
                }
                catch (error) {
                    // User not found, we should not try to send again
                    await (0, firebase_admin_1.firestore)().runTransaction((transaction) => {
                        transaction.update(doc.ref, {
                            "metadata.error": error.message,
                        });
                        return Promise.resolve();
                    });
                    firebase_functions_1.logger.error(error);
                }
            });
        }
    }
    catch (error) {
        firebase_functions_1.logger.error(error);
        return;
    }
    firebase_functions_1.logger.log("Completed execution of Abandoned Cart scheduled cart checker.");
    return;
});
//# sourceMappingURL=processCartCheck.js.map