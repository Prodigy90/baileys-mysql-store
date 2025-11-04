/**
 * MySQL Authentication State Management for Baileys
 * 
 * Original implementation by @bobslavtriev (https://github.com/bobslavtriev/mysql-baileys)
 * Enhanced to use connection pooling for better performance and resource management
 */

import {
  sqlData,
  SignalDataTypeMap,
  AuthenticationCreds,
  AuthenticationState
} from "./types.js";
import { Pool } from "mysql2/promise";
import { BufferJSON, initAuthCreds, fromObject } from "./utils.js";

/**
 * Stores the full authentication state in MySQL
 * Far more efficient than file-based storage
 *
 * @param pool - MySQL connection pool from mysql2/promise
 * @param session - Session name to identify the connection, allowing multisessions with MySQL
 * @returns Authentication state object with credentials and helper methods
 *
 * @example
 * ```typescript
 * import { createPool } from 'mysql2/promise';
 * import { createAuth } from '@theprodigy/baileys-mysql-store';
 *
 * const pool = createPool({
 *   host: 'localhost',
 *   user: 'root',
 *   database: 'whatsapp_db',
 *   password: 'password'
 * });
 *
 * const { state, saveCreds, removeCreds } = await createAuth(
 *   pool,
 *   'session_1'
 * );
 *
 * const sock = makeWASocket({
 *   auth: {
 *     creds: state.creds,
 *     keys: makeCacheableSignalKeyStore(state.keys, logger)
 *   }
 * });
 *
 * sock.ev.on('creds.update', saveCreds);
 * ```
 */

let newConnection = true;

async function connection(pool: Pool, tableName = "auth"): Promise<void> {
  if (newConnection) {
    try {
      await pool.execute(
        `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
                    \`session\` varchar(50) NOT NULL,
                    \`id\` varchar(80) NOT NULL,
                    \`value\` json DEFAULT NULL,
                    UNIQUE KEY \`idxunique\` (\`session\`, \`id\`),
                    KEY \`idxsession\` (\`session\`),
                    KEY \`idxid\` (\`id\`)
                ) ENGINE=MyISAM;`
      );
      newConnection = false;
    } catch (error) {
      console.error("Error creating table:", error);
      throw new Error("Failed to initialize database connection");
    }
  }
}

export const createAuth = async (
  pool: Pool,
  session: string
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clear: () => Promise<void>;
  removeCreds: () => Promise<void>;
  query: (sql: string, values: string[]) => Promise<sqlData>;
}> => {
  await connection(pool);
  const maxtRetries = 10;
  const tableName = "auth";
  const retryRequestDelayMs = 200;

  const query = async (sql: string, values: string[]) => {
    for (let x = 0; x < maxtRetries; x++) {
      try {
        const [rows] = await pool.query(sql, values);
        return rows as sqlData;
      } catch (e) {
        await new Promise((r) => setTimeout(r, retryRequestDelayMs));
      }
    }
    return [] as sqlData;
  };

  const readData = async (id: string) => {
    const data = await query(
      `SELECT value FROM ${tableName} WHERE id = ? AND session = ?`,
      [id, session]
    );
    if (!data[0]?.value) {
      return null;
    }
    const creds =
      typeof data[0].value === "object"
        ? JSON.stringify(data[0].value)
        : data[0].value;
    const credsParsed = JSON.parse(creds, BufferJSON.reviver);
    return credsParsed;
  };

  const writeData = async (id: string, value: object) => {
    const valueFixed = JSON.stringify(value, BufferJSON.replacer);
    await query(
      `INSERT INTO ${tableName} (session, id, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?`,
      [session, id, valueFixed, valueFixed]
    );
  };

  const removeData = async (id: string) => {
    await query(`DELETE FROM ${tableName} WHERE id = ? AND session = ?`, [
      id,
      session
    ]);
  };

  const clearAll = async () => {
    await query(
      `DELETE FROM ${tableName} WHERE id != 'creds' AND session = ?`,
      [session]
    );
  };

  const removeAll = async () => {
    await query(`DELETE FROM ${tableName} WHERE session = ?`, [session]);
  };

  const creds: AuthenticationCreds =
    (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds: creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          for (const id of ids) {
            let value = await readData(`${type}-${id}`);
            if (type === "app-state-sync-key" && value) {
              value = fromObject(value);
            }
            data[id] = value;
          }
          return data;
        },
        set: async (data) => {
          for (const category in data) {
            const categoryData = data[category as keyof typeof data];
            if (categoryData) {
              for (const id in categoryData) {
                const value = categoryData[id];
                const name = `${category}-${id}`;
                if (value) {
                  await writeData(name, value);
                } else {
                  await removeData(name);
                }
              }
            }
          }
        }
      }
    },
    saveCreds: async () => {
      await writeData("creds", creds);
    },
    clear: async () => {
      await clearAll();
    },
    removeCreds: async () => {
      await removeAll();
    },
    query: async (sql: string, values: string[]) => {
      return await query(sql, values);
    }
  };
};

// Export for backward compatibility
export { createAuth as useMySQLAuthState };

