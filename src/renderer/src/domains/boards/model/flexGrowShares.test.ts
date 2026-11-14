import { describe, expect, it } from 'vitest';
import { flexGrowShares } from './flexGrowShares';

describe('flexGrowShares', () => {
  it('gives a lone item below weight 1 the whole space', () => {
    expect(flexGrowShares([0.6])).toEqual([1]);
  });

  it('keeps proportions while summing to 1', () => {
    expect(flexGrowShares([0.25, 0.75, 0])).toEqual([0.25, 0.75, 0]);
    expect(flexGrowShares([1, 3])).toEqual([0.25, 0.75]);
  });

  it('gives nothing when every weight is zero', () => {
    expect(flexGrowShares([0, 0])).toEqual([0, 0]);
  });
});
