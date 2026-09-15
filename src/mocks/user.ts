import type { ISODate, UserProfile } from "@/types/finance";

export const mockUser: UserProfile = {
  firstName: "Carlos",
  lastName: "Rivas",
  initials: "CR",
};

/** Every date in the demo lives in September 2026 (spec §89). */
export const MOCK_TODAY: ISODate = "2026-09-15";
