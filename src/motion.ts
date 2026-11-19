export const gaitNames = ["기어가기", "빠르게 기어가기", "이족보행", "빠른 걸음", "달리기", "소닉 질주"];

export function motion(speed: number, distance: number) {
  const progress = Math.max(0, Math.min(5, (speed - 260) / 68));
  return {
    gait: Math.floor(progress),
    upright: Math.max(0, Math.min(1, progress - 1)),
    lean: Math.max(0, progress - 3) * 0.16,
    phase: distance / 32,
    intensity: progress / 5,
  };
}
