### See it in action

You can test out this extension right away!

1.  Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

1.  If it doesn't already exist, create the collection you specified during installation: `${param:MESSAGES_COLLECTION}`.

1.  Add a document with a `to` field and a `body` field with the following content:

    ```js
    to: "YOUR_PHONE_NUMBER",
    body: "Hello from Firebase!"
    ```

2.  In a few seconds, you'll see a `delivery` field appear in the document. The field will update as the extension processes the message.

**Note:** You can also use the [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) to add a document:

```js
admin
  .firestore()
  .collection("${param:MESSAGE_COLLECTION}")
  .add({
    to: "YOUR_PHONE_NUMBER",
    body: "Hello from Firebase!"
  })
  .then(() => console.log("Queued message for delivery!"));
```

### Using this extension

After its installation, this extension monitors all document writes to the `${param:MESSAGE_COLLECTION}` collection. Messages are delivered based on the contents of the document's fields. The document's fields specify who to send the message to and the body of the message and can optionally define the number to send the message from.

#### Required fields

| Field  | Description                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to`   | The phone number or WhatsApp number you want to send the message to. Phone numbers should be in [e.164 format](https://www.twilio.com/docs/glossary/what-e164). |
| `body` | The body of the message                                                                                                                                         |

#### Optional fields

| Field  | Description                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from` | A Twilio phone number or [Messaging Service](https://www.twilio.com/docs/messaging/services) you want to use to send the message. Overrides the from number or Messaging Service set in the extension settings |

#### Security rules and sending messages

This extension can be used to trigger message delivery using the Twilio API directly from client applications. However, you should carefully control client access to the `${param:MESSAGE_COLLECTION}` collection to avoid potential abuse (you don't want users able to send arbitrary messages from your company's phone number or WhatsApp Business account!).

Security rules will vary from application to application, but you should always make sure that messages are sent only to intended recipients and free-form content is kept to a minimum.

#### Message delivery processing

When a document is added to the `${param:MESSAGE_COLLECTION}` collection, the extension picks it up for delivery processing via the Twilio API. The extension creates and updates a `delivery` field in the document as it processes the message. The `delivery` field can be populated with the following fields:

| Field                      | Description                                                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `state`                    | One of `PENDING`, `PROCESSING`, `SUCCESS`, or `ERROR`.                                                                                                                                                                               |
| `startTime`                | Timestamp when message processing began.                                                                                                                                                                                             |
| `endTime`                  | Timestamp when message processing completed (that is, ended in either a `SUCCESS` or `ERROR` state)                                                                                                                                  |
| `errorCode`                | If there was an API error, an error code will be populated here. You can look up error codes in the [Twilio error directory](https://www.twilio.com/docs/api/errors) for more information                                            |
| `errorMessage`             | If there was an API error, an error message will be populated here                                                                                                                                                                   |
| `leaseExpireTime`          | In case of a hang or timeout, the time at which a `PROCESSING` state should be considered an error                                                                                                                                   |
| `info`                     | After successful message delivery this field will be populated with the following fields                                                                                                                                             |
| `info.messageSid`          | The SID of the message                                                                                                                                                                                                               |
| `info.status`              | The status of the message. Can be: accepted, queued, sending, sent, failed, delivered, or undelivered. For more information, [see detailed descriptions](https://www.twilio.com/docs/sms/api/message-resource#message-status-values) |
| `info.dateCreated`         | The time the message was created within Twilio                                                                                                                                                                                       |
| `info.dateSent`            | The time the message was sent from Twilio to the network                                                                                                                                                                             |
| `info.dateUpdated`         | The last time the message was updated within Twilio                                                                                                                                                                                  |
| `info.messagingServiceSid` | The Sid of the Messaging Service used to send the message                                                                                                                                                                            |
| `info.numMedia`            | The number of media objects sent with the message                                                                                                                                                                                    |
| `info.numSegments`         | The number of segments your message was sent as. See [here for more on message segments](https://www.twilio.com/blog/2017/03/what-the-heck-is-a-segment.html)                                                                        |

A message will typically go from `PENDING` to `PROCESSING` to either `SUCCESS` or `ERROR`. Once in the `SUCCESS` or `ERROR` state, additional changes to the document will not trigger the extension to send another message.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
