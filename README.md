# 거북이, 사고쳤다!

30초 동안 마트를 와장창 어지르는 모바일 웹 게임. 손가락을 누르고 원하는 방향으로 밀면 거북이가 움직입니다. 작은 물건부터 부수면서 성장해 진열대와 냉장고까지 밀어버리세요.

## 실행

Node.js 22.12+ 권장.

```sh
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

개발 서버 주소로 접속합니다. 휴대폰은 같은 Wi-Fi에서 Vite의 Network 주소로 접속하세요. `dist/`를 정적 호스팅에 배포할 수 있습니다. 외부 배포는 하지 않았습니다.

## 조작

- 화면을 누른 지점을 기준으로 드래그 → 그 방향으로 이동. 손을 떼면 정지.
- PC는 마우스 드래그 또는 방향키/WASD.
- 캔은 처음부터, 성장량 40에서 상자, 130에서 진열대, 270에서 냉장고를 부술 수 있습니다.
- 아직 못 부수는 큰 물건에는 작은 표시가 붙습니다. 돌아서 작은 물건을 먼저 밀어보세요.
- 1.5초 안에 연속 파괴하면 콤보. 5/10/15연속부터 점수가 2/3/4배가 됩니다.
- 한 판 30초. 결과창에서 바로 다시 시작할 수 있습니다. 최고 점수는 이 브라우저에 저장합니다.
- 일시정지·도움말·백그라운드·3D 최초 로딩 중엔 시간이 멈춥니다.
- 카툰과 3D는 같은 게임 상태를 사용합니다. 전환하면 드래그 입력은 안전하게 해제됩니다.

## 구성

- `src/game.ts`: 이동, 충돌, 성장, 콤보, 물건 배치, 30초 타이머.
- `src/cartoon.ts`: Canvas 2D 마트·거북이·파괴 연출.
- `src/toy.ts`: Three.js 장난감 마트. 선택 시 지연 로딩.
- `src/main.ts`, `src/style.css`: 가상 조이스틱·키보드 입력, HUD, 결과창, 효과음.
- `tests/game.test.ts`: 순수 게임 로직 회귀 테스트.
- `tests/browser.smoke.ts`: UI 입력을 통한 30초 플레이 테스트.

```js
const checks = await import('/tests/browser.smoke.ts');
await checks.checkDrag();
await checks.checkRound('cartoon');
await checks.checkRound('toy');
```

브라우저 테스트는 최고 기록을 갱신할 수 있습니다. `checkLoadingPause()`는 3D를 처음 여는 페이지에서 실행합니다.

## 첫 버전의 한계

물건 파괴는 직접 계산한 가벼운 튕김·회전 연출이며, 정밀한 물리 엔진은 아닙니다. 원본 그림과 모델은 코드로 제작했습니다. 효과음은 Web Audio 합성음이며 기본 음소거입니다. Google Fonts 연결이 안 되면 시스템 글꼴로 표시합니다. 실제 iPhone/Android 기기의 터치감과 성능은 추가 확인이 필요합니다.

기존 브레이크 게임 기록은 삭제하지 않고 새 저장 키를 사용합니다. 개발 도구의 picomatch 취약점은 이전 검사에서 수정 버전이 없어 남아 있으며, 배포 의존성은 `npm audit --omit=dev`로 따로 확인할 수 있습니다.

## 다음 작업

현재 게임의 재미 방향은 아직 실험 중입니다. [다음 세션 메모](docs/NEXT_SESSION.md)에 사용자 피드백과 이어갈 지점을 정리했습니다.
