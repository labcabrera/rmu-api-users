export class ListFriendInvitesQuery {
  constructor(public readonly userId: string) {}
}

export class CheckFriendInviteQuery {
  constructor(public readonly token: string) {}
}
