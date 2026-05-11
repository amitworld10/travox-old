export type GoogleIdentity = {
  providerSub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

export type GoogleIdentityProvider = {
  verifyIdToken(idToken: string): Promise<GoogleIdentity>;
};
