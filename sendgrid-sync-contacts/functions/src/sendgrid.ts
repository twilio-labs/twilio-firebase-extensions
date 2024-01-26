import RequestOptions from "@sendgrid/helpers/classes/request";
import Response from "@sendgrid/helpers/classes/response";
import { sendGridClient, hasOwnProperty } from "./utils";
import {
  Job,
  ContactData,
  ContactOptions,
  EmailResults,
  ErrorResponse,
} from "./types";

class SendGridError extends Error {
  constructor(response: Response<ErrorResponse>) {
    const message = response.body.errors
      .map((error) => error.message)
      .join("\n");
    super(message);
  }
}

export async function createContact(data: ContactData): Promise<string> {
  try {
    const request: RequestOptions<ContactOptions> = {
      method: "PUT",
      url: "/v3/marketing/contacts",
      body: {
        contacts: [data],
      },
    };
    const response = await sendGridClient.request(request);
    const clientResponse = response[0] as Response<Job>;
    return clientResponse.body.job_id;
  } catch (error: any) {
    const response = error.response as Response<ErrorResponse>;
    throw new SendGridError(response);
  }
}

export async function getContactId(email: string) {
  try {
    const request: RequestOptions = {
      method: "POST",
      url: "/v3/marketing/contacts/search/emails",
      body: {
        emails: [email],
      },
    };
    const response = await sendGridClient.request(request);
    const clientResponse = response[0] as Response<EmailResults>;
    const result = clientResponse.body.result[email];
    if (hasOwnProperty(result, "contact") && typeof result.contact === "object" && result.contact && hasOwnProperty(result.contact, "id") && typeof result.contact.id === "string") {
      return result.contact.id;
    } else {
      return null;
    }
  } catch (error: any) {
    const response = error.response as Response<ErrorResponse>;
    throw new SendGridError(response);
  }
}

export async function deleteContact(id: string) {
  try {
    const queryParams = new URLSearchParams({ ids: id });
    const request: RequestOptions = {
      method: "DELETE",
      url: `/v3/marketing/contacts?${queryParams.toString()}`,
    };
    const response = await sendGridClient.request(request);
    const clientResponse = response[0] as Response<Job>;
    return clientResponse.body.job_id;
  } catch (error: any) {
    const response = error.response as Response<ErrorResponse>;
    throw new SendGridError(response);
  }
}
