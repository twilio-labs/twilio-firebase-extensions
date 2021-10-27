type APIErrorMessage = {
  field: string;
  message: string;
};

export type ErrorResponse = {
  errors: APIErrorMessage[];
};

export type UserInput<T> = T & { [key: string]: any };

export type ContactData = {
  email: string;
  alternate_emails?: string[];
  first_name?: string;
  last_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postal_code?: string;
  state_province_region?: string;
  country?: string;
  phone_number?: string;
  whatsapp?: string;
  line?: string;
  facebook?: string;
  unique_name?: string;
  custom_fields?: { [key: string]: string };
};

export type ContactDataWithId = ContactData & { id: string };
export type ContactDataWithMeta = ContactData & {
  meta?: {
    state: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
    error?: string;
    jobId?: string;
  };
};

export type ContactOptions = {
  contacts: ContactData[];
};

export type Job = {
  job_id: string;
};

export type EmailResults = {
  result: {
    [key: string]: { contact: ContactDataWithId } | { error: string };
  };
};
