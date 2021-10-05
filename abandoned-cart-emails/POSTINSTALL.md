### See it in action

Due to the nature of the extension, it's difficult to see the full effects of this extension immediately. Here's what you can do:

1.  Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

1. If it doesn't already exist, create the cart collection you specified during installation: `${param:CART_COLLECTION}`

1. Add a document with an `items` field containing some products:

   ```js
   items: [{ name: "Test product 1", price: "$9.99" }]
   ```

1. In a few seconds, you will see a `metadata` field appear in the document. The field will contain a `lastUpdated` property that will be set to the current time

1. If you update any properties outside of the `metadata` property, you will see the `metadata.lastUpdated` property update shortly after

1. Once `${param:ABANDONED_TIMEOUT}` minutes have passed, the cart will be updated again and a new document will be placed in the `${param:EMAIL_COLLECTION}` collection

2. In a few secondsm, you will see a `delivery` field appear on the new document in the `${param:EMAIL_COLLECTION}` collection. The field will upate as the extension processes the message and sends it via the SendGrid API


#### Using this extension

##### The shopping cart

A shopping cart should be implemented as a document per cart. How you store items in the document is up to you, but an array property called `items` containing information about each of the items in the cart is typical. The document should also have a reference to a [Firebase Authentication](https://firebase.google.com/docs/auth) User, either the cart document ID should match the user ID or there should be a `userId` property on the document. When you create the cart document or update properties on the cart document, the extension will update a `metadata.lastUpdated` timestamp.

##### Checking the cart

A function runs periodically to determine whether any carts are abandoned and should be emailed. You can configure the period with the `CART_CHECK_INTERVAL` using [cron.yaml syntax](https://cloud.google.com/appengine/docs/standard/python/config/cronref). Yours is currently set to `${param:CART_CHECK_INTERVAL}`.

There are a few conditions that a cart document must fulfill before it is processed to the next stage:

* the `metadata.lastUpdated` timestamp should be older than `${param:ABANDONED_TIMEOUT}` time in minutes
* the `metadata.emailSent` boolean property should be `false`
* there should be no errors present in the `metadata.error` property

If all of these conditions are met, then the extension will attempt to load the user data using the `userId` property or the document's ID. If the user doesn't have an email address, an error will be recorded. If the user has an email address then a document will be created in the `${param:EMAIL_COLLECTION}` collection. The document will include the user email and a property for `dynamicTemplateData` consisting of the contents of the user's cart and a `user` property including the user's `email` and `displayName` if present. This `dynamicTemplateData` is used to fill in the fields in a SendGrid dynamic email template.

##### Sending the email

When a document is added to the `${param:EMAIL_COLLECTION}` collection the contents are queued up to be emailed using the Twilio SendGrid API. All the information from the cart document is added as dynamic template data for the email. You can configure a `DEFAULT_TEMPLATE_ID` which is the ID of a SendGrid dynamic template.

You can [create dynamic transactional templates in the SendGrid dashboard](https://mc.sendgrid.com/dynamic-templates). [SendGrid Templates use Handlebars](https://docs.sendgrid.com/for-developers/sending-email/using-handlebars) to render dynamic data into the email.

You also need to configure your `DEFAULT_FROM` to be an email address that you have verified with SendGrid as either a [single sender](https://docs.sendgrid.com/ui/sending-email/sender-verification) or via [domain authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication). You can also set a `DEFAULT_REPLY_TO` email.

You can trigger an email to be sent at any time by added a document to the `${param:EMAIL_COLLECTION}` collection with a `to` email address and a `dynamicTemplateData` property.

```js
admin.firestore().collection('cart_emails').add({
  to: 'example@example.com',
  dynamicTemplateData: {
    name: "Example"
  }
});
```

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.