import { FLAGSHIP_STAY_ID, stays } from "@/data/hotels";
import type { Stay, StayTier } from "@/lib/types";

/** Stay inventory access (sample data; swap for a hotel/channel-manager API). */
export const hotelService = {
  async listByTier(tier: StayTier): Promise<Stay[]> {
    return stays.filter((s) => s.tier === tier);
  },

  async get(id: string): Promise<Stay | null> {
    return stays.find((s) => s.id === id) ?? null;
  },

  async listForDestination(destinationId: string): Promise<Stay[]> {
    return stays.filter((s) => s.destinationId === destinationId);
  },

  /** The property with a walkable 3D environment ("Walk Before You Book"). */
  getFlagshipSync(): Stay {
    const stay = stays.find((s) => s.id === FLAGSHIP_STAY_ID);
    if (!stay) throw new Error("Flagship stay missing from catalogue");
    return stay;
  },
};
