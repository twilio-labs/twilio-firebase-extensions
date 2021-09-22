export default {
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    defaultFrom: process.env.DEFAULT_FROM,
    defaultReplyTo: process.env.DEFAULT_REPLY_TO,
    defaultTemplateId: process.env.DEFAULT_TEMPLATE_ID,
  },
  location: process.env.LOCATION || "us-central1",
  projectId: process.env.PROJECT_ID,
  cartCollection: process.env.CART_COLLECTION || "cart",
  emailCollection: process.env.EMAIL_COLLECTION || "cart_emails",
  abandonedTimeout: process.env.ABANDONED_TIMEOUT,
};
