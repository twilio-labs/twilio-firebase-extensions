import { initializeApp } from "firebase-admin";
import config from "./config";
import { Client as SendGridClient } from "@sendgrid/client";
import { MailService } from "@sendgrid/mail";
import { APP_VERSION } from "./version";

let initialized = false;
export let sendgridClient: MailService;

export function initialize(): void {
  if (initialized) {
    return;
  }
  if (config.sendgrid.apiKey) {
    initializeApp();
    const httpClient = new SendGridClient();
    // @ts-ignore The client has a defaultHeaders property, it just isn't exposed in the types
    const oldUserAgent = httpClient.defaultHeaders["User-Agent"];
    const newUserAgent = `${oldUserAgent} twilio-firebase-extensions abandoned-cart-emails/${APP_VERSION}`;
    httpClient.setDefaultHeader("User-Agent", newUserAgent);
    sendgridClient = new MailService();
    sendgridClient.setClient(httpClient);
    sendgridClient.setApiKey(config.sendgrid.apiKey);
    initialized = true;
    return;
  } else {
    throw new Error(
      `Your SendGrid API key is missing. Please add all your API credentials to your extension config.`
    );
  }
}
