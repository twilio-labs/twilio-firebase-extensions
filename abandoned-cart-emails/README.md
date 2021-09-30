# Send emails when users abandon their shopping cart

**Author**: Twilio (**[https://www.twilio.com](https://www.twilio.com)**)

**Description**: Watches a cart collection keeping track of the last updated time of a cart object. When it is over a certain period, send the user an email based on a SendGrid Dynamic Template.



**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* SendGrid API Key: A SendGrid API key with permission to add contacts to the marketing campaign

* Email documents collection: What is the path to the collection that contains the documents used to build and send the emails?

* Default from email address: The default email address to send the emails from

* Default email to set as reply-to: The default email address to set as the email reply-to field

* Default email dynamic template ID: The SendGrid Dynamic Template ID that you want to use by default

* The collection your shopping cart is stored in: This is the collection that this extension should observe in order to calculate whether a cart has been abandoned.

* Time in minutes: The amount of time in minutes a cart is inactive before this extension will send them an email

* Time in minutes between checks for abandoned carts: The amount of time in minutes between each check for abandoned carts.



**Cloud Functions:**

* **processEmailQueue:** Processes document changes in the specified Cloud Firestore collection, delivers emails, and updates the document with delivery status information.

* **processCartUpdate:** Processes changes to documents in the collection that represent a shopping cart, adding metadata about the document, specifically a last updated field that can be used to determine whether the cart has been abandoned.

* **processCartCheck:** undefined



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added message documents.)
