# Baileys MySQL Store

A comprehensive MySQL persistence solution for [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys), providing both authentication state management and data storage with LRU caching and batch processing.

## Features

### 🔐 Authentication State Management

- **MySQL-based Auth Storage** - Store authentication credentials and keys in MySQL
- **Multi-session Support** - Handle multiple WhatsApp sessions with a single database
- **Automatic Table Creation** - Database schema is created automatically
- **Connection Pooling** - Efficient database connection management

### 💾 Data Store

- **MySQL Persistence** - Store all WhatsApp data in MySQL database
- **LRU Caching** - Multi-tiered caching strategy for optimal performance
- **Batch Processing** - Efficient bulk database operations with transactions
- **Cache Warming** - Proactive cache loading for frequently accessed data
- **Status Tracking** - Track WhatsApp status updates and views
- **Group Filtering** - Exclude specific groups from tracking
- **Optimized Queries** - Indexed queries and connection pooling

## Installation

```bash
npm install @theprodigy/baileys-mysql-store baileys mysql2
```

## Usage

### Complete Example (Auth + Store)

```typescript
import makeWASocket, { makeCacheableSignalKeyStore } from "baileys";
import {
  useMySQLAuthState,
  makeMySQLStore
} from "@theprodigy/baileys-mysql-store";
import { createPool } from "mysql2/promise";
import pino from "pino";

const logger = pino({ level: "info" });

// Create MySQL connection pool (shared by both auth and store)
const pool = createPool({
  host: "localhost",
  user: "your_user",
  database: "whatsapp_db",
  password: "your_password",
  connectionLimit: 5
});

async function startWhatsApp() {
  const sessionId = "session_1";

  // Initialize MySQL auth state
  const { state, saveCreds } = await useMySQLAuthState(pool, sessionId);

  // Initialize MySQL store
  const store = makeMySQLStore(
    sessionId,
    pool,
    [], // Optional: array of group JIDs to skip tracking
    logger
  );

  // Create WhatsApp socket
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    logger,
    printQRInTerminal: true
  });

  // Bind store to socket events
  await store.bind(sock.ev);

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);

  // Handle connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("Connection closed");
    } else if (connection === "open") {
      console.log("Connection opened");
    }
  });
}

startWhatsApp();
```

### Auth Only

```typescript
import { useMySQLAuthState } from "@theprodigy/baileys-mysql-store";
import { createPool } from "mysql2/promise";

const pool = createPool({
  host: "localhost",
  user: "root",
  database: "whatsapp_db",
  password: "password"
});

const { state, saveCreds, removeCreds } = await useMySQLAuthState(
  pool,
  "session_1"
);

// Use state.creds and state.keys with Baileys
```

### Store Only

```typescript
import { makeMySQLStore } from "@theprodigy/baileys-mysql-store";
import { createPool } from "mysql2/promise";

const pool = createPool({
  host: "localhost",
  user: "root",
  database: "whatsapp_db",
  password: "password"
});

const store = makeMySQLStore("session_1", pool, [], logger);
await store.bind(socket.ev);
```

## API

### `useMySQLAuthState(pool, session)`

Creates a MySQL-based authentication state for Baileys.

**Parameters:**

- `pool` (Pool): mysql2 connection pool
- `session` (string): Session name to identify the connection (allows multi-sessions)

**Returns:** Object with:

- `state` - Authentication state object with `creds` and `keys`
- `saveCreds()` - Function to save credentials to database
- `clear()` - Clear all auth data except credentials
- `removeCreds()` - Remove all auth data including credentials
- `query(sql, values)` - Execute custom SQL query

**Database Table:**

Automatically creates an `auth` table with columns:

- `session` - Session identifier
- `id` - Key identifier
- `value` - JSON data

### `makeMySQLStore(sessionId, pool, skippedGroups, logger)`

Creates a new MySQL store instance for WhatsApp data.

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
- And many more...

## Database Schema

The package automatically creates the following tables:

### Authentication Tables

- `auth` - Authentication credentials and keys (session, id, value)

### Store Tables

- `messages` - WhatsApp messages
- `chats` - Chat conversations
- `contacts` - Contact information
- `groups_metadata` - Group metadata
- `groups_status` - Group status updates
- `status_updates` - Status update tracking
- `status_viewers` - Status view tracking
- `status_view_counts` - Aggregated status view counts
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
