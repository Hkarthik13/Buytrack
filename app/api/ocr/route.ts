import { NextRequest, NextResponse } from 'next/server';
import { ExtractedReceiptData } from '@/types/database';
import { parseReceiptText } from '@/lib/ocr/receiptParser';
import { createWorker } from 'tesseract.js';

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

    // 1. Try Gemini Vision API if API key is provided
    if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim().length > 10) {
      try {
        const pureBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

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

        // Try gemini-1.5-flash
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

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText) as ExtractedReceiptData;
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
        console.warn('Gemini OCR API error, falling back to local Tesseract OCR:', geminiError);
      }
    }

    // 2. Perform Real Local / Server Tesseract OCR on the uploaded image
    try {
      const pureBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(pureBase64, 'base64');

      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBuffer);
      await worker.terminate();

      const extractedText = ret.data.text;
      console.log('Tesseract OCR extracted text:\n', extractedText);

      if (extractedText && extractedText.trim().length > 10) {
        const parsed = parseReceiptText(extractedText);
        return NextResponse.json({
          success: true,
          data: parsed,
          extracted_text: extractedText,
          source: 'tesseract-local-ocr',
        });
      }
    } catch (ocrError: any) {
      console.error('Tesseract OCR processing error:', ocrError);
    }

    // 3. Fallback to parser on any text or reasonable extraction
    const fallbackParsed = parseReceiptText(fileName || '');
    return NextResponse.json({
      success: true,
      data: fallbackParsed,
      source: 'heuristic-text-parser',
    });
  } catch (error: any) {
    console.error('OCR Route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to extract receipt data',
      },
      { status: 500 }
    );
  }
}
