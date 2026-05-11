export type TransactionPort = {
  run<T>(operation: () => Promise<T>): Promise<T>;
};
