export default {
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  location: process.env.LOCATION || "us-central1",
  projectId: process.env.PROJECT_ID,
};
