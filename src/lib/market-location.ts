import type { UserProfile } from "@/types/user";
import { hamiltonRegions } from "@/config/marketplace";

export type MarketLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export const distanceFilterOptions = ["전체", "5km 이내", "10km 이내", "25km 이내", "50km 이내", "100km 이내"] as const;

const MARKET_LOCATION_COORDS: Record<string, MarketLocation> = {
  Auckland: { label: "Auckland", latitude: -36.8485, longitude: 174.7633 },
  "Auckland Central": { label: "Auckland Central", latitude: -36.8485, longitude: 174.7633 },
  CBD: { label: "CBD", latitude: -36.8485, longitude: 174.7633 },
  Newmarket: { label: "Newmarket", latitude: -36.8697, longitude: 174.7772 },
  "Mount Eden": { label: "Mount Eden", latitude: -36.877, longitude: 174.761 },
  Ponsonby: { label: "Ponsonby", latitude: -36.847, longitude: 174.744 },
  Parnell: { label: "Parnell", latitude: -36.856, longitude: 174.781 },
  Epsom: { label: "Epsom", latitude: -36.891, longitude: 174.775 },
  "Mount Albert": { label: "Mount Albert", latitude: -36.884, longitude: 174.714 },
  "Grey Lynn": { label: "Grey Lynn", latitude: -36.859, longitude: 174.737 },
  "North Shore": { label: "North Shore", latitude: -36.7939, longitude: 174.751 },
  Takapuna: { label: "Takapuna", latitude: -36.786, longitude: 174.772 },
  Devonport: { label: "Devonport", latitude: -36.828, longitude: 174.796 },
  Northcote: { label: "Northcote", latitude: -36.801, longitude: 174.747 },
  Glenfield: { label: "Glenfield", latitude: -36.782, longitude: 174.722 },
  Birkenhead: { label: "Birkenhead", latitude: -36.812, longitude: 174.727 },
  Albany: { label: "Albany", latitude: -36.728, longitude: 174.701 },
  Rosedale: { label: "Rosedale", latitude: -36.747, longitude: 174.725 },
  "Browns Bay": { label: "Browns Bay", latitude: -36.714, longitude: 174.746 },
  "West Auckland": { label: "West Auckland", latitude: -36.871, longitude: 174.633 },
  Henderson: { label: "Henderson", latitude: -36.881, longitude: 174.631 },
  "New Lynn": { label: "New Lynn", latitude: -36.908, longitude: 174.684 },
  Massey: { label: "Massey", latitude: -36.831, longitude: 174.61 },
  "Te Atatu Peninsula": { label: "Te Atatu Peninsula", latitude: -36.844, longitude: 174.651 },
  Titirangi: { label: "Titirangi", latitude: -36.938, longitude: 174.655 },
  "Glen Eden": { label: "Glen Eden", latitude: -36.912, longitude: 174.652 },
  Westgate: { label: "Westgate", latitude: -36.821, longitude: 174.608 },
  "East Auckland": { label: "East Auckland", latitude: -36.916, longitude: 174.91 },
  Howick: { label: "Howick", latitude: -36.894, longitude: 174.933 },
  Pakuranga: { label: "Pakuranga", latitude: -36.914, longitude: 174.874 },
  "Botany Downs": { label: "Botany Downs", latitude: -36.929, longitude: 174.914 },
  "Flat Bush": { label: "Flat Bush", latitude: -36.965, longitude: 174.92 },
  "Half Moon Bay": { label: "Half Moon Bay", latitude: -36.882, longitude: 174.902 },
  "Bucklands Beach": { label: "Bucklands Beach", latitude: -36.867, longitude: 174.908 },
  "South Auckland": { label: "South Auckland", latitude: -36.992, longitude: 174.879 },
  Manukau: { label: "Manukau", latitude: -36.992, longitude: 174.879 },
  Papatoetoe: { label: "Papatoetoe", latitude: -36.979, longitude: 174.852 },
  Mangere: { label: "Mangere", latitude: -36.969, longitude: 174.799 },
  Otahuhu: { label: "Otahuhu", latitude: -36.943, longitude: 174.843 },
  Takanini: { label: "Takanini", latitude: -37.048, longitude: 174.923 },
  Papakura: { label: "Papakura", latitude: -37.065, longitude: 174.943 },
  Pukekohe: { label: "Pukekohe", latitude: -37.201, longitude: 174.904 },
  Hamilton: { label: "Hamilton", latitude: -37.787, longitude: 175.2793 },
  Tauranga: { label: "Tauranga", latitude: -37.6878, longitude: 176.1651 },
  Wellington: { label: "Wellington", latitude: -41.2865, longitude: 174.7762 },
  "Lower Hutt": { label: "Lower Hutt", latitude: -41.212, longitude: 174.903 },
  Christchurch: { label: "Christchurch", latitude: -43.5321, longitude: 172.6362 },
  Dunedin: { label: "Dunedin", latitude: -45.8788, longitude: 170.5028 },
  "Palmerston North": { label: "Palmerston North", latitude: -40.3523, longitude: 175.6082 },
};

for (const region of hamiltonRegions) {
  if (!MARKET_LOCATION_COORDS[region]) {
    MARKET_LOCATION_COORDS[region] = { label: region, latitude: -37.787, longitude: 175.2793 };
  }
}

export function getUserMarketLocation(profile?: Pick<UserProfile, "city" | "suburb" | "tradeArea"> | null) {
  return getMarketLocation(profile?.suburb) ?? getMarketLocation(profile?.city) ?? getMarketLocation(profile?.tradeArea);
}

export function getMarketLocation(value?: string | null) {
  if (!value) return null;
  return MARKET_LOCATION_COORDS[value.trim()] ?? null;
}

export function getDistanceKm(from: MarketLocation | null | undefined, toRegion: string) {
  const to = getMarketLocation(toRegion);
  if (!from || !to) return null;

  return Math.round(haversineKm(from, to));
}

export function formatDistanceLabel(distanceKm: number | null | undefined) {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return "1km 미만";
  return `약 ${distanceKm.toLocaleString("ko-KR")}km`;
}

export function getDistanceLimitKm(option: string) {
  if (option === "전체") return null;
  const match = /^(\d+)km/.exec(option);
  return match ? Number(match[1]) : null;
}

function haversineKm(from: MarketLocation, to: MarketLocation) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
