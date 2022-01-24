import { firestore as adminFirestore } from "firebase-admin";
import {
  Change,
  handler,
  logger,
  firestore as functionsFirestore,
} from "firebase-functions";
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
  snapshot: adminFirestore.DocumentSnapshot<adminFirestore.DocumentData>
) {
  const payload = snapshot.data();
  let update: MetadataUpdate;
  if (payload?.metadata) {
    update = {
      metadata: {
        ...payload.metadata,
        lastUpdated: adminFirestore.FieldValue.serverTimestamp(),
      },
    };
  } else {
    update = {
      metadata: {
        lastUpdated: adminFirestore.FieldValue.serverTimestamp(),
        emailSent: false,
        error: "",
      },
    };
  }
  return adminFirestore().runTransaction(
    (transaction: adminFirestore.Transaction) => {
      transaction.update(snapshot.ref, update);
      return Promise.resolve();
    }
  );
}

function processCreate(
  snapshot: adminFirestore.DocumentSnapshot<adminFirestore.DocumentData>
): Promise<void> {
  // In a transaction, store a metadata object that logs the time it was
  // updated
  return updateLastUpdated(snapshot);
}

async function processWrite(
  change: Change<functionsFirestore.DocumentSnapshot>
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

export const processCartUpdate = handler.firestore.document.onWrite(
  async (change: Change<functionsFirestore.DocumentSnapshot>) => {
    // Initialize Firebase and Twilio clients
    initialize();
    try {
      await processWrite(change);
    } catch (error) {
      logger.error(error);
      return;
    }
    logger.log("Completed execution of Abandoned Cart updates.");
  }
);
