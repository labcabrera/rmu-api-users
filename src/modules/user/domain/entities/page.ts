export interface Page<I> {
  content: I[];
  pagination: Pagination;
}

export class Pagination {
  public readonly totalPages: number;
  constructor(
    public readonly page: number,
    public readonly size: number,
    public readonly totalElements: number,
  ) {
    this.totalPages = Math.ceil(totalElements / size);
  }
}
