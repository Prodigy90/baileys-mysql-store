export const isJidUser = (jid: string | undefined | null): boolean =>
  jid?.endsWith("@s.whatsapp.net") ?? false;
