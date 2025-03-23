# Ape Tweet Frontend

## 1. Install dependencies

```bash
npm install
# or
pnpm install
```

## 2. Setup environment variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_app_secret

# RPC for Base
NEXT_PUBLIC_RPC_URL=https://base-mainnet.rpc
```

## 3. Run database setup

```bash
npm run db:generate
npm run db:push
```

## 4. Start dev server

```bash
npm run dev
```
