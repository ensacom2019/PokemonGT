(() => {
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBk7tpjvNpcyQhzqEz3HwrXbsQvOBdKOdQ',
    authDomain: 'pokemongt-224d2.firebaseapp.com',
    projectId: 'pokemongt-224d2',
    storageBucket: 'pokemongt-224d2.firebasestorage.app',
    messagingSenderId: '628240153353',
    appId: '1:628240153353:web:3c90ea5a55866f9f79b1d8',
  };
  const COLLECTION = 'pokemonGTournamentRankings';
  const MAX_ENTRIES = 10;
  const NICKNAME_KEY = 'pokemon-g-tournament-nickname';
  let auth;
  let db;
  let currentUser = null;
  let firebaseReady = false;
  let firebaseApi = null;

  const titleList = document.querySelector('#title-ranking-list');
  const titleState = document.querySelector('#title-ranking-state');
  const resultPanel = document.querySelector('#result-ranking');
  const resultList = document.querySelector('#result-ranking-list');
  const resultState = document.querySelector('#result-ranking-state');
  const googleButton = document.querySelector('#google-sign-in');
  const saveButton = document.querySelector('#save-ranking');
  const nicknameInput = document.querySelector('#ranking-nickname');
  const submitStatus = document.querySelector('#ranking-submit-status');

  const formatScore = (value) => String(Math.max(0, Math.floor(Number(value) || 0))).padStart(6, '0');
  const cleanNickname = (value) => String(value || '').trim().replace(/[<>]/g, '').slice(0, 16);
  const setSubmitStatus = (message, kind = '') => {
    submitStatus.textContent = message;
    submitStatus.className = `ranking-submit-status ${kind}`;
  };
  const setRankingState = (message) => {
    [titleState, resultState].forEach((element) => { if (element) element.textContent = message; });
  };
  const createEntry = (entry, rank) => {
    const item = document.createElement('li');
    item.className = 'ranking-entry';
    const rankEl = document.createElement('b');
    const name = document.createElement('strong');
    const partner = document.createElement('span');
    const run = document.createElement('small');
    rankEl.textContent = String(rank).padStart(2, '0');
    name.textContent = entry.nickname || '이름 없음';
    partner.textContent = entry.pokemon || '파트너 없음';
    run.textContent = `${Math.max(1, Number(entry.stage) || 1)} 층 · ${formatScore(entry.score)}`;
    item.append(rankEl, name, partner, run);
    return item;
  };
  const renderRanking = (entries) => {
    [titleList, resultList].forEach((list) => {
      if (!list) return;
      list.replaceChildren(...entries.map((entry, index) => createEntry(entry, index + 1)));
    });
    setRankingState(entries.length ? `상위 ${entries.length}명` : '아직 등록된 기록이 없습니다.');
  };
  const refreshRanking = async (firebase) => {
    if (!firebaseReady) return;
    setRankingState('랭킹을 불러오는 중입니다.');
    try {
      const records = await firebase.getDocs(firebase.query(
        firebase.collection(db, COLLECTION),
        firebase.orderBy('score', 'desc'),
        firebase.limit(50),
      ));
      const entries = records.docs
        .map((record) => record.data())
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(right.stage || 0) - Number(left.stage || 0))
        .slice(0, MAX_ENTRIES);
      renderRanking(entries);
    } catch (error) {
      setRankingState(error.code === 'permission-denied' ? '랭킹 규칙 배포를 기다리고 있습니다.' : '랭킹을 불러오지 못했습니다.');
    }
  };
  const updateAuthUi = async (firebase) => {
    const signedIn = Boolean(currentUser);
    const googleAction = signedIn ? 'Google 로그아웃' : 'Google로 로그인';
    googleButton.setAttribute('aria-label', googleAction);
    googleButton.setAttribute('title', googleAction);
    saveButton.disabled = !signedIn;
    if (!signedIn) {
      setSubmitStatus('Google 로그인 후 닉네임을 입력하세요.');
      return;
    }
    try {
      const profile = await firebase.getDoc(firebase.doc(db, COLLECTION, currentUser.uid));
      if (profile.exists() && profile.data().nickname) nicknameInput.value = profile.data().nickname;
      else nicknameInput.value = localStorage.getItem(NICKNAME_KEY) || '';
    } catch (error) {
      console.error(error);
    }
    setSubmitStatus('닉네임을 확인한 뒤 기록을 저장하세요.', 'ready');
  };
  const saveCurrentRun = async (firebase) => {
    const nickname = cleanNickname(nicknameInput.value);
    if (!currentUser) { setSubmitStatus('Google 로그인이 필요합니다.', 'error'); return; }
    if (nickname.length < 2) { setSubmitStatus('닉네임은 2~16자로 입력하세요.', 'error'); nicknameInput.focus(); return; }
    const partner = state.player?.name || pokemonById(state.selected)?.name || '파트너 없음';
    const stage = Math.max(1, Number(state.stage) || 1);
    const score = Math.max(0, Math.floor(Number(state.score) || 0));
    saveButton.disabled = true;
    setSubmitStatus('기록을 저장하는 중입니다.');
    try {
      const ref = firebase.doc(db, COLLECTION, currentUser.uid);
      const previous = await firebase.getDoc(ref);
      const old = previous.exists() ? previous.data() : null;
      const isBetter = !old || score > (Number(old.score) || 0) || (score === (Number(old.score) || 0) && stage > (Number(old.stage) || 0));
      await firebase.setDoc(ref, {
        userId: currentUser.uid,
        nickname,
        pokemon: isBetter ? partner : old.pokemon,
        stage: isBetter ? stage : Number(old.stage) || 1,
        score: isBetter ? score : Number(old.score) || 0,
        savedAt: firebase.serverTimestamp(),
      }, { merge:true });
      localStorage.setItem(NICKNAME_KEY, nickname);
      setSubmitStatus(isBetter ? '랭킹 기록을 저장했습니다.' : '기존 최고 기록을 유지합니다.', 'ready');
      await refreshRanking(firebase);
    } catch (error) {
      console.error(error);
      setSubmitStatus('저장에 실패했습니다. Firebase 설정을 확인하세요.', 'error');
    } finally {
      saveButton.disabled = !currentUser;
    }
  };
  const initialize = async () => {
    try {
      const [appModule, authModule, firestoreModule] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js'),
      ]);
      const app = appModule.getApps().find((item) => item.name === 'pokemon-g-tournament') || appModule.initializeApp(FIREBASE_CONFIG, 'pokemon-g-tournament');
      auth = authModule.getAuth(app);
      db = firestoreModule.getFirestore(app);
      firebaseApi = firestoreModule;
      firebaseReady = true;
      authModule.onAuthStateChanged(auth, async (user) => { currentUser = user; await updateAuthUi(firestoreModule); });
      googleButton.addEventListener('click', async () => {
        googleButton.disabled = true;
        try {
          if (currentUser) await authModule.signOut(auth);
          else await authModule.signInWithPopup(auth, new authModule.GoogleAuthProvider());
        } catch (error) {
          console.error(error);
          setSubmitStatus(error.code === 'auth/popup-closed-by-user' ? '로그인이 취소되었습니다.' : 'Google 로그인에 실패했습니다.', 'error');
        } finally { googleButton.disabled = false; }
      });
      saveButton.addEventListener('click', () => saveCurrentRun(firestoreModule));
      await refreshRanking(firestoreModule);
    } catch (error) {
      console.error(error);
      setRankingState('랭킹 연결에 실패했습니다.');
      setSubmitStatus('Firebase 연결을 확인하세요.', 'error');
    }
  };

  const originalFinishBattle = window.finishBattle;
  window.finishBattle = (winner) => {
    const defeated = winner?.side !== 'player';
    if (!defeated) resultPanel.hidden = true;
    originalFinishBattle?.(winner);
    if (!defeated) return;
    window.setTimeout(() => {
      resultPanel.hidden = false;
      if (firebaseReady && firebaseApi) refreshRanking(firebaseApi);
    }, 780);
  };

  const hideResultRanking = () => { resultPanel.hidden = true; };
  const originalStartBattle = window.startBattle;
  window.startBattle = (...args) => { hideResultRanking(); return originalStartBattle?.(...args); };
  const originalStartNextBattle = window.startNextBattle;
  window.startNextBattle = (...args) => { hideResultRanking(); return originalStartNextBattle?.(...args); };

  initialize();
})();
