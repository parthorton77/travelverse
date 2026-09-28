import { destinations } from "@/data/destinations";
import { dining, experiences } from "@/data/experiences";
import type { Destination, Dining, Experience } from "@/lib/types";

export interface SignatureExperience {
  experience: Experience;
  destination: Destination;
}

/** Activities & dining access (sample data; swap for an activities marketplace API). */
export const experienceService = {
  async listForDestination(destinationId: string): Promise<Experience[]> {
    return experiences.filter((e) => e.destinationId === destinationId);
  },

  async diningForDestination(destinationId: string): Promise<Dining[]> {
    return dining.filter((d) => d.destinationId === destinationId);
  },

  /** Hand-picked "signature" experiences for the Immersive Experiences showcase. */
  async signature(limit = 8): Promise<SignatureExperience[]> {
    const out: SignatureExperience[] = [];
    for (const dest of destinations) {
      const exp = experiences.find((e) => e.destinationId === dest.id && e.signature);
      if (exp) out.push({ experience: exp, destination: dest });
    }
    return out.slice(0, limit);
  },
};
