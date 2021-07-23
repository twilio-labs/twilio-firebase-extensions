import { getMockRes, getMockReq } from "@jest-mock/express";
const mockTwilioConfig: {
  authToken?: string;
  accountSid?: string;
  phoneNumber?: string;
  messagingServiceSid?: string;
} = {};
jest.mock("../src/config", () => ({
  twilio: mockTwilioConfig,
}));

import Twilio from "twilio";

import { statusCallback } from "../src/";

const updateMock = jest.fn();

const where = jest.fn();

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => {
    return {
      runTransaction: jest.fn((transaction) =>
        transaction({
          update: updateMock,
        })
      ),
      collection: jest.fn(() => ({ where: where }))
    };
  })
}));

describe("receiving a status callback webhook", () => {
  beforeEach(() => {
    updateMock.mockReset();
    mockTwilioConfig.authToken = undefined;
    mockTwilioConfig.accountSid = undefined;
  });

  it("functions are exported", () => {
    expect(statusCallback).toBeInstanceOf(Function);
  });

  it("responds with a 400 response with no X-Twilio-Signature header", async () => {
    mockTwilioConfig.authToken = "token";
    mockTwilioConfig.accountSid = "ACxxx";
    const req = getMockReq();
    const { res } = getMockRes();
    await statusCallback(req, res);
    expect(res.type).toHaveBeenCalledWith("text/plain");
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("responds with a 500 response when no authToken in config", async () => {
    mockTwilioConfig.authToken = undefined;
    mockTwilioConfig.accountSid = undefined;
    const req = getMockReq({
      get: jest.fn((header) =>
        header === "x-twilio-signature" ? "test" : undefined
      ),
    });
    const { res } = getMockRes();
    await statusCallback(req, res);
    expect(res.type).toHaveBeenCalledWith("text/plain");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("responds with a 403 response when the signature isn't valid", async () => {
    mockTwilioConfig.authToken = 'token';
    mockTwilioConfig.accountSid = 'ACxxx';
    const req = getMockReq({
      get: jest.fn((header) =>
        header === "x-twilio-signature" ? "test" : undefined
      ),
    });
    const { res } = getMockRes();
    jest.spyOn(Twilio, 'validateRequest').mockImplementation(() => false);
    await statusCallback(req, res);
    expect(res.type).toHaveBeenCalledWith("text/plain");
    expect(res.status).toHaveBeenCalledWith(403);
  });

  xit('responds with a 200 response when the signature is valid', async () => {
    mockTwilioConfig.authToken = 'token';
    mockTwilioConfig.accountSid = 'ACxxx';
    const req = getMockReq({
      get: jest.fn((header) =>
        header === "x-twilio-signature" ? "test" : undefined
      ),
      body: {
        MessageSid: "SMxxx",
        MessageStatus: "delivered"
      }
    });
    const { res } = getMockRes();
    jest.spyOn(Twilio, 'validateRequest').mockImplementation(() => true);
    // TODO:
    // - Fetching the message from the store by MessageSid
    // - Updating the ref with the new status in a transaction
    await statusCallback(req, res);
    expect(res.type).toHaveBeenCalledWith("text/xml");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
