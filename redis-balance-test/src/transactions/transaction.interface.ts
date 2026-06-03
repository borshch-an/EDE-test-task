export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  gameId?: string;
  timestamp: string;
  action_id: string;
}
