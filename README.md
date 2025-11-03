# Baileys MySQL Store

A high-performance MySQL store implementation for [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) with LRU caching and batch processing.

## Features

- ✅ **MySQL Persistence** - Store all WhatsApp data in MySQL database
- ⚡ **LRU Caching** - Multi-tiered caching strategy for optimal performance
- 📦 **Batch Processing** - Efficient bulk database operations with transactions
- �� **Cache Warming** - Proactive cache loading for frequently accessed data
- 📊 **Status Tracking** - Track WhatsApp status updates and views
- 🎯 **Optimized Queries** - Indexed queries and connection pooling

## Installation

```bash
npm install @theprodigy/baileys-mysql-store baileys mysql2
```

## Usage

```typescript
import makeWASocket from "baileys";
import { makeMySQLStore } from "@theprodigy/baileys-mysql-store";
import { createPool } from "mysql2/promise";

// Create MySQL connection pool
const pool = createPool({
  host: "localhost",
  user: "your_user",
  database: "whatsapp_db",
  password: "your_password",
  connectionLimit: 5
});

// Initialize the store
const store = makeMySQLStore(
  "session_id", // Your session identifier
  pool, // MySQL pool
  [], // Optional: array of group JIDs to skip tracking (unless you're admin)
  logger // Optional: Pino logger instance
);

// Create WhatsApp socket
const sock = makeWASocket({
  auth: state
  // ... other options
});

// Bind store to socket events
await store.bind(sock.ev);
```

## API

### `makeMySQLStore(sessionId, pool, skippedGroups, logger)`

Creates a new MySQL store instance.

**Parameters:**

- `sessionId` (string): Unique identifier for this session
- `pool` (Pool): mysql2 connection pool
- `skippedGroups` (string[]): Array of group JIDs to exclude from tracking. Groups in this list will not be stored in the database unless you are an admin/superadmin of the group. Useful for excluding large broadcast groups or communities you don't want to track. Default: `[]`
- `logger` (Logger): Pino logger instance (optional)

**Returns:** Store instance with methods:

- `bind(ev)` - Bind to Baileys event emitter
- `loadMessage(id)` - Load a message by ID
- `getAllChats()` - Get all chats
- `getAllContacts()` - Get all contacts
- `loadAllGroupsMetadata()` - Load all group metadata
- `customQuery(query, params)` - Execute custom SQL query

## Database Schema

The store automatically creates the following tables:

- `messages` - WhatsApp messages
- `chats` - Chat conversations
- `contacts` - Contact information
- `groups_metadata` - Group metadata
- `groups_status` - Group status updates
- `status_updates` - Status update tracking
- `users` - User information

## Features

### Group Filtering

You can exclude specific groups from being tracked in the database using the `skippedGroups` parameter:

```typescript
const store = makeMySQLStore(
  "session_id",
  pool,
  [
    "120363123456789012@g.us", // Large broadcast group
    "120363987654321098@g.us" // Community you don't want to track
  ],
  logger
);
```

**Important Notes:**

- Groups in the `skippedGroups` array will **not** be stored in the database
- **Exception:** If you are an admin or superadmin of a skipped group, it **will still be tracked**
- This is useful for excluding large communities, broadcast groups, or groups you don't need to monitor
- Group JIDs typically end with `@g.us`

### LRU Caching

- **Groups**: 15-minute TTL
- **Contacts**: 30-minute TTL
- **Message Types**: 24-hour TTL
- **Status Viewers**: 5-minute TTL

### Batch Processing

- Automatic batching of database writes
- Configurable batch size and flush interval
- Transaction support for data integrity

## Environment Variables

```env
MYSQL_HOST=localhost
MYSQL_USER=your_user
MYSQL_DATABASE=whatsapp_db
MYSQL_PASSWORD=your_password
MYSQL_PORT=3306
USER_SESSION=your_session_id
```

## License

MIT

## Credits

Built for use with [Baileys](https://github.com/WhiskeySockets/Baileys) - Lightweight full-featured WhatsApp Web + Multi-Device API
