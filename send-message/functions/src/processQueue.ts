import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { QueuePayload } from "./types";
import config from "./config";
import { initialize, twilioClient, getFunctionsUrl } from "./utils";

async function deliverMessage(
  payload: QueuePayload,
  ref: admin.firestore.DocumentReference
): Promise<void> {
  functions.logger.log(`Attempting delivery for message: ${ref.path}`);
  const update = {
    "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
    "delivery.leaseExpireTime": null,
    "delivery.state": "SUCCESS",
    "delivery.info": {},
    "delivery.errorCode": "",
    "delivery.errorMessage": "",
  };

  try {
    const from =
      payload.from ||
      config.twilio.messagingServiceSid ||
      config.twilio.phoneNumber;
    const { to, body, mediaUrls } = payload;
    const message = await twilioClient.messages.create({
      from,
      to,
      body,
      mediaUrl: mediaUrls,
      statusCallback: getFunctionsUrl("statusCallback"),
    });
    const info = {
      messageSid: message.sid,
      status: message.status,
      dateCreated: message.dateCreated
        ? admin.firestore.Timestamp.fromDate(message.dateCreated)
        : null,
      dateSent: message.dateSent
        ? admin.firestore.Timestamp.fromDate(message.dateSent)
        : null,
      dateUpdated: message.dateUpdated
        ? admin.firestore.Timestamp.fromDate(message.dateUpdated)
        : null,
      messagingServiceSid: message.messagingServiceSid,
      numMedia: message.numMedia,
      numSegments: message.numSegments,
    };
    update["delivery.state"] = "SUCCESS";
    update["delivery.info"] = info;
    functions.logger.log(
      `Delivered message: ${ref.path} successfully. MessageSid: ${info.messageSid}`
    );
  } catch (error: any) {
    update["delivery.state"] = "ERROR";
    update["delivery.errorCode"] = error.code.toString();
    update["delivery.errorMessage"] = `${error.message} ${error.moreInfo}`;
    functions.logger.error(
      `Error when delivering message: ${ref.path}: ${error.toString()}`
    );
  }

  return admin.firestore().runTransaction((transaction) => {
    transaction.update(ref, update);
    return Promise.resolve();
  });
}

function processCreate(
  snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>
) {
  // In a transaction, store a delivery object that logs the time it was
  // updated, the initial state (PENDING), and empty properties for info about
  // the message or error codes and messages.
  return admin
    .firestore()
    .runTransaction((transaction: admin.firestore.Transaction) => {
      transaction.update(snapshot.ref, {
        delivery: {
          startTime: admin.firestore.FieldValue.serverTimestamp(),
          state: "PENDING",
          errorCode: null,
          errorMessage: null,
          info: null,
        },
      });
      return Promise.resolve();
    });
}

// This method is called by `processQueue` when a document is added to the
// collection, updated, or deleted.
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

  // The document has been updated, so we fetch the data in the document to
  // determine what to do next.
  const payload = change.after.data() as QueuePayload;

  if (!payload.delivery) {
    // Document does not have a delivery object so something has gone wrong.
    // Log and exit.
    functions.logger.error(
      `message=${change.after.ref} is missing 'delivery' field`
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
        return admin.firestore().runTransaction((transaction) => {
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
      await admin.firestore().runTransaction((transaction) => {
        transaction.update(change.after.ref, {
          "delivery.state": "PROCESSING",
          "delivery.leaseExpireTime": admin.firestore.Timestamp.fromMillis(
            Date.now() + 60000
          ),
        });
        return Promise.resolve();
      });
      return deliverMessage(payload, change.after.ref);
  }
}

export const processQueue = functions.handler.firestore.document.onWrite(
  async (change: functions.Change<functions.firestore.DocumentSnapshot>) => {
    // Initialize Firebase and Twilio clients
    initialize();
    try {
      await processWrite(change);
    } catch (error) {
      functions.logger.error(error);
      return;
    }
    functions.logger.log(
      "Completed execution of Twilio send message extension."
    );
  }
);
