export const gaitNames = ['기어가기', '빠르게 기어가기', '이족보행', '빠른 걸음', '달리기', '소닉 질주'];
export function motion(speed: number, distance: number) {
  const intensity = Math.max(0, Math.min(1, (speed - 420) / 180));
  return { gait: speed >= 540 ? 5 : 4, upright: 1, lean: .16 + intensity * .16,
    phase: distance / 32, intensity: .65 + intensity * .35 };
}
