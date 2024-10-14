import { PromptTemplate } from "@langchain/core/prompts";

export const classifyInquiryPrompt = PromptTemplate.fromTemplate(`
Classify the following customer inquiry:

{inquiry}

Intent:
`);

export const extractInfoPrompt = PromptTemplate.fromTemplate(`
Extract the following information from the customer inquiry:

{inquiry}

Product ID:
Order ID:
Customer ID:
Issue:
`);

export const generateDraftPrompt = PromptTemplate.fromTemplate(`
Generate a customer service response for the following inquiry:

Intent: {intent}
Subintent: {subintent}
Inquiry: {inquiry}
Context: {context}
Handler Result: {handlerResult}

Response:
`);