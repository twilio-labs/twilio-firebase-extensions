# Add and remove contacts from your SendGrid marketing campaigns contacts list

**Author**: Twilio (**[https://www.twilio.com](https://www.twilio.com)**)

**Description**: Keeps a Firestore collection of contact data synced with a SendGrid Marketing Campaign contacts list



**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* SendGrid API Key: A SendGrid API key with permission to add contacts to the marketing campaign

* Contacts documents collection: What is the path to the collection that contains the documents with the contacts details?



**Cloud Functions:**

* **processQueue:** Processes document changes in the specified Cloud Firestore collection, adds contact data to the contacts list in your SendGrid Marketing Campaign



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added message documents.)
