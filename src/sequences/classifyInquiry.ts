import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

const model = new ChatOpenAI({ modelName: "gpt-4-turbo" });

const classifyInquiryPrompt = PromptTemplate.fromTemplate(`
Classify the following customer inquiry into one of these intent/subintent pairs:
- Catalog/GeneralQuestion
- Catalog/ProductAvailability
- Product/GeneralQuestion
- Product/StockAvailability
- Product/PriceInquiry
- Order/GeneralQuestion
- Order/TrackingStatus
- Order/CancellationRequest
- Returns/ProcessInquiry
- Returns/RefundStatus
- Shipping/DeliveryTimeframe
- Shipping/CostInquiry
- Account/LoginIssue
- Account/UpdateInformation
- Payment/MethodInquiry
- Payment/TransactionIssue
- Warranty/CoverageInquiry
- Warranty/ClaimProcess
- Feedback/ProductReview
- Feedback/CustomerService
- Other/Other

Customer inquiry: {inquiry}

Classification:`);

const classificationSchema = z.object({
  intent: z.enum([
    "Catalog", "Product", "Order", "Returns", "Shipping",
    "Account", "Payment", "Warranty", "Feedback", "Other"
  ]),
  subintent: z.enum([
    "GeneralQuestion", "ProductAvailability", "StockAvailability",
    "PriceInquiry", "TrackingStatus", "CancellationRequest",
    "ProcessInquiry", "RefundStatus", "DeliveryTimeframe",
    "CostInquiry", "LoginIssue", "UpdateInformation",
    "MethodInquiry", "TransactionIssue", "CoverageInquiry",
    "ClaimProcess", "ProductReview", "CustomerService", "Other"
  ]),
});

const structuredLlm = model.withStructuredOutput(classificationSchema);

export const classifyInquiry = RunnableSequence.from([
  classifyInquiryPrompt,
  structuredLlm,
]);
// Usage:
// const result = await classifyInquiry.invoke({ inquiry: "Your inquiry here" });
