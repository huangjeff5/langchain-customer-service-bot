import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });

const classifyInquiryPrompt = PromptTemplate.fromTemplate(`
Classify the following customer inquiry:

{inquiry}

Provide the intent and subintent, separated by a comma. For example: "Order Status, Shipping Delay" or "Product Information, Specifications".

Intent, Subintent:`);

const parseResult = (text: string) => {
  const [intent, subintent] = text.split(',').map(s => s.trim());
  return { intent, subintent };
};

export const classifyInquiryFlow = RunnableSequence.from([
  classifyInquiryPrompt,
  model,
  new StringOutputParser(),
  parseResult
]);

// Usage remains similar:
// const result = await classifyInquiryFlow.invoke({ inquiry: "Your inquiry here" });