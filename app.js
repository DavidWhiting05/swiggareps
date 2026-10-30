const STORAGE_KEY = 'gymbuddy-workouts';
const FEED_KEY = 'gymbuddy-feed';
const AUTH_KEY = 'gymbuddy-current-user';

const squad = ['Jayden', 'Ezra', 'David'];

const defaultWorkouts = [];
const defaultFeed = [];

const badgeDefinitions = [
  {
    id: 'streak-starter',
    name: 'Streak Starter',
    description: 'Complete 3 workouts in a row.',
    icon: 'S',
    requirement: 3,
    metric: 'workoutsInARow'
  },
  {
    id: 'pr-hunter',
    name: 'PR Hunter',
    description: 'Hit a personal record of 20 lb or more.',
    icon: 'P',
    requirement: 20,
    metric: 'prLift'
  },
  {
    id: 'volume-builder',
    name: 'Volume Builder',
    description: 'Reach 10k lb total training volume in a week.',
    icon: 'V',
    requirement: 10000,
    metric: 'weeklyVolume'
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Log workouts for 5 straight days.',
    icon: 'C',
    requirement: 5,
    metric: 'daysStreak'
  },
  {
    id: 'top-3-finish',
    name: 'Top 3 Finish',
    description: 'Finish in the top 3 of the leaderboard.',
    icon: 'T',
    requirement: 3,
    metric: 'leaderboardRank'
  },
  {
    id: 'recovery-focus',
    name: 'Recovery Focus',
    description: 'Take at least 2 rest days and keep the weekly plan balanced.',
    icon: 'R',
    requirement: 2,
    metric: 'restDays'
  }
];

function isLegacySampleData(data) {
  return Array.isArray(data) && data.some((item) => item.exercise === 'Deadlift' || item.text === 'PR day: deadlift moved 20 lb heavier than last week.');
}

function loadWorkouts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWorkouts));
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    if (isLegacySampleData(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse workouts', error);
    return [];
  }
}

function saveWorkouts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function loadFeed() {
  const saved = localStorage.getItem(FEED_KEY);
  if (!saved) {
    localStorage.setItem(FEED_KEY, JSON.stringify(defaultFeed));
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && isLegacySampleData(parsed)) {
      localStorage.setItem(FEED_KEY, JSON.stringify([]));
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse feed', error);
    return [];
  }
}

function saveFeed() {
  localStorage.setItem(FEED_KEY, JSON.stringify(feed));
}

function getSavedUser() {
  const saved = localStorage.getItem(AUTH_KEY);
  return saved ? JSON.parse(saved) : null;
}

function setUser(userName) {
  currentUser = userName;
  localStorage.setItem(AUTH_KEY, JSON.stringify(userName));
  currentUserName.textContent = userName;
  authView.classList.add('hidden');
  appView.classList.remove('hidden');
  renderAll();
}

function getVolumeForWorkout(workout) {
  return workout.sets * workout.reps * workout.weight;
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T12:00:00');
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function renderPersonalCard() {
  const members = squad.map((person) => {
    const personWorkouts = workouts.filter((w) => w.friend === person);
    const totalVolume = personWorkouts.reduce((sum, workout) => sum + getVolumeForWorkout(workout), 0);
    const bestPr = personWorkouts.reduce((max, workout) => Math.max(max, workout.weight), 0);
    return { person, totalVolume, bestPr, workouts: personWorkouts.length };
  });

  const me = members.find((member) => member.person === currentUser) || members[0];

  personalCard.innerHTML = `
    <div class="card-header">
      <div class="small-avatar">${me.person.charAt(0)}</div>
      <div>
        <strong>${me.person}</strong>
        <span>${me.workouts} sessions</span>
      </div>
    </div>
    <div class="card-metrics">
      <div>
        <span>Volume</span>
        <strong>${Math.round(me.totalVolume / 1000)}k lb</strong>
      </div>
      <div>
        <span>PR</span>
        <strong>${me.bestPr} lb</strong>
      </div>
    </div>
  `;
}

function renderSummaryCards() {
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, workout) => sum + getVolumeForWorkout(workout), 0);
  const uniqueMembers = new Set(workouts.map((w) => w.friend)).size;
  const bestPr = workouts.reduce((max, workout) => Math.max(max, workout.weight), 0);

  const cards = [
    { label: 'Workouts', value: totalWorkouts },
    { label: 'Volume', value: `${Math.round(totalVolume / 1000)}k lb` },
    { label: 'Squad', value: uniqueMembers },
    { label: 'PR', value: `${bestPr} lb` }
  ];

  summaryCards.innerHTML = cards
    .map(
      (card) => `
        <div class="stat-card">
          <span class="label">${card.label}</span>
          <strong>${card.value}</strong>
        </div>
      `
    )
    .join('');
}

function renderLeaderboard() {
  const leaderboard = squad
    .map((person) => {
      const personWorkouts = workouts.filter((w) => w.friend === person);
      const totalVolume = personWorkouts.reduce((sum, workout) => sum + getVolumeForWorkout(workout), 0);
      return { person, totalVolume, workouts: personWorkouts.length };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume);

  leaderboardList.innerHTML = leaderboard
    .map(
      ({ person, totalVolume, workouts: count }, index) => `
        <div class="friend-row">
          <div class="friend-index">#${index + 1}</div>
          <div>
            <div class="friend-name">${person}</div>
            <div class="friend-meta">${count} sessions</div>
          </div>
          <div class="friend-points">${Math.round(totalVolume / 1000)}k lb</div>
        </div>
      `
    )
    .join('');
}

function renderWorkoutHistory() {
  const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

  workoutList.innerHTML = sorted
    .map(
      (workout) => `
        <article class="workout-item">
          <div>
            <div class="workout-title">${workout.friend} · ${workout.exercise}</div>
            <div class="workout-meta">${formatDate(workout.date)}</div>
            <div class="workout-detail">
              <span>${workout.sets} sets</span>
              <span>${workout.reps} reps</span>
              <span>${workout.weight} lb</span>
            </div>
            ${workout.notes ? `<div class="workout-note">${workout.notes}</div>` : ''}
          </div>
          <span class="workout-badge">${Math.round((workout.sets * workout.reps * workout.weight) / 1000)}k</span>
        </article>
      `
    )
    .join('');
}

function renderChallenges() {
  const challengeData = [
    { title: '3 Workouts This Week', value: 'In progress', progress: 2, total: 3 },
    { title: 'PR Push', value: 'Bench +10 lb', progress: 1, total: 1 },
    { title: 'Consistency Streak', value: '5 day streak', progress: 5, total: 7 }
  ];

  challengeList.innerHTML = challengeData
    .map(
      (challenge) => `
        <div class="challenge-item">
          <div class="challenge-topline">
            <strong>${challenge.title}</strong>
            <span>${challenge.value}</span>
          </div>
          <div class="progress-track">
            <span style="width:${(challenge.progress / challenge.total) * 100}%"></span>
          </div>
        </div>
      `
    )
    .join('');
}

function renderBadges() {
  const earnedSet = new Set(['Streak Starter', 'PR Hunter']);

  badgeList.innerHTML = badgeDefinitions
    .map((badge) => {
      const isEarned = earnedSet.has(badge.name);
      return `
        <div class="badge ${isEarned ? 'earned' : ''}">
          <div class="badge-icon">${badge.icon}</div>
          <div class="badge-copy">
            <strong>${badge.name}</strong>
            <span>${badge.description}</span>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderFeed() {
  if (!feed.length) {
    feedList.innerHTML = '<p class="muted">No updates yet.</p>';
    return;
  }

  feedList.innerHTML = [...feed].reverse()
    .map(
      (post) => `
        <article class="feed-item">
          <div class="feed-header">
            <strong>${post.author}</strong>
            <span>${post.time}</span>
          </div>
          <p>${post.text}</p>
        </article>
      `
    )
    .join('');
}

function getWeeklyVolume() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  return workouts
    .filter((workout) => new Date(workout.date + 'T12:00:00') >= start)
    .reduce((sum, workout) => sum + getVolumeForWorkout(workout), 0);
}

function getStreak() {
  if (!workouts.length) return 0;

  const uniqueDates = [...new Set(workouts.map((w) => w.date))].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let cursor = new Date();

  while (uniqueDates.includes(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function renderProgressChart() {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = Array(7).fill(0);

  workouts.forEach((workout) => {
    const date = new Date(workout.date + 'T12:00:00');
    const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
    values[index] += getVolumeForWorkout(workout) / 50;
  });

  const maxValue = Math.max(...values, 1);

  progressChart.innerHTML = labels
    .map(
      (label, index) => `
        <div class="bar-col">
          <div class="bar" style="height:${Math.max((values[index] / maxValue) * 140, 18)}px"></div>
          <div class="bar-label">${label}</div>
        </div>
      `
    )
    .join('');

  const bestPr = workouts.reduce((max, workout) => Math.max(max, workout.weight), 0);
  const weekly = getWeeklyVolume();
  const streak = getStreak();

  bestPrEl.textContent = `${bestPr} lb`;
  weeklyVolumeEl.textContent = `${Math.round(weekly / 1000)}k lb`;
  streakEl.textContent = `${streak} days`;
}

function resetForm() {
  const defaultDate = new Date().toISOString().slice(0, 10);
  dateInput.value = defaultDate;
  friendSelect.value = currentUser || squad[0];
  document.getElementById('exercise').value = '';
  document.getElementById('sets').value = '4';
  document.getElementById('reps').value = '8';
  document.getElementById('weight').value = '135';
  document.getElementById('notes').value = '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const workout = {
    id: Date.now(),
    friend: document.getElementById('friend').value,
    date: document.getElementById('date').value,
    exercise: document.getElementById('exercise').value.trim(),
    sets: Number(document.getElementById('sets').value),
    reps: Number(document.getElementById('reps').value),
    weight: Number(document.getElementById('weight').value),
    notes: document.getElementById('notes').value.trim()
  };

  if (!workout.exercise || !workout.date) return;

  workouts.push(workout);
  saveWorkouts();

  if (supabase) {
    await persistWorkoutToCloud(workout);
    await syncFromSupabase();
  }

  renderAll();
  resetForm();
});

const feedForm = document.getElementById('feedForm');
const feedInput = document.getElementById('feedInput');
const feedSubmitButton = document.getElementById('feedSubmit');

function submitFeedPost() {
  const text = (feedInput.value || '').trim();
  if (!text || !currentUser) return;

  const post = {
    id: Date.now(),
    author: currentUser,
    text,
    time: 'Just now'
  };

  feed.push(post);
  saveFeed();

  if (supabase) {
    persistFeedToCloud(post).then(() => syncFromSupabase());
  }

  renderFeed();
  feedInput.value = '';
  feedInput.focus();
}

if (feedSubmitButton) {
  feedSubmitButton.addEventListener('click', submitFeedPost);
}

if (feedForm) {
  feedForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    submitFeedPost();
  });

  feedInput.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      submitFeedPost();
    }
  });
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    navButtons.forEach((navButton) => navButton.classList.toggle('active', navButton === button));
    const section = document.getElementById(button.dataset.target);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const profileCards = document.querySelectorAll('.profile-card');

profileCards.forEach((card) => {
  card.addEventListener('click', () => {
    const selectedUser = card.dataset.user;
    if (!selectedUser) return;
    setUser(selectedUser);
  });
});

const suggestionsGrid = document.getElementById('suggestionsGrid');

const suggestionList = [
  { title: 'Add 1 top set', body: 'Use your first heavy set to gauge energy before loading up on volume.' },
  { title: 'Keep rest honest', body: 'Aim for consistent rest timing so your output stays comparable across sessions.' },
  { title: 'Log the win', body: 'Capture one note after every workout to track what felt strong or weak.' }
];

function renderSuggestions() {
  suggestionsGrid.innerHTML = suggestionList
    .map(
      (item, index) => `
        <div class="suggestion-item">
          <span class="suggestion-number">0${index + 2}</span>
          <strong>${item.title}</strong>
          <p>${item.body}</p>
        </div>
      `
    )
    .join('');
}

function renderAll() {
  renderSummaryCards();
  renderPersonalCard();
  renderSuggestions();
  renderLeaderboard();
  renderBadges();
  renderFeed();
  renderProgressChart();
}

function initialize() {
  friendSelect.innerHTML = squad.map((person) => `<option value="${person}">${person}</option>`).join('');

  if (supabase) {
    syncFromSupabase();
  }

  if (currentUser) {
    currentUserName.textContent = currentUser;
    authView.classList.add('hidden');
    appView.classList.remove('hidden');
  } else {
    authView.classList.remove('hidden');
    appView.classList.add('hidden');
  }

  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  resetForm();
  renderAll();
}

const supabaseConfig = window.swiggaSupabaseConfig || {};
const supabaseEnabled = !!(supabaseConfig.url && supabaseConfig.url !== 'https://YOUR_PROJECT_REF.supabase.co' && supabaseConfig.anonKey && supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY');

const supabase = supabaseEnabled ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;

async function fetchSupabaseData(tableName) {
  if (!supabase) return null;

  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Supabase fetch failed for ${tableName}:`, error);
    return null;
  }

  return data || [];
}

async function saveSupabaseData(tableName, row) {
  if (!supabase) return false;

  const { error } = await supabase.from(tableName).insert(row);
  if (error) {
    console.error(`Supabase insert failed for ${tableName}:`, error);
    return false;
  }

  return true;
}

async function syncFromSupabase() {
  if (!supabase) return;

  const sharedWorkouts = await fetchSupabaseData('workouts');
  const sharedFeed = await fetchSupabaseData('feed');

  if (sharedWorkouts) {
    const normalized = sharedWorkouts.map((item) => ({
      id: item.id,
      friend: item.friend,
      date: item.date,
      exercise: item.exercise,
      sets: Number(item.sets),
      reps: Number(item.reps),
      weight: Number(item.weight),
      notes: item.notes || ''
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    workouts.length = 0;
    normalized.forEach((row) => workouts.push(row));
  }

  if (sharedFeed) {
    const normalized = sharedFeed.map((item) => ({
      id: item.id,
      author: item.author,
      text: item.text,
      time: item.time || 'Just now'
    }));

    localStorage.setItem(FEED_KEY, JSON.stringify(normalized));
    feed.length = 0;
    normalized.forEach((row) => feed.push(row));
  }
}

async function persistWorkoutToCloud(workout) {
  if (!supabase) return false;
  return saveSupabaseData('workouts', workout);
}

async function persistFeedToCloud(post) {
  if (!supabase) return false;
  return saveSupabaseData('feed', post);
}

initialize();
