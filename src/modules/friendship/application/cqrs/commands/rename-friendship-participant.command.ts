/** A user changed their name: the friendships and invites that keep a copy of it follow. */
export class RenameFriendshipParticipantCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
  ) {}
}
