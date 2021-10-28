### See it in action

You can test out this extension right away!

1.  Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

1.  If it doesn't already exist, create the collection you specified during installation: `${param:CONTACTS_COLLECTION}`.

1.  Add a document with an `email` field containing your email address

1. In a few seconds, you will see a `meta` field appear in the document. The field will update as the extension makes the request to the SendGrid API

1. Contacts are uploaded in batch processes, soon your contact will be visible in your [SendGrid contacts list](https://mc.sendgrid.com/contacts/all)

**Note:** You can also use the [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) to add a document:

```js
admin
  .firestore()
  .collection("${param:CONTACTS_COLLECTION}")
  .add({
    email: "yourname@example.com"
  })
  .then(() => console.log("Contact added to list!"));
```

### Using this extension

After its installation, this extension monitors all document writes to the `${param:CONTACTS_COLLECTION}` collection. Contacts are created or updated based on the contents of the document's fields. The document's fields specify a contact's email and other attributes, including custom fields.

#### Fields

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

#### Security rules and syncing contacts

This extension can be used to sync contacts with your SendGrid Marketing Campaigns account. However, you should carefully control client access to the `${param:CONTACTS_COLLECTION}` collection to avoid potential abuse (you don't want users to be able to add arbitrary email addresses to your contacts).

Security rules will vary from application to application, but you should always make sure that only contacts that have agreed to join your list are added to the `${param:CONTACTS_COLLECTION}` collection.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.