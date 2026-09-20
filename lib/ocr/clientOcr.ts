import { createWorker } from 'tesseract.js';
import { parseReceiptText } from './receiptParser';
import { ExtractedReceiptData } from '@/types/database';

let workerPromise: Promise<any> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * Runs OCR directly on the user's browser in < 2-4 seconds.
 */
export async function performClientOCR(imageBase64: string): Promise<ExtractedReceiptData> {
  try {
    const worker = await getWorker();
    const ret = await worker.recognize(imageBase64);
    const text = ret.data?.text || '';
    console.log('Client OCR recognized text:', text);
    if (text.trim().length > 5) {
      return parseReceiptText(text);
    }
    return parseReceiptText('');
  } catch (err) {
    console.error('Client OCR failed:', err);
    throw err;
  }
}
