import Tesseract from "tesseract.js";

const TESSERACT_LANG = "eng+ind";

interface TesseractLineItem {
  name: string;
  price: number;
}

export interface OCRResult {
  metadata: { source: string; processed_at: string; ocr: string };
  totalData: { name: string; price: number };
  supplier: string;
  date: string;
  time: string;
  total_amount: number;
  total_net: number;
  total_tax: number;
  tips_gratuity: number;
  document_type: string;
  purchase_category: string;
  purchase_subcategory: string;
  locale: string;
  receipt_number: string;
  items: TesseractLineItem[];
  additional_info: string[];
}

function extractPrice(text: string): number {
  const cleaned = text.replace(/[^\d]/g, "");
  return parseInt(cleaned) || 0;
}

function parseLineItems(text: string): TesseractLineItem[] {
  const items: TesseractLineItem[] = [];
  const lines = text.split("\n").filter((line) => line.trim());

  const pricePattern = /(\d{1,3}(?:\.\d{3})*)$/;
  const itemPattern = /^(.+?)\s+[\d.]+\s*$/;

  for (const line of lines) {
    const match = line.match(pricePattern);
    if (match) {
      const price = extractPrice(match[1]);
      if (price > 1000) {
        let name = line.replace(pricePattern, "").trim();
        if (name.length > 2) {
          items.push({ name, price });
        }
      }
    }
  }

  return items.slice(0, 20);
}

function extractTotalAmount(text: string): number {
  const totalPatterns = [
    /total[:\s]*Rp\s*(\d{1,3}(?:\.\d{3})+)/i,
    /grand\s*total[:\s]*Rp\s*(\d{1,3}(?:\.\d{3})+)/i,
    /amount[:\s]*Rp\s*(\d{1,3}(?:\.\d{3})+)/i
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      return extractPrice(match[1]);
    }
  }

  const prices = text.match(/Rp\s*(\d{1,3}(?:\.\d{3})+)/g);
  if (prices && prices.length > 0) {
    return extractPrice(prices[prices.length - 1]);
  }

  return 0;
}

function extractSupplier(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim());
  return lines[0] || "Unknown";
}

function extractDate(text: string): string {
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const match = text.match(datePattern);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return "";
}

export async function processWithTesseract(
  imagePath: string,
  imageBuffer?: Uint8Array
): Promise<OCRResult> {
  let result;

  if (imageBuffer) {
    result = await Tesseract.recognize(Buffer.from(imageBuffer), TESSERACT_LANG, {
      logger: () => {}
    });
  } else {
    result = await Tesseract.recognize(imagePath, TESSERACT_LANG, {
      logger: () => {}
    });
  }

  const text = result.data.text;
  const supplier = extractSupplier(text);
  const date = extractDate(text);
  const totalAmount = extractTotalAmount(text);
  const items = parseLineItems(text);

  return {
    metadata: {
      source: imagePath,
      processed_at: new Date().toISOString(),
      ocr: "Tesseract"
    },
    totalData: {
      name: `transaction ${supplier}`,
      price: totalAmount
    },
    supplier,
    date,
    time: "",
    total_amount: totalAmount,
    total_net: 0,
    total_tax: 0,
    tips_gratuity: 0,
    document_type: "expense_receipt",
    purchase_category: "food",
    purchase_subcategory: "restaurant",
    locale: "en_ID",
    receipt_number: "",
    items,
    additional_info: []
  };
}