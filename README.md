# VeriAssets 🏦✨

**AI-Verified Real-World Asset Marketplace & Launchpad on Qubic**

[![Built for Qubic Hackathon](https://img.shields.io/badge/Built%20for-Qubic%20Hackathon-00D4AA?style=for-the-badge)](https://qubic.org)
[![Nostromo Track](https://img.shields.io/badge/Track-Nostromo%20Launchpad-6366F1?style=for-the-badge)](https://qubic.org)

## 🚀 Overview

VeriAssets is a groundbreaking platform that tokenizes real-world assets (RWAs) on the Qubic network, leveraging AI for verification and Nostromo for decentralized governance.

### Key Features

- 🤖 **AI-Powered Verification** - Gemini 1.5 Flash analyzes documents for 99%+ authenticity confidence
- 🏦 **RWA Tokenization** - Carbon credits, real estate, treasury assets
- 🗳️ **Nostromo Governance** - Community-driven proposal and voting system
- 🏷️ **Dutch Auction IPO** - Fair price discovery for new listings
- ⚡ **Qubic Integration** - Instant finality with tick-based architecture
- 🔗 **EasyConnect Webhooks** - Automation with Make.com/Zapier

## 🏗️ Architecture

```
VeriAssets/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/         # API Routes
│   │   ├── core/           # Config & Logging
│   │   ├── db/             # Database Models
│   │   ├── models/         # Pydantic Schemas
│   │   └── services/       # External Services
│   └── Dockerfile
├── frontend/               # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/           # App Router Pages
│   │   ├── components/    # React Components
│   │   ├── hooks/         # Custom Hooks
│   │   └── lib/           # Utilities & API
│   └── Dockerfile
└── docker-compose.yml
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance async API framework
- **SQLModel** - SQL databases with Pydantic models
- **Neon** - Serverless Postgres database
- **Google Gemini** - AI verification service
- **Qubic RPC** - Blockchain integration

### Frontend
- **Next.js 15** - React framework with App Router
- **Clerk** - Authentication & user management
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Client state management

### Infrastructure
- **Docker** - Containerization
- **Redis** - Caching & rate limiting
- **uv** - Fast Python package manager

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Clerk account
- Google AI Studio API key
- Neon database

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/veriassets.git
cd veriassets
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Install dependencies with uv
uv pip install -r pyproject.toml

# Run migrations (if needed)
uv run alembic upgrade head

# Start the server
uv run uvicorn app.main:app --reload

```

### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📚 API Documentation

Once running, access the API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/rwa` | GET/POST | List/Create RWA assets |
| `/api/v1/rwa/{id}/verify` | POST | Trigger AI verification |
| `/api/v1/trade` | GET/POST | Trading operations |
| `/api/v1/nostromo/proposals` | GET/POST | Governance proposals |
| `/api/v1/nostromo/ipo/{id}/bid` | POST | Dutch auction bids |

## 🔄 EasyConnect Webhooks

VeriAssets supports automation webhooks for Make.com/Zapier:

| Event | Trigger |
|-------|---------|
| `RWA_CREATED` | New asset submitted |
| `RWA_VERIFIED` | AI verification complete |
| `TRADE_COMPLETED` | Trade executed |
| `PROPOSAL_CREATED` | New governance proposal |
| `IPO_BID_FILLED` | Dutch auction bid filled |

## 🗳️ Nostromo Governance

1. **Submit Proposal** - Asset owner creates listing proposal
2. **Community Vote** - Token holders vote FOR/AGAINST
3. **Threshold Check** - Auto-approve at 100+ FOR votes (2:1 ratio)
4. **Dutch Auction** - Approved assets enter 24h IPO

## 🔥 Fee Structure

- **Trading Fee**: 0.3% of transaction
- **Burn Mechanism**: 100% of fees burned
- **IPO Fee**: 1% of funds raised

## 🔐 Security

- Clerk JWT authentication
- Rate limiting (100 req/min)
- Input validation with Pydantic
- SQL injection prevention
- CORS protection

## 📈 Roadmap

- [x] Core RWA marketplace
- [x] AI verification with Gemini
- [x] Nostromo governance integration
- [x] Dutch auction IPO
- [x] EasyConnect webhooks
- [ ] Mobile app (React Native)
- [ ] Multi-chain support
- [ ] Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Qubic** - For the amazing blockchain platform
- **Nostromo** - For decentralized governance tools
- **Google AI** - For Gemini verification capabilities

---

<p align="center">
  Built with ❤️ for the <strong>Qubic Hackathon</strong>
</p>

<p align="center">
  <a href="https://qubic.org">Qubic</a> •
  <a href="https://docs.qubic.org">Documentation</a> •
  <a href="https://discord.gg/qubic">Discord</a>
</p>
