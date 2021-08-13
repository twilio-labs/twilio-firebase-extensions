"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContact = exports.getContactId = exports.createContact = void 0;
const utils_1 = require("./utils");
class SendGridError extends Error {
    constructor(response) {
        const message = response.body.errors
            .map((error) => error.message)
            .join("\n");
        super(message);
    }
}
async function createContact(data) {
    try {
        const request = {
            method: "PUT",
            url: "/v3/marketing/contacts",
            body: {
                contacts: [data],
            },
        };
        const response = await utils_1.sendGridClient.request(request);
        const clientResponse = response[0];
        return clientResponse.body.job_id;
    }
    catch (error) {
        const response = error.response;
        throw new SendGridError(response);
    }
}
exports.createContact = createContact;
async function getContactId(email) {
    try {
        const request = {
            method: "POST",
            url: "/v3/marketing/contacts/search/emails",
            body: {
                emails: [email],
            },
        };
        const response = await utils_1.sendGridClient.request(request);
        const clientResponse = response[0];
        const result = clientResponse.body.result[email];
        if (utils_1.hasOwnProperty(result, "contact")) {
            return result.contact.id;
        }
        else {
            return null;
        }
    }
    catch (error) {
        const response = error.response;
        throw new SendGridError(response);
    }
}
exports.getContactId = getContactId;
async function deleteContact(id) {
    try {
        const queryParams = new URLSearchParams({ ids: id });
        const request = {
            method: "DELETE",
            url: `/v3/marketing/contacts?${queryParams.toString()}`,
        };
        const response = await utils_1.sendGridClient.request(request);
        const clientResponse = response[0];
        return clientResponse.body.job_id;
    }
    catch (error) {
        const response = error.response;
        throw new SendGridError(response);
    }
}
exports.deleteContact = deleteContact;
//# sourceMappingURL=sendgrid.js.map