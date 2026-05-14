export const MESSAGE_TYPES = ['info', 'alert'] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];
