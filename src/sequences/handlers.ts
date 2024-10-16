import { z } from 'zod';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from '@langchain/openai';

// Define the structure of a handler's result
const HandlerResult = z.object({
    needsUserInput: z.boolean(),
    nextAction: z.string().optional(),
    actionsTaken: z.array(z.string()),
    data: z.record(z.unknown()),
    handlerCompleted: z.boolean(),
  });
  
  // Define the input structure for a handler
  type HandlerInput = {
    intent: string;
    subintent: string;
    inquiry: string;
    context: Record<string, unknown>;
  };
  
// Define a type for handler functions
type HandlerFunction = (input: HandlerInput) => Promise<z.infer<typeof HandlerResult>>;

// Create a map to store handler functions
const handlers: Record<string, HandlerFunction> = {};

// Main function to execute a handler based on the given input
export async function executeHandler(input: HandlerInput): Promise<z.infer<typeof HandlerResult>> {
  const handlerKey = `${input.intent.toLowerCase()}_${input.subintent.toLowerCase()}`;
  const handler = handlers[handlerKey];
  console.log('Handler key:', handlerKey);
  console.log('Available handler keys:', Object.keys(handlers));
  console.log('Handler function:', !!handler ? 'Found' : 'Not found');
  if (handler) {
    console.log('Handler function details:', handler.toString().slice(0, 100) + '...');
  }

  if (!handler) {
    throw new Error(`NoHandlerError: No handler found for intent '${input.intent}' and subintent '${input.subintent}'`);
  }

  return handler(input);
}

// Function to register a new handler
export function registerHandler(intent: string, subintent: string, handler: HandlerFunction) {
  const handlerKey = `${intent}_${subintent}`;
  handlers[handlerKey] = handler;
}

// Helper function to create a LangChain-based handler
export function createLangChainHandler(promptTemplate: string): HandlerFunction {
  return async (input: HandlerInput) => {
    console.log('Creating LangChain handler with input:', JSON.stringify(input, null, 2));
    const model = new ChatOpenAI({ temperature: 0.7 });
    const prompt = PromptTemplate.fromTemplate(promptTemplate);

    console.log('Prompt template:', promptTemplate);

    const chain = RunnableSequence.from([
      {
        inquiry: (input: HandlerInput) => input.inquiry,
        context: (input: HandlerInput) => JSON.stringify(input.context, null, 2),
      },
      prompt,
      model,
      (output) => JSON.parse(output.content),
    ]);

    console.log('Invoking LangChain...', input);
    const output = await chain.invoke(input);
    console.log('LangChain output:', JSON.stringify(output, null, 2));

    const result = {
      needsUserInput: output.needsUserInput || false,
      nextAction: output.nextAction,
      actionsTaken: output.actionsTaken || [],
      data: output.data || {},
      handlerCompleted: output.handlerCompleted || false,
    };

    console.log('Handler result:', JSON.stringify(result, null, 2));
    return result;
  };
}

// Handler for general order questions
registerHandler('order', 'generalquestion', createLangChainHandler(`
You are a customer service AI assistant handling a general question about a specific order. Follow these steps:

1. Analyze the customer's inquiry to identify the order in question.
2. If the order is ambiguous or not specified, ask the customer to confirm before proceeding.
3. Use the available information about the order to answer the customer's question.
4. Provide a clear and concise answer to the customer's question.

Execute as many steps as possible before requiring user input. If you complete all steps, set handlerCompleted to true.

User inquiry: {inquiry}
Context: {context}

Respond in the following JSON format:
{{
  "needsUserInput": boolean,
  "nextAction": string,
  "actionsTaken": string[],
  "data": object,
  "handlerCompleted": boolean
}}
`));

// Handler for general product questions
registerHandler('product', 'generalquestion', createLangChainHandler(`
You are a customer service AI assistant handling a general question about a specific product. Follow these steps:

1. Analyze the customer's inquiry to identify the product in question.
2. If the product is ambiguous or not specified, ask the customer to confirm before proceeding.
3. Use the available information about the product to answer the customer's question.
4. Provide a clear and concise answer to the customer's question.

Execute as many steps as possible before requiring user input. If you complete all steps, set handlerCompleted to true.

User inquiry: {inquiry}
Context: {context}

Respond in the following JSON format:
{{
  "needsUserInput": boolean,
  "nextAction": string,
  "actionsTaken": string[],
  "data": object,
  "handlerCompleted": boolean
}}
`));

// Handler for product stock availability
registerHandler('product', 'stockavailability', createLangChainHandler(`
You are a customer service AI assistant handling a stock availability question about a specific product. Follow these steps:

1. Analyze the customer's inquiry to identify the product in question.
2. If the product is ambiguous or not specified, ask the customer to confirm before proceeding.
3. Check the available information about the product's stock status.
4. Provide a clear and concise answer about the product's availability.
5. If the product is out of stock, provide information on when it might be restocked, if available.

Execute as many steps as possible before requiring user input. If you complete all steps, set handlerCompleted to true.

User inquiry: {inquiry}
Context: {context}

Respond in the following JSON format:
{{
  "needsUserInput": boolean,
  "nextAction": string,
  "actionsTaken": string[],
  "data": object,
  "handlerCompleted": boolean
}}
`));
