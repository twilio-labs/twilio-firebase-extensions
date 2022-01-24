import { firestore as adminFirestore } from "firebase-admin";
import {
  logger,
  Change,
  handler,
  firestore as functionsFirestore,
} from "firebase-functions";
import config from "./config";
import { QueuePayload, ResponseError, EmailSendError } from "./types";
import { sendgridClient, initialize } from "./utils";

async function deliverMessage(
  payload: QueuePayload,
  ref: adminFirestore.DocumentReference
): Promise<void> {
  logger.log(`Attempting delivery for message: ${String(ref.path)}`);
  const update = {
    "delivery.endTime": adminFirestore.FieldValue.serverTimestamp(),
    "delivery.leaseExpireTime": null,
    "delivery.state": "SUCCESS",
    "delivery.errorMessage": "",
    "delivery.errors": new Array<EmailSendError>(),
  };
  try {
    const from = payload.from || config.sendgrid.defaultFrom;
    const templateId = payload.templateId || config.sendgrid.defaultTemplateId;
    if (!from) {
      update["delivery.state"] = "ERROR";
      update["delivery.errorMessage"] = "";
    } else if (!templateId) {
      update["delivery.state"] = "ERROR";
      update["delivery.errorMessage"] = "";
    } else {
      const mail = {
        to: payload.to,
        from,
        templateId,
        dynamicTemplateData: payload.dynamicTemplateData,
      };
      await sendgridClient.send(mail);
    }
  } catch (error) {
    update["delivery.state"] = "ERROR";
    if (error instanceof Error) {
      update["delivery.errorMessage"] = error.message;
      const responseError = error as ResponseError;
      if (responseError.response) {
        if (
          responseError.response &&
          responseError.response.body &&
          responseError.response.body.errors
        ) {
          update["delivery.errors"] = responseError.response.body.errors;
          logger.error(
            `Error when sending email: ${String(ref.path)}: ${error.toString()}`
          );
        }
      }
    }
  }

  return adminFirestore().runTransaction((transaction) => {
    transaction.update(ref, update);
    return Promise.resolve();
  });
}

function processCreate(
  snapshot: adminFirestore.DocumentSnapshot<adminFirestore.DocumentData>
) {
  // In a transaction, store a delivery object that logs the time it was
  // updated, the initial state (PENDING), and empty properties for info about
  // the message or error codes and messages.
  return adminFirestore().runTransaction(
    (transaction: adminFirestore.Transaction) => {
      transaction.update(snapshot.ref, {
        delivery: {
          startTime: adminFirestore.FieldValue.serverTimestamp(),
          state: "PENDING",
          errorMessage: null,
          errors: [],
        },
      });
      return Promise.resolve();
    }
  );
}

// This method is called by `processQueue` when a document is added to the
// collection, updated, or deleted.
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

  // The document has been updated, so we fetch the data in the document to
  // determine what to do next.
  const payload = change.after.data() as QueuePayload;

  if (!payload.delivery) {
    // Document does not have a delivery object so something has gone wrong.
    // Log and exit.
    logger.error(
      `message=${String(change.after.ref.path)} is missing 'delivery' field`
    );
    return;
  }

  switch (payload.delivery.state) {
    case "SUCCESS":
    case "ERROR":
      // Processing complete, nothing more to do.
      return;
    case "PROCESSING":
      if (
        payload.delivery.leaseExpireTime &&
        payload.delivery.leaseExpireTime.toMillis() < Date.now()
      ) {
        // It has taken too long to process the message, mark it as an error.
        return adminFirestore().runTransaction((transaction) => {
          transaction.update(change.after.ref, {
            "delivery.state": "ERROR",
            errorMessage: "Message processing lease expired.",
          });
          return Promise.resolve();
        });
      }
      return;
    case "PENDING":
      // Update the message to the processing state and give it 60 seconds to
      // run. Then call the deliver function.
      await adminFirestore().runTransaction((transaction) => {
        transaction.update(change.after.ref, {
          "delivery.state": "PROCESSING",
          "delivery.leaseExpireTime": adminFirestore.Timestamp.fromMillis(
            Date.now() + 60000
          ),
        });
        return Promise.resolve();
      });
      return deliverMessage(payload, change.after.ref);
  }
}

export const processEmailQueue = handler.firestore.document.onWrite(
  async (change: Change<functionsFirestore.DocumentSnapshot>) => {
    // Initialize Firebase and Twilio clients
    initialize();
    try {
      await processWrite(change);
    } catch (error) {
      logger.error(error);
      return;
    }
    logger.log("Completed execution of SendGrid email.");
  }
);
