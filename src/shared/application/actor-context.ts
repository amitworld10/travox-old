export type ActorContext = {
  userId: string;
  orgId: string;
  email?: string;
  roles: string[];
  permissions: string[];
};
