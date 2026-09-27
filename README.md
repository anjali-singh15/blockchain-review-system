# Blockchain-Based Fake Product Review Detection System

Production-ready full-stack web application for authenticated buyers to submit product reviews, detect suspicious patterns, validate purchases by order ID, and publish only genuine verified reviews.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, Chart.js
- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Smart Contract: Solidity, Hardhat

## Project Structure

```text
client/      React frontend
server/      Express API + MongoDB + JWT auth
contracts/   Solidity contract + Hardhat deployment
```

## Features

- Users can register and log in securely
- Approved reviewer records are managed directly in MongoDB Atlas
- Only logged-in buyers whose email and order ID appear in that dataset can submit reviews
- Rule-based fake review detection using:
  - Duplicate review detection
  - Same-user repeat submission checks
  - High-frequency review checks
  - Similar review pattern matching
- Review trust score from `0-100`
- `FAKE` / `GENUINE` classification
- Public feed for verified genuine reviews only
- Admin dashboard with analytics and fake-review queue
- Responsive UI with dark/light mode and notifications

## Environment Setup

Create a root `.env` file based on `.env.example`.

```env
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
PRIVATE_KEY=optional_blockchain_private_key
RPC_URL=optional_blockchain_rpc_url
CONTRACT_ADDRESS=optional_blockchain_contract_address
PORT=5000
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
```

## MongoDB Setup

1. Create a MongoDB Atlas cluster or local MongoDB instance.
2. Copy the connection string into `MONGO_URI`.
3. Ensure the database user has read/write permissions.
4. If using Atlas, whitelist the machine IP address that will run the API.

## Smart Contract Deployment on Sepolia

1. Install dependencies:

```bash
npm install
```

2. Compile the contract:

```bash
npm run compile --workspace contracts
```

3. Deploy to Sepolia:

```bash
npm run deploy:contract
```

4. Copy the deployed contract address into `CONTRACT_ADDRESS` in the root `.env`.

## Running the Backend

```bash
cd server
npm install
npm run dev
```

The API runs on `http://localhost:5000` by default.

### API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dataset`
- `POST /api/reviews`
- `GET /api/reviews`
- `GET /api/reviews/public`
- `GET /api/reviews/:id`
- `GET /api/health`

## Running the Frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Review Submission Flow

1. Seed approved reviewer records into MongoDB Atlas with `email`, `orderId`, and optional `productName`.
2. Any user can register and log in.
3. Only users whose `email + orderId` appear in MongoDB can submit reviews.
4. If a reviewer record also includes `productName`, it must match the submitted product.
5. Backend calculates fraud heuristics and trust score.
6. Genuine reviews are stored with `verified: true`.
7. Suspicious reviews are stored with `verified: false` for admin inspection.
8. The public feed only returns verified genuine reviews.

## Notes

- No secrets are hardcoded in source files.
- JWT credentials are loaded from environment variables only.
- Approved reviewer records should be inserted directly into MongoDB Atlas with `email` and `orderId`, plus optional `productName`.
- Reviewer records are stored in MongoDB Atlas via the `ReviewerDatasetEntry` collection.
- Admin routes are still open; add role-based access control before production deployment.

## Suggested Next Production Improvements

- Add role-based access control for admin routes.
- Replace uploaded dataset validation with a real commerce/order service.
- Add request rate limiting and schema validation with Zod or Joi.
- Add automated tests for controller logic and contract behavior.
