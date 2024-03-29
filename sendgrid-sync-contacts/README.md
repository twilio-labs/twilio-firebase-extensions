# Sync Contacts with SendGrid

**Author**: Twilio (**[https://www.twilio.com](https://www.twilio.com)**)

**Description**: Keeps a Firestore collection of contact data synced with a SendGrid Marketing Campaign contacts list



**Details**: Use this extension to add, update, or remove contacts from your [SendGrid Marketing Campaigns](https://sendgrid.com/solutions/email-marketing/) contact list based on information added to a specified Cloud Firestore collection.

Adding a document triggers this extension to add a contact to the Marketing Campaigns contact list. Updating a document will update the contact's data and deleting the document will trigger its removal from the contact list in SendGrid.

Here's an example document that would trigger this extension:

```js
admin.firestore().collection('contacts').add({
  email: 'someone@example.com',
  first_name: 'Bob',
  last_name: 'Bobson'
});
```

In the document you can add any of the following fields to your document and they will be applied to your contact:

| Field                   | type                |              |
| ----------------------- | ------------------- | ------------ |
| `email`                 | string              | **required** |
| `alternate_emails`      | Array<string>       |              |
| `first_name`            | string              |              |
| `last_name`             | string              |              |
| `address_line_1`        | string              |              |
| `address_line_2`        | string              |              |
| `city`                  | string              |              |
| `postal_code`           | string              |              |
| `state_province_region` | string              |              |
| `country`               | string              |              |
| `phone_number`          | string              |              |
| `whatsapp`              | string              |              |
| `line`                  | string              |              |
| `facebook`              | string              |              |
| `unique_name`           | string              |              |
| `custom_fields`         | Map<string, string> |              |

`custom_fields` must be defined within your SendGrid account and are a map of the custom field's ID to the content.

#### Additional setup

Before installing this extension, make sure:

* You have [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project
* You have [signed up for a Twilio SendGrid Marketing Campaigns account](https://signup.sendgrid.com/)
* You have created a SendGrid API Key with access to the Marketing APIs

#### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s free tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))
  - Cloud Secret Manager

Usage of this extension also requires you to have a [Twilio SendGrid account](https://www.sendgrid.com/) and credentials in order to use the Twilio SendGrid API for marketing campaigns. You are responsible for any associated costs with your usage of Twilio SendGrid.




**Configuration Parameters:**

* Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* SendGrid API Key: What is your SendGrid API key? It needs to have permission to add contacts to the marketing campaign.

* Contacts documents collection: What is the path to the collection that contains the documents with the contacts details?



**Cloud Functions:**

* **processQueue:** Processes document changes in the specified Cloud Firestore collection, adds contact data to the contacts list in your SendGrid Marketing Campaign



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added message documents.)
