import { ExtractedReceiptData, ProductCategory, PaymentMethod } from '@/types/database';

/**
 * Deterministic & intelligent parser that converts raw OCR text into structured ExtractedReceiptData
 */
export function parseReceiptText(text: string): ExtractedReceiptData {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Store / Merchant Name
  let store: string | undefined = undefined;
  const knownStores = [
    'Reliance Digital',
    'Croma',
    'Vijay Sales',
    'Amazon',
    'Flipkart',
    'Apple Store',
    'Imagine',
    'Poorvika',
    'Sangeetha',
    'Girias',
    'Pai International',
    'Tata Cliq',
    'IKEA',
    'Dyson',
    'Samsung Smart Plaza',
    'Sony Center',
    'Unilet',
  ];

  for (const s of knownStores) {
    if (new RegExp(s, 'i').test(text)) {
      store = s;
      break;
    }
  }

  if (!store && lines.length > 0) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (
        !line.match(/invoice|tax|receipt|bill|gst|date|tel|phone|ph:|welcome|order/i) &&
        line.length > 2 &&
        line.length < 40
      ) {
        store = line;
        break;
      }
    }
  }

  // 2. Brand Detection
  let brand: string | undefined = undefined;
  const knownBrands = [
    'Samsung',
    'Apple',
    'Sony',
    'LG',
    'Dell',
    'HP',
    'Lenovo',
    'Asus',
    'OnePlus',
    'Xiaomi',
    'Realme',
    'Bose',
    'JBL',
    'Boat',
    'Dyson',
    'Whirlpool',
    'Voltas',
    'Daikin',
    'Havells',
    'Philips',
    'Panasonic',
    'Haier',
    'Godrej',
    'Bosch',
    'IFB',
    'Sennheiser',
    'Canon',
    'Nikon',
    'Acer',
    'Marshall',
    'Mi',
    'Poco',
    'Vivo',
    'Oppo',
    'Motorola',
    'Nothing',
  ];

  // Match "Brand: Samsung" specifically on a single line
  const brandMatch = text.match(/brand\s*[:\-]\s*([^\r\n,]+)/i);
  if (brandMatch && brandMatch[1].trim()) {
    brand = brandMatch[1].trim();
  } else {
    for (const b of knownBrands) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
        brand = b;
        break;
      }
    }
  }

  // 3. Product Name & Model Detection
  let productName: string | undefined = undefined;
  let modelNumber: string | undefined = undefined;

  const modelMatch = text.match(/model\s*[:\-]\s*([a-zA-Z0-9\-_]+)/i);
  if (modelMatch && modelMatch[1]) {
    modelNumber = modelMatch[1].trim();
  }

  // Search under Item Details table
  const itemHeaderIndex = lines.findIndex((l) =>
    /item\s*details|description|particulars|product\s*name|item\s*name/i.test(l)
  );

  if (itemHeaderIndex !== -1 && itemHeaderIndex + 1 < lines.length) {
    const candidateParts: string[] = [];
    for (let j = itemHeaderIndex + 1; j < Math.min(itemHeaderIndex + 5, lines.length); j++) {
      const line = lines[j];
      if (/subtotal|discount|tax|total|amount|payment|terms|invoice|hsn/i.test(line)) break;
      if (/^brand\s*:/i.test(line) || /^model\s*:/i.test(line)) continue;

      // Clean line: remove leading "# 1", "1 ", strip trailing numbers / amounts
      let cleaned = line
        .replace(/^[#0-9\.\-\s]+/, '')
        .replace(/\s+\d+\s+[₹Rs\d\.,\s]+$/, '')
        .replace(/[₹Rs].*$/, '')
        .trim();

      if (cleaned.length > 2 && !/qty|unit price|total price|item details/i.test(cleaned)) {
        candidateParts.push(cleaned);
      }
    }

    if (candidateParts.length > 0) {
      productName = candidateParts.join(' ');
    }
  }

  // If still not found, check product keyword lines
  if (!productName) {
    const productKeywords = [
      'TV',
      'LED',
      'OLED',
      'QLED',
      'Smart TV',
      'MacBook',
      'iPhone',
      'iPad',
      'Laptop',
      'Refrigerator',
      'Washing Machine',
      'Microwave',
      'Air Conditioner',
      'AC',
      'Headphones',
      'Earbuds',
      'Watch',
      'Camera',
      'Vacuum',
      'Purifier',
      'Monitor',
      'Speaker',
      'Soundbar',
    ];

    for (const line of lines) {
      if (productKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(line))) {
        if (!/total|subtotal|tax|warranty|payment|terms|thank|cashier|invoice|phone/i.test(line)) {
          productName = line
            .replace(/^[#0-9\.\-\s]+/, '')
            .replace(/\s+\d+\s+[₹Rs\d\.,\s]+$/, '')
            .replace(/[₹Rs].*$/, '')
            .trim();
          break;
        }
      }
    }
  }

  // Append model number if not present in product name
  if (modelNumber && productName && !productName.includes(modelNumber)) {
    productName = `${productName} (${modelNumber})`;
  }

  // 4. Category Classification
  let category: ProductCategory = 'Electronics';
  const categoryMap: { [key in ProductCategory]?: RegExp } = {
    Appliances: /refrigerator|fridge|washing machine|dryer|microwave|oven|air conditioner|\bac\b|dishwasher|vacuum|water purifier|geyser/i,
    Electronics: /tv|television|smart tv|led|oled|laptop|macbook|computer|pc|desktop|monitor|soundbar|home theatre/i,
    Gadgets: /iphone|smartphone|mobile|phone|tablet|ipad|headphone|earbuds|smartwatch|watch|fitness band|camera|gimbal|powerbank/i,
    Furniture: /sofa|table|chair|desk|bed|mattress|wardrobe|cabinet|bookshelf|couch/i,
    Automobile: /car|bike|motorcycle|scooter|helmet|tyre|battery|dashcam/i,
    Fashion: /shirt|t-shirt|pant|jeans|dress|shoes|sneakers|jacket|bag|handbag|sunglasses/i,
    Home: /blender|mixer|grinder|cooker|kettle|toaster|iron|fan|light|curtain/i,
  };

  const combinedSearchText = `${productName || ''} ${text}`;
  for (const [cat, regex] of Object.entries(categoryMap)) {
    if (regex && regex.test(combinedSearchText)) {
      category = cat as ProductCategory;
      break;
    }
  }

  // 5. Purchase Date
  let purchaseDate: string | undefined = undefined;
  const dateRegexes = [
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i,
    /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/,
    /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/,
  ];

  for (const regex of dateRegexes) {
    const match = text.match(regex);
    if (match) {
      try {
        const parsedDate = new Date(match[0]);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          purchaseDate = `${year}-${month}-${day}`;
          break;
        }
      } catch (_) {}
    }
  }

  if (!purchaseDate) {
    purchaseDate = new Date().toISOString().split('T')[0];
  }

  // Helper for numeric amounts
  const extractAmount = (regex: RegExp): number | null => {
    const match = text.match(regex);
    if (match && match[1]) {
      const numStr = match[1].replace(/,/g, '').trim();
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // 6. Financial breakdown
  const totalAmount =
    extractAmount(/(?:total\s*amount|grand\s*total|net\s*amount|amount\s*payable|total\s*payable|total\s*paid|invoice\s*total)\s*[:\-]?\s*[₹Rs\.\s]*([\d,]+(?:\.\d{2})?)/i) ||
    extractAmount(/(?:total|amount)\s*[:\-]?\s*[₹Rs\.\s]*([\d,]+(?:\.\d{2})?)/i);

  const subtotal =
    extractAmount(/(?:sub\s*total|subtotal|item\s*total|unit\s*price)\s*[:\-]?\s*[₹Rs\.\s]*([\d,]+(?:\.\d{2})?)/i);

  const discount =
    extractAmount(/(?:discount|savings|offer)\s*[:\-]?\s*[-]?\s*[₹Rs\.\s]*([\d,]+(?:\.\d{2})?)/i) || 0;

  const tax =
    extractAmount(/(?:tax|gst|cgst\s*\+\s*sgst|vat)\s*(?:\([^)]*\))?\s*[:\-]?\s*[₹Rs\.\s]*([\d,]+(?:\.\d{2})?)/i) || 0;

  const finalPrice = totalAmount || subtotal || 0;
  const originalPrice = subtotal || (finalPrice > 0 ? finalPrice + discount - tax : finalPrice);

  // 7. Payment Method
  let paymentMethod: PaymentMethod = 'Other';
  if (/emi|installment|finance/i.test(text)) {
    paymentMethod = 'EMI';
  } else if (/credit\s*card/i.test(text)) {
    paymentMethod = 'Credit Card';
  } else if (/debit\s*card/i.test(text)) {
    paymentMethod = 'Debit Card';
  } else if (/upi|gpay|phonepe|paytm|bhim/i.test(text)) {
    paymentMethod = 'UPI';
  } else if (/net\s*banking/i.test(text)) {
    paymentMethod = 'Net Banking';
  } else if (/cash/i.test(text)) {
    paymentMethod = 'Cash';
  }

  // 8. EMI Details
  const hasEmi =
    paymentMethod === 'EMI' ||
    /emi\s*details|loan\s*amount|monthly\s*emi|tenure/i.test(text);

  let downPayment = 0;
  let monthlyEmi = 0;
  let tenureMonths = 0;
  let interestRate = 0;

  if (hasEmi) {
    paymentMethod = 'EMI';
    downPayment =
      extractAmount(/(?:down\s*payment|initial\s*payment|margin\s*money)\s*[:\-]?\s*[₹Rs\.\s]*([\d,]+(?:\.\d{2})?)/i) || 0;

    monthlyEmi =
      extractAmount(/(?:monthly\s*emi|emi\s*amount|installment\s*amount|per\s*month)\s*[:\-]?\s*[₹Rs\.\s]*([\d,]+(?:\.\d{2})?)/i) || 0;

    const tenureMatch = text.match(/(?:tenure|months|duration|installments)\s*[:\-]?\s*(\d+)\s*(?:months|mo|m)?/i);
    if (tenureMatch && tenureMatch[1]) {
      tenureMonths = parseInt(tenureMatch[1], 10);
    }

    const rateMatch = text.match(/(?:interest\s*rate|rate\s*of\s*interest|roi)\s*[:\-]?\s*([\d\.]+)\s*%/i);
    if (rateMatch && rateMatch[1]) {
      interestRate = parseFloat(rateMatch[1]);
    }

    if (tenureMonths === 0 && monthlyEmi > 0 && finalPrice > downPayment) {
      tenureMonths = Math.round((finalPrice - downPayment) / monthlyEmi);
    }
  }

  // 9. Warranty Information
  let hasWarranty = false;
  let warrantyDurationMonths = 12;

  const warrantyMatch = text.match(
    /(?:warranty\s*(?:period|duration|cover)?|guarantee)\s*[:\-]?\s*(\d+)\s*(year|yr|month|m|mo)/i
  );

  if (warrantyMatch) {
    hasWarranty = true;
    const val = parseInt(warrantyMatch[1], 10);
    const unit = warrantyMatch[2].toLowerCase();
    if (unit.startsWith('y')) {
      warrantyDurationMonths = val * 12;
    } else {
      warrantyDurationMonths = val;
    }
  } else if (/warranty|guarantee/i.test(text)) {
    hasWarranty = true;
    warrantyDurationMonths = 12;
  }

  // 10. Invoice No / Notes
  let invoiceNo = '';
  const invMatch = text.match(/(?:invoice\s*no|inv\s*no|bill\s*no|receipt\s*no|order\s*id)\s*[:\-]?\s*([a-zA-Z0-9\-_]+)/i);
  if (invMatch && invMatch[1]) {
    invoiceNo = invMatch[1].trim();
  }

  const notes = [
    invoiceNo ? `Invoice No: ${invoiceNo}` : '',
    store ? `Store: ${store}` : '',
    hasWarranty ? `Warranty: ${warrantyDurationMonths} Months` : '',
    hasEmi ? `EMI Plan: ${tenureMonths} Months (₹${monthlyEmi}/mo)` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    product_name: productName || (brand ? `${brand} Product` : 'Purchased Item'),
    brand: brand || store || 'Unknown Brand',
    category,
    store: store || 'Retail Store',
    purchase_date: purchaseDate,
    original_price: originalPrice || finalPrice,
    discount,
    tax,
    final_price: finalPrice,
    payment_method: paymentMethod,
    has_warranty: hasWarranty,
    warranty_duration_months: warrantyDurationMonths,
    has_emi: hasEmi,
    down_payment: downPayment,
    monthly_emi: monthlyEmi,
    tenure_months: tenureMonths || (hasEmi ? 10 : 0),
    interest_rate: interestRate,
    notes: notes || 'Receipt successfully processed via OCR.',
    confidence_score: 0.95,
  };
}
