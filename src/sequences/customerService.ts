import { RunnableSequence } from "@langchain/core/runnables";
import { classifyInquiry } from "./classifyInquiry";
import { augmentInfo } from "./augmentInfo";
import { executeHandler } from "./handlers";
import { generateDraft } from "./generateDraft";
import { escalateToHuman } from "./escalateToHuman";

export const customerService = RunnableSequence.from([
  async (input) => {
    console.log('Input received:', input);

    try {
      const { intent, subintent } = await classifyInquiry.invoke({ inquiry: input.body });
      console.log('Classified intent:', intent, 'subintent:', subintent);

      const augmentedData = await augmentInfo(
        intent,
        input.body,
        input.from,
      );
      console.log('Augmented data:', augmentedData);

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
        console.log('Handler result:', handlerResult);
      } catch (error) {
        console.error('Error in executeHandler:', error);
        if (error instanceof Error && error.message.startsWith('NoHandlerPromptError')) {
          const escalationResult = await escalateToHuman(
            input.body,
            input.from,
            input.subject || ''
          );
          console.log('Escalation result:', escalationResult);
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
      console.log('Generated draft:', responseResult);

      return {
        intent,
        subintent,
        response: responseResult.draftResponse,
        needsUserInput: handlerResult.needsUserInput ?? false,
        nextAction: handlerResult.nextAction,
        escalated: false,
      };
    } catch (error) {
      console.error('Error in customerService sequence:', error);
      throw error;
    }
  },
  (output) => output
]);
