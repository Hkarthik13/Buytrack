import { NextRequest, NextResponse } from 'next/server';
import { Purchase } from '@/types/database';
import { calculateWarrantyMetrics } from '@/lib/calculations/warranty';
import { computeDashboardMetrics } from '@/lib/calculations/insights';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, purchases = [], currency = '₹' } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // Structured context summary for AI
    const purchaseList = purchases as Purchase[];
    const metrics = computeDashboardMetrics(purchaseList, currency);

    const contextData = purchaseList.map((p) => {
      let warrantyInfo = 'No warranty';
      if (p.has_warranty && p.warranty) {
        const w = calculateWarrantyMetrics(p.warranty.warranty_start_date, p.warranty.warranty_end_date);
        warrantyInfo = `${p.warranty.warranty_duration_months} months (${w.status}, expires ${p.warranty.warranty_end_date}, ${w.daysRemaining} days remaining)`;
      }

      let emiInfo = 'No EMI (Paid outright)';
      if (p.has_emi && p.emi_plan) {
        emiInfo = `Monthly ${currency}${p.emi_plan.monthly_emi} x ${p.emi_plan.number_of_installments} months (Paid: ${p.emi_plan.paid_installments}, Remaining: ${p.emi_plan.remaining_installments}, Next Due: ${p.emi_plan.next_due_date}, Completion: ${p.emi_plan.completion_date})`;
      }

      return {
        product: p.product_name,
        brand: p.brand,
        category: p.category,
        store: p.store,
        purchase_date: p.purchase_date,
        price: `${currency}${p.final_price}`,
        payment_method: p.payment_method,
        warranty: warrantyInfo,
        emi: emiInfo,
      };
    });

    if (apiKey) {
      try {
        const systemPrompt = `You are "Ask BuyTrack", the personal purchase intelligence assistant.
Answer the user's question accurately using ONLY the user's purchase database provided below.
If the question is in Tamil (தமிழ்), reply in fluent, polite Tamil with clear formatting.
If the question is in English or another language, reply in that language.
Be concise, helpful, and highlight numbers, dates, and actionable details.
Never make up purchases or dates not in the user's data.

USER'S CURRENT PURCHASES & FINANCIAL DATA:
${JSON.stringify({ summaryMetrics: metrics, purchases: contextData }, null, 2)}
`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: `User Question: ${trimmedQuestion}` },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 600,
              },
            }),
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer) {
            return NextResponse.json({
              success: true,
              answer: answer.trim(),
              source: 'gemini',
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini Assistant error, using grounded deterministic parser:', geminiErr);
      }
    }

    // Grounded deterministic multi-lingual NLP engine
    const qLower = trimmedQuestion.toLowerCase();
    let reply = '';

    // 1. TV EMI completion question: “என் TV EMI எப்போ முடியும்?” or "When will my TV EMI finish?"
    if (
      (qLower.includes('tv') || qLower.includes('television')) &&
      (qLower.includes('emi') || qLower.includes('முடியும்') || qLower.includes('finish') || qLower.includes('end') || qLower.includes('complete'))
    ) {
      const tv = purchaseList.find((p) => p.product_name.toLowerCase().includes('tv'));
      if (tv && tv.emi_plan) {
        if (qLower.includes('முடியும்') || qLower.includes('எப்போ') || qLower.includes('என்')) {
          reply = `📺 **${tv.product_name}** EMI விவரம்:\n\n` +
            `• உங்கள் TV EMI **${tv.emi_plan.completion_date}** அன்று நிறைவடையும்.\n` +
            `• மாதாந்திர தவணை: **${currency}${tv.emi_plan.monthly_emi.toLocaleString()}**\n` +
            `• செலுத்தப்பட்ட தவணைகள்: **${tv.emi_plan.paid_installments} / ${tv.emi_plan.number_of_installments}**\n` +
            `• மீதமுள்ள தவணைகள்: **${tv.emi_plan.remaining_installments}**\n` +
            `• அடுத்த தவணை தேதி: **${tv.emi_plan.next_due_date}**`;
        } else {
          reply = `📺 **${tv.product_name}** EMI Details:\n\n` +
            `• Your TV EMI will complete on **${tv.emi_plan.completion_date}**.\n` +
            `• Monthly installment: **${currency}${tv.emi_plan.monthly_emi.toLocaleString()}**\n` +
            `• Paid installments: **${tv.emi_plan.paid_installments} of ${tv.emi_plan.number_of_installments}**\n` +
            `• Remaining installments: **${tv.emi_plan.remaining_installments}**\n` +
            `• Next due date: **${tv.emi_plan.next_due_date}**`;
        }
      } else {
        reply = `I could not find an active EMI plan for a TV in your purchases.`;
      }
    }
    // 2. Upcoming EMI payments this month: “இந்த மாதம் என்ன EMI payments இருக்கு?” or "What EMI payments do I have this month?"
    else if (
      (qLower.includes('இந்த மாதம்') || qLower.includes('month') || qLower.includes('upcoming') || qLower.includes('next')) &&
      (qLower.includes('emi') || qLower.includes('payments') || qLower.includes('செலுத்த'))
    ) {
      const activeEmis = purchaseList.filter((p) => p.has_emi && p.emi_plan && p.emi_plan.remaining_installments > 0);
      if (activeEmis.length === 0) {
        reply = qLower.includes('இந்த மாதம்') 
          ? `இந்த மாதம் உங்களுக்கு செலுத்த வேண்டிய EMI தவணைகள் எதுவும் இல்லை! 🎉`
          : `You have no pending EMI installments for this period! 🎉`;
      } else {
        const isTamil = qLower.includes('இந்த மாதம்') || qLower.includes('இருக்');
        if (isTamil) {
          reply = `💳 **இந்த மாத EMI தவணைகள் (மொத்தம்: ${currency}${metrics.monthlyEmiCommitment.toLocaleString()}):**\n\n` +
            activeEmis.map((p) => `• **${p.product_name}**: ${currency}${p.emi_plan?.monthly_emi.toLocaleString()} (அடுத்த தேதி: ${p.emi_plan?.next_due_date}, மீதம் ${p.emi_plan?.remaining_installments} தவணைகள்)`).join('\n');
        } else {
          reply = `💳 **Active EMI Payments (Total Commitment: ${currency}${metrics.monthlyEmiCommitment.toLocaleString()}/month):**\n\n` +
            activeEmis.map((p) => `• **${p.product_name}**: ${currency}${p.emi_plan?.monthly_emi.toLocaleString()} (Next Due: ${p.emi_plan?.next_due_date}, ${p.emi_plan?.remaining_installments} remaining)`).join('\n');
        }
      }
    }
    // 3. Warranty expiring soon: “என்னோட warranty எது சீக்கிரம் expire ஆகுது?” or "Which warranty is expiring soon?"
    else if (
      qLower.includes('warranty') || qLower.includes('வாரண்டி') || qLower.includes('expire') || qLower.includes('சீக்கிரம்')
    ) {
      const expiringSoon = purchaseList
        .filter((p) => p.has_warranty && p.warranty)
        .map((p) => ({
          name: p.product_name,
          ...calculateWarrantyMetrics(p.warranty!.warranty_start_date, p.warranty!.warranty_end_date),
          endDate: p.warranty!.warranty_end_date,
        }))
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      const isTamil = qLower.includes('சீக்கிரம்') || qLower.includes('என்னோட') || qLower.includes('ஆகுது');

      if (expiringSoon.length === 0) {
        reply = isTamil
          ? `உங்களிடம் எந்த தயாரிப்புகளுக்கும் பதிவு செய்யப்பட்ட warranty இல்லை.`
          : `You have no registered warranties in your purchases.`;
      } else {
        const earliest = expiringSoon[0];
        if (isTamil) {
          reply = `🛡️ **விரைவில் முடிவடையும் Warranty:**\n\n` +
            `• **${earliest.name}** warranty **${earliest.daysRemaining} நாட்களில் (${earliest.endDate})** நிறைவடைகிறது! (${earliest.status})\n\n` +
            `மற்றவை:\n` +
            expiringSoon.slice(1, 4).map((w) => `• ${w.name}: ${w.daysRemaining} நாட்கள் மீதம் (${w.status})`).join('\n');
        } else {
          reply = `🛡️ **Warranty Status Overview:**\n\n` +
            `• **${earliest.name}** expires earliest in **${earliest.daysRemaining} days** on **${earliest.endDate}** (${earliest.status}).\n\n` +
            `Other items:\n` +
            expiringSoon.slice(1, 4).map((w) => `• ${w.name}: ${w.daysRemaining} days remaining (${w.status})`).join('\n');
        }
      }
    }
    // 4. Electronics spend last 6 months: “Last 6 months நான் electronics-க்கு எவ்வளவு செலவு பண்ணிருக்கேன்?” or "How much spent on electronics?"
    else if (
      (qLower.includes('electronics') || qLower.includes('செலவு') || qLower.includes('spend') || qLower.includes('spent') || qLower.includes('expense'))
    ) {
      const electSpend = metrics.categorySpending['Electronics'] || 0;
      const isTamil = qLower.includes('செலவு') || qLower.includes('பண்ணி');
      if (isTamil) {
        reply = `📊 **Electronics செலவு விவரம்:**\n\n` +
          `நீங்கள் Electronics பிரிவில் இதுவரை **${currency}${electSpend.toLocaleString()}** செலவு செய்துள்ளீர்கள். ` +
          `(இது உங்கள் மொத்த செலவில் சுமார் ${metrics.totalPurchasesAmount > 0 ? Math.round((electSpend / metrics.totalPurchasesAmount) * 100) : 0}% ஆகும்).`;
      } else {
        reply = `📊 **Electronics Spending Breakdown:**\n\n` +
          `You have spent **${currency}${electSpend.toLocaleString()}** on Electronics across your registered purchases ` +
          `(representing ${metrics.totalPurchasesAmount > 0 ? Math.round((electSpend / metrics.totalPurchasesAmount) * 100) : 0}% of your total ${currency}${metrics.totalPurchasesAmount.toLocaleString()} tracked spending).`;
      }
    }
    // 5. Active EMIs count: “என்னிடம் எத்தனை active EMIs இருக்கு?” or "How many active EMIs do I have?"
    else if (
      qLower.includes('active emi') || qLower.includes('எத்தனை') || qLower.includes('how many emi')
    ) {
      const isTamil = qLower.includes('எத்தனை') || qLower.includes('இருக்');
      if (isTamil) {
        reply = `💳 உங்களிடம் தற்போது **${metrics.activeEmiCount} Active EMI Plans** உள்ளன.\n` +
          `மாதாந்திர தவணை சுமை: **${currency}${metrics.monthlyEmiCommitment.toLocaleString()} / மாதம்**.`;
      } else {
        reply = `💳 You currently have **${metrics.activeEmiCount} Active EMI Plans** with a combined monthly payment of **${currency}${metrics.monthlyEmiCommitment.toLocaleString()} / month**.`;
      }
    }
    // Generic summary fallback
    else {
      reply = `Here is a summary of your BuyTrack database:\n\n` +
        `• Total Tracked Purchases: **${purchaseList.length} items (${currency}${metrics.totalPurchasesAmount.toLocaleString()})**\n` +
        `• Active EMIs: **${metrics.activeEmiCount} (${currency}${metrics.monthlyEmiCommitment.toLocaleString()}/mo)**\n` +
        `• Warranties: **${metrics.activeWarrantyCount} Active, ${metrics.warrantyExpiringSoonCount} Expiring Soon**\n\n` +
        `You can ask me specific questions like:\n` +
        `- "When will my TV EMI finish?" (என் TV EMI எப்போ முடியும்?)\n` +
        `- "What are my upcoming EMI payments?"\n` +
        `- "Which warranty expires soon?"`;
    }

    return NextResponse.json({
      success: true,
      answer: reply,
      source: 'buytrack-nlp-engine',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Assistant request failed' },
      { status: 500 }
    );
  }
}
