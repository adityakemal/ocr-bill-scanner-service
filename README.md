# OCR Service

Receipt OCR API service with dual providers: Mindee (AI) and Tesseract (manual).

## Tech Stack

- **Runtime**: Bun (https://bun.com)
- **Framework**: Elysia
- **OCR Providers**:
  - Mindee SDK (AI-powered, free API at https://platform.mindee.net)
  - Tesseract.js (manual OCR, no API key required)

## Environment Variables

Buat file `.env` di root directory:

```bash
# Required for Mindee - get free at https://platform.mindee.net
MINDEE_API_KEY=your_api_key_here

# Optional - default: 90d93165-d8ee-4359-b276-d6f7355d3ec4
MINDEE_MODEL_ID=90d93165-d8ee-4359-b276-d6f7355d3ec4

# Optional - server port
PORT=3000
```

**Mindee Model ID**: `90d93165-d8ee-4359-b276-d6f7355d3ec4`

## Getting Started

### Prerequisites

- Bun installed (https://bun.com)
- Mindee API key (free at https://platform.mindee.net)

### Installation

```bash
bun install
```

### Run Locally

```bash
# Pastikan .env sudah ada dengan MINDEE_API_KEY
# Cara 1: Langsung dari .env
source .env && bun src/index.ts

# Cara 2: Lewat export
export MINDEE_API_KEY=$(grep MINDEE_API_KEY .env | cut -d'=' -f2)
export MINDEE_MODEL_ID=$(grep MINDEE_MODEL_ID .env | cut -d'=' -f2)
bun src/index.ts

# Cara 3: Manual
MINDEE_API_KEY=your_key bun src/index.ts
```

Server runs on http://localhost:3000

---

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

**cURL:**
```bash
IMAGE=$(base64 -i receipt.jpg | tr -d '\n')
curl -X POST http://localhost:3000/ocr/mindee/base64 \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE\", \"filename\": \"receipt.jpg\"}"
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

Tanpa API key required!

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

---

## Deploy on Coolify

### 1. Build Docker Image

```bash
docker build -t ocr-service .
```

### 2. Run Container

```bash
docker run -p 3000:3000 \
  -e MINDEE_API_KEY=your_key \
  -e MINDEE_MODEL_ID=90d93165-d8ee-4359-b276-d6f7355d3ec4 \
  ocr-service
```

### 3. Coolify Configuration

- Create new app → Select "Docker"
- Set port: 3000
- Set environment variables:
  - `MINDEE_API_KEY=your_api_key`
  - `MINDEE_MODEL_ID=90d93165-d8ee-4359-b276-d6f7355d3ec4` (optional)

---

## Testing with Postman

### Mindee - File Upload
```
Method: POST
URL: http://localhost:3000/ocr/mindee/file
Body: form-data
Key: file (File) → select image
```

### Mindee - Base64
```
Method: POST
URL: http://localhost:3000/ocr/mindee/base64
Headers: Content-Type: application/json
Body:
{
  "image": "base64_string...",
  "filename": "receipt.jpg"
}
```

### Tesseract - File Upload
```
Method: POST
URL: http://localhost:3000/ocr/tesseract/file
Body: form-data
Key: file (File) → select image
```

---

## Endpoints Reference

| Provider | Method | Endpoint | API Key |
|----------|--------|----------|---------|
| Mindee | POST | `/ocr/mindee/file` | Required |
| Mindee | POST | `/ocr/mindee/base64` | Required |
| Mindee | POST | `/ocr/mindee/url` | Required |
| Tesseract | POST | `/ocr/tesseract/file` | Not needed |
| Tesseract | POST | `/ocr/tesseract/base64` | Not needed |

## License

MIT