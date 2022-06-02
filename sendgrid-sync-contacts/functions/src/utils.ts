import { initializeApp } from "firebase-admin/app";
import config from "./config";
import { Client as SendGridClient } from "@sendgrid/client";
import { APP_VERSION } from "./version";

let initialized = false;
export let sendGridClient: SendGridClient;

export function initialize(): void {
  if (initialized) {
    return;
  }
  if (config.sendgrid.apiKey) {
    initializeApp();
    sendGridClient = new SendGridClient();
    sendGridClient.setApiKey(config.sendgrid.apiKey);
    // @ts-ignore The client has a defaultHeaders property, it just isn't exposed in the types
    const oldUserAgent = sendGridClient.defaultHeaders["User-Agent"];
    const newUserAgent = `${oldUserAgent} twilio-firebase-extensions sendgrid-sync-contacts/${APP_VERSION}`;
    sendGridClient.setDefaultHeader("User-Agent", newUserAgent);
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
