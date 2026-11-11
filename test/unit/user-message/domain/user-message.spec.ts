import { UserMessage } from '../../../../src/modules/user-message/domain/aggregates/user-message.js';

describe('UserMessage.markAsRead', () => {
  it('keeps the first read date [F-users-26]', () => {
    const message = UserMessage.create({ userId: 'u-1', from: 'u-2', message: 'Hi', type: 'info' });
    const first = new Date('2026-01-01T00:00:00Z');
    message.markAsRead(first);
    message.restoreVersion(1);
    message.markAsRead(new Date('2026-02-01T00:00:00Z'));
    expect(message.readed).toEqual(first);
    expect(message.hasChanges()).toBe(false);
  });
});
