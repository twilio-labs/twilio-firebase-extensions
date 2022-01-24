import { firestore as adminFirestore, auth as adminAuth } from "firebase-admin";
import { handler, EventContext, logger } from "firebase-functions";
import { initialize } from "./utils";
import config from "./config";

const MS_PER_MINUTE = 60000;

export const processCartCheck = handler.pubsub.schedule.onRun(
  async (context: EventContext) => {
    initialize();
    const firestore = adminFirestore();
    const collection = firestore.collection(config.cartCollection);
    const now = new Date();
    if (!config.abandonedTimeout) {
      logger.error("ABANDONED_TIMEOUT not set");
      return;
    }
    const abandonedTimeout = parseInt(config.abandonedTimeout, 10);
    if (Number.isNaN(abandonedTimeout)) {
      logger.error("ABANDONED_TIMEOUT is not set to an integer.");
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
            const user = await adminAuth().getUser(userId);
            delete templateData.metadata;
            templateData.user = {
              email: user.email,
              displayName: user.displayName,
            };
            const email = user.email;
            if (!email) {
              await adminFirestore().runTransaction((transaction) => {
                transaction.update(doc.ref, {
                  "metadata.error": "User does not have email address",
                });
                return Promise.resolve();
              });
            } else {
              if (templateData.items && templateData.items.length > 0) {
                await adminFirestore().collection(config.emailCollection).add({
                  to: email,
                  dynamicTemplateData: templateData,
                });
                await adminFirestore().runTransaction((transaction) => {
                  transaction.update(doc.ref, {
                    "metadata.emailSent": true,
                    "metadata.emailSentAt":
                      adminFirestore.FieldValue.serverTimestamp(),
                  });
                  return Promise.resolve();
                });
              }
            }
          } catch (error) {
            // User not found, we should not try to send again
            await adminFirestore().runTransaction((transaction) => {
              transaction.update(doc.ref, {
                "metadata.error": (error as Error).message,
              });
              return Promise.resolve();
            });
            logger.error(error);
          }
        });
      }
    } catch (error) {
      logger.error(error);
      return;
    }
    logger.log("Completed execution of Abandoned Cart scheduled cart checker.");
    return;
  }
);
