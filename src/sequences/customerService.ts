import { RunnableSequence } from "@langchain/core/runnables";
import { classifyInquiry } from "./classifyInquiry";
import { augmentInfo } from "./augmentInfo";
import { executeHandler } from "./handlers";
import { generateDraft } from "./generateDraft";
import { escalateToHuman } from "./escalateToHuman";

export const customerService = RunnableSequence.from([
  async (input) => {
    const { intent, subintent } = await classifyInquiry.invoke({ inquiry: input.body });

    const augmentedData = await augmentInfo(
      intent,
      input.body,
      input.from,
    );

    let handlerResult;
    try {
      handlerResult = await executeHandler({
        intent,
        subintent,
        inquiry: input.body,
        context: {
          ...augmentedData,
          subject: input.subject,
          threadHistory: input.threadHistory,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('NoHandlerPromptError')) {
        const escalationResult = await escalateToHuman(
          input.body,
          input.from,
          // Add a third argument here, possibly a default value or another property from input
          input.subject || ''
        );
        return {
          intent,
          subintent,
          response: escalationResult.message,
          needsUserInput: false,
          nextAction: 'wait_for_human',
          escalated: true,
          escalationReason: 'No handler found',
        };
      } else {
        throw error;
      }
    }

    const responseResult = await generateDraft({
      intent,
      subintent,
      inquiry: input.body,
      context: {
        ...augmentedData,
        subject: input.subject,
        threadHistory: input.threadHistory,
      },
      handlerResult: handlerResult.data,
    });

    return {
      intent,
      subintent,
      response: responseResult.draftResponse,
      needsUserInput: handlerResult.needsUserInput ?? false,
      nextAction: handlerResult.nextAction,
      escalated: false,
    };
  },
  (output) => output
]);
