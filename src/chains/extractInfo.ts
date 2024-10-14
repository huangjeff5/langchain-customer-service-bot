import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { extractInfoPrompt } from '../prompts';

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });

export const extractInfoFlow = async (input: { inquiry: string }) => {
  const chain = RunnableSequence.from([
    PromptTemplate.fromTemplate(`
Extract the following information from the customer inquiry:

{inquiry}

Product ID:
Order ID:
Customer ID:
Issue:
`),
    model,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke({ inquiry: input.inquiry });
  const lines = result.split('\n');
  return {
    productId: lines[0].split(':')[1].trim(),
    orderId: lines[1].split(':')[1].trim(),
    customerId: lines[2].split(':')[1].trim(),
    issue: lines[3].split(':')[1].trim(),
  };
};