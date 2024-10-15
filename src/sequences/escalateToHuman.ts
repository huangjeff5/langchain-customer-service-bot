import { createEscalation, getCustomerByEmail } from "../firestoreDb";

export async function escalateToHuman(inquiry: string, email: string, reason: string) {
    const customer = await getCustomerByEmail(email);
    if (!customer) {
      throw new Error('Customer not found');
    }
  
    const escalation = await createEscalation(
      customer.id,
      'Customer Inquiry Escalation',
      `Inquiry: ${inquiry}\n\nReason for escalation: ${reason}`,
      inquiry
    );
  
    return {
      message: "Your inquiry has been escalated to our customer service team. We'll get back to you as soon as possible.",
      escalationId: escalation.id
    };
  }