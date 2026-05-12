import type { AccountDto } from "@/modules/accounts/application/account-dto";

export type CustomerDto = {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string;
  passportNo: string;
  aadhaarNo: string;
  visaNo: string;
  gstin: string;
  accountId: string;
  account: AccountDto | null;
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  name: string;
  phone?: string;
  email?: string;
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  accountId?: string;
};

export type CustomerListDto = {
  data: CustomerDto[];
  count: number;
  stats: {
    totalCustomers: number;
    linkedAccounts: number;
    totalSpent: number;
  };
};
