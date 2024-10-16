import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatOpenAI({ modelName: "gpt-4-turbo" });

export const generateDraft = async (input: {
  intent: string;
  subintent: string;
  inquiry: string;
  context: Record<string, unknown>;
  handlerResult: unknown;
}) => {
  const generateDraftPrompt = PromptTemplate.fromTemplate(`
Generate a customer service response for the following inquiry:

Intent: {intent}
Subintent: {subintent}
Inquiry: {inquiry}
Context: {context}
Handler Result: {handlerResult}

Response:
`);

  const generateChain = RunnableSequence.from([
    {
      intent: (input) => input.intent,
      subintent: (input) => input.subintent,
      inquiry: (input) => input.inquiry,
      context: (input) => JSON.stringify(input.context),
      handlerResult: (input) => JSON.stringify(input.handlerResult),
    },
    generateDraftPrompt,
    model,
  ]);

  const result = await generateChain.invoke(input);
  return { draftResponse: result.content };
};