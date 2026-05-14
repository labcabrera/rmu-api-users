import { MessageType } from '../value-objects/message-type.vo';

export interface UserMessageProps {
  id: string;
  userId: string;
  from: string;
  message: string;
  type: MessageType;
  readed: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}
