import type { City } from "@/lib/types";

/** Departure cities supported by the planner (sample set). */
export const departureCities: City[] = [
  { id: "ahmedabad", name: "Ahmedabad", airportCode: "AMD", coordinates: { lat: 23.0225, lng: 72.5714 }, aliases: ["amdavad", "amd"] },
  { id: "mumbai", name: "Mumbai", airportCode: "BOM", coordinates: { lat: 19.076, lng: 72.8777 }, aliases: ["bombay", "bom"] },
  { id: "delhi", name: "Delhi", airportCode: "DEL", coordinates: { lat: 28.6139, lng: 77.209 }, aliases: ["new delhi", "ncr", "gurgaon", "noida"] },
  { id: "bengaluru", name: "Bengaluru", airportCode: "BLR", coordinates: { lat: 12.9716, lng: 77.5946 }, aliases: ["bangalore", "blr"] },
  { id: "hyderabad", name: "Hyderabad", airportCode: "HYD", coordinates: { lat: 17.385, lng: 78.4867 } },
  { id: "chennai", name: "Chennai", airportCode: "MAA", coordinates: { lat: 13.0827, lng: 80.2707 }, aliases: ["madras"] },
  { id: "kolkata", name: "Kolkata", airportCode: "CCU", coordinates: { lat: 22.5726, lng: 88.3639 }, aliases: ["calcutta"] },
  { id: "pune", name: "Pune", airportCode: "PNQ", coordinates: { lat: 18.5204, lng: 73.8567 } },
  { id: "jaipur", name: "Jaipur", airportCode: "JAI", coordinates: { lat: 26.9124, lng: 75.7873 } },
  { id: "kochi", name: "Kochi", airportCode: "COK", coordinates: { lat: 9.9312, lng: 76.2673 }, aliases: ["cochin"] },
  { id: "surat", name: "Surat", airportCode: "STV", coordinates: { lat: 21.1702, lng: 72.8311 } },
  { id: "vadodara", name: "Vadodara", airportCode: "BDQ", coordinates: { lat: 22.3072, lng: 73.1812 }, aliases: ["baroda"] },
  { id: "lucknow", name: "Lucknow", airportCode: "LKO", coordinates: { lat: 26.8467, lng: 80.9462 } },
  { id: "chandigarh", name: "Chandigarh", airportCode: "IXC", coordinates: { lat: 30.7333, lng: 76.7794 } },
];

export const DEFAULT_DEPARTURE_ID = "ahmedabad";
