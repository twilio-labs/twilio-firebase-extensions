# Send Messages with Twilio

**Author**: Twilio (**[https://www.twilio.com](https://www.twilio.com)**)

**Description**: Sends a message using the Twilio API based on the contents of a document written to a specified Cloud Firestore collection.



**Details**: Use this extension to send messages (SMS or WhatsApp) using the [Twilio Programmable Messaging API](https://www.twilio.com/docs/messaging) based on information from documents added to a specified Cloud Firestore collection. The extension will also record the delivery status of each message.

Adding a document triggers this extension to send a message built from the document's fields. The document's fields specify who to send the message to and the body of the message and can optionally define the number to send the message from.

Here's an example document that would trigger this extension:

```js
admin.firestore().collection('messages').add({
  to: '+15551234567',
  body: 'Hello from Firebase!'
});
```

#### Required fields

| Field  | Description                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to`   | The phone number or WhatsApp number you want to send the message to. Phone numbers should be in [e.164 format](https://www.twilio.com/docs/glossary/what-e164). |
| `body` | The body of the message                                                                                                                                         |

#### Optional fields

| Field       | Description                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from`      | A Twilio phone number or [Messaging Service](https://www.twilio.com/docs/messaging/services) you want to use to send the message. Overrides the from number or Messaging Service set in the extension settings      |
| `mediaUrls` | An array of URLs of media to send with the message. Only supported in US and Canada. See the [Create a Message docs](https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource) for more info. |

#### Additional setup

Before installing this extension, make sure:

* You have [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project
* You have [signed up for a Twilio account](https://www.twilio.com/try-twilio)

##### Sending SMS

* You will need a [Twilio phone number](https://www.twilio.com/docs/phone-numbers) that is capable of sending SMS messages
* If you are using a trial account you will only be able to send messages to a number that you have [verified with Twilio](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account#verify-your-personal-phone-number)

##### Sending WhatsApp messages

* You can test with the number provided in the [Twilio Sandbox for WhatsApp](https://www.twilio.com/docs/whatsapp/sandbox)
* To send WhatsApp messages in production you will need to [connect a Twilio number to a WhatsApp Business Profile](https://www.twilio.com/docs/whatsapp/tutorial/connect-number-business-profile)

#### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s free tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))
  - Cloud Secret Manager

Usage of this extension also requires you to have a [Twilio account](https://www.twilio.com/) and credentials in order to use the Twilio API for message delivery. You are responsible for any associated costs with your usage of Twilio.




**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Twilio Account Sid: What is your Twilio Account Sid? You can find in in your Twilio console.

* Twilio Auth Token: What is your Twilio Auth Token? You can find it in your Twilio console.

* Twilio phone number: What is the Twilio phone number you want to use to send messages? Please enter it in e.164 format. If you provide a Messaging Service Sid as well, the messaging service will be preferred.

* Twilio Messaging Service Sid: What is the Twilio Messaging Service Sid that you want to use to send messages? If you provide a Twilio phone number as well, the messaging service will be preferred.

* Message documents collection: What is the path to the collection that contains the documents used to build and send the messages?



**Cloud Functions:**

* **processQueue:** Processes document changes in the specified Cloud Firestore collection, delivers messages, and updates the document with delivery status information.

* **statusCallback:** An HTTP triggered function that receives status callback webhooks from Twilio and updates the delivery status of a message document.



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added message documents.)
