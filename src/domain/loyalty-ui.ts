import { DEFAULT_LOYALTY, estimatePoints as est } from './loyalty';
import { freeNightPointsCost as fnc, maxRedeemablePoints as mrp } from './pricing';
import type { LoyaltyConfig, TierId } from './types';

/** Config-aware helpers used by the booking UI. */
export const estimatePoints = (total: number, tier: TierId, cfg: LoyaltyConfig = DEFAULT_LOYALTY) => est(total, tier, cfg);
export const maxRedeemablePoints = (amount: number, cfg: LoyaltyConfig) => mrp(amount, cfg.pointValue, cfg.maxRedeemShare);
export const freeNightPointsCost = (nightPrice: number, cfg: LoyaltyConfig) => fnc(nightPrice, cfg.pointValue);
