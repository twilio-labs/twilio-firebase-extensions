import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import isEqual from "lodash.isequal";
import { initialize } from "./utils";
import { createContact, deleteContact, getContactId } from "./sendgrid";
import { ContactData, ContactDataWithMeta, UserInput } from "./types";

async function createSendGridContact(opts: UserInput<ContactData>) {
  // This will cut out any keys added to the item in the collection that do not
  // appear in a contact.
  const contact: ContactData = {
    email: opts.email,
    alternate_emails: opts.alternate_emails,
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
    const jobId = await createContact(contact);
    return { state: "SUCCESS", jobId: jobId };
  } catch (error) {
    if (error instanceof Error) {
      return { state: "ERROR", error: error.message };
    } else {
      return { state: "ERROR", error: `Unknown error: ${String(error)}` };
    }
  }
}

async function startUpdate(
  snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>
) {
  // In a transaction, store a meta object that logs the time it was
  // updated and the initial state, PENDING.
  return admin
    .firestore()
    .runTransaction((transaction: admin.firestore.Transaction) => {
      transaction.update(snapshot.ref, { meta: { state: "PENDING" } });
      return Promise.resolve();
    });
}

async function processDelete(
  snapshot: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>
) {
  const contact = snapshot.data() as UserInput<ContactData>;
  try {
    const id = await getContactId(contact.email);
    if (id) {
      return deleteContact(id);
    } else {
      functions.logger.error(
        "Cannot delete email that isn't present in the contacts list."
      );
      return;
    }
  } catch (error) {
    if (error instanceof Error) {
      functions.logger.error(error.message);
    } else {
      functions.logger.error(`Unknown error: ${String(error)}`);
    }
    return;
  }
}

async function processWrite(
  change: functions.Change<functions.firestore.DocumentSnapshot>
) {
  if (!change.after.exists) {
    // Document has been deleted, remove from the contacts list
    return processDelete(change.before);
  }
  if (!change.before.exists && change.after.exists) {
    return startUpdate(change.after);
  }

  // Document has been created or updated, upsert the information to the
  // marketing campaign contacts list
  const payload = change.after.data() as UserInput<ContactDataWithMeta>;

  if (!payload.meta) {
    // Document does not have a delivery object so something has gone wrong.
    // Log and exit.
    functions.logger.error(
      `contact=${change.after.ref} is missing 'meta' field`
    );
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
          if (!isEqual(beforeData, afterData)) {
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

export const processQueue = functions.handler.firestore.document.onWrite(
  async (change: functions.Change<functions.firestore.DocumentSnapshot>) => {
    // Initialize Firebase and SendGrid clients
    initialize();
    try {
      await processWrite(change);
    } catch (error) {
      functions.logger.error(error);
      return;
    }
    functions.logger.log(
      "Completed execution of SendGrid Marketing Campaigns sync extension."
    );
  }
);
