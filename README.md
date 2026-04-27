# OCR Service

Receipt OCR API service with dual providers: Mindee (AI) and Tesseract (manual).

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **OCR Providers**:
  - Mindee SDK (AI-powered, get API key at https://platform.mindee.net)
  - Tesseract.js (manual OCR, no API key required)

## Model ID (Mindee)

```
90d93165-d8ee-4359-b276-d6f7355d3ec4
```

## Getting Started

### Prerequisites

- Bun installed (https://bun.com)
- Mindee API key (free at https://platform.mindee.net)
- No key needed for Tesseract

### Installation

```bash
bun install
```

### Run Locally

```bash
# Method 1: Set env var langsung
MINDEE_API_KEY=your_key bun src/index.ts

# Method 2: Dari .env file
source .env && bun src/index.ts

# Method 3: Lewat export
export MINDEE_API_KEY=your_key
bun src/index.ts
```

Server runs on http://localhost:3000

## API Endpoints

### Health Check
```
GET /health
```
Response:
```json
{ "status": "ok", "timestamp": "2026-04-27T00:00:00.000Z" }
```

---

## Mindee OCR (AI)

### 1. File Upload
```
POST /ocr/mindee/file
```
- Body: form-data → `file` field

**cURL:**
```bash
curl -X POST http://localhost:3000/ocr/mindee/file \
  -F "file=@receipt.jpg"
```

### 2. Base64
```
POST /ocr/mindee/base64
```
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "image": "base64_encoded_image...",
  "filename": "receipt.jpg"
}
```

### 3. URL
```
POST /ocr/mindee/url
```
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "url": "https://example.com/receipt.jpg"
}
```

---

## Tesseract OCR (Manual)

### 1. File Upload
```
POST /ocr/tesseract/file
```
- Body: form-data → `file` field

**cURL:**
```bash
curl -X POST http://localhost:3000/ocr/tesseract/file \
  -F "file=@receipt.jpg"
```

### 2. Base64
```
POST /ocr/tesseract/base64
```
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "image": "base64_encoded_image...",
  "filename": "receipt.jpg"
}
```

---

## Response Format

```json
{
  "metadata": {
    "source": "test1.jpeg",
    "processed_at": "2026-04-27T00:00:00.000Z",
    "ocr": "Mindee"
  },
  "totalData": {
    "name": "transaction Sentosa Seafood PIK",
    "price": 480800
  },
  "supplier": "Sentosa Seafood PIK",
  "date": "2022-02-20",
  "time": "17:54:28",
  "total_amount": 480800,
  "total_net": 518200,
  "total_tax": 53116,
  "tips_gratuity": 0,
  "document_type": "expense_receipt",
  "purchase_category": "food",
  "purchase_subcategory": "restaurant",
  "locale": "en_ID",
  "receipt_number": "",
  "items": [
    { "name": "1 Ice Tea Tawar", "price": 6000 },
    { "name": "1 Jus Guava", "price": 22000 }
  ],
  "additional_info": []
}
```

## Deploy on Coolify

### 1. Build Docker Image

```bash
docker build -t ocr-service .
```

### 2. Run Container

```bash
docker run -p 3000:3000 -e MINDEE_API_KEY=your_key ocr-service
```

### 3. Coolify Configuration

- Create new app → Select "Docker"
- Set port: 3000
- Set environment variable: `MINDEE_API_KEY=your_api_key`

## Testing with Postman

### Mindee - File Upload
1. Method: POST
2. URL: `http://localhost:3000/ocr/mindee/file`
3. Body: form-data → Key: `file` (File) → select image

### Mindee - Base64
1. Method: POST
2. URL: `http://localhost:3000/ocr/mindee/base64`
3. Headers: `Content-Type: application/json`
4. Body:
```json
{
  "image": "base64_string...",
  "filename": "receipt.jpg"
}
```

### Tesseract - File Upload
1. Method: POST
2. URL: `http://localhost:3000/ocr/tesseract/file`
3. Body: form-data → Key: `file` (File) → select image

## Endpoints Reference

| Provider | Method | Endpoint |
|----------|--------|----------|
| Mindee | POST | `/ocr/mindee/file` |
| Mindee | POST | `/ocr/mindee/base64` |
| Mindee | POST | `/ocr/mindee/url` |
| Tesseract | POST | `/ocr/tesseract/file` |
| Tesseract | POST | `/ocr/tesseract/base64` |

## License

MIT