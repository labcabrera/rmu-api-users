export interface AcceptFriendRequestCommand {
  readonly id: string;
  readonly status: 'accepted' | 'rejected';
}
