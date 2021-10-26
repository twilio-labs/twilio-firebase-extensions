import * as admin from "firebase-admin";
import config from "./config";
import { Client as SendGridClient } from "@sendgrid/client";

let initialized = false;
export let sendGridClient: SendGridClient;

export function initialize(): void {
  if (initialized) {
    return;
  }
  if (config.sendgrid.apiKey) {
    admin.initializeApp();
    sendGridClient = new SendGridClient();
    sendGridClient.setApiKey(config.sendgrid.apiKey);
    initialized = true;
    return;
  } else {
    throw new Error(
      `One or more of the Twilio API Key or Auth Token is missing. Please add all of your API credentials to your extension config.`
    );
  }
}

export function hasOwnProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
