import { type Pool } from 'mysql2/promise'
import pino from 'pino'
import { proto } from '@whiskeysockets/baileys'
import type makeWASocket from '@whiskeysockets/baileys'
import {
type BaileysEventEmitter,
type Chat,
type ConnectionState,
type Contact,
type GroupMetadata,
type GroupMetadataResult,
type GroupMetadataRow
} from '@whiskeysockets/baileys'
import { OptimizedMySQLStore } from './optimized-mysql-store.js'

type WASocket = ReturnType<typeof makeWASocket>

interface makeMySQLStoreFunc {
state: ConnectionState | null
bind: (ev: BaileysEventEmitter) => Promise<void>
loadMessage: (id: string) => Promise<proto.IWebMessageInfo | undefined>
loadAllGroupsMetadata: () => Promise<GroupMetadata[]>
customQuery: (query: string, params?: unknown[]) => Promise<unknown>
getAllChats: () => Promise<Chat[]>
getAllContacts: () => Promise<Contact[]>
getAllSavedContacts: () => Promise<Contact[]>
fetchAllGroupsMetadata: (sock: WASocket | undefined) => Promise<GroupMetadataResult>
getChatById: (jid: string) => Promise<Chat | undefined>
getContactById: (jid: string) => Promise<Contact | undefined>
getGroupByJid: (jid: string) => Promise<GroupMetadataRow | null>
}
