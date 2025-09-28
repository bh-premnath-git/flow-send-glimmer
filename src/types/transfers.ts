export type TransferStatus = 'pending' | 'active' | 'completed';

export interface TransferHistoryEntry {
  id: string;
  fromCountry: string;
  toCountry: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  status: TransferStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
