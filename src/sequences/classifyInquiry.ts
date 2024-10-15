import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });

const classifyInquiryPrompt = PromptTemplate.fromTemplate(`
Classify the following customer inquiry:

{inquiry}

Provide the intent and subintent, separated by a comma. For example: "Order Status, Shipping Delay" or "Product Information, Specifications".

Intent, Subintent:`);

const classificationSchema = z.object({
  intent: z.string(),
  subintent: z.string(),
});

const structuredLlm = model.withStructuredOutput(classificationSchema);

export const classifyInquiry = RunnableSequence.from([
  classifyInquiryPrompt,
  structuredLlm,
]);
// Usage:
// const result = await classifyInquiry.invoke({ inquiry: "Your inquiry here" });
