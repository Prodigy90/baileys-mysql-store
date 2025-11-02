/**
 * Custom types for MySQL Store
 * These types extend the base Baileys types for database operations
 */

import type { GroupMetadata } from '@whiskeysockets/baileys'

/**
 * Database row representation of group metadata
 */
export interface GroupMetadataRow {
subject: string
is_admin: boolean
group_index: number
admin_index: number
participating: boolean
metadata: GroupMetadata
}

/**
 * Formatted group metadata entry
 */
export interface GroupMetadataEntry {
id: string
subject: string
isAdmin: boolean
groupIndex: number
adminIndex: number
metadata: GroupMetadata
}

/**
 * Result structure for group metadata queries
 */
export interface GroupMetadataResult {
allGroups: {
id: string
subject: string
groupIndex: number
}[]
adminGroups: {
id: string
subject: string
adminIndex: number
participants: string[]
}[]
}

/**
 * Map of message types to their string representations
 * Used for caching and database storage
 */
export const messageTypeMap: Record<string, string> = {
extendedTextMessage: 'text',
audioMessage: 'audio',
videoMessage: 'video',
imageMessage: 'image',
documentMessage: 'document',
stickerMessage: 'sticker',
contactMessage: 'contact',
locationMessage: 'location',
liveLocationMessage: 'liveLocation',
contactsArrayMessage: 'contact_array',
groupInviteMessage: 'group_invite',
templateMessage: 'template',
templateButtonReplyMessage: 'template_button_reply',
productMessage: 'product',
deviceSentMessage: 'device_sent',
messageContextInfo: 'context_info',
listMessage: 'list',
viewOnceMessage: 'view_once',
reactionMessage: 'reaction',
stickerSyncRmrMessage: 'sticker_sync',
interactiveMessage: 'interactive',
pollCreationMessage: 'poll',
pollUpdateMessage: 'poll_update',
}
