# Send Abandoned Cart reminders with SendGrid

**Author**: Twilio (**[https://www.twilio.com](https://www.twilio.com)**)

**Description**: Watches a cart collection keeping track of the last updated time of a cart object. When it is over a certain period, send the user an email based on a SendGrid Dynamic Template.



**Details**: Use this extension to automate sending an email reminder to users about items they left in their shopping cart.

This extension will watch the documents added to a specified Cloud Firestore collection. For each document the extension records the last updated time of the document. Then, when the last updated time goes beyond a configurable threshold, the information in the document is copied to a new collection which triggers an email using the [Twilio SendGrid API](https://sendgrid.com/). The information in the document is sent as the template data for a [dynamic transactional email](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates).

#### Additional setup

Before installing this extension, make sure:

* You have [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project
* You have [set up Firebase Authentication](https://firebase.google.com/docs/auth/where-to-start) in your Firebase project
* You have [signed up for a Twilio SendGrid Marketing Campaigns account](https://signup.sendgrid.com/)
* You have created a SendGrid API Key with access to send emails
* You have verified a single sender email address or set up domain authentication with SendGrid
* You have a dynamic transactional template setup with which to send emails

##### Firestore indexes

This extension requires a composite Firestore index. You can add the index in the Firebase console or by the command line.

###### Indexes in the Firebase console

1. Go to the **Cloud Firestore** section of the [Firebase console](https://console.firebase.google.com/project/_/firestore/data)
1. Go to the **Indexes** tab and click **Add Index**
1. Enter the collection name for your cart collection
1. Add the following fields to the index:
   * `metadata.emailSent` - Ascending
   * `metadata.error` - Ascending
   * `metadata.lastUpdated` - Ascending
2. Set the **Query scopes** to **Collection**
3. Click **Create**

###### Indexes with the Firebase CLI

1. In your Firebase project, open your index configuration file, with default filename `firestore.indexes.json`
1. Add the following object to the `indexes` array:
    ```json
    {
      "collectionGroup": "cart",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "metadata.emailSent", "order": "ASCENDING" },
        { "fieldPath": "metadata.error", "order": "ASCENDING" },
        { "fieldPath": "metadata.lastUpdated", "order": "ASCENDING" }
      ]
    }
    ```

    The `collectionGroup` name should be the collection name for your cart collection.
1. Deploy your index configuration with the `firebase deploy` command. If you only want to deploy indexes, add the `--only firestore:indexes` flag.

#### How it works

##### The shopping cart

A shopping cart should be implemented as a document per cart. How you store items in the document is up to you, but an array property called `items` containing information about each of the items in the cart is typical. The document should also have a reference to a [Firebase Authentication](https://firebase.google.com/docs/auth) User, either the cart document ID should match the user ID or there should be a `userId` property on the document. When you create the cart document or update properties on the cart document, the extension will update a `metadata.lastUpdated` timestamp.

##### Checking the cart

A function runs periodically to determine whether any carts are abandoned and should be emailed. You can configure the period with the `CART_CHECK_INTERVAL` using [cron.yaml syntax](https://cloud.google.com/appengine/docs/standard/python/config/cronref).

There are a few conditions that a cart document must fulfill before it is processed to the next stage:

* the `metadata.lastUpdated` timestamp should be older than the configurable `ABANDONED_TIMEOUT` time in minutes
* the `metadata.emailSent` boolean property should be `false`
* there should be no errors present in the `metadata.error` property

If all of these conditions are met, then the extension will attempt to load the user data using the `userId` property or the document's ID. If the user doesn't have an email address, an error will be recorded. If the user has an email address then a document will be created in the `EMAIL_COLLECTION`. The document will include the user email and a property for `dynamicTemplateData` consisting of the contents of the user's cart and a `user` property including the user's `email` and `displayName` if present. This `dynamicTemplateData` is used to fill in the fields in a SendGrid dynamic email template.

##### Sending the email

When a document is added to the `EMAIL_COLLECTION` the contents are queued up to be emailed using the Twilio SendGrid API. All the information from the cart document is added as dynamic template data for the email. You can configure a `DEFAULT_TEMPLATE_ID` which is the ID of a SendGrid dynamic template.

You can [create dynamic transactional templates in the SendGrid dashboard](https://mc.sendgrid.com/dynamic-templates). [SendGrid Templates use Handlebars](https://docs.sendgrid.com/for-developers/sending-email/using-handlebars) to render dynamic data into the email.

You also need to configure your `DEFAULT_FROM` to be an email address that you have verified with SendGrid as either a [single sender](https://docs.sendgrid.com/ui/sending-email/sender-verification) or via [domain authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication). You can also set a `DEFAULT_REPLY_TO` email.

You can trigger an email to be sent at any time by added a document to the `EMAIL_COLLECTION` with a `to` email address and a `dynamicTemplateData` property.

```js
admin.firestore().collection('cart_emails').add({
  to: 'example@example.com',
  dynamicTemplateData: {
    name: "Example"
  }
});
```

#### Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s free tier:
  - Cloud Firestore
  - Firebase Authentication
  - Cloud Functions (Node.js 10+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))
  - Cloud Secret Manager

Usage of this extension also requires you to have a [Twilio SendGrid account](https://www.sendgrid.com/) and credentials in order to use the Twilio SendGrid API for marketing campaigns. You are responsible for any associated costs with your usage of Twilio SendGrid.




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

* firebaseauth.viewer (Reason: Allows this extension to access Firebase Auth to read user information.)
