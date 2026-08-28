export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}
