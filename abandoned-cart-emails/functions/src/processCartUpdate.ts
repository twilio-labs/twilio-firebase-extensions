import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import isEqual from "lodash.isequal";
import { initialize } from "./utils";
import { CartDocument } from "./types";

type MetadataUpdate = {
  metadata: {
    lastUpdated: FirebaseFirestore.FieldValue;
    emailSent?: boolean;
    error?: string;
  };
};

function updateLastUpdated(
  snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>
) {
  const payload = snapshot.data();
  let update: MetadataUpdate;
  if (payload?.metadata) {
    update = {
      metadata: {
        ...payload.metadata,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
    };
  } else {
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
    .runTransaction((transaction: admin.firestore.Transaction) => {
      transaction.update(snapshot.ref, update);
      return Promise.resolve();
    });
}

function processCreate(
  snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>
): Promise<void> {
  // In a transaction, store a metadata object that logs the time it was
  // updated
  return updateLastUpdated(snapshot);
}

async function processWrite(
  change: functions.Change<functions.firestore.DocumentSnapshot>
): Promise<void> {
  if (!change.after.exists) {
    // Document has been deleted, nothing to do here.
    return;
  }

  if (!change.before.exists && change.after.exists) {
    // Document has been created, initialize the delivery state
    return processCreate(change.after);
  }

  const beforeData = change.before.data() as CartDocument;
  const afterData = change.after.data() as CartDocument;

  // Deletes the metadata and checks to see if the rest of the document has
  // changed. If so, updates the lastUpdated metadata field.
  delete beforeData.metadata;
  delete afterData.metadata;
  if (!isEqual(beforeData, afterData)) {
    return updateLastUpdated(change.after);
  }
}

export const processCartUpdate = functions.handler.firestore.document.onWrite(
  async (change: functions.Change<functions.firestore.DocumentSnapshot>) => {
    // Initialize Firebase and Twilio clients
    initialize();
    try {
      await processWrite(change);
    } catch (error) {
      functions.logger.error(error);
      return;
    }
    functions.logger.log("Completed execution of Abandoned Cart updates.");
  }
);
