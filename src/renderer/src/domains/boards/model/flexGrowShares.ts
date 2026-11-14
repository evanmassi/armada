// PITFALL: flex items whose grow factors sum below 1 take only that fraction of the free space, so a lone tile at weight 0.6 would leave 40% empty.
export const flexGrowShares = (weights: number[]): number[] => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (total > 0 ? weight / total : 0));
};
