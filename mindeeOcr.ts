import * as mindee from "mindee";
import { writeFile } from "node:fs/promises";

const MINDEE_API_KEY = process.env.MINDEE_API_KEY || "";

async function processBillWithMindee(imagePath: string) {
  console.log(`Processing with Mindee: ${imagePath}...`);
  
  if (!MINDEE_API_KEY) {
    console.error("Please set MINDEE_API_KEY environment variable");
    process.exit(1);
  }
  
  const mindeeClient = new mindee.Client({ apiKey: MINDEE_API_KEY });
  
  const modelId = "90d93165-d8ee-4359-b276-d6f7355d3ec4";
  
  const inputSource = new mindee.PathInput({ inputPath: imagePath });
  
  const response = await mindeeClient.enqueueAndGetResult(
    mindee.product.Extraction,
    inputSource,
    { modelId: modelId, rawText: true }
  );
  
  const fields = response?.rawHttp?.inference?.result?.fields || {};
  
  // Extract all available fields
  const supplier = fields.supplier_name?.value || "Unknown";
  const date = fields.date?.value || "";
  const time = fields.time?.value || "";
  const totalAmount = fields.total_amount?.value || 0;
  const totalNet = fields.total_net?.value || 0;
  const totalTax = fields.total_tax?.value || 0;
  const tips = fields.tips_gratuity?.value || 0;
  const documentType = fields.document_type?.value || "";
  const purchaseCategory = fields.purchase_category?.value || "";
  const purchaseSubcategory = fields.purchase_subcategory?.value || "";
  const locale = fields.locale?.value || "";
  const receiptNumber = fields.receipt_number?.value || "";
  
  console.log("\n=== Extracted Data ===");
  console.log("Supplier:", supplier);
  console.log("Date:", date, "Time:", time);
  console.log("Total Amount:", totalAmount);
  console.log("Total Net:", totalNet);
  console.log("Total Tax:", totalTax);
  console.log("Tips:", tips);
  console.log("Document Type:", documentType);
  console.log("Purchase Category:", purchaseCategory);
  console.log("Purchase Subcategory:", purchaseSubcategory);
  console.log("Locale:", locale);
  console.log("Receipt Number:", receiptNumber);
  
  // Extract line items
  const items: Array<{ name: string; price: number }> = [];
  
  const lineItems = fields.line_items?.items || [];
  
  for (const item of lineItems) {
    const description = item.fields?.description?.value || "";
    const quantity = parseFloat(item.fields?.quantity?.value || "1");
    const totalAmount = parseFloat(item.fields?.total_price?.value || item.fields?.total_amount?.value || "0");
    
    if (description && totalAmount > 0) {
      items.push({
        name: `${quantity} ${description}`,
        price: Math.round(totalAmount)
      });
    }
  }
  
  console.log("Line Items:", items.length);
  
  const outputData = {
    metadata: { 
      source: imagePath, 
      processed_at: new Date().toISOString(), 
      ocr: "Mindee" 
    },
    totalData: {
      name: `transaction ${supplier}`,
      price: Math.round(totalAmount)
    },
    supplier,
    date,
    time,
    total_amount: totalAmount,
    total_net: totalNet,
    total_tax: totalTax,
    tips_gratuity: tips,
    document_type: documentType,
    purchase_category: purchaseCategory,
    purchase_subcategory: purchaseSubcategory,
    locale,
    receipt_number: receiptNumber,
    items: items,
    additional_info: []
  };
  
  await writeFile("mindee_output.json", JSON.stringify(outputData, null, 2));
  console.log(`\nSuccess! JSON saved`);
  console.log(JSON.stringify(outputData, null, 2));
}

const filePath = process.argv[2];
if (!filePath) process.exit(1);
processBillWithMindee(filePath).catch(console.error);