import * as admin from "firebase-admin";
import config from "./config";
import { MailService } from "@sendgrid/mail";

let initialized = false;
export let sendgridClient: MailService;

export function initialize(): void {
  if (initialized) {
    return;
  }
  if (config.sendgrid.apiKey) {
    admin.initializeApp();
    sendgridClient = new MailService();
    sendgridClient.setApiKey(config.sendgrid.apiKey);
    initialized = true;
    return;
  } else {
    throw new Error(
      `Your SendGrid API key is missing. Please add all your API credentials to your extension config.`
    );
  }
}
