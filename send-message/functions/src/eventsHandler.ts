import config from "./config";
import { initialize, twilioClient, getFunctionsUrl } from "./utils";
import { eventarc } from "firebase-functions/v2";

export const onsend = eventarc.onCustomEventPublished(
    "firebase.extensions.twilio.send.sms",
    async (event) => {
      try {
        // Initialize Twilio client
        initialize();
        const from =
            event.data.from ||
            config.twilio.messagingServiceSid ||
            config.twilio.phoneNumber;
        const { to, body, mediaUrl } = event.data;
        return await twilioClient.messages.create({
            from,
            to,
            body,
            mediaUrl,
            statusCallback: getFunctionsUrl("statusCallback"),
        });
      } catch(err) {
        return Promise.reject(err);
      }
    }
  );