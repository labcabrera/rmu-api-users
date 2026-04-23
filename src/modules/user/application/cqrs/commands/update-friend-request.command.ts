export interface FriendshipResponseCommand {
  readonly id: string;
  readonly status: 'accepted' | 'rejected';
}
