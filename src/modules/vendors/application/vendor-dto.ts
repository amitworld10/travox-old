import type { AccountDto } from "@/modules/accounts/application/account-dto";

export const serviceTypeLabels = ["Airline", "Hotel", "Rail", "Bus", "Cab", "DMC", "Visa", "Insurance", "Other"] as const;

export type ServiceTypeLabel = (typeof serviceTypeLabels)[number];

export type VendorDto = {
  id: string;
  orgId: string;
  name: string;
  serviceType: ServiceTypeLabel;
  pocName: string;
  phone: string;
  email: string;
  gstin: string;
  accountId: string;
  account: AccountDto | null;
  totalExpense: number;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
};

export type VendorInput = {
  name: string;
  serviceType: ServiceTypeLabel;
  pocName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  accountId?: string;
};

export type VendorListDto = {
  data: VendorDto[];
  count: number;
  stats: {
    totalVendors: number;
    linkedAccounts: number;
    totalExpense: number;
  };
};
