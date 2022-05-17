export type MessageStatus =
  | "accepted"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "delivered"
  | "undelivered"
  | "receiving"
  | "received"
  | "read";

export type QueuePayload = {
  delivery?: {
    startTime: FirebaseFirestore.Timestamp;
    endTime?: FirebaseFirestore.Timestamp;
    leaseExpireTime?: FirebaseFirestore.Timestamp;
    state: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
    errorCode?: number;
    errorMessage?: string;
    info?: {
      messageSid: string;
      status?: MessageStatus;
      dateCreated?: FirebaseFirestore.Timestamp;
      dateSent?: FirebaseFirestore.Timestamp;
      dateUpdated?: FirebaseFirestore.Timestamp;
      messagingServiceSid?: string;
      numMedia?: string;
      numSegments?: string;
    };
  };
  to: string;
  from: string;
  body: string;
  mediaUrl?: string;
};
