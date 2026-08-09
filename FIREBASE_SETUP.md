# Firebase 랭킹 연결

랭킹은 기존 Firebase 프로젝트의 `pokemonGTournamentRankings` 컬렉션을 사용한다.

## 처음 한 번만 할 설정

1. Firebase Console에서 해당 프로젝트를 연다.
2. **Firestore Database → Rules**에서 이 폴더의 `firestore.rules` 전체 내용을 붙여 넣고 **Publish**한다.
3. **Authentication → Sign-in method**에서 Google 제공업체를 활성화한다.
4. **Authentication → Settings → Authorized domains**에 실제 Firebase Hosting 도메인을 추가한다. 로컬 점검을 할 경우 `localhost`도 추가한다.

## 저장 방식

- 사용자가 패배하면 Google 로그인과 닉네임 입력 후 기록을 저장할 수 있다.
- 기록 항목은 닉네임, 선택한 파트너 포켓몬, 진행 층, 총점수다.
- 계정당 최고 점수 하나만 유지하고, 점수가 같으면 더 높은 층 기록으로 갱신한다.
