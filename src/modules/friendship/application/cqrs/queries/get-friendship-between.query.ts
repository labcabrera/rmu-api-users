/** The friendship of two users in either direction (spec 069). For other APIs, with the service token (admin). */
export class GetFriendshipBetweenQuery {
  constructor(
    public readonly userA: string,
    public readonly userB: string,
    public readonly roles: string[],
  ) {}
}
