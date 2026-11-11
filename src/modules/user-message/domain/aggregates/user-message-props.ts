import type { MessageType } from '../value-objects/message-type.vo.js';

export interface UserMessageProps {
  id: string;
  userId: string;
  from: string;
  message: string;
  type: MessageType;
  readed: Date | null;
  createdAt: Date;
}
