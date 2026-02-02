# Flick AI

A monorepo containing both the iOS app and the AI coaching backend server.

## Project Structure

```
FlickClean/
├── app/                    # Expo Router pages and screens
├── components/             # Reusable React Native components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries (pose estimation, etc.)
├── assets/                 # Images, fonts, and static assets
├── server/                 # Express + TypeScript AI coaching backend
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── routes/
│   │   │   ├── ingest.ts   # Session data ingestion endpoint
│   │   │   └── query.ts    # AI coaching query endpoint
│   │   ├── lib/
│   │   │   └── serialize.ts # Markdown serializer
│   │   └── shared/
│   │       └── types.ts    # Shared TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── package.json            # iOS app dependencies
└── app.json                # Expo configuration
```

## iOS App (React Native / Expo)

The mobile app captures shooting sessions using pose estimation and sends data to the coaching server.

### Setup

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Running on Device

- **iOS Simulator**: Press `i` after starting Expo
- **Physical Device**: Scan QR code with Expo Go app

## Server (Express + TypeScript)

The backend handles session ingestion and AI-powered coaching queries via OpenAI.

### Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment template and add your keys
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and VECTOR_STORE_ID

# Start development server
npm run dev
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ingest` | POST | Ingest shooting session data |
| `/query` | POST | Query AI coach for feedback |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `VECTOR_STORE_ID` | OpenAI vector store ID for session storage |
| `PORT` | Server port (default: 5050) |

## Development Workflow

1. Start the server: `cd server && npm run dev`
2. Start the iOS app: `npx expo start`
3. The app sends session data to `http://localhost:5050`

## License

See individual LICENSE files in each package.
