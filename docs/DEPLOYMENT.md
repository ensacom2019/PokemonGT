# 포켓몬 G 토너먼트 배포 메모

## 현재 연결 정보

- Firebase 프로젝트: `pokemongt-224d2`
- Firestore 리전: `asia-northeast3` (서울)
- 랭킹 컬렉션: `pokemonGTournamentRankings`
- 공개 주소: GitHub Pages `https://ensacom2019.github.io/PokemonGT/`

## 배포 구성

- 정적 게임 파일은 GitHub 저장소 `ensacom2019/PokemonGT`의 `main` 브랜치 루트에서 제공한다.
- `.nojekyll`을 두어 GitHub Pages가 게임의 정적 리소스를 그대로 제공하도록 한다.
- Firestore 규칙은 `firebase/firestore.rules`에 보관한다. 읽기는 공개하고, 쓰기는 Google 로그인 사용자가 자신의 최고 기록만 저장·갱신할 수 있도록 제한한다.
- Firebase Authentication의 Google 로그인과 `ensacom2019.github.io` 승인 도메인을 활성화했다.

## 다음 작업 시 참고

- 게임 규칙·UI·에셋을 변경한 뒤에는 이 문서와 `WORKLOG.md`에 변경 내역을 남긴다.
- 새 Firebase 프로젝트로 옮길 경우 `ranking-firebase.js`의 웹 앱 설정과 Firestore 규칙을 함께 교체한다.
