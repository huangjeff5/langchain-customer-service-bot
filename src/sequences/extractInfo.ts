import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

const model = new ChatOpenAI({ modelName: "gpt-4-turbo" });

const extractInfoPrompt = PromptTemplate.fromTemplate(`
Extract the following information from the customer inquiry:

{inquiry}

Product ID:
Order ID:
Customer ID:
Issue:
`);

const extractionSchema = z.object({
  productId: z.string().optional(),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  issue: z.string(),
});

const structuredLlm = model.withStructuredOutput(extractionSchema);

export const extractInfo = RunnableSequence.from([
  extractInfoPrompt,
  structuredLlm,
]);

// Usage:
// const result = await extractInfo.invoke({ inquiry: "Your inquiry here" });
