import { initializeApp } from "firebase-admin/app";
import { Twilio } from "twilio";

import { APP_VERSION } from "./version";

import config from "./config";

let initialized = false;
export let twilioClient: Twilio;

export function initialize(): void {
  if (initialized) {
    return;
  }
  if (config.twilio.accountSid && config.twilio.authToken) {
    initializeApp();
    twilioClient = new Twilio(
      config.twilio.accountSid,
      config.twilio.authToken,
      {
        lazyLoading: true,
        userAgentExtensions: [
          "twilio-firebase-extensions",
          `send-message/${APP_VERSION}`,
        ],
      }
    );
    initialized = true;
    return;
  } else {
    throw new Error(
      `One or more of the Twilio API Key or Auth Token is missing. Please add all of your API credentials to your extension config.`
    );
  }
}

export function getFunctionsUrl(functionName: string): string {
  if (process.env.IS_FIREBASE_CLI) {
    const baseUrl = process.env.HTTP_TUNNEL
      ? `https://${process.env.HTTP_TUNNEL}/`
      : "http://localhost:5001/";
    return `${baseUrl}${config.projectId}/${config.location}/${functionName}`;
  } else {
    return `https://${config.location}-${config.projectId}.cloudfunctions.net/${functionName}`;
  }
}
