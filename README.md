# OPA-Firestore Sync

A Next.js web application for managing Open Policy Agent (OPA) policies with a user-friendly interface.

## Features

- 📋 **Policy Management** - Create, view, edit, and delete OPA policies
- ✅ **Policy Validation** - Validate Rego syntax before saving
- 🔍 **Query Tester** - Test policies with custom input data
- 💾 **Data Manager** - Manage OPA data documents
- 🔄 **Real-time Status** - Monitor OPA server connection status

## Getting Started

### Prerequisites

- Node.js 18+ 
- OPA server running (locally or remote)

### Installation

```bash
npm install
```

### Environment Configuration

Create `.env.local` for local development:

```env
# Local OPA server
NEXT_PUBLIC_OPA_SERVER_URL=http://localhost:8181
OPA_SERVER_URL=http://localhost:8181
```

For production, create `.env.production` with your server IP:

```env
NEXT_PUBLIC_OPA_SERVER_URL=http://YOUR_SERVER_IP:8181
OPA_SERVER_URL=http://YOUR_SERVER_IP:8181
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Running OPA Server Locally

```bash
# Download OPA binary from https://www.openpolicyagent.org/docs/latest/#running-opa
opa run --server
```

## Project Structure

```
src/
├── app/
│   ├── api/opa/           # Centralized API routes for OPA operations
│   │   ├── policies/      # Policy CRUD endpoints
│   │   ├── data/          # Data management endpoints
│   │   ├── query/         # Query endpoint
│   │   ├── health/        # Health check endpoint
│   │   └── compile/       # Policy validation endpoint
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/            # React UI components
├── lib/
│   └── opa-server.ts      # Server-side OPA client
├── services/
│   └── opaClient.ts       # Client-side API wrapper
└── types/
    └── opa.ts             # TypeScript type definitions
examples/
└── sample-policy.rego     # Example Rego policy
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/opa/policies` | GET, POST | List or create policies |
| `/api/opa/policies/[id]` | GET, PUT, DELETE | Single policy operations |
| `/api/opa/data` | GET, PUT | Root data operations |
| `/api/opa/data/[...path]` | GET, PUT, DELETE, PATCH | Path-specific data |
| `/api/opa/query` | POST | Query policies with input |
| `/api/opa/health` | GET | Server health check |
| `/api/opa/compile` | POST | Validate Rego syntax |

## Learn More

- [OPA Documentation](https://www.openpolicyagent.org/docs/)
- [Rego Policy Language](https://www.openpolicyagent.org/docs/latest/policy-language/)
- [Next.js Documentation](https://nextjs.org/docs)
