import * as functions from "firebase-functions";
import functionsTestInit from "firebase-functions-test";

import { processQueue } from "../src/";

const functionsTest = functionsTestInit();

const updateMock = jest.fn();

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: function firestore() {
    (firestore as any).FieldValue = {
      increment: (v) => v,
      serverTimestamp: () => "serverTimestamp",
    };
    (firestore as any).Timestamp = {
      fromMillis: () => 0,
    };
    return {
      runTransaction: jest.fn((transaction) =>
        transaction({
          update: updateMock,
        })
      ),
    };
  },
}));

const messageCreate = jest.fn();

jest.mock("twilio", () => {
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: messageCreate,
      }
    }))
  };
});

describe("processing message queue", () => {
  beforeEach(() => {
    updateMock.mockReset();
    messageCreate.mockReset();
  });

  it("functions are exported", () => {
    expect(processQueue).toBeInstanceOf(Function);
  });

  it("successfully invokes function and ignores delete", async () => {
    const wrapped = functionsTest.wrap(processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: false,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
  });

  it("successfully invokes function and processes create", async () => {
    const wrapped = functionsTest.wrap(processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: false,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(null, {
      delivery: {
        errorCode: null,
        errorMessage: null,
        info: null,
        startTime: "serverTimestamp",
        state: "PENDING",
      },
    });
  });

  it("successfully invokes function and ignores update with finished status", async () => {
    const wrapped = functionsTest.wrap(processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(() => ({
          delivery: {
            state: "SUCCESS",
          },
        })),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
  });

  xit("successfully invokes function and processes update in pending state", async () => {
    const wrapped = functionsTest.wrap(processQueue);
    // This needs to be a real DocumentSnapshot with a real DocumentReference in
    // the `ref` fields so that the logging based on the `ref` in the function
    // works.
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(() => ({
          delivery: {
            state: "PENDING",
          },
        })),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    messageCreate.mockRejectedValue(new Error('Required parameter "opts.to" missing.'));
    expect(await wrapped(change)).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.state": "PROCESSING",
      "delivery.leaseExpireTime": 0,
    });
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.endTime": "serverTimestamp",
      "delivery.leaseExpireTime": null,
      "delivery.state": "ERROR",
      "delivery.errorMessage": 'Required parameter "opts.to" missing.',
    });
  });

  xit("should send message and write update delivery status with success", async () => {
    const wrapped = functionsTest.wrap(processQueue);
    const change: functions.Change<functions.firestore.DocumentSnapshot> = {
      before: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
      after: {
        id: "123",
        ref: null,
        exists: true,
        readTime: null,
        data: jest.fn(() => ({
          body: "Ahoy world!",
          to: "+15551231234",
          delivery: {
            state: "PENDING",
          },
        })),
        get: jest.fn(),
        isEqual: jest.fn(),
      },
    };
    expect(await wrapped(change)).toBeUndefined();
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.state": "PROCESSING",
      "delivery.leaseExpireTime": 0,
    });
    expect(updateMock).toHaveBeenCalledWith(null, {
      "delivery.attempts": 1,
      "delivery.endTime": "serverTimestamp",
      "delivery.leaseExpireTime": null,
      "delivery.state": "SUCCESS",
      messageId: "fakeConversationsResponse",
      "delivery.error": null,
    });
  });
});
