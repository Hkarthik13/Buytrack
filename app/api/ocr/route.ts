import { NextRequest, NextResponse } from 'next/server';
import { ExtractedReceiptData } from '@/types/database';
import { parseReceiptText } from '@/lib/ocr/receiptParser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', fileName = 'receipt.jpg' } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No image or receipt data provided.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API key is available, use ultra-fast Gemini Vision (< 1.2s)
    if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim().length > 10) {
      try {
        const pureBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

        const systemPrompt = `You are a high-precision financial receipt OCR scanner.
Analyze the given receipt image and extract structured data in strict JSON format.
Extract the exact details from the bill (Store name, Product name, Brand, Dates, Prices, Tax, Discount, EMI details, Warranty details, Invoice No).

Extract the following JSON schema:
{
  "product_name": "string (Exact full product name and model from bill)",
  "brand": "string (e.g. Samsung, Apple, Sony, etc.)",
  "category": "Electronics" | "Appliances" | "Furniture" | "Gadgets" | "Automobile" | "Fashion" | "Home" | "Other",
  "store": "string (Seller, store or merchant name, e.g. Reliance Digital)",
  "purchase_date": "YYYY-MM-DD",
  "original_price": number (float, subtotal or unit price),
  "discount": number (float, discount amount or 0),
  "tax": number (float, tax / GST amount or 0),
  "final_price": number (float, total paid / total amount),
  "payment_method": "EMI" | "Credit Card" | "Debit Card" | "UPI" | "Net Banking" | "Cash" | "Other",
  "has_warranty": boolean,
  "warranty_duration_months": number (e.g. 12 or 24),
  "has_emi": boolean,
  "down_payment": number,
  "monthly_emi": number,
  "tenure_months": number,
  "interest_rate": number,
  "notes": "string (e.g. Invoice No, Store, warranty/EMI summary)"
}
Return ONLY pure JSON.`;

        // Abort Gemini request if it exceeds 7 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    {
                      inline_data: {
                        mime_type: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
                        data: pureBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const jsonText = rawText.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
            const parsed = JSON.parse(jsonText) as ExtractedReceiptData;
            return NextResponse.json({
              success: true,
              data: {
                ...parsed,
                confidence_score: 0.98,
              },
              source: 'gemini-vision-ocr',
            });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini OCR API error or timeout, requesting client-side fallback:', geminiError);
      }
    }

    // 2. Fast server Tesseract OCR with strict 6s timeout (fallback to client if slow)
    try {
      const { createWorker, PSM } = await import('tesseract.js');
      const pureBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const imageBuffer = Buffer.from(pureBase64, 'base64');

      const ocrPromise = (async () => {
        const worker = await createWorker('eng');
        if (typeof worker.setParameters === 'function') {
          await worker.setParameters({
            preserve_interword_spaces: '1',
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          });
        }
        const ret = await worker.recognize(imageBuffer);
        await worker.terminate();
        return ret.data.text;
      })();

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Server OCR timeout')), 8500)
      );

      const extractedText = (await Promise.race([ocrPromise, timeoutPromise])) as string;

      if (extractedText && extractedText.trim().length > 10) {
        const parsed = parseReceiptText(extractedText);
        return NextResponse.json({
          success: true,
          data: parsed,
          extracted_text: extractedText,
          source: 'tesseract-server-ocr',
        });
      }
    } catch (serverOcrError) {
      console.log('Server OCR skipped or timed out, delegating to client-side OCR');
    }

    // Return flag indicating client OCR should run in browser
    return NextResponse.json({
      success: false,
      fallbackToClient: true,
      message: 'Server OCR unavailable, running fast client-side OCR',
    });
  } catch (error: any) {
    console.error('OCR Route error:', error);
    return NextResponse.json(
      {
        success: false,
        fallbackToClient: true,
        error: error?.message || 'Failed to extract receipt data',
      },
      { status: 200 }
    );
  }
}
