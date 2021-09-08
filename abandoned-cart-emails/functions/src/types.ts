export interface ResponseError extends Error {
  code: number;
  message: string;
  response: {
    headers: { [key: string]: string };
    body: {
      errors: EmailSendError[];
    };
  };
}

export type EmailSendError = {
  message: string;
  field?: string;
  help?: string;
};

type DataObject =
  | string
  | number
  | boolean
  | DataObject[]
  | { [key: string]: DataObject };

export type QueuePayload = {
  delivery?: {
    startTime: FirebaseFirestore.Timestamp;
    endTime?: FirebaseFirestore.Timestamp;
    leaseExpireTime?: FirebaseFirestore.Timestamp;
    state: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
    errorMessage?: string;
    errors: EmailSendError[];
  };
  to: string;
  dynamicTemplateData?: { [key: string]: DataObject };
  templateId?: string;
  from: string;
  replyTo?: string;
};
