# Trigger Message with the Twilio API

**Author**: Twilio (**[https://www.twilio.com](https://www.twilio.com)**)

**Description**: Sends a message using the Twilio API based on the contents of a document written to a specified Cloud Firestore collection.



**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Twilio Account Sid: Your Twilio Account Sid, which you can find in your Twilio console.

* Twilio Auth Token: Your Twilio Auth Token, which you can find in your Twilio console.

* Twilio phone number: A Twilio phone number you want to use to send messages. In e.164 format. If you provide a Messaging Service Sid as well, the messaging service will be preferred.

* Twilio Messaging Service Sid: A Sid of a Twilio Messaging Service that you want to use to send messages. If you provide a Twilio phone number as well, the messaging service will be preferred.

* Message documents collection: What is the path to the collection that contains the documents used to build and send the messages?



**Cloud Functions:**

* **processQueue:** Processes document changes in the specified Cloud Firestore collection, delivers messages, and updates the document with delivery status information.



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added message documents.)
