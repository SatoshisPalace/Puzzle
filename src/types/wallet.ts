export interface BazarProfile {
  Version: string;
  DateUpdated: number;
  DisplayName: string;
  DateCreated: number;
  ProfileImage: string;
  Description: string;
  CoverImage: string;
  UserName: string;
  ProfileId?: string;
}

declare global {
  interface Window {
    arweaveWallet: {
      connect: (permissions: string[]) => Promise<void>;
      disconnect: () => Promise<void>;
      getActiveAddress: () => Promise<string>;
      getPermissions: () => Promise<string[]>;
    };
  }
}
