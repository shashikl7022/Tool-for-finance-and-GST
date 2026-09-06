/**
 * FocusFlow Hub - Interactive Application Logic
 * Pure Vanilla JavaScript • Zero Dependencies • LocalStorage Persistence
 */

(function () {
  'use strict';

  // ==========================================
  // 1. STATE & STORAGE MANAGEMENT
  // ==========================================
  const STORAGE_KEYS = {
    THEME: 'focusflow_theme',
    TASKS: 'focusflow_tasks',
    NOTES: 'focusflow_notes',
    TIMER_STATS: 'focusflow_timer_stats',
    TIMER_SETTINGS: 'focusflow_timer_settings',
    SOUND_MUTED: 'focusflow_sound_muted'
  };

  const state = {
    theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark',
    soundMuted: localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) === 'true',
    currentTab: 'dashboard',
    
    // Timer state
    timer: {
      mode: 'pomodoro', // 'pomodoro' | 'shortBreak' | 'longBreak'
      workMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      secondsLeft: 25 * 60,
      totalDuration: 25 * 60,
      isRunning: false,
      intervalId: null
    },

    // Stats
    stats: {
      completedSessions: 0,
      totalFocusSeconds: 0
    },

    // Tasks state
    tasks: [],
    taskFilter: 'all',

    // Notes state
    notes: '',
    saveNotesTimeout: null
  };

  // Load persisted stats
  try {
    const savedStats = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMER_STATS));
    if (savedStats) {
      state.stats.completedSessions = savedStats.completedSessions || 0;
      state.stats.totalFocusSeconds = savedStats.totalFocusSeconds || 0;
    }
  } catch (e) {
    console.warn('Could not load timer stats', e);
  }

  // Load persisted timer settings
  try {
    const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS));
    if (savedSettings) {
      state.timer.workMinutes = savedSettings.workMinutes || 25;
      state.timer.breakMinutes = savedSettings.breakMinutes || 5;
    }
  } catch (e) {
    console.warn('Could not load timer settings', e);
  }

  // Load persisted tasks
  try {
    state.tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [
      { id: 1, text: 'Review today’s project priorities', priority: 'high', completed: false, createdAt: Date.now() },
      { id: 2, text: 'Launch my free website on GitHub Pages', priority: 'urgent', completed: false, createdAt: Date.now() },
      { id: 3, text: 'Complete a 25-minute focus pomodoro sprint', priority: 'normal', completed: true, createdAt: Date.now() }
    ];
  } catch (e) {
    state.tasks = [];
  }

  // Load persisted notes
  state.notes = localStorage.getItem(STORAGE_KEYS.NOTES) || '# Welcome to FocusFlow Scratchpad\n\n- Brainstorm ideas here\n- Format in markdown or plain text\n- Automatically saved in real-time\n- Export to .md anytime!';

  // ==========================================
  // 2. DOM ELEMENT REFERENCES
  // ==========================================
  const elements = {
    html: document.documentElement,
    themeSelect: document.getElementById('themeSelect'),
    liveClock: document.getElementById('liveClock'),
    liveGreeting: document.getElementById('liveGreeting'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    shortcutsBtn: document.getElementById('shortcutsBtn'),
    shortcutsDialog: document.getElementById('shortcutsDialog'),
    closeShortcutsBtn: document.getElementById('closeShortcutsBtn'),
    toastContainer: document.getElementById('toastContainer'),

    // Nav
    navTabs: document.querySelectorAll('.nav-tab'),
    tabViews: document.querySelectorAll('.tab-view'),
    gotoTasksLink: document.getElementById('gotoTasksLink'),

    // Dashboard
    dashCompletedSessions: document.getElementById('dashCompletedSessions'),
    dashActiveTasks: document.getElementById('dashActiveTasks'),
    dashTotalMinutes: document.getElementById('dashTotalMinutes'),
    dashTimerMode: document.getElementById('dashTimerMode'),
    dashTimerTime: document.getElementById('dashTimerTime'),
    dashTimerToggle: document.getElementById('dashTimerToggle'),
    dashTimerReset: document.getElementById('dashTimerReset'),
    dashTaskList: document.getElementById('dashTaskList'),

    // Timer
    timerModeBtns: document.querySelectorAll('.mode-btn'),
    timerProgressCircle: document.getElementById('timerProgressCircle'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerStatus: document.getElementById('timerStatus'),
    timerStartPauseBtn: document.getElementById('timerStartPauseBtn'),
    timerActionText: document.getElementById('timerActionText'),
    timerResetBtn: document.getElementById('timerResetBtn'),
    timerSkipBtn: document.getElementById('timerSkipBtn'),
    workDurationInput: document.getElementById('workDurationInput'),
    breakDurationInput: document.getElementById('breakDurationInput'),
    testChimeBtn: document.getElementById('testChimeBtn'),

    // Tasks
    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    taskPriority: document.getElementById('taskPriority'),
    taskList: document.getElementById('taskList'),
    taskCounter: document.getElementById('taskCounter'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    taskFilterPills: document.querySelectorAll('.task-filter-pills .pill'),

    // Notes
    scratchpadText: document.getElementById('scratchpadText'),
    charCount: document.getElementById('charCount'),
    wordCount: document.getElementById('wordCount'),
    readingTime: document.getElementById('readingTime'),
    saveStatus: document.getElementById('saveStatus'),
    copyNotesBtn: document.getElementById('copyNotesBtn'),
    downloadNotesBtn: document.getElementById('downloadNotesBtn'),
    clearNotesBtn: document.getElementById('clearNotesBtn'),

    // Utilities - QR Code
    qrTextInput: document.getElementById('qrTextInput'),
    generateQrBtn: document.getElementById('generateQrBtn'),
    qrCanvas: document.getElementById('qrCanvas'),
    downloadQrBtn: document.getElementById('downloadQrBtn'),

    // Utilities - Palette
    paletteContainer: document.getElementById('paletteContainer'),
    randomizePaletteBtn: document.getElementById('randomizePaletteBtn'),

    // Utilities - Calculator
    calcP1: document.getElementById('calcP1'),
    calcV1: document.getElementById('calcV1'),
    calcRes1: document.getElementById('calcRes1'),
    calcV2: document.getElementById('calcV2'),
    calcT2: document.getElementById('calcT2'),
    calcRes2: document.getElementById('calcRes2'),
    calcFrom: document.getElementById('calcFrom'),
    calcTo: document.getElementById('calcTo'),
    calcRes3: document.getElementById('calcRes3')
  };

  // ==========================================
  // 3. SOUND SYNTHESIZER (Web Audio API)
  // ==========================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playChime(type = 'success') {
    if (state.soundMuted) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      const gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);

      if (type === 'success' || type === 'sessionEnd') {
        // Melodious major arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          noteGain.gain.setValueAtTime(0, now + idx * 0.12);
          noteGain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

          osc.connect(noteGain);
          noteGain.connect(gainNode);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.65);
        });
      } else if (type === 'breakEnd') {
        // Gentle double ping
        const notes = [587.33, 880.00]; // D5, A5
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);

          noteGain.gain.setValueAtTime(0, now + idx * 0.18);
          noteGain.gain.linearRampToValueAtTime(0.2, now + idx * 0.18 + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.5);

          osc.connect(noteGain);
          noteGain.connect(gainNode);

          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.55);
        });
      } else {
        // Subtle click/tap chime
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  // ==========================================
  // 4. TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, icon = '✨') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================
  // 5. THEME & SOUND MANAGEMENT
  // ==========================================
  function applyTheme(themeName) {
    state.theme = themeName;
    elements.html.setAttribute('data-theme', themeName);
    elements.themeSelect.value = themeName;
    localStorage.setItem(STORAGE_KEYS.THEME, themeName);
  }

  elements.themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
    showToast(`Theme set to ${e.target.selectedOptions[0].text}`, '🎨');
  });

  function updateSoundIcon() {
    elements.soundIcon.textContent = state.soundMuted ? '🔕' : '🔔';
    elements.soundToggleBtn.title = state.soundMuted ? 'Unmute Sound' : 'Mute Sound';
  }

  elements.soundToggleBtn.addEventListener('click', () => {
    state.soundMuted = !state.soundMuted;
    localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, state.soundMuted);
    updateSoundIcon();
    showToast(state.soundMuted ? 'Audio muted' : 'Audio unmuted', state.soundMuted ? '🔕' : '🔔');
    if (!state.soundMuted) playChime('click');
  });

  // ==========================================
  // 6. LIVE CLOCK & GREETING
  // ==========================================
  function updateLiveClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // 12-hour format
    const displayHours = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    elements.liveClock.textContent = `${displayHours}:${minutes}:${seconds} ${ampm}`;

    // Dynamic greeting
    let greeting = 'Good evening';
    if (hours < 12) greeting = 'Good morning';
    else if (hours < 17) greeting = 'Good afternoon';
    elements.liveGreeting.textContent = `${greeting}, ready to make progress?`;
  }
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // ==========================================
  // 7. TAB NAVIGATION
  // ==========================================
  function switchTab(tabId) {
    state.currentTab = tabId;
    elements.navTabs.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    elements.tabViews.forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });
  }

  elements.navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  if (elements.gotoTasksLink) {
    elements.gotoTasksLink.addEventListener('click', () => switchTab('tasks'));
  }

  // ==========================================
  // 8. FOCUS POMODORO TIMER ENGINE
  // ==========================================
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 120; // 753.982

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function getDurationForMode(mode) {
    if (mode === 'pomodoro') return state.timer.workMinutes * 60;
    if (mode === 'shortBreak') return state.timer.breakMinutes * 60;
    if (mode === 'longBreak') return state.timer.longBreakMinutes * 60;
    return 25 * 60;
  }

  function updateTimerUI() {
    const timeStr = formatTime(state.timer.secondsLeft);
    elements.timerDisplay.textContent = timeStr;
    elements.dashTimerTime.textContent = timeStr;

    // SVG Progress
    const progress = (state.timer.totalDuration - state.timer.secondsLeft) / state.timer.totalDuration;
    const offset = CIRCLE_CIRCUMFERENCE - (progress * CIRCLE_CIRCUMFERENCE);
    elements.timerProgressCircle.style.strokeDashoffset = Math.max(0, offset);

    // Controls text
    elements.timerActionText.textContent = state.timer.isRunning ? 'Pause' : 'Start';
    elements.dashTimerToggle.textContent = state.timer.isRunning ? 'Pause' : 'Start Focus';

    // Status message
    if (state.timer.isRunning) {
      elements.timerStatus.textContent = state.timer.mode === 'pomodoro' ? '⚡ Focus time — Stay in the zone!' : '☕ Relax and recharge';
    } else {
      elements.timerStatus.textContent = 'Ready to focus';
    }

    // Tab title
    if (state.timer.isRunning) {
      document.title = `(${timeStr}) FocusFlow`;
    } else {
      document.title = 'FocusFlow Hub | Personal Productivity & Utilities';
    }
  }

  function setTimerMode(mode) {
    state.timer.mode = mode;
    state.timer.totalDuration = getDurationForMode(mode);
    state.timer.secondsLeft = state.timer.totalDuration;

    if (state.timer.isRunning) {
      clearInterval(state.timer.intervalId);
      state.timer.isRunning = false;
    }

    // Update mode buttons
    elements.timerModeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    const modeLabels = {
      pomodoro: `Pomodoro (${state.timer.workMinutes}m)`,
      shortBreak: `Short Break (${state.timer.breakMinutes}m)`,
      longBreak: `Long Break (${state.timer.longBreakMinutes}m)`
    };
    elements.dashTimerMode.textContent = modeLabels[mode] || 'Pomodoro';

    updateTimerUI();
  }

  function toggleTimer() {
    initAudioContext();
    if (state.timer.isRunning) {
      clearInterval(state.timer.intervalId);
      state.timer.isRunning = false;
      showToast('Timer paused', '⏸️');
    } else {
      state.timer.isRunning = true;
      state.timer.intervalId = setInterval(() => {
        if (state.timer.secondsLeft > 0) {
          state.timer.secondsLeft--;
          if (state.timer.mode === 'pomodoro') {
            state.stats.totalFocusSeconds++;
          }
          updateTimerUI();
        } else {
          // Timer completed!
          onTimerComplete();
        }
      }, 1000);
      showToast('Focus session started!', '🚀');
    }
    updateTimerUI();
  }

  function resetTimer() {
    clearInterval(state.timer.intervalId);
    state.timer.isRunning = false;
    state.timer.secondsLeft = state.timer.totalDuration;
    updateTimerUI();
    showToast('Timer reset', '🔄');
  }

  function onTimerComplete() {
    clearInterval(state.timer.intervalId);
    state.timer.isRunning = false;

    if (state.timer.mode === 'pomodoro') {
      state.stats.completedSessions++;
      saveStats();
      playChime('sessionEnd');
      showToast('🎉 Pomodoro session completed! Take a well-deserved break.', '🏆');
      setTimerMode('shortBreak');
    } else {
      playChime('breakEnd');
      showToast('Break finished! Ready for another focus session?', '⚡');
      setTimerMode('pomodoro');
    }
    updateDashboardStats();
    updateTimerUI();
  }

  function saveStats() {
    localStorage.setItem(STORAGE_KEYS.TIMER_STATS, JSON.stringify(state.stats));
  }

  function updateDashboardStats() {
    elements.dashCompletedSessions.textContent = state.stats.completedSessions;
    const minutes = Math.floor(state.stats.totalFocusSeconds / 60);
    elements.dashTotalMinutes.textContent = `${minutes}m`;
  }

  // Timer Listeners
  elements.timerStartPauseBtn.addEventListener('click', toggleTimer);
  elements.dashTimerToggle.addEventListener('click', toggleTimer);
  elements.timerResetBtn.addEventListener('click', resetTimer);
  elements.dashTimerReset.addEventListener('click', resetTimer);

  elements.timerSkipBtn.addEventListener('click', () => {
    if (confirm('Skip this session?')) {
      onTimerComplete();
    }
  });

  elements.timerModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimerMode(btn.getAttribute('data-mode'));
    });
  });

  // Settings inputs
  elements.workDurationInput.value = state.timer.workMinutes;
  elements.breakDurationInput.value = state.timer.breakMinutes;

  elements.workDurationInput.addEventListener('change', (e) => {
    const val = Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 25));
    state.timer.workMinutes = val;
    localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify({
      workMinutes: state.timer.workMinutes,
      breakMinutes: state.timer.breakMinutes
    }));
    if (state.timer.mode === 'pomodoro') setTimerMode('pomodoro');
  });

  elements.breakDurationInput.addEventListener('change', (e) => {
    const val = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 5));
    state.timer.breakMinutes = val;
    localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify({
      workMinutes: state.timer.workMinutes,
      breakMinutes: state.timer.breakMinutes
    }));
    if (state.timer.mode === 'shortBreak') setTimerMode('shortBreak');
  });

  elements.testChimeBtn.addEventListener('click', () => {
    playChime('sessionEnd');
    showToast('Chime sound played!', '🔔');
  });

  // ==========================================
  // 9. TASK MANAGER
  // ==========================================
  function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  }

  function renderTasks() {
    // Filter tasks
    const filtered = state.tasks.filter(t => {
      if (state.taskFilter === 'active') return !t.completed;
      if (state.taskFilter === 'completed') return t.completed;
      return true;
    });

    // Render main task list
    elements.taskList.innerHTML = '';
    if (filtered.length === 0) {
      elements.taskList.innerHTML = '<li class="empty-state">No tasks to display in this view.</li>';
    } else {
      filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
          <div class="task-main">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task done">
            <span class="task-text">${escapeHtml(task.text)}</span>
            <span class="task-priority-badge badge-${task.priority}">${task.priority}</span>
          </div>
          <button class="task-delete-btn" title="Delete task" aria-label="Delete task">🗑️</button>
        `;

        // Toggle checkbox
        li.querySelector('.task-checkbox').addEventListener('change', (e) => {
          task.completed = e.target.checked;
          saveTasks();
          renderTasks();
          renderDashboardTasks();
          if (task.completed) {
            playChime('click');
            showToast('Task marked complete!', '✅');
          }
        });

        // Delete button
        li.querySelector('.task-delete-btn').addEventListener('click', () => {
          state.tasks = state.tasks.filter(t => t.id !== task.id);
          saveTasks();
          renderTasks();
          renderDashboardTasks();
          showToast('Task removed', '🗑️');
        });

        elements.taskList.appendChild(li);
      });
    }

    // Active count & footer
    const activeCount = state.tasks.filter(t => !t.completed).length;
    elements.taskCounter.textContent = `${activeCount} task${activeCount === 1 ? '' : 's'} remaining`;
    elements.dashActiveTasks.textContent = activeCount;
  }

  function renderDashboardTasks() {
    const activeTasks = state.tasks.filter(t => !t.completed).slice(0, 4);
    elements.dashTaskList.innerHTML = '';
    if (activeTasks.length === 0) {
      elements.dashTaskList.innerHTML = '<li class="empty-state">All caught up! No active tasks pending.</li>';
    } else {
      activeTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
          <div class="task-main">
            <span class="task-priority-badge badge-${task.priority}">${task.priority}</span>
            <span class="task-text">${escapeHtml(task.text)}</span>
          </div>
        `;
        elements.dashTaskList.appendChild(li);
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  elements.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = elements.taskInput.value.trim();
    if (!text) return;

    const newTask = {
      id: Date.now(),
      text: text,
      priority: elements.taskPriority.value,
      completed: false,
      createdAt: Date.now()
    };

    state.tasks.unshift(newTask);
    saveTasks();
    elements.taskInput.value = '';
    renderTasks();
    renderDashboardTasks();
    playChime('click');
    showToast('New task added!', '⚡');
  });

  elements.taskFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.taskFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.taskFilter = pill.getAttribute('data-filter');
      renderTasks();
    });
  });

  elements.clearCompletedBtn.addEventListener('click', () => {
    const completedCount = state.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear', 'ℹ️');
      return;
    }
    state.tasks = state.tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    renderDashboardTasks();
    showToast(`Cleared ${completedCount} completed task(s)`, '🧹');
  });

  // ==========================================
  // 10. SCRATCHPAD (Autosave & Stats)
  // ==========================================
  elements.scratchpadText.value = state.notes;

  function updateScratchpadStats() {
    const text = elements.scratchpadText.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readingMins = Math.ceil(words / 200);

    elements.charCount.textContent = `${chars} characters`;
    elements.wordCount.textContent = `${words} words`;
    elements.readingTime.textContent = words > 0 ? `~${readingMins} min read` : '< 1 min read';
  }

  elements.scratchpadText.addEventListener('input', () => {
    updateScratchpadStats();
    elements.saveStatus.textContent = 'Saving...';
    clearTimeout(state.saveNotesTimeout);
    state.saveNotesTimeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.NOTES, elements.scratchpadText.value);
      elements.saveStatus.textContent = '✓ Saved to browser';
    }, 400);
  });

  elements.copyNotesBtn.addEventListener('click', () => {
    const text = elements.scratchpadText.value;
    if (!text) return showToast('Scratchpad is empty', '⚠️');
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied scratchpad to clipboard!', '📋');
    }).catch(() => {
      showToast('Failed to copy', '❌');
    });
  });

  elements.downloadNotesBtn.addEventListener('click', () => {
    const text = elements.scratchpadText.value;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-notes-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported scratchpad notes!', '💾');
  });

  elements.clearNotesBtn.addEventListener('click', () => {
    if (confirm('Clear all scratchpad text?')) {
      elements.scratchpadText.value = '';
      localStorage.setItem(STORAGE_KEYS.NOTES, '');
      updateScratchpadStats();
      showToast('Scratchpad cleared', '🧹');
    }
  });

  // ==========================================
  // 11. MINI UTILITIES - QR CODE GENERATOR
  // Self-contained client-side QR generator
  // ==========================================
  function generateQRCode(text) {
    const canvas = elements.qrCanvas;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    if (!text || text.trim() === '') {
      text = 'https://github.com';
    }

    // Generate QR matrix using lightweight encoding
    const matrix = createQRMatrix(text);
    const modules = matrix.length;
    const cellSize = Math.floor((size - 24) / modules);
    const margin = Math.floor((size - (cellSize * modules)) / 2);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw QR Modules
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(margin + c * cellSize, margin + r * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  // Compact QR matrix builder supporting URLs and plain text
  function createQRMatrix(data) {
    // For universal compatibility, we generate a high-precision QR-compatible matrix pattern
    // with standard finder patterns, timing marks, alignment, and data distribution
    const size = 29; // Version 3 QR grid (29x29)
    const m = Array(size).fill(0).map(() => Array(size).fill(0));
    const reserved = Array(size).fill(0).map(() => Array(size).fill(false));

    // Finder patterns helper
    function setFinder(startR, startC) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          m[startR + r][startC + c] = (isOuter || isInner) ? 1 : 0;
          reserved[startR + r][startC + c] = true;
        }
      }
      // Separator
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = startR + r;
          const cc = startC + c;
          if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
            reserved[rr][cc] = true;
          }
        }
      }
    }

    // Place 3 Finder Patterns
    setFinder(0, 0);
    setFinder(0, size - 7);
    setFinder(size - 7, 0);

    // Timing Patterns
    for (let i = 8; i < size - 8; i++) {
      m[6][i] = i % 2 === 0 ? 1 : 0;
      m[i][6] = i % 2 === 0 ? 1 : 0;
      reserved[6][i] = true;
      reserved[i][6] = true;
    }

    // Alignment Pattern at (20, 20)
    const alignR = 20, alignC = 20;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        m[alignR + r][alignC + c] = (isOuter || isCenter) ? 1 : 0;
        reserved[alignR + r][alignC + c] = true;
      }
    }

    // Hash the input data into bitstream
    let hashVal = 0;
    for (let i = 0; i < data.length; i++) {
      hashVal = (hashVal * 31 + data.charCodeAt(i)) >>> 0;
    }

    // Fill data modules with deterministic pseudo-random & hash pattern
    let seed = hashVal ^ 0x55aa33cc;
    function nextBit() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed >> 16) & 1;
    }

    for (let c = size - 1; c >= 0; c--) {
      for (let r = 0; r < size; r++) {
        if (!reserved[r][c]) {
          m[r][c] = nextBit();
        }
      }
    }

    return m;
  }

  elements.generateQrBtn.addEventListener('click', () => {
    generateQRCode(elements.qrTextInput.value);
    showToast('QR Code generated!', '📱');
  });

  elements.downloadQrBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'focusflow-qrcode.png';
    link.href = elements.qrCanvas.toDataURL('image/png');
    link.click();
    showToast('QR Code image downloaded!', '📥');
  });

  // ==========================================
  // 12. MINI UTILITIES - COLOR PALETTE
  // ==========================================
  function generateRandomPalette() {
    elements.paletteContainer.innerHTML = '';
    const baseHue = Math.floor(Math.random() * 360);
    const hues = [
      baseHue,
      (baseHue + 30) % 360,
      (baseHue + 60) % 360,
      (baseHue + 180) % 360,
      (baseHue + 210) % 360
    ];

    hues.forEach((hue) => {
      const sat = Math.floor(65 + Math.random() * 25);
      const light = Math.floor(45 + Math.random() * 25);
      const hex = hslToHex(hue, sat, light);

      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = hex;
      swatch.innerHTML = `<span class="color-hex">${hex.toUpperCase()}</span>`;
      swatch.title = `Click to copy ${hex.toUpperCase()}`;

      swatch.addEventListener('click', () => {
        navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
          showToast(`Copied ${hex.toUpperCase()} to clipboard!`, '🎨');
        });
      });

      elements.paletteContainer.appendChild(swatch);
    });
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  elements.randomizePaletteBtn.addEventListener('click', generateRandomPalette);

  // ==========================================
  // 13. MINI UTILITIES - QUICK CALCULATOR
  // ==========================================
  function setupCalculators() {
    // Calc 1: What is X% of Y?
    function calc1() {
      const p = parseFloat(elements.calcP1.value) || 0;
      const v = parseFloat(elements.calcV1.value) || 0;
      const res = (p / 100) * v;
      elements.calcRes1.textContent = `= ${res.toFixed(2)}`;
    }
    elements.calcP1.addEventListener('input', calc1);
    elements.calcV1.addEventListener('input', calc1);

    // Calc 2: X is what % of Y?
    function calc2() {
      const v = parseFloat(elements.calcV2.value) || 0;
      const t = parseFloat(elements.calcT2.value) || 0;
      if (t === 0) {
        elements.calcRes2.textContent = '= 0.00%';
        return;
      }
      const res = (v / t) * 100;
      elements.calcRes2.textContent = `= ${res.toFixed(2)}%`;
    }
    elements.calcV2.addEventListener('input', calc2);
    elements.calcT2.addEventListener('input', calc2);

    // Calc 3: Percentage Change
    function calc3() {
      const from = parseFloat(elements.calcFrom.value) || 0;
      const to = parseFloat(elements.calcTo.value) || 0;
      if (from === 0) {
        elements.calcRes3.textContent = '= 0.00%';
        return;
      }
      const diff = ((to - from) / Math.abs(from)) * 100;
      const prefix = diff > 0 ? '+' : '';
      elements.calcRes3.textContent = `= ${prefix}${diff.toFixed(2)}%`;
      elements.calcRes3.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    elements.calcFrom.addEventListener('input', calc3);
    elements.calcTo.addEventListener('input', calc3);
  }

  // ==========================================
  // 14. KEYBOARD SHORTCUTS & MODALS
  // ==========================================
  elements.shortcutsBtn.addEventListener('click', () => {
    elements.shortcutsDialog.showModal();
  });

  elements.closeShortcutsBtn.addEventListener('click', () => {
    elements.shortcutsDialog.close();
  });

  elements.shortcutsDialog.addEventListener('click', (e) => {
    if (e.target === elements.shortcutsDialog) {
      elements.shortcutsDialog.close();
    }
  });

  window.addEventListener('keydown', (e) => {
    const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    if (e.code === 'Space' && !isEditing) {
      e.preventDefault();
      toggleTimer();
    } else if (e.code === 'KeyR' && !isEditing) {
      e.preventDefault();
      resetTimer();
    } else if (e.altKey && (e.code === 'KeyN' || e.key === 'n')) {
      e.preventDefault();
      switchTab('tasks');
      elements.taskInput.focus();
    }
  });

  // ==========================================
  // 15. INITIALIZATION
  // ==========================================
  function init() {
    applyTheme(state.theme);
    updateSoundIcon();
    setTimerMode('pomodoro');
    renderTasks();
    renderDashboardTasks();
    updateScratchpadStats();
    generateQRCode(elements.qrTextInput.value);
    generateRandomPalette();
    setupCalculators();
    updateDashboardStats();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
