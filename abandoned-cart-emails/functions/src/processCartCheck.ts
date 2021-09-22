import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { initialize } from "./utils";
import config from "./config";

const MS_PER_MINUTE = 60000;

export const processCartCheck = functions.handler.pubsub.schedule.onRun(
  async (context: functions.EventContext) => {
    initialize();
    const firestore = admin.firestore();
    const collection = firestore.collection(config.cartCollection);
    const now = new Date();
    if (!config.abandonedTimeout) {
      functions.logger.error("ABANDONED_TIMEOUT not set");
      return;
    }
    const abandonedTimeout = parseInt(config.abandonedTimeout, 10);
    if (Number.isNaN(abandonedTimeout)) {
      functions.logger.error("ABANDONED_TIMEOUT is not set to an integer.");
      return;
    }
    const abandonedThreshold = new Date(
      now.valueOf() - abandonedTimeout * MS_PER_MINUTE
    );
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
            if (templateData.items && templateData.items.length > 0) {
              await admin.firestore().collection(config.emailCollection).add({
                to: user.email,
                dynamicTemplateData: templateData,
              });
              await admin.firestore().runTransaction((transaction) => {
                transaction.update(doc.ref, {
                  "metadata.emailSent": true,
                  "metadata.emailSentAt":
                    admin.firestore.FieldValue.serverTimestamp(),
                });
                return Promise.resolve();
              });
            }
          } catch (error) {
            // User not found, we should not try to send again
            await admin.firestore().runTransaction((transaction) => {
              transaction.update(doc.ref, {
                "metadata.error": (error as Error).message,
              });
              return Promise.resolve();
            });
            functions.logger.error(error);
          }
        });
      }
    } catch (error) {
      functions.logger.error(error);
      return;
    }
    functions.logger.log(
      "Completed execution of Abandoned Cart scheduled cart checker."
    );
    return;
  }
);
