export interface IdentityUserDto {
  id: string;
  userName: string;
  name?: string | null;
  surname?: string | null;
  email?: string | null;
}

export interface UserListResultDto {
  totalCount: number;
  items: IdentityUserDto[];
}
