export type Point3 = [number, number, number];

export const CRANK_CENTER: Point3 = [.025, .425, 0];
export const CRANK_RADIUS = .115;
export const CADENCE = 3.4;
export const THIGH_LENGTH = .43;
export const SHIN_LENGTH = .425;

// Travel is +X: both wheels and cranks rotate clockwise when viewed from +Z.
export function cyclingPose(t: number, side: number) {
 const angle = -t * CADENCE + (side === 1 ? 0 : Math.PI);
 const pedal: Point3 = [
  CRANK_CENTER[0] + Math.cos(angle) * CRANK_RADIUS,
  CRANK_CENTER[1] + Math.sin(angle) * CRANK_RADIUS,
  side * .18,
 ];
 // The ball of the foot rests on the pedal; the ankle sits behind and above it.
 const ankle: Point3 = [pedal[0] - .060, pedal[1] + .058, pedal[2]];
 const hip: Point3 = [-.18, 1.08, side * .095];
 const delta = ankle.map((v, i) => v - hip[i]);
 const distance = Math.hypot(...delta);
 const axis = delta.map(v => v / distance);
 const planar = Math.hypot(axis[0], axis[1]);
 const forward = [-axis[1] / planar, axis[0] / planar, 0];
 const along = (THIGH_LENGTH ** 2 - SHIN_LENGTH ** 2 + distance ** 2) / (2 * distance);
 const bend = Math.sqrt(Math.max(0, THIGH_LENGTH ** 2 - along ** 2));
 const knee = hip.map((v, i) => v + axis[i] * along + forward[i] * bend) as Point3;
 return {angle, pedal, ankle, hip, knee};
}
