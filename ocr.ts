import { createWorker } from 'tesseract.js';
import { writeFile } from 'node:fs/promises';

const EXCLUDED_KEYWORDS = [
  'subtotal', 'total', 'service', 'charge', 'tax', 'ppn', 'sc ', 'pb ',
  'paid', 'cash', 'change', 'cashier', 'print', 'thank', 'items',
  'grand', 'brand', 'discount', 'komisi', 'ongkir', 'delivery', 'shipping',
  'pajak', 'bill', 'serv', 'diskon', 'point'
];

async function processBill(imagePath: string) {
  console.log(`Processing: ${imagePath}...`);
  
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imagePath);
  await worker.terminate();

  console.log("Extracted Text:\n", text);

  const lines = text.split('\n');
  const items = [];
  const additionalInfo = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].trim();
    if (!current) continue;

    const lower = current.toLowerCase();
    
    if (EXCLUDED_KEYWORDS.some(kw => lower.includes(kw))) {
      additionalInfo.push(current);
      continue;
    }
    
    // Skip lines with months/dates
// Skip lines with months/dates
    if (/^(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|dec)/.test(lower) ||
        /^\d{1,2}[/]\d{1,2}[/]\d{2,4}/.test(current) ||
        /^\d{2}[/]\d{2}[/]/.test(current)) {
      continue;
    }

    // Skip lines that look like phone numbers or very long numbers (>6 digits)
    const longNum = current.match(/\d{6,}/);
    if (longNum && !current.includes('=')) {
      continue;
    }

    // Skip lines that are only prices (.000, .500 format) without names
    // But allow valid prices if they look like totals
    const isOnlyPrice = /^\d+[.,]\s*\d{3}/.test(current);
    const isShortNumber = current.replace(/[^0-9]/g, '').length <= 6;
    if (isOnlyPrice && isShortNumber) {
      continue;
    }
    
    // Skip lines starting with . (orphaned prices)
    if (/^\./.test(current)) {
      continue;
    }
    
// Skip lines like "Rp." at start (total lines)
    if (/^rp[.]?\s/i.test(current)) {
      continue;
    }
    
    // Skip lines containing "HARGA JUAL" or similar total lines
    if (/harga\s+jual/i.test(current)) {
      continue;
    }
    
    // Skip lines starting with "!" or "! VOUCHER"
    if (/^!/.test(current)) {
      continue;
    }

// Try multiple price patterns: 35,000 (comma), 20.000 (dot), 98'00 (apostrophe)
    let priceMatch = current.match(/(\d{1,3}[,\.\s]\s*\d{3})/);
    
    // For format like "2300 4,600" (space between unit and total), take the last one
    // This is for receipts like test7: "name qty price total"
    if (current.includes(' ') && !current.includes('x')) {
      const lastPriceMatch = current.match(/(\d+[,\.]\d{3})\s*$/);
      if (lastPriceMatch) {
        priceMatch = lastPriceMatch;
      }
    }
    
    if (!priceMatch) priceMatch = current.match(/(\d'\d{2})/);
    if (!priceMatch) priceMatch = current.match(/(\d{4,})/);
    
    if (!priceMatch) continue;
    
    // Clean the price string
    let priceStr = priceMatch[0].replace(/[^0-9]/g, '');
    
    // Validate price
    const cleanPrice = parseInt(priceStr, 10);
    if (!cleanPrice || cleanPrice < 1000 || cleanPrice > 10000000) continue;
    
    let qty = 1;
    
    if (current.includes('x')) {
      const qtyMatch = current.match(/x(\d+)/);
      if (qtyMatch) qty = parseInt(qtyMatch[1], 10);
    }
    
    const priceIndex = current.indexOf(priceMatch[0]);
    let item = current.substring(0, priceIndex)
      .replace(/^[|©©"~#*\s]+/, '')
      .replace(/[|©©"~#*]/g, '')
      .trim();
    
    // Find previous line if needed
    let actualPrev = '';
    for (let j = i - 1; j >= 0; j--) {
      const checkLine = lines[j].trim();
      if (checkLine.length > 0 && !checkLine.match(/(\d{1,3}[,\s]\s*\d{3})/)) {
        actualPrev = checkLine;
        break;
      }
    }
    
    if (item.replace(/[\s\d]+/g, '').length < 2 && actualPrev) {
      item = actualPrev.replace(/^[|©©"~\s]+/, '').replace(/[|©©"#*]/g, '');
    }
    
    let name = item.replace(/^(\d+)\s*[xX*]?\s*/, '').trim();
    
    if (name && cleanPrice > 0) {
      name = `${qty} ${name}`;
    }
    
    if (name && name.length >= 2 && cleanPrice > 0) {
      const nameAfterQty = name.replace(/^\d+\s*[xX*]?\s*/, '').trim();
      
      if (nameAfterQty.length < 2) continue;
      
      const firstWord = nameAfterQty.split(/\s/)[0].toLowerCase();
      if (/^(a|i|is|an|the|di|ke|ya|pake|ve|lo)$/.test(firstWord)) continue;
      
      if (/^[^a-zA-Z0-9]+$/.test(nameAfterQty)) continue;
      if (/[£¥€©§¶£¥%§]/.test(nameAfterQty)) continue;
      
      items.push({ name: name, price: cleanPrice });
    }
  }

  const outputData = {
    metadata: {
      source: imagePath,
      processed_at: new Date().toISOString()
    },
    items: items,
    additional_info: additionalInfo
  };

  const outputPath = 'bill_output.json';
  await writeFile(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\nSuccess! JSON saved to: ${outputPath}`);
  console.log(JSON.stringify(outputData, null, 2));
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Please provide an image path: bun run ocr.ts <path-to-image>");
  process.exit(1);
}

processBill(filePath).catch(console.error);