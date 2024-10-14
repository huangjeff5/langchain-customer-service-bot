import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { z } from "zod";
import { getCustomerByEmail, getOrderById, getProductById, getRecentOrdersByEmail, listProducts, createEscalation } from './firestoreDb';

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });

const classifyInquiryPrompt = PromptTemplate.fromTemplate(
  "Classify the following customer inquiry:\n\n{inquiry}\n\nIntent:"
);

export const classifyInquiryFlow = async (input: { inquiry: string }) => {
  const classifyChain = new LLMChain({ llm: model, prompt: classifyInquiryPrompt });
  const result = await classifyChain.call({ inquiry: input.inquiry });
  const [intent, subintent] = result.text.split(',').map(s => s.trim());
  return { intent, subintent };
};

export const customerServiceFlow = async (input: {
  from: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  threadHistory: Array<{ from: string; to: string; body: string; sentAt: string }>;
}) => {
  // Step 1: Classify the inquiry
  const classificationResult = await classifyInquiryFlow({ inquiry: input.body });
  const { intent, subintent } = classificationResult;

  // Step 2: Augment data
  const augmentedData = await augmentInfo(intent, input.body, input.from);

  // Step 3: Execute Handler (placeholder for now)
  const handlerResult = { data: "Handler result placeholder" };

  // Step 4: Generate response
  const responseResult = await generateDraftFlow({
    intent,
    subintent,
    inquiry: input.body,
    context: {
      ...augmentedData.responseData,
      subject: input.subject,
      threadHistory: input.threadHistory,
    },
    handlerResult: handlerResult.data,
  });

  return {
    intent,
    subintent,
    response: responseResult.draftResponse,
    needsUserInput: false,
    nextAction: 'send_response',
    escalated: false,
  };
};

// Implement other flows (augmentInfo, extractInfoFlow, executeHandlerFlow, generateDraftFlow, etc.)

const augmentInfo = async (intent: string, customerInquiry: string, email: string) => {
  let responseData = {};
  switch (intent) {
    case 'Catalog':
      const products = await listProducts();
      responseData = { catalog: products };
      break;
    case 'Product':
      const productInfo = await extractInfoFlow({ inquiry: customerInquiry });
      if (productInfo.productId) {
        const product = await getProductById(productInfo.productId);
        responseData = { product };
      } else {
        const products = await listProducts();
        responseData = { products };
      }
      break;
    case 'Order':
      const orderInfo = await extractInfoFlow({ inquiry: customerInquiry });
      if (orderInfo.orderId) {
        const order = await getOrderById(orderInfo.orderId);
        responseData = { order };
      } else {
        const recentOrders = await getRecentOrdersByEmail(email);
        responseData = { recentOrders };
      }
      break;
    case 'Other':
      const customer = await getCustomerByEmail(email);
      responseData = { customer };
      break;
  }
  return { responseData };
};

const extractInfoPrompt = PromptTemplate.fromTemplate(
  "Extract the following information from the customer inquiry:\n\n{inquiry}\n\nProduct ID:\nOrder ID:\nCustomer ID:\nIssue:"
);

const extractInfoFlow = async (input: { inquiry: string }) => {
  const extractChain = new LLMChain({ llm: model, prompt: extractInfoPrompt });
  const result = await extractChain.call({ inquiry: input.inquiry });
  const lines = result.text.split('\n');
  return {
    productId: lines[0].split(':')[1].trim(),
    orderId: lines[1].split(':')[1].trim(),
    customerId: lines[2].split(':')[1].trim(),
    issue: lines[3].split(':')[1].trim(),
  };
};

const generateDraftPrompt = PromptTemplate.fromTemplate(
  "Generate a customer service response for the following inquiry:\n\nIntent: {intent}\nSubintent: {subintent}\nInquiry: {inquiry}\nContext: {context}\nHandler Result: {handlerResult}\n\nResponse:"
);

const generateDraftFlow = async (input: {
  intent: string;
  subintent: string;
  inquiry: string;
  context: Record<string, unknown>;
  handlerResult: unknown;
}) => {
  const generateChain = new LLMChain({ llm: model, prompt: generateDraftPrompt });
  const result = await generateChain.call({
    intent: input.intent,
    subintent: input.subintent,
    inquiry: input.inquiry,
    context: JSON.stringify(input.context),
    handlerResult: JSON.stringify(input.handlerResult),
  });
  return { draftResponse: result.text };
};
