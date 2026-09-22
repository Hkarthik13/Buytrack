import { ExtractedReceiptData, PaymentMethod, ProductCategory } from '@/types/database';

const KNOWN_STORES = [
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
  'Big Bazaar',
  'D Mart',
  'DMart',
  'Myntra',
  'Ajio',
  'Reliance Retail',
  'Bajaj Electronics',
  'Pai Mobiles',
  'Lot Mobiles',
];

const KNOWN_BRANDS = [
  'Samsung',
  'Apple',
  'Sony',
  'LG',
  'Dell',
  'HP',
  'Lenovo',
  'Asus',
  'Acer',
  'OnePlus',
  'Xiaomi',
  'Realme',
  'Redmi',
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
  'Marshall',
  'Mi',
  'Poco',
  'Vivo',
  'Oppo',
  'Motorola',
  'Nothing',
  'Google',
  'Microsoft',
  'Noise',
  'Fire-Boltt',
  'Prestige',
  'Butterfly',
  'Bajaj',
  'Kent',
  'Livpure',
  'Blue Star',
];

const PRODUCT_KEYWORDS = [
  'tv',
  'television',
  'led',
  'oled',
  'qled',
  'uhd',
  '4k',
  'macbook',
  'iphone',
  'ipad',
  'laptop',
  'notebook',
  'refrigerator',
  'fridge',
  'washing machine',
  'microwave',
  'air conditioner',
  'headphones',
  'earbuds',
  'watch',
  'camera',
  'vacuum',
  'purifier',
  'monitor',
  'speaker',
  'soundbar',
  'mobile',
  'smartphone',
  'tablet',
  'printer',
  'router',
  'mixer',
  'grinder',
];

const CATEGORY_MAP: { [key in ProductCategory]?: RegExp } = {
  Appliances:
    /refrigerator|fridge|washing machine|dryer|microwave|oven|air conditioner|\bac\b|dishwasher|vacuum|water purifier|geyser|cooler/i,
  Electronics:
    /tv|television|smart tv|led|oled|qled|uhd|laptop|macbook|computer|pc|desktop|monitor|soundbar|home theatre|printer|router/i,
  Gadgets:
    /iphone|smartphone|mobile|phone|tablet|ipad|headphone|earbuds|smartwatch|watch|fitness band|camera|gimbal|powerbank/i,
  Furniture: /sofa|table|chair|desk|bed|mattress|wardrobe|cabinet|bookshelf|couch/i,
  Automobile: /car|bike|motorcycle|scooter|helmet|tyre|battery|dashcam/i,
  Fashion: /shirt|t-shirt|pant|jeans|dress|shoes|sneakers|jacket|bag|handbag|sunglasses/i,
  Home: /blender|mixer|grinder|cooker|kettle|toaster|iron|fan|light|curtain/i,
};

const STOP_LINE_REGEX =
  /subtotal|sub total|discount|tax|gst|cgst|sgst|igst|total|amount|payment|terms|invoice|hsn|customer|emi|warranty|cashier|card|upi|transaction/i;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeOcrText(text: string) {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[|]/g, ' ')
    .replace(/[\u20b9]/g, 'Rs ')
    .replace(/[\u2022]/g, ' ')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\r/g, '\n');
}

function getLines(text: string) {
  return normalizeOcrText(text)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function cleanCandidateLine(line: string) {
  return line
    .replace(/^[#*\-.\s]*(?:s\.?\s*no\.?|sl\.?\s*no\.?)?\s*/i, '')
    .replace(/^\d{1,3}\s*[).:-]?\s*/, '')
    .replace(/\b(?:qty|quantity)\b\s*[:x-]?\s*\d+(?:\.\d+)?/gi, '')
    .replace(/\b(?:hsn|sac)\b\s*[:#-]?\s*[a-z0-9-]+/gi, '')
    .replace(/\b(?:sku|serial|sr\.?\s*no)\b\s*[:#-]?\s*[a-z0-9-]+/gi, '')
    .replace(/\s+(?:rs\.?|inr|mrp|amt|amount)?\s*[-+]?\d[\d,]*(?:\.\d{1,2})?\s*$/i, '')
    .replace(/\s+\d+\s+[-+]?(?:rs\.?|inr)?\s*\d[\d,]*(?:\.\d{1,2})?(?:\s+[-+]?(?:rs\.?|inr)?\s*\d[\d,]*(?:\.\d{1,2})?)?$/i, '')
    .replace(/[^\w\s"'()+./-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseAmount(raw: string) {
  const cleaned = raw
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .replace(/[\u20b9$]/g, '')
    .replace(/\b(?:rs|inr|mrp|amt)\b\.?/gi, '')
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '');

  const amount = Number.parseFloat(cleaned);
  return Number.isFinite(amount) ? Math.abs(amount) : null;
}

function amountsInLine(line: string) {
  const matches = line.match(
    /(?:rs\.?|inr|mrp|\u20b9)?\s*[-+]?\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|(?:rs\.?|inr|mrp|\u20b9)?\s*[-+]?\d{4,}(?:\.\d{1,2})?/gi
  );
  return (matches || [])
    .map(parseAmount)
    .filter((amount): amount is number => amount !== null && amount > 0);
}

function findAmountNearLabels(lines: string[], labels: RegExp[], blockAfter?: RegExp) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!labels.some((label) => label.test(line))) continue;

    const sameLineAmounts = amountsInLine(line).filter((amount) => amount >= 1);
    if (sameLineAmounts.length) return sameLineAmounts[sameLineAmounts.length - 1];

    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      if (blockAfter?.test(lines[j])) break;
      const nextLineAmounts = amountsInLine(lines[j]).filter((amount) => amount >= 1);
      if (nextLineAmounts.length) return nextLineAmounts[nextLineAmounts.length - 1];
    }
  }

  return null;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateToIso(text: string) {
  const normalized = normalizeOcrText(text);
  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    sept: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const dayMonthMatch = normalized.match(/\b(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{2,4})\b/i);
  if (dayMonthMatch) {
    const day = Number.parseInt(dayMonthMatch[1], 10);
    const monthKey = dayMonthMatch[2].slice(0, 4).toLowerCase();
    const month = months[monthKey] ?? months[monthKey.slice(0, 3)];
    const yearRaw = Number.parseInt(dayMonthMatch[3], 10);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (month !== undefined && day >= 1 && day <= 31) return toIsoDate(new Date(Date.UTC(year, month, day)));
  }

  const monthDayMatch = normalized.match(/\b([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{2,4})\b/i);
  if (monthDayMatch) {
    const day = Number.parseInt(monthDayMatch[2], 10);
    const monthKey = monthDayMatch[1].slice(0, 4).toLowerCase();
    const month = months[monthKey] ?? months[monthKey.slice(0, 3)];
    const yearRaw = Number.parseInt(monthDayMatch[3], 10);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (month !== undefined && day >= 1 && day <= 31) return toIsoDate(new Date(Date.UTC(year, month, day)));
  }

  const ymdMatch = normalized.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (ymdMatch) {
    const year = Number.parseInt(ymdMatch[1], 10);
    const month = Number.parseInt(ymdMatch[2], 10) - 1;
    const day = Number.parseInt(ymdMatch[3], 10);
    if (year >= 2000 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return toIsoDate(new Date(Date.UTC(year, month, day)));
    }
  }

  const dmyMatch = normalized.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (dmyMatch) {
    const first = Number.parseInt(dmyMatch[1], 10);
    const second = Number.parseInt(dmyMatch[2], 10);
    const rawYear = Number.parseInt(dmyMatch[3], 10);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second - 1 : second > 12 ? first - 1 : second - 1;
    if (year >= 2000 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return toIsoDate(new Date(Date.UTC(year, month, day)));
    }
  }

  return undefined;
}

function extractAfterLabel(text: string, label: RegExp) {
  const match = text.match(label);
  return match?.[1]?.trim();
}

function detectStore(lines: string[], text: string) {
  for (const store of KNOWN_STORES) {
    if (new RegExp(`\\b${escapeRegex(store)}\\b`, 'i').test(text)) return store;
  }

  const labelledStore = extractAfterLabel(
    text,
    /(?:seller|merchant|store|sold\s*by|supplier|retailer)\s*(?:name)?\s*[:#-]\s*([^\n,]{3,60})/i
  );
  if (labelledStore && !/address|date|time|phone|gst|invoice/i.test(labelledStore)) {
    return cleanCandidateLine(labelledStore);
  }

  for (const line of lines.slice(0, 8)) {
    const cleaned = cleanCandidateLine(line);
    if (
      cleaned.length >= 3 &&
      cleaned.length <= 55 &&
      !/invoice|tax|receipt|bill|gst|date|tel|phone|ph|welcome|order|customer|address|email|cin|pan/i.test(cleaned) &&
      !amountsInLine(cleaned).length
    ) {
      return cleaned;
    }
  }

  return undefined;
}

function detectBrand(text: string) {
  const brandFromLabel = extractAfterLabel(text, /(?:brand|make|manufacturer)\s*[:#-]\s*([^\n,|]{2,40})/i);
  if (brandFromLabel) return cleanCandidateLine(brandFromLabel);

  for (const brand of KNOWN_BRANDS) {
    if (new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i').test(text)) return brand;
  }

  return undefined;
}

function detectModel(text: string) {
  return extractAfterLabel(text, /(?:model|model\s*no|item\s*code|product\s*code)\s*[:#-]\s*([a-z0-9][a-z0-9_./-]{2,30})/i);
}

function scoreProductLine(line: string, brand?: string) {
  const lower = line.toLowerCase();
  let score = 0;
  if (brand && new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i').test(line)) score += 4;
  if (PRODUCT_KEYWORDS.some((keyword) => lower.includes(keyword))) score += 3;
  if (/[a-z]{2,}[-/\s]?\d{2,}/i.test(line)) score += 2;
  if (/\d{2,}\s?(?:inch|"|gb|tb|ltr|l|kg|w|mah|ton)\b/i.test(line)) score += 2;
  if (amountsInLine(line).length) score += 1;
  if (STOP_LINE_REGEX.test(line)) score -= 6;
  if (/address|phone|email|gstin|cin|pan|thank|cashier|transaction/i.test(line)) score -= 5;
  if (line.length < 5 || line.length > 110) score -= 3;
  return score;
}

function appendModel(productName: string, model?: string) {
  if (!model || new RegExp(`\\b${escapeRegex(model)}\\b`, 'i').test(productName)) return productName;
  return `${productName} (${model})`;
}

function detectProductName(lines: string[], text: string, brand?: string, model?: string) {
  const labelled = extractAfterLabel(
    text,
    /(?:product\s*name|item\s*name|description|particulars)\s*[:#-]\s*([^\n]{4,100})/i
  );
  if (labelled) {
    const cleaned = cleanCandidateLine(labelled);
    if (cleaned.length > 3 && !STOP_LINE_REGEX.test(cleaned)) return appendModel(cleaned, model);
  }

  const itemHeaderIndex = lines.findIndex((line) =>
    /item\s*details|description|particulars|product\s*name|item\s*name|item\s+description/i.test(line)
  );

  if (itemHeaderIndex !== -1) {
    const parts: string[] = [];
    for (let i = itemHeaderIndex + 1; i < Math.min(itemHeaderIndex + 8, lines.length); i++) {
      const line = lines[i];
      if (STOP_LINE_REGEX.test(line)) break;
      if (/^brand\s*[:#-]/i.test(line) || /^model\s*[:#-]/i.test(line)) continue;

      const cleaned = cleanCandidateLine(line);
      if (cleaned.length > 3 && scoreProductLine(cleaned, brand) >= -1) parts.push(cleaned);
      if (parts.length >= 2) break;
    }

    if (parts.length) return appendModel(parts.join(' '), model);
  }

  const best = lines
    .map((line) => ({ line: cleanCandidateLine(line), score: scoreProductLine(line, brand) }))
    .filter(({ line }) => line.length > 3 && !/invoice|customer|phone|address|payment|warranty|subtotal|total/i.test(line))
    .sort((a, b) => b.score - a.score)[0];

  if (best && best.score > 0) return appendModel(best.line, model);
  return brand ? `${brand} Product` : undefined;
}

function detectCategory(productName: string | undefined, text: string): ProductCategory {
  const combinedSearchText = `${productName || ''} ${text}`;
  for (const [category, regex] of Object.entries(CATEGORY_MAP)) {
    if (regex?.test(combinedSearchText)) return category as ProductCategory;
  }
  return productName ? 'Electronics' : 'Other';
}

function detectPaymentMethod(text: string): PaymentMethod {
  if (/emi|installment|finance|loan amount|monthly emi/i.test(text)) return 'EMI';
  if (/credit\s*card|cc\b/i.test(text)) return 'Credit Card';
  if (/debit\s*card|dc\b/i.test(text)) return 'Debit Card';
  if (/upi|gpay|google\s*pay|phonepe|paytm|bhim|tez/i.test(text)) return 'UPI';
  if (/net\s*banking|internet\s*banking|neft|imps/i.test(text)) return 'Net Banking';
  if (/\bcash\b/i.test(text)) return 'Cash';
  return 'Other';
}

function calculateConfidence(data: ExtractedReceiptData, rawText: string) {
  let score = 0.15;
  if (data.product_name && data.product_name !== 'Purchased Item') score += 0.2;
  if (data.brand && data.brand !== 'Unknown Brand') score += 0.1;
  if (data.store && data.store !== 'Retail Store') score += 0.1;
  if (data.purchase_date) score += 0.12;
  if ((data.final_price || 0) > 0) score += 0.18;
  if ((data.original_price || 0) > 0) score += 0.08;
  if (data.has_warranty) score += 0.05;
  if (data.has_emi) score += 0.05;
  if (rawText.length > 80) score += 0.07;
  return Math.min(0.98, Number(score.toFixed(2)));
}

/**
 * Deterministic parser that turns raw OCR text into BuyTrack receipt fields.
 */
export function parseReceiptText(text: string): ExtractedReceiptData {
  if (!text || typeof text !== 'string' || text.trim().length < 4) {
    return {
      confidence_score: 0,
      notes: 'OCR could not read enough text from this receipt.',
    };
  }

  const normalizedText = normalizeOcrText(text);
  const lines = getLines(normalizedText);

  const store = detectStore(lines, normalizedText);
  const brand = detectBrand(normalizedText);
  const modelNumber = detectModel(normalizedText);
  const productName = detectProductName(lines, normalizedText, brand, modelNumber);
  const category = detectCategory(productName, normalizedText);
  const purchaseDate = parseDateToIso(normalizedText) || toIsoDate(new Date());
  const paymentSectionIndex = lines.findIndex((line) => /payment\s*details|emi\s*details|finance\s*details/i.test(line));
  const billLines = paymentSectionIndex > 0 ? lines.slice(0, paymentSectionIndex) : lines;

  const totalAmount =
    findAmountNearLabels(billLines, [
      /grand\s*total|net\s*amount|total\s*payable|amount\s*payable|total\s*paid|invoice\s*total|bill\s*amount/i,
      /^total\b/i,
    ]) || 0;

  const subtotal =
    findAmountNearLabels(billLines, [/sub\s*total|subtotal|item\s*total|gross\s*amount|taxable\s*value|unit\s*price|mrp/i]) ||
    totalAmount;

  const discount = findAmountNearLabels(billLines, [/discount|savings|offer|coupon|promo/i]) || 0;

  const tax =
    findAmountNearLabels(billLines, [/cgst\s*\+?\s*sgst|total\s*gst|gst\s*amount|tax|vat|igst|cgst|sgst/i], /total|payment/i) ||
    0;

  const paymentMethod = detectPaymentMethod(normalizedText);
  const hasEmi = paymentMethod === 'EMI' || /emi\s*details|loan\s*amount|monthly\s*emi|tenure/i.test(normalizedText);

  const downPayment = hasEmi
    ? findAmountNearLabels(lines, [/down\s*payment|initial\s*payment|margin\s*money|advance/i]) || 0
    : 0;

  const monthlyEmi = hasEmi
    ? findAmountNearLabels(lines, [/monthly\s*emi|emi\s*amount|installment\s*amount|per\s*month/i]) || 0
    : 0;

  const tenureMatch = normalizedText.match(/(?:tenure|duration|installments?|months)\s*[:#-]?\s*(\d{1,3})\s*(?:months?|mos?|m)?/i);
  let tenureMonths = tenureMatch?.[1] ? Number.parseInt(tenureMatch[1], 10) : 0;

  const rateMatch = normalizedText.match(/(?:interest\s*rate|rate\s*of\s*interest|roi)\s*[:#-]?\s*([\d.]+)\s*%/i);
  const interestRate = rateMatch?.[1] ? Number.parseFloat(rateMatch[1]) : 0;

  if (hasEmi && tenureMonths === 0 && monthlyEmi > 0 && totalAmount > downPayment) {
    tenureMonths = Math.round((totalAmount - downPayment) / monthlyEmi);
  }

  const warrantyMatch = normalizedText.match(
    /(?:warranty\s*(?:period|duration|cover|information)?|guarantee)\s*[:#-]?\s*(\d{1,2})\s*(years?|yrs?|months?|mos?|m)\b/i
  );
  const hasWarranty = Boolean(warrantyMatch || /\bwarranty\b|\bguarantee\b/i.test(normalizedText));
  let warrantyDurationMonths = hasWarranty ? 12 : 0;

  if (warrantyMatch?.[1] && warrantyMatch[2]) {
    const value = Number.parseInt(warrantyMatch[1], 10);
    warrantyDurationMonths = /^y/i.test(warrantyMatch[2]) ? value * 12 : value;
  }

  const invoiceNo = extractAfterLabel(
    normalizedText,
    /(?:invoice\s*(?:no|number)?|inv\s*no|bill\s*(?:no|number)?|receipt\s*(?:no|number)?|order\s*id|transaction\s*id)\s*[:#-]\s*([a-z0-9_./-]{3,40})/i
  );

  const finalPrice = totalAmount || Math.max(0, subtotal - discount + tax);
  const originalPrice = subtotal || (finalPrice > 0 ? Math.max(finalPrice, finalPrice + discount - tax) : 0);

  const notes = [
    invoiceNo ? `Invoice No: ${invoiceNo}` : '',
    store ? `Store: ${store}` : '',
    hasWarranty ? `Warranty: ${warrantyDurationMonths} Months` : '',
    hasEmi ? `EMI Plan: ${tenureMonths || 0} Months (Rs ${monthlyEmi || 0}/mo)` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const parsed: ExtractedReceiptData = {
    product_name: productName || 'Purchased Item',
    brand: brand || 'Unknown Brand',
    category,
    store: store || 'Retail Store',
    purchase_date: purchaseDate,
    original_price: originalPrice,
    discount,
    tax,
    final_price: finalPrice,
    payment_method: paymentMethod,
    has_warranty: hasWarranty,
    warranty_duration_months: warrantyDurationMonths || 12,
    has_emi: hasEmi,
    down_payment: downPayment,
    monthly_emi: monthlyEmi,
    tenure_months: tenureMonths || (hasEmi ? 10 : 0),
    interest_rate: interestRate,
    notes: notes || 'Receipt processed via OCR. Please review any low-confidence fields.',
  };

  return {
    ...parsed,
    confidence_score: calculateConfidence(parsed, normalizedText),
  };
}
