export type AccountDto = {
  id: string;
  orgId: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  accountNo: string;
  upiId: string;
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountInput = {
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  accountNo?: string;
  upiId?: string;
  isActive?: boolean;
};
