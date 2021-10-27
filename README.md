<h1 align="center">Twilio Firebase Extensions</h1>
<p align="center"><a href="https://github.com/twilio-labs/about"><img src="https://img.shields.io/static/v1?label=&message=Twilio-Labs&color=F22F46&labelColor=0D122B&logo=twilio&style=for-the-badge" alt="Part of Twilio Labs Banner"></a></p>

This repository contains the source code for Firebase Extensions that enable communications with Twilio. To learn more about Firebase Extensions, including how to install them in your Firebase projects, visit the [Firebase documentation](https://firebase.google.com/docs/extensions).

* [Available Extensions](#available-extensions)
  * [Send Messages using Twilio](#send-messages-using-twilio)
  * [Sync contacts to SendGrid Marketing Campaigns](#sync-contacts-to-sendgrid-marketing-campaigns)
  * [Send emails when shopping carts are abandoned](#send-emails-when-shopping-carts-are-abandoned)
* [Running the extensions locally](#running-the-extensions-locally)
* [Contributing](#contributing)
  * [Code of Conduct](#code-of-conduct)

## Available Extensions

### Send Messages using Twilio

* [Source code](./send-message/)

### Sync contacts to SendGrid Marketing Campaigns

* [Source code](./sendgrid-sync-contacts/)

### Send emails when shopping carts are abandoned

* [Source code](./abandoned-cart-emails/)

## Running the extensions locally

* [Create a Firebase project](https://firebase.google.com/)
* Clone the project
* Install the dependencies: `npm install`
* `cd` into the extension that you want to run
* Copy the `.env.example` file: `cp .env.example .env`
* Fill in the `.env` file with values from your Twilio account
* Run the Firebase emulator: `npx firebase ext:dev:emulators:start --test-params .env --project YOUR_FIREBASE_PROJECT_ID`
* Open the emulator in your browser at `localhost:4000`

## Contributing

This project welcomes contributions from the community.

### Code of Conduct

Please be aware that this project has a [Code of Conduct](./CODE_OF_CONDUCT.md). The tldr; is to just be excellent to each other ❤️