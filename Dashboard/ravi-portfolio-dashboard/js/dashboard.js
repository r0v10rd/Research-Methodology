/**
 * Dynamic Dashboard Controller for Ravi Ardhana Developer OS
 * Complete dynamic tracking of:
 * 1. Projects with Milestones & Completion Timeline Duration
 * 2. Technical Skills with Learning Duration & Mastery Level
 * 3. Biography & Developer Profile
 * 4. Roadmap: To-Do Topics / Concepts to Cover Soon (Linked to Skills)
 * 5. LeetCode Problems Solved Per Day, Per Week, and Per Month (with Chart.js Analytics)
 */

let currentData = null;
let overviewLcTimeframe = 'day';
let dedicatedLcTimeframe = 'day';
let activeSkillCategory = 'All';

// Chart Instances
let overviewLcChartInstance = null;
let overviewDifficultyChartInstance = null;
let projectDurationChartInstance = null;
let skillsDurationChartInstance = null;
let dedicatedLcChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupMobileMenu();
  await refreshDashboard();

  // Handle URL hash tab switching if provided (e.g. dashboard.html#leetcode)
  if (window.location.hash) {
    const tabName = window.location.hash.replace('#', '').replace('-tab', '');
    if (['overview', 'projects', 'skills', 'topics', 'leetcode', 'messages', 'settings'].includes(tabName)) {
      switchTab(tabName);
    }
  }

  // Cross-tab broadcast listener
  window.addEventListener('portfolioDataChanged', (e) => {
    currentData = e.detail;
    renderAllViews(currentData);
  });
});

function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  }
}

async function refreshDashboard() {
  updateConnectionBadge('checking');
  if (!window.portfolioStore) return;

  const isServer = await window.portfolioStore.checkServer();
  updateConnectionBadge(isServer ? 'server' : 'local');

  currentData = await window.portfolioStore.getData();
  renderAllViews(currentData);
}

function updateConnectionBadge(status) {
  const badge = document.getElementById('connectionStatusBadge');
  const text = document.getElementById('connectionStatusText');
  if (!badge || !text) return;

  if (status === 'server') {
    badge.className = 'mt-4 flex items-center space-x-2 px-2.5 py-1 rounded-md bg-green-950/50 border border-green-800/40 text-[11px] text-green-300';
    text.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400 inline-block mr-1"></span> Python API Connected';
  } else if (status === 'local') {
    badge.className = 'mt-4 flex items-center space-x-2 px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300';
    text.innerHTML = '<span class="w-2 h-2 rounded-full bg-purple-400 inline-block mr-1"></span> LocalStorage Mode';
  } else {
    badge.className = 'mt-4 flex items-center space-x-2 px-2.5 py-1 rounded-md bg-yellow-950/40 border border-yellow-800/40 text-[11px] text-yellow-300';
    text.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block mr-1"></span> Syncing...';
  }
}

function switchTab(tabId) {
  const tabs = ['overview', 'projects', 'skills', 'topics', 'leetcode', 'messages', 'settings'];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`tab-${t}`);
    const btnEl = document.getElementById(`tab-btn-${t}`);
    if (tabEl) tabEl.classList.add('hidden');
    if (btnEl) btnEl.classList.remove('active');
  });

  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.getElementById(`tab-btn-${tabId}`);
  if (targetTab) targetTab.classList.remove('hidden');
  if (targetBtn) targetBtn.classList.add('active');

  const titles = {
    overview: {
      title: "Dashboard Overview & Analytics",
      subtitle: "High-level summary of your project timelines, technical skill investments, upcoming study concepts, and LeetCode solve frequency."
    },
    projects: {
      title: "Projects & Completion Timeline Tracker",
      subtitle: "Showcase completed and active builds, with milestone dates and the exact duration taken to complete each."
    },
    skills: {
      title: "Technical Skills & Learning Duration",
      subtitle: "Organize technologies, current proficiency ratings, and the time invested to achieve mastery."
    },
    topics: {
      title: "Roadmap: To-Do Concepts & Topics",
      subtitle: "Upcoming topics, algorithms, and architectural patterns to cover soon, dynamically mapped to your technical skills."
    },
    leetcode: {
      title: "LeetCode Problem Solving Hub",
      subtitle: "Track problems solved per day, per week, and per month with algorithmic approach notes, streaks, and difficulty distribution."
    },
    messages: {
      title: "Inquiries & Contact Leads",
      subtitle: "Review and respond to messages submitted through the public developer portfolio."
    },
    settings: {
      title: "Profile & Biography Customizer",
      subtitle: "Personalize your developer bio, headline prefix, animated Typed.js strings, target goals, and social coordinates."
    }
  };

  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  if (pageTitle && titles[tabId]) pageTitle.textContent = titles[tabId].title;
  if (pageSubtitle && titles[tabId]) pageSubtitle.textContent = titles[tabId].subtitle;

  // Re-render chart if switching to tabs with charts
  if (currentData) {
    if (tabId === 'overview') {
      setTimeout(() => renderOverviewCharts(currentData), 60);
    } else if (tabId === 'leetcode') {
      setTimeout(() => renderDedicatedLeetCodeChart(currentData), 60);
    }
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById('sidebar');
  if (sidebar && window.innerWidth < 768) {
    sidebar.classList.add('hidden');
  }
}

function renderAllViews(data) {
  if (!data) return;

  // Update Sidebar Badges
  const badgeProj = document.getElementById('badgeProjectCount');
  if (badgeProj) badgeProj.textContent = (data.projects || []).length;

  const badgeSkill = document.getElementById('badgeSkillCount');
  if (badgeSkill) badgeSkill.textContent = (data.skills || []).length;

  const badgeTopic = document.getElementById('badgeTopicCount');
  if (badgeTopic) {
    const pendingTopics = (data.topics || []).filter(t => t.status !== 'Mastered').length;
    badgeTopic.textContent = pendingTopics;
  }

  const badgeLc = document.getElementById('badgeLeetCodeCount');
  if (badgeLc) {
    const totalLc = (data.leetcode && data.leetcode.problems) ? data.leetcode.problems.length : 0;
    badgeLc.textContent = totalLc;
  }

  const badgeMsg = document.getElementById('badgeMessageCount');
  if (badgeMsg) {
    const newMsgs = (data.messages || []).filter(m => m.status === 'New').length;
    badgeMsg.textContent = newMsgs;
  }

  // 1. Overview Tab
  renderOverview(data);

  // 2. Projects Tab
  renderProjectsList(data.projects || []);

  // 3. Skills Tab
  renderSkillsList(data.skills || []);

  // 4. Topics Tab (To-Do Concepts)
  renderTopicsModule(data.topics || [], data.skills || []);

  // 5. LeetCode Tab
  renderLeetCodeModule(data.leetcode || { goals: {}, problems: [] });

  // 6. Messages Tab
  renderMessagesList(data.messages || []);

  // 7. Profile Settings Tab
  populateSettingsForm(data.profile || {});
}


/* =========================================================================
 * TAB 1: OVERVIEW & ANALYTICS
 * ========================================================================= */

function renderOverview(data) {
  const lcAnalytics = window.portfolioStore.getLeetCodeAnalytics();

  // Top LeetCode Card
  const totalLcEl = document.getElementById('statTotalLeetCode');
  if (totalLcEl) totalLcEl.textContent = lcAnalytics.totalSolved;

  const todayEl = document.getElementById('statLcTodayBadge');
  if (todayEl) todayEl.textContent = `Today: ${lcAnalytics.solvedToday}`;

  const weekEl = document.getElementById('statLcWeekBadge');
  if (weekEl) weekEl.textContent = `Week: ${lcAnalytics.solvedThisWeek}`;

  const monthEl = document.getElementById('statLcMonthBadge');
  if (monthEl) monthEl.textContent = `Month: ${lcAnalytics.solvedThisMonth}`;

  const streakEl = document.getElementById('statLcStreakBadge');
  if (streakEl) streakEl.textContent = `🔥 ${lcAnalytics.currentStreak}-Day Active Streak`;

  // Projects Card
  const projects = data.projects || [];
  const completedProjs = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjs = projects.filter(p => p.status === 'In Progress').length;

  const totalProjEl = document.getElementById('statTotalProjects');
  if (totalProjEl) totalProjEl.textContent = projects.length;

  const projLiveEl = document.getElementById('statProjectsLive');
  if (projLiveEl) projLiveEl.textContent = `${completedProjs} Completed`;

  const projProgEl = document.getElementById('statProjectsProgress');
  if (projProgEl) projProgEl.textContent = `${inProgressProjs} In Progress`;

  const avgProjDurEl = document.getElementById('statAvgProjectDuration');
  if (avgProjDurEl) {
    avgProjDurEl.textContent = `⏱️ Avg Duration: ~4 Weeks`;
  }

  // Skills Card
  const skills = data.skills || [];
  const totalSkillEl = document.getElementById('statTotalSkills');
  if (totalSkillEl) totalSkillEl.textContent = skills.length;

  const avgSkillLevelEl = document.getElementById('statAvgSkillLevel');
  if (avgSkillLevelEl) {
    const avg = skills.length > 0 ? Math.round(skills.reduce((acc, s) => acc + (s.level || 80), 0) / skills.length) : 80;
    avgSkillLevelEl.textContent = `Avg Proficiency: ${avg}%`;
  }

  // Topics Card
  const topics = data.topics || [];
  const totalTopicsEl = document.getElementById('statTotalTopics');
  if (totalTopicsEl) totalTopicsEl.textContent = topics.length;

  const pendingTopics = topics.filter(t => t.status !== 'Mastered').length;
  const masteredTopics = topics.filter(t => t.status === 'Mastered').length;
  const highPriorityTopics = topics.filter(t => t.priority === 'High' && t.status !== 'Mastered').length;

  const topicsPendingEl = document.getElementById('statTopicsPending');
  if (topicsPendingEl) topicsPendingEl.textContent = `${pendingTopics} Pending`;

  const topicsMasteredEl = document.getElementById('statTopicsMastered');
  if (topicsMasteredEl) topicsMasteredEl.textContent = `${masteredTopics} Mastered`;

  const topicsHighEl = document.getElementById('statTopicsHighPriority');
  if (topicsHighEl) topicsHighEl.textContent = `${highPriorityTopics} High Priority Queued`;

  // Donut counts
  const donutEasy = document.getElementById('donutEasyCount');
  if (donutEasy) donutEasy.textContent = lcAnalytics.byDifficulty.Easy || 0;
  const donutMed = document.getElementById('donutMediumCount');
  if (donutMed) donutMed.textContent = lcAnalytics.byDifficulty.Medium || 0;
  const donutHard = document.getElementById('donutHardCount');
  if (donutHard) donutHard.textContent = lcAnalytics.byDifficulty.Hard || 0;

  // Upcoming topics peek
  renderOverviewUpcomingTopics(topics);

  // Render Charts
  renderOverviewCharts(data);
}

function setOverviewLcTimeframe(tf) {
  overviewLcTimeframe = tf;
  ['day', 'week', 'month'].forEach(t => {
    const btn = document.getElementById(`btnLc${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tf) {
        btn.className = 'px-3 py-1.5 rounded-md font-semibold bg-[#a855f7] text-white transition';
      } else {
        btn.className = 'px-3 py-1.5 rounded-md font-medium text-gray-400 hover:text-white transition';
      }
    }
  });

  const subtitle = document.getElementById('lcChartSubtitle');
  if (subtitle) {
    if (tf === 'day') subtitle.textContent = 'Problems solved per day (Last 14 days)';
    else if (tf === 'week') subtitle.textContent = 'Problems solved per week (Last 6 weeks)';
    else subtitle.textContent = 'Problems solved per month (Last 4 months)';
  }

  if (currentData) {
    renderOverviewLeetCodeChart(currentData);
  }
}

function renderOverviewCharts(data) {
  renderOverviewLeetCodeChart(data);
  renderOverviewDifficultyChart();
  renderProjectDurationChart(data.projects || []);
  renderSkillsDurationChart(data.skills || []);
}

function renderOverviewLeetCodeChart(data) {
  const ctx = document.getElementById('overviewLeetCodeChart');
  if (!ctx) return;

  const analytics = window.portfolioStore.getLeetCodeAnalytics();
  let labels = [];
  let counts = [];
  let easyCounts = [];
  let medCounts = [];
  let hardCounts = [];

  if (overviewLcTimeframe === 'day') {
    labels = analytics.dailyActivity.map(d => d.label);
    counts = analytics.dailyActivity.map(d => d.count);
    easyCounts = analytics.dailyActivity.map(d => d.easy);
    medCounts = analytics.dailyActivity.map(d => d.medium);
    hardCounts = analytics.dailyActivity.map(d => d.hard);
  } else if (overviewLcTimeframe === 'week') {
    labels = analytics.weeklyActivity.map(w => w.label);
    counts = analytics.weeklyActivity.map(w => w.count);
    easyCounts = analytics.weeklyActivity.map(w => w.easy);
    medCounts = analytics.weeklyActivity.map(w => w.medium);
    hardCounts = analytics.weeklyActivity.map(w => w.hard);
  } else {
    labels = analytics.monthlyActivity.map(m => m.label);
    counts = analytics.monthlyActivity.map(m => m.count);
    easyCounts = analytics.monthlyActivity.map(m => m.easy);
    medCounts = analytics.monthlyActivity.map(m => m.medium);
    hardCounts = analytics.monthlyActivity.map(m => m.hard);
  }

  if (overviewLcChartInstance) {
    overviewLcChartInstance.destroy();
  }

  overviewLcChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Easy',
          data: easyCounts,
          backgroundColor: '#22c55e',
          borderRadius: 4
        },
        {
          label: 'Medium',
          data: medCounts,
          backgroundColor: '#f59e0b',
          borderRadius: 4
        },
        {
          label: 'Hard',
          data: hardCounts,
          backgroundColor: '#ef4444',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { size: 10 } }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: '#1f2937' },
          ticks: { color: '#9ca3af', font: { size: 10 }, stepSize: 1 }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#e5e7eb', boxWidth: 12, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#000021',
          borderColor: '#a855f7',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#e5e7eb'
        }
      }
    }
  });
}

function renderOverviewDifficultyChart() {
  const ctx = document.getElementById('overviewDifficultyChart');
  if (!ctx) return;

  const analytics = window.portfolioStore.getLeetCodeAnalytics();
  const diffs = analytics.byDifficulty;

  if (overviewDifficultyChartInstance) {
    overviewDifficultyChartInstance.destroy();
  }

  overviewDifficultyChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [{
        data: [diffs.Easy || 0, diffs.Medium || 0, diffs.Hard || 0],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#000021',
          borderColor: '#1f2937',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#e5e7eb'
        }
      }
    }
  });
}

function renderProjectDurationChart(projects) {
  const ctx = document.getElementById('projectDurationChart');
  if (!ctx) return;

  // Extract approximate weeks from duration string or fallback
  const parsed = projects.map(p => {
    let weeks = 3;
    const durStr = (p.duration || '').toLowerCase();
    const matchWeeks = durStr.match(/(\d+(?:\.\d+)?)\s*week/);
    const matchDays = durStr.match(/(\d+)\s*day/);
    const matchMonths = durStr.match(/(\d+(?:\.\d+)?)\s*month/);

    if (matchWeeks) weeks = parseFloat(matchWeeks[1]);
    else if (matchMonths) weeks = parseFloat(matchMonths[1]) * 4.3;
    else if (matchDays) weeks = Math.round((parseInt(matchDays[1]) / 7) * 10) / 10;

    return {
      title: p.title.length > 18 ? p.title.substring(0, 16) + '...' : p.title,
      durationLabel: p.duration || `${weeks} wks`,
      weeks: weeks,
      status: p.status
    };
  });

  if (projectDurationChartInstance) {
    projectDurationChartInstance.destroy();
  }

  projectDurationChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: parsed.map(p => p.title),
      datasets: [{
        label: 'Completion Duration (Weeks)',
        data: parsed.map(p => p.weeks),
        backgroundColor: parsed.map(p => p.status === 'Completed' ? '#a855f7' : '#3b82f6'),
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#1f2937' },
          ticks: { color: '#9ca3af', font: { size: 10 } },
          title: { display: true, text: 'Weeks to Complete', color: '#6b7280', font: { size: 10 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e5e7eb', font: { size: 11 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `Duration: ${parsed[item.dataIndex].durationLabel} (${item.raw} wks)`
          }
        }
      }
    }
  });
}

function renderSkillsDurationChart(skills) {
  const ctx = document.getElementById('skillsDurationChart');
  if (!ctx) return;

  if (skillsDurationChartInstance) {
    skillsDurationChartInstance.destroy();
  }

  skillsDurationChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: skills.map(s => s.name),
      datasets: [
        {
          label: 'Proficiency (%)',
          data: skills.map(s => s.level || 80),
          backgroundColor: '#a855f7',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { size: 10 }, maxRotation: 45 }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#1f2937' },
          ticks: { color: '#9ca3af', font: { size: 10 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (item) => `Time to master: ${skills[item.dataIndex].duration || 'N/A'}`
          }
        }
      }
    }
  });
}

function renderOverviewUpcomingTopics(topics) {
  const container = document.getElementById('overviewUpcomingTopics');
  if (!container) return;

  const pending = topics.filter(t => t.status !== 'Mastered').slice(0, 4);
  if (pending.length === 0) {
    container.innerHTML = `<div class="text-xs text-gray-400 py-4 text-center">All topics mastered! Add new concepts in the Roadmap tab.</div>`;
    return;
  }

  container.innerHTML = pending.map(t => {
    const priorityColor = t.priority === 'High' ? 'bg-red-950/60 text-red-300 border-red-800/40' :
                         (t.priority === 'Medium' ? 'bg-amber-950/60 text-amber-300 border-amber-800/40' : 'bg-blue-950/60 text-blue-300 border-blue-800/40');
    return `
      <div class="p-3 rounded-xl bg-[#000021] border border-gray-800 hover:border-amber-500/40 transition flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-base">📌</span>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-white">${escapeHtml(t.title)}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full border ${priorityColor} font-semibold">${t.priority}</span>
            </div>
            <p class="text-[11px] text-gray-400 mt-0.5">Linked Skill: <span class="text-purple-300 font-medium">${escapeHtml(t.skillName || 'General')}</span> • Target: ${t.targetDate || 'Soon'}</p>
          </div>
        </div>
        <button onclick="toggleTopicStatusQuick('${t.id}')" class="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#12123e] border border-gray-700 hover:border-green-500 text-gray-300 hover:text-green-300 transition">
          ${t.status === 'In Progress' ? 'In Progress' : 'Start'}
        </button>
      </div>
    `;
  }).join('');
}


/* =========================================================================
 * TAB 2: PROJECTS & TIMELINE
 * ========================================================================= */

function renderProjectsList(projects) {
  const container = document.getElementById('dashboardProjectsList');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 glass-card rounded-2xl border border-dashed border-gray-800">
        <p class="text-gray-400">No projects added yet.</p>
        <button onclick="openAddProjectModal()" class="mt-3 px-4 py-2 bg-[#a855f7] text-white rounded-lg text-xs font-semibold">+ Add First Project</button>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map(p => {
    const isCompleted = p.status === 'Completed';
    const statusBadge = isCompleted 
      ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-950/70 text-green-400 border border-green-800/50">Completed</span>'
      : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/70 text-purple-300 border border-purple-800/50 animate-pulse">In Progress</span>';

    const techTags = (Array.isArray(p.techStack) ? p.techStack : (p.techStack ? p.techStack.split(',') : []))
      .map(tag => `<span class="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] text-purple-300 font-mono-code">${escapeHtml(tag.trim())}</span>`)
      .join('');

    return `
      <div class="glass-card p-6 rounded-2xl relative flex flex-col justify-between hover:border-purple-500/50 transition">
        <div>
          <!-- Header: Category & Status -->
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-purple-400">${escapeHtml(p.category || 'General')}</span>
            ${statusBadge}
          </div>

          <h4 class="text-lg font-bold text-white mb-2">${escapeHtml(p.title)}</h4>
          <p class="text-xs text-gray-400 mb-4 line-clamp-3">${escapeHtml(p.description || '')}</p>

          <!-- Timeline & Completion Duration Box -->
          <div class="p-3.5 rounded-xl bg-[#000021] border border-purple-900/40 mb-4 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-400 font-medium">⏱️ How Long it Took:</span>
              <span class="font-bold text-purple-300 font-mono-code">${escapeHtml(p.duration || 'N/A')}</span>
            </div>
            ${p.startDate ? `
              <div class="flex justify-between items-center text-[11px] text-gray-500">
                <span>Timeline Dates:</span>
                <span>${p.startDate} → ${p.endDate || 'Present'}</span>
              </div>
            ` : ''}
            <!-- Visual Timeline Progress Bar -->
            <div class="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div class="${isCompleted ? 'bg-gradient-to-r from-purple-500 to-green-400' : 'bg-gradient-to-r from-purple-500 to-blue-400'} h-1.5 rounded-full" style="width: ${isCompleted ? '100%' : '65%'}"></div>
            </div>
          </div>

          <!-- Tech Stack -->
          <div class="flex flex-wrap gap-1.5 mb-4">
            ${techTags}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-4 border-t border-gray-800/80 flex items-center justify-between">
          <div class="flex space-x-2">
            ${p.liveUrl && p.liveUrl !== '#' ? `<a href="${p.liveUrl}" target="_blank" class="text-xs text-purple-400 hover:text-white flex items-center space-x-1"><span>Demo</span><span>↗</span></a>` : ''}
            ${p.githubUrl && p.githubUrl !== '#' ? `<a href="${p.githubUrl}" target="_blank" class="text-xs text-gray-400 hover:text-white flex items-center space-x-1"><span>Code</span><span>↗</span></a>` : ''}
          </div>
          <div class="flex space-x-2">
            <button onclick="openEditProjectModal('${p.id}')" class="px-2.5 py-1 text-xs font-semibold rounded bg-gray-800 hover:bg-gray-700 text-gray-200 transition">Edit</button>
            <button onclick="handleDeleteProject('${p.id}')" class="px-2.5 py-1 text-xs font-semibold rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterProjectsList() {
  const query = (document.getElementById('projectSearchInput')?.value || '').toLowerCase();
  const cat = document.getElementById('projectCategoryFilter')?.value || 'All';
  const status = document.getElementById('projectStatusFilter')?.value || 'All';
  const sort = document.getElementById('projectSortFilter')?.value || 'newest';

  let list = (currentData?.projects || []).slice();

  if (query) {
    list = list.filter(p => 
      p.title.toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query) ||
      (Array.isArray(p.techStack) ? p.techStack.join(' ') : p.techStack || '').toLowerCase().includes(query)
    );
  }

  if (cat !== 'All') {
    list = list.filter(p => p.category === cat);
  }

  if (status !== 'All') {
    list = list.filter(p => p.status === status);
  }

  // Sort
  if (sort === 'duration-desc') {
    list.sort((a, b) => (b.duration || '').localeCompare(a.duration || ''));
  } else if (sort === 'duration-asc') {
    list.sort((a, b) => (a.duration || '').localeCompare(b.duration || ''));
  }

  renderProjectsList(list);
}

function openAddProjectModal() {
  document.getElementById('projectModalTitle').textContent = 'Add New Project';
  document.getElementById('projId').value = '';
  document.getElementById('projTitle').value = '';
  document.getElementById('projCategory').value = 'Frontend';
  document.getElementById('projStatus').value = 'Completed';
  document.getElementById('projStartDate').value = '';
  document.getElementById('projEndDate').value = '';
  document.getElementById('projDuration').value = '';
  document.getElementById('projDescription').value = '';
  document.getElementById('projTechStack').value = '';
  document.getElementById('projLiveUrl').value = '';
  document.getElementById('projGithubUrl').value = '';

  const modal = document.getElementById('projectModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function openEditProjectModal(id) {
  const p = (currentData?.projects || []).find(item => item.id === id);
  if (!p) return;

  document.getElementById('projectModalTitle').textContent = 'Edit Project';
  document.getElementById('projId').value = p.id;
  document.getElementById('projTitle').value = p.title || '';
  document.getElementById('projCategory').value = p.category || 'Frontend';
  document.getElementById('projStatus').value = p.status || 'Completed';
  document.getElementById('projStartDate').value = p.startDate || '';
  document.getElementById('projEndDate').value = p.endDate || '';
  document.getElementById('projDuration').value = p.duration || '';
  document.getElementById('projDescription').value = p.description || '';
  document.getElementById('projTechStack').value = Array.isArray(p.techStack) ? p.techStack.join(', ') : (p.techStack || '');
  document.getElementById('projLiveUrl').value = p.liveUrl || '';
  document.getElementById('projGithubUrl').value = p.githubUrl || '';

  const modal = document.getElementById('projectModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  modal.classList.add('hidden');
  modal.classList.remove('modal-active');
}

function handleProjectStatusChange() {
  const status = document.getElementById('projStatus').value;
  const endInput = document.getElementById('projEndDate');
  if (status === 'In Progress') {
    endInput.value = '';
    endInput.disabled = true;
  } else {
    endInput.disabled = false;
  }
}

function autoCalculateProjectDuration() {
  const sStr = document.getElementById('projStartDate').value;
  const eStr = document.getElementById('projEndDate').value;
  const status = document.getElementById('projStatus').value;
  const durInput = document.getElementById('projDuration');

  if (!sStr) return;

  const s = new Date(sStr);
  const e = (status === 'Completed' && eStr) ? new Date(eStr) : new Date();

  const diffTime = Math.abs(e - s);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    durInput.value = `${diffDays} days`;
  } else if (diffDays <= 30) {
    const w = (diffDays / 7).toFixed(1).replace('.0', '');
    durInput.value = `${w} weeks (${diffDays} days)`;
  } else {
    const m = (diffDays / 30.4).toFixed(1).replace('.0', '');
    durInput.value = `${m} months (${diffDays} days)`;
  }

  if (status === 'In Progress') {
    durInput.value = `In Progress (${durInput.value} so far)`;
  }
}

async function handleSaveProject(e) {
  e.preventDefault();
  const id = document.getElementById('projId').value || ('proj-' + Date.now());
  const title = document.getElementById('projTitle').value.trim();
  const category = document.getElementById('projCategory').value;
  const status = document.getElementById('projStatus').value;
  const startDate = document.getElementById('projStartDate').value;
  const endDate = document.getElementById('projEndDate').value;
  const duration = document.getElementById('projDuration').value.trim();
  const description = document.getElementById('projDescription').value.trim();
  const techRaw = document.getElementById('projTechStack').value;
  const techStack = techRaw ? techRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const liveUrl = document.getElementById('projLiveUrl').value.trim() || '#';
  const githubUrl = document.getElementById('projGithubUrl').value.trim() || '#';

  const newProj = {
    id, title, category, status, startDate, endDate, duration, description, techStack, liveUrl, githubUrl, featured: true
  };

  const list = (currentData?.projects || []).slice();
  const idx = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    list[idx] = newProj;
  } else {
    list.unshift(newProj);
  }

  await window.portfolioStore.saveProjects(list);
  currentData.projects = list;
  closeProjectModal();
  renderAllViews(currentData);
  showToast('Project saved successfully!', 'success');
}

async function handleDeleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  const list = (currentData?.projects || []).filter(p => p.id !== id);
  await window.portfolioStore.saveProjects(list);
  currentData.projects = list;
  renderAllViews(currentData);
  showToast('Project deleted.', 'info');
}


/* =========================================================================
 * TAB 3: SKILLS & DURATION
 * ========================================================================= */

function renderSkillsList(skills) {
  const container = document.getElementById('dashboardSkillsList');
  if (!container) return;

  const topics = currentData?.topics || [];

  if (skills.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 glass-card rounded-2xl border border-dashed border-gray-800">
        <p class="text-gray-400">No skills listed yet.</p>
        <button onclick="openAddSkillModal()" class="mt-3 px-4 py-2 bg-[#a855f7] text-white rounded-lg text-xs font-semibold">+ Add First Skill</button>
      </div>
    `;
    return;
  }

  const filtered = activeSkillCategory === 'All'
    ? skills
    : skills.filter(s => s.category === activeSkillCategory);

  container.innerHTML = filtered.map(skill => {
    const level = skill.level || 80;
    const linkedTopics = topics.filter(t => t.skillId === skill.id || (t.skillName && t.skillName.toLowerCase() === skill.name.toLowerCase()));
    const pendingCount = linkedTopics.filter(t => t.status !== 'Mastered').length;

    return `
      <div class="glass-card p-6 rounded-2xl relative flex flex-col justify-between hover:border-purple-500/50 transition">
        <div>
          <div class="flex justify-between items-start mb-3">
            <span class="text-3xl">${skill.icon || '⚡'}</span>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-purple-400 px-2 py-0.5 rounded-full bg-purple-950/50 border border-purple-800/40">
              ${escapeHtml(skill.category || 'General')}
            </span>
          </div>

          <h4 class="text-lg font-bold text-white mb-1">${escapeHtml(skill.name)}</h4>
          <p class="text-xs text-gray-400 mb-4 line-clamp-2">${escapeHtml(skill.description || '')}</p>

          <!-- Proficiency Slider Meter -->
          <div class="w-full bg-[#000021] rounded-full h-2 overflow-hidden border border-gray-800 mb-1.5">
            <div class="bg-gradient-to-r from-purple-600 to-[#a855f7] h-2 rounded-full" style="width: ${level}%"></div>
          </div>
          <div class="flex justify-between text-[11px] text-gray-400 font-mono-code mb-4">
            <span>Proficiency</span>
            <span class="text-purple-300 font-bold">${level}%</span>
          </div>

          <!-- Time Taken to Complete / Learn Duration Badge -->
          <div class="p-3 rounded-xl bg-[#000021] border border-purple-900/40 mb-4 space-y-1">
            <span class="text-[10px] text-gray-400 block uppercase font-medium">How Long It Took To Learn:</span>
            <span class="text-xs font-bold text-purple-300 font-mono-code block">⏱️ ${escapeHtml(skill.duration || '3 months')}</span>
          </div>

          <!-- Linked Roadmap Topics Pill -->
          <div class="mb-4">
            ${linkedTopics.length > 0 ? `
              <button onclick="filterTopicsBySkill('${skill.id}')" class="w-full text-left p-2 rounded-lg bg-amber-950/30 hover:bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between transition">
                <span>📌 ${linkedTopics.length} Concepts Linked (${pendingCount} pending)</span>
                <span>→</span>
              </button>
            ` : `
              <button onclick="openAddTopicForSkill('${skill.id}', '${escapeHtml(skill.name)}')" class="w-full text-left p-2 rounded-lg bg-[#000021] hover:bg-gray-800 border border-gray-800 text-gray-400 text-xs flex items-center justify-between transition">
                <span>+ Add Study Topic for this Skill</span>
                <span>+</span>
              </button>
            `}
          </div>
        </div>

        <div class="pt-4 border-t border-gray-800/80 flex justify-end space-x-2">
          <button onclick="openEditSkillModal('${skill.id}')" class="px-2.5 py-1 text-xs font-semibold rounded bg-gray-800 hover:bg-gray-700 text-gray-200 transition">Edit</button>
          <button onclick="handleDeleteSkill('${skill.id}')" class="px-2.5 py-1 text-xs font-semibold rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function setSkillFilter(cat) {
  activeSkillCategory = cat;
  const buttons = document.querySelectorAll('.skill-cat-btn');
  buttons.forEach(btn => {
    if (btn.textContent.includes(cat) || (cat === 'All' && btn.textContent.includes('All'))) {
      btn.className = 'skill-cat-btn active px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#a855f7] text-white';
    } else {
      btn.className = 'skill-cat-btn px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#12123e] text-gray-300 hover:text-white';
    }
  });
  renderSkillsList(currentData?.skills || []);
}

function openAddSkillModal() {
  document.getElementById('skillModalTitle').textContent = 'Add New Skill';
  document.getElementById('skillId').value = '';
  document.getElementById('skillIcon').value = '⚡';
  document.getElementById('skillName').value = '';
  document.getElementById('skillCategory').value = 'Frontend Core';
  document.getElementById('skillLevel').value = '85';
  document.getElementById('skillLevelLabel').textContent = '85%';
  document.getElementById('skillDuration').value = '';
  document.getElementById('skillDescription').value = '';

  const modal = document.getElementById('skillModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function openEditSkillModal(id) {
  const skill = (currentData?.skills || []).find(s => s.id === id);
  if (!skill) return;

  document.getElementById('skillModalTitle').textContent = 'Edit Skill';
  document.getElementById('skillId').value = skill.id;
  document.getElementById('skillIcon').value = skill.icon || '⚡';
  document.getElementById('skillName').value = skill.name || '';
  document.getElementById('skillCategory').value = skill.category || 'Frontend Core';
  document.getElementById('skillLevel').value = skill.level || 80;
  document.getElementById('skillLevelLabel').textContent = (skill.level || 80) + '%';
  document.getElementById('skillDuration').value = skill.duration || '';
  document.getElementById('skillDescription').value = skill.description || '';

  const modal = document.getElementById('skillModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function closeSkillModal() {
  const modal = document.getElementById('skillModal');
  modal.classList.add('hidden');
  modal.classList.remove('modal-active');
}

async function handleSaveSkill(e) {
  e.preventDefault();
  const id = document.getElementById('skillId').value || ('sk-' + Date.now());
  const icon = document.getElementById('skillIcon').value.trim() || '⚡';
  const name = document.getElementById('skillName').value.trim();
  const category = document.getElementById('skillCategory').value;
  const level = Number(document.getElementById('skillLevel').value) || 80;
  const duration = document.getElementById('skillDuration').value.trim();
  const description = document.getElementById('skillDescription').value.trim();

  const newSkill = { id, icon, name, category, level, duration, description };

  const list = (currentData?.skills || []).slice();
  const idx = list.findIndex(s => s.id === id);
  if (idx !== -1) {
    list[idx] = newSkill;
  } else {
    list.push(newSkill);
  }

  await window.portfolioStore.saveSkills(list);
  currentData.skills = list;
  closeSkillModal();
  renderAllViews(currentData);
  showToast('Skill saved successfully!', 'success');
}

async function handleDeleteSkill(id) {
  if (!confirm('Are you sure you want to delete this skill?')) return;
  const list = (currentData?.skills || []).filter(s => s.id !== id);
  await window.portfolioStore.saveSkills(list);
  currentData.skills = list;
  renderAllViews(currentData);
  showToast('Skill deleted.', 'info');
}


/* =========================================================================
 * TAB 4: ROADMAP & TO-DO TOPICS (RELATED TO SKILLS)
 * ========================================================================= */

function renderTopicsModule(topics, skills) {
  // Populate skill dropdowns in Topic Form and Filter
  const formSkillSelect = document.getElementById('topicSkillSelect');
  const filterSkillSelect = document.getElementById('topicSkillFilter');

  if (formSkillSelect) {
    formSkillSelect.innerHTML = skills.map(s => `
      <option value="${s.id}">${s.icon || ''} ${escapeHtml(s.name)}</option>
    `).join('');
  }

  if (filterSkillSelect) {
    const currentVal = filterSkillSelect.value;
    filterSkillSelect.innerHTML = `<option value="All">All Linked Skills</option>` + skills.map(s => `
      <option value="${s.id}">${s.icon || ''} ${escapeHtml(s.name)}</option>
    `).join('');
    filterSkillSelect.value = currentVal || 'All';
  }

  // Update summary strip
  const total = topics.length;
  const inProg = topics.filter(t => t.status === 'In Progress').length;
  const highPri = topics.filter(t => t.priority === 'High' && t.status !== 'Mastered').length;
  const mastered = topics.filter(t => t.status === 'Mastered').length;

  const kpiTot = document.getElementById('topicKpiTotal');
  if (kpiTot) kpiTot.textContent = total;
  const kpiProg = document.getElementById('topicKpiInProgress');
  if (kpiProg) kpiProg.textContent = inProg;
  const kpiHigh = document.getElementById('topicKpiHighPriority');
  if (kpiHigh) kpiHigh.textContent = highPri;
  const kpiMast = document.getElementById('topicKpiMastered');
  if (kpiMast) kpiMast.textContent = mastered;

  // Render cards
  renderTopicsList(topics);

  // Render Per-Skill Progress Meters
  renderSkillTopicsProgress(topics, skills);
}

function renderTopicsList(topics) {
  const container = document.getElementById('dashboardTopicsList');
  if (!container) return;

  if (topics.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 glass-card rounded-2xl border border-dashed border-gray-800">
        <p class="text-gray-400">No concepts queued in roadmap.</p>
        <button onclick="openAddTopicModal()" class="mt-3 px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold">+ Add First Concept</button>
      </div>
    `;
    return;
  }

  container.innerHTML = topics.map(t => {
    const isMastered = t.status === 'Mastered';
    const isInProgress = t.status === 'In Progress';

    const priorityBadge = t.priority === 'High' ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">High Priority</span>' :
                         (t.priority === 'Medium' ? '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">Medium</span>' : '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">Low</span>');

    const statusBadge = isMastered 
      ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950/70 text-green-300 border border-green-800/50">Mastered</span>'
      : (isInProgress ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-800/50">In Progress</span>'
                      : '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-gray-400 border border-gray-800">To Do</span>');

    return `
      <div class="glass-card p-5 rounded-2xl relative flex flex-col justify-between hover:border-amber-500/50 transition">
        <div>
          <!-- Header: Linked Skill + Priority & Status -->
          <div class="flex justify-between items-center mb-2.5">
            <span class="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
              <span>⚡</span>
              <span>${escapeHtml(t.skillName || 'General')}</span>
            </span>
            <div class="flex items-center space-x-1.5">
              ${priorityBadge}
              ${statusBadge}
            </div>
          </div>

          <h4 class="text-base font-bold text-white mb-1.5 ${isMastered ? 'line-through text-gray-500' : ''}">${escapeHtml(t.title)}</h4>
          <p class="text-xs text-gray-400 mb-3 line-clamp-2">${escapeHtml(t.concept || '')}</p>

          <!-- Target Date & Resource Strip -->
          <div class="p-2.5 rounded-lg bg-[#000021] border border-gray-800 text-xs flex justify-between items-center mb-3">
            <div class="flex items-center space-x-1.5 text-gray-400">
              <span>📅 Target:</span>
              <span class="text-amber-300 font-medium font-mono-code">${t.targetDate || 'Soon'}</span>
            </div>
            ${t.resource ? `
              <a href="${t.resource}" target="_blank" class="text-[11px] text-[#a855f7] hover:underline flex items-center space-x-1">
                <span>Doc Resource</span>
                <span>↗</span>
              </a>
            ` : ''}
          </div>

          ${t.notes ? `
            <p class="text-[11px] text-gray-400 italic mb-2">Note: ${escapeHtml(t.notes)}</p>
          ` : ''}
        </div>

        <!-- Action Strip -->
        <div class="pt-3 border-t border-gray-800 flex items-center justify-between">
          <button onclick="toggleTopicStatusQuick('${t.id}')" class="px-3 py-1 rounded text-xs font-semibold ${isMastered ? 'bg-green-950/50 text-green-300 border border-green-800/40' : (isInProgress ? 'bg-blue-950/50 text-blue-300 border border-blue-800/40' : 'bg-gray-800 hover:bg-gray-700 text-gray-300')} transition">
            ${isMastered ? '✓ Mastered' : (isInProgress ? 'Mark Mastered' : 'Start Topic')}
          </button>
          <div class="flex space-x-2">
            <button onclick="openEditTopicModal('${t.id}')" class="px-2 py-1 text-xs text-gray-400 hover:text-white">Edit</button>
            <button onclick="handleDeleteTopic('${t.id}')" class="px-2 py-1 text-xs text-red-400 hover:text-red-300">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSkillTopicsProgress(topics, skills) {
  const container = document.getElementById('skillTopicProgressBars');
  if (!container) return;

  container.innerHTML = skills.map(skill => {
    const linked = topics.filter(t => t.skillId === skill.id || (t.skillName && t.skillName.toLowerCase() === skill.name.toLowerCase()));
    if (linked.length === 0) return '';

    const mastered = linked.filter(t => t.status === 'Mastered').length;
    const pct = Math.round((mastered / linked.length) * 100);

    return `
      <div>
        <div class="flex justify-between text-xs text-gray-300 mb-1">
          <span class="font-medium">${skill.icon || ''} ${escapeHtml(skill.name)}</span>
          <span class="font-mono-code text-amber-300">${mastered} / ${linked.length} Mastered (${pct}%)</span>
        </div>
        <div class="w-full bg-[#000021] rounded-full h-1.5 overflow-hidden border border-gray-800">
          <div class="bg-gradient-to-r from-amber-500 to-green-400 h-1.5 rounded-full" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function filterTopicsList() {
  const query = (document.getElementById('topicSearchInput')?.value || '').toLowerCase();
  const skillId = document.getElementById('topicSkillFilter')?.value || 'All';
  const status = document.getElementById('topicStatusFilter')?.value || 'All';
  const priority = document.getElementById('topicPriorityFilter')?.value || 'All';

  let list = (currentData?.topics || []).slice();

  if (query) {
    list = list.filter(t => 
      t.title.toLowerCase().includes(query) ||
      (t.concept || '').toLowerCase().includes(query) ||
      (t.notes || '').toLowerCase().includes(query)
    );
  }

  if (skillId !== 'All') {
    list = list.filter(t => t.skillId === skillId);
  }

  if (status !== 'All') {
    list = list.filter(t => t.status === status);
  }

  if (priority !== 'All') {
    list = list.filter(t => t.priority === priority);
  }

  renderTopicsList(list);
}

function filterTopicsBySkill(skillId) {
  switchTab('topics');
  const sel = document.getElementById('topicSkillFilter');
  if (sel) {
    sel.value = skillId;
    filterTopicsList();
  }
}

function openAddTopicModal() {
  document.getElementById('topicModalTitle').textContent = 'Add To-Do Concept / Topic';
  document.getElementById('topicId').value = '';
  document.getElementById('topicTitle').value = '';
  document.getElementById('topicPriority').value = 'High';
  document.getElementById('topicStatus').value = 'To Do';
  document.getElementById('topicConcept').value = '';
  document.getElementById('topicResource').value = '';
  document.getElementById('topicNotes').value = '';

  // Default target date: 7 days from now
  const d = new Date();
  d.setDate(d.getDate() + 7);
  document.getElementById('topicTargetDate').value = d.toISOString().split('T')[0];

  const modal = document.getElementById('topicModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function openAddTopicForSkill(skillId, skillName) {
  openAddTopicModal();
  const sel = document.getElementById('topicSkillSelect');
  if (sel) sel.value = skillId;
}

function openEditTopicModal(id) {
  const topic = (currentData?.topics || []).find(t => t.id === id);
  if (!topic) return;

  document.getElementById('topicModalTitle').textContent = 'Edit Concept / Topic';
  document.getElementById('topicId').value = topic.id;
  document.getElementById('topicTitle').value = topic.title || '';
  document.getElementById('topicSkillSelect').value = topic.skillId || '';
  document.getElementById('topicPriority').value = topic.priority || 'High';
  document.getElementById('topicTargetDate').value = topic.targetDate || '';
  document.getElementById('topicStatus').value = topic.status || 'To Do';
  document.getElementById('topicConcept').value = topic.concept || '';
  document.getElementById('topicResource').value = topic.resource || '';
  document.getElementById('topicNotes').value = topic.notes || '';

  const modal = document.getElementById('topicModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function closeTopicModal() {
  const modal = document.getElementById('topicModal');
  modal.classList.add('hidden');
  modal.classList.remove('modal-active');
}

async function handleSaveTopic(e) {
  e.preventDefault();
  const id = document.getElementById('topicId').value || ('top-' + Date.now());
  const title = document.getElementById('topicTitle').value.trim();
  const skillSelect = document.getElementById('topicSkillSelect');
  const skillId = skillSelect.value;
  const skillName = skillSelect.options[skillSelect.selectedIndex]?.text?.replace(/^[^\w]+/, '').trim() || 'General';
  const priority = document.getElementById('topicPriority').value;
  const targetDate = document.getElementById('topicTargetDate').value;
  const status = document.getElementById('topicStatus').value;
  const concept = document.getElementById('topicConcept').value.trim();
  const resource = document.getElementById('topicResource').value.trim();
  const notes = document.getElementById('topicNotes').value.trim();

  const newTopic = { id, skillId, skillName, title, priority, targetDate, status, concept, resource, notes };

  const list = (currentData?.topics || []).slice();
  const idx = list.findIndex(t => t.id === id);
  if (idx !== -1) {
    list[idx] = newTopic;
  } else {
    list.unshift(newTopic);
  }

  await window.portfolioStore.saveTopics(list);
  currentData.topics = list;
  closeTopicModal();
  renderAllViews(currentData);
  showToast('Concept saved to roadmap!', 'success');
}

async function toggleTopicStatusQuick(id) {
  const newStatus = await window.portfolioStore.toggleTopicStatus(id);
  if (newStatus) {
    showToast(`Topic marked as: ${newStatus}`, 'info');
    renderAllViews(currentData);
  }
}

async function handleDeleteTopic(id) {
  if (!confirm('Are you sure you want to remove this topic?')) return;
  await window.portfolioStore.deleteTopic(id);
  renderAllViews(currentData);
  showToast('Topic deleted.', 'info');
}


/* =========================================================================
 * TAB 5: LEETCODE PROBLEMS TRACKER (PER DAY, PER WEEK, PER MONTH)
 * ========================================================================= */

function renderLeetCodeModule(leetcode) {
  const analytics = window.portfolioStore.getLeetCodeAnalytics();

  // Header Cards
  const cToday = document.getElementById('lcCardToday');
  if (cToday) cToday.textContent = analytics.solvedToday;
  const cTodayGoal = document.getElementById('lcCardTodayGoal');
  if (cTodayGoal) cTodayGoal.textContent = `Goal: ${analytics.goals.targetPerDay || 2} / day`;

  const cWeek = document.getElementById('lcCardWeek');
  if (cWeek) cWeek.textContent = analytics.solvedThisWeek;
  const cWeekGoal = document.getElementById('lcCardWeekGoal');
  if (cWeekGoal) cWeekGoal.textContent = `Goal: ${analytics.goals.targetPerWeek || 14} / wk`;

  const cMonth = document.getElementById('lcCardMonth');
  if (cMonth) cMonth.textContent = analytics.solvedThisMonth;
  const cMonthGoal = document.getElementById('lcCardMonthGoal');
  if (cMonthGoal) cMonthGoal.textContent = `Goal: ${analytics.goals.targetPerMonth || 50} / mo`;

  const cTot = document.getElementById('lcCardTotal');
  if (cTot) cTot.textContent = analytics.totalSolved;

  const cStreak = document.getElementById('lcCardStreak');
  if (cStreak) cStreak.textContent = `🔥 ${analytics.currentStreak}`;

  // Dedicated Chart
  renderDedicatedLeetCodeChart(currentData);

  // Solved Problems History Table
  renderLeetCodeTable(leetcode.problems || []);
}

function setDedicatedLcTimeframe(tf) {
  dedicatedLcTimeframe = tf;
  ['day', 'week', 'month'].forEach(t => {
    const btn = document.getElementById(`btnLcHub${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tf) {
        btn.className = 'px-3.5 py-1.5 rounded-md font-semibold bg-green-500 text-slate-950 transition';
      } else {
        btn.className = 'px-3.5 py-1.5 rounded-md font-medium text-gray-400 hover:text-white transition';
      }
    }
  });

  const title = document.getElementById('lcDedicatedChartTitle');
  const sub = document.getElementById('lcDedicatedChartSubtitle');
  if (title && sub) {
    if (tf === 'day') {
      title.textContent = 'Daily Solves Activity (Past 14 Days)';
      sub.textContent = 'Shows daily solved problems split by Easy, Medium, and Hard challenges';
    } else if (tf === 'week') {
      title.textContent = 'Weekly Solves Activity (Past 6 Weeks)';
      sub.textContent = 'Aggregated problem count week by week comparing performance against goals';
    } else {
      title.textContent = 'Monthly Solves Progression (Past 4 Months)';
      sub.textContent = 'Total problems solved per month split across difficulty levels';
    }
  }

  if (currentData) {
    renderDedicatedLeetCodeChart(currentData);
  }
}

function renderDedicatedLeetCodeChart(data) {
  const ctx = document.getElementById('dedicatedLeetCodeChart');
  if (!ctx) return;

  const analytics = window.portfolioStore.getLeetCodeAnalytics();
  let labels = [];
  let easyCounts = [];
  let medCounts = [];
  let hardCounts = [];

  if (dedicatedLcTimeframe === 'day') {
    labels = analytics.dailyActivity.map(d => d.label);
    easyCounts = analytics.dailyActivity.map(d => d.easy);
    medCounts = analytics.dailyActivity.map(d => d.medium);
    hardCounts = analytics.dailyActivity.map(d => d.hard);
  } else if (dedicatedLcTimeframe === 'week') {
    labels = analytics.weeklyActivity.map(w => `${w.label} (${w.dateRange})`);
    easyCounts = analytics.weeklyActivity.map(w => w.easy);
    medCounts = analytics.weeklyActivity.map(w => w.medium);
    hardCounts = analytics.weeklyActivity.map(w => w.hard);
  } else {
    labels = analytics.monthlyActivity.map(m => m.label);
    easyCounts = analytics.monthlyActivity.map(m => m.easy);
    medCounts = analytics.monthlyActivity.map(m => m.medium);
    hardCounts = analytics.monthlyActivity.map(m => m.hard);
  }

  if (dedicatedLcChartInstance) {
    dedicatedLcChartInstance.destroy();
  }

  dedicatedLcChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Easy',
          data: easyCounts,
          backgroundColor: '#22c55e',
          borderRadius: 4
        },
        {
          label: 'Medium',
          data: medCounts,
          backgroundColor: '#f59e0b',
          borderRadius: 4
        },
        {
          label: 'Hard',
          data: hardCounts,
          backgroundColor: '#ef4444',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { size: 10 } }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: '#1f2937' },
          ticks: { color: '#9ca3af', font: { size: 10 }, stepSize: 1 }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#e5e7eb', boxWidth: 12, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#000021',
          borderColor: '#22c55e',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#e5e7eb'
        }
      }
    }
  });
}

function renderLeetCodeTable(problems) {
  const tbody = document.getElementById('leetcodeProblemsTableBody');
  if (!tbody) return;

  if (problems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-500">No LeetCode problems logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = problems.map(p => {
    const diffBadge = p.difficulty === 'Easy' 
      ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950/70 text-green-400 border border-green-800/50">Easy</span>'
      : (p.difficulty === 'Hard' 
          ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 text-red-400 border border-red-800/50">Hard</span>'
          : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-400 border border-amber-800/50">Medium</span>');

    return `
      <tr class="hover:bg-gray-800/30 transition">
        <td class="py-3 px-4 font-medium text-white">
          <div class="flex items-center space-x-2">
            <span class="text-purple-400 font-mono-code font-bold">#${p.number}</span>
            ${p.url && p.url !== '#' ? `
              <a href="${p.url}" target="_blank" class="hover:underline hover:text-green-300 font-semibold">${escapeHtml(p.title)} ↗</a>
            ` : `<span>${escapeHtml(p.title)}</span>`}
          </div>
        </td>
        <td class="py-3 px-4">${diffBadge}</td>
        <td class="py-3 px-4 text-gray-300 font-mono-code text-[11px]">${escapeHtml(p.topic || 'General')}</td>
        <td class="py-3 px-4 text-gray-400 font-mono-code text-[11px]">${p.date || 'N/A'}</td>
        <td class="py-3 px-4 text-purple-300 font-mono-code font-semibold">${p.timeMinutes ? `⏱️ ${p.timeMinutes}m` : '—'}</td>
        <td class="py-3 px-4 text-gray-400 max-w-xs truncate" title="${escapeHtml(p.approach || '')}">${escapeHtml(p.approach || '—')}</td>
        <td class="py-3 px-4 text-right space-x-2">
          <button onclick="openEditLeetCodeModal('${p.id}')" class="text-xs text-gray-400 hover:text-white">Edit</button>
          <button onclick="handleDeleteLeetCode('${p.id}')" class="text-xs text-red-400 hover:text-red-300">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterLeetCodeList() {
  const query = (document.getElementById('lcSearchInput')?.value || '').toLowerCase();
  const diff = document.getElementById('lcDifficultyFilter')?.value || 'All';
  const timeframe = document.getElementById('lcDateFilter')?.value || 'All';

  let list = (currentData?.leetcode?.problems || []).slice();

  if (query) {
    list = list.filter(p => 
      String(p.number).includes(query) ||
      p.title.toLowerCase().includes(query) ||
      (p.topic || '').toLowerCase().includes(query) ||
      (p.approach || '').toLowerCase().includes(query)
    );
  }

  if (diff !== 'All') {
    list = list.filter(p => p.difficulty === diff);
  }

  if (timeframe !== 'All') {
    const todayStr = list.length > 0 ? list[0].date : new Date().toISOString().split('T')[0];
    if (timeframe === 'today') {
      list = list.filter(p => p.date === todayStr);
    } else if (timeframe === 'week') {
      const wDate = new Date(todayStr);
      wDate.setDate(wDate.getDate() - 6);
      const wStr = wDate.toISOString().split('T')[0];
      list = list.filter(p => p.date >= wStr && p.date <= todayStr);
    } else if (timeframe === 'month') {
      const mStr = todayStr.substring(0, 7);
      list = list.filter(p => p.date && p.date.startsWith(mStr));
    }
  }

  renderLeetCodeTable(list);
}

function openAddLeetCodeModal() {
  document.getElementById('leetcodeModalTitle').textContent = 'Log LeetCode Solved Problem';
  document.getElementById('lcId').value = '';
  document.getElementById('lcNumber').value = '';
  document.getElementById('lcTitle').value = '';
  document.getElementById('lcDifficulty').value = 'Medium';
  document.getElementById('lcTopic').value = 'Arrays & Hashing';
  document.getElementById('lcTimeMinutes').value = '20';
  document.getElementById('lcDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('lcUrl').value = '';
  document.getElementById('lcApproach').value = '';

  const modal = document.getElementById('leetcodeModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function openEditLeetCodeModal(id) {
  const p = (currentData?.leetcode?.problems || []).find(item => item.id === id);
  if (!p) return;

  document.getElementById('leetcodeModalTitle').textContent = 'Edit LeetCode Problem';
  document.getElementById('lcId').value = p.id;
  document.getElementById('lcNumber').value = p.number || '';
  document.getElementById('lcTitle').value = p.title || '';
  document.getElementById('lcDifficulty').value = p.difficulty || 'Medium';
  document.getElementById('lcTopic').value = p.topic || '';
  document.getElementById('lcTimeMinutes').value = p.timeMinutes || 20;
  document.getElementById('lcDate').value = p.date || '';
  document.getElementById('lcUrl').value = p.url || '';
  document.getElementById('lcApproach').value = p.approach || '';

  const modal = document.getElementById('leetcodeModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function closeLeetCodeModal() {
  const modal = document.getElementById('leetcodeModal');
  modal.classList.add('hidden');
  modal.classList.remove('modal-active');
}

function openQuickLeetCodeModal() {
  document.getElementById('quickLcTitle').value = '';
  document.getElementById('quickLcDiff').value = 'Medium';
  document.getElementById('quickLcMins').value = '20';
  document.getElementById('quickLcTopic').value = 'Arrays & Hashing';

  const modal = document.getElementById('quickLeetCodeModal');
  modal.classList.remove('hidden');
  modal.classList.add('modal-active');
}

function closeQuickLeetCodeModal() {
  const modal = document.getElementById('quickLeetCodeModal');
  modal.classList.add('hidden');
  modal.classList.remove('modal-active');
}

async function quickLogSolve(diff) {
  openQuickLeetCodeModal();
  document.getElementById('quickLcDiff').value = diff;
  document.getElementById('quickLcMins').value = diff === 'Easy' ? 10 : (diff === 'Medium' ? 25 : 45);
}

async function handleQuickLeetCodeSave(e) {
  e.preventDefault();
  const rawTitle = document.getElementById('quickLcTitle').value.trim();
  const diff = document.getElementById('quickLcDiff').value;
  const mins = Number(document.getElementById('quickLcMins').value) || 20;
  const topic = document.getElementById('quickLcTopic').value.trim() || 'Algorithms';

  // Extract problem number if given like "#121 Title"
  let num = (currentData?.leetcode?.problems || []).length + 1;
  let title = rawTitle;
  const matchNum = rawTitle.match(/^#?(\d+)\s*(.*)/);
  if (matchNum) {
    num = Number(matchNum[1]);
    title = matchNum[2] || `Problem ${num}`;
  }

  const problem = {
    number: num,
    title: title,
    difficulty: diff,
    topic: topic,
    timeMinutes: mins,
    date: new Date().toISOString().split('T')[0],
    approach: 'Quick logged solve.'
  };

  await window.portfolioStore.addLeetCodeProblem(problem);
  closeQuickLeetCodeModal();
  renderAllViews(currentData);
  showToast(`Solved Problem #${num} logged!`, 'success');
}

async function handleSaveLeetCode(e) {
  e.preventDefault();
  const id = document.getElementById('lcId').value;
  const number = Number(document.getElementById('lcNumber').value) || 1;
  const title = document.getElementById('lcTitle').value.trim();
  const difficulty = document.getElementById('lcDifficulty').value;
  const topic = document.getElementById('lcTopic').value.trim() || 'Algorithms';
  const timeMinutes = Number(document.getElementById('lcTimeMinutes').value) || 20;
  const date = document.getElementById('lcDate').value;
  const url = document.getElementById('lcUrl').value.trim() || '#';
  const approach = document.getElementById('lcApproach').value.trim();

  const problemObj = { id, number, title, difficulty, topic, timeMinutes, date, url, approach };

  if (id) {
    await window.portfolioStore.updateLeetCodeProblem(problemObj);
  } else {
    await window.portfolioStore.addLeetCodeProblem(problemObj);
  }

  closeLeetCodeModal();
  renderAllViews(currentData);
  showToast('LeetCode problem saved!', 'success');
}

async function handleDeleteLeetCode(id) {
  if (!confirm('Are you sure you want to delete this solve record?')) return;
  await window.portfolioStore.deleteLeetCodeProblem(id);
  renderAllViews(currentData);
  showToast('Record deleted.', 'info');
}

function exportLeetCodeCSV() {
  const problems = currentData?.leetcode?.problems || [];
  if (problems.length === 0) {
    showToast('No solves to export.', 'info');
    return;
  }

  const headers = ['Number', 'Title', 'Difficulty', 'Topic', 'Date', 'TimeMinutes', 'URL', 'Approach'];
  const rows = problems.map(p => [
    p.number,
    `"${(p.title || '').replace(/"/g, '""')}"`,
    p.difficulty,
    `"${(p.topic || '').replace(/"/g, '""')}"`,
    p.date,
    p.timeMinutes,
    `"${(p.url || '').replace(/"/g, '""')}"`,
    `"${(p.approach || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csv, `leetcode-solves-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}


/* =========================================================================
 * TAB 6: MESSAGES / INBOX
 * ========================================================================= */

function renderMessagesList(messages) {
  const container = document.getElementById('dashboardMessagesList');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `<div class="text-center py-12 glass-card rounded-2xl text-gray-500">No inquiries received yet.</div>`;
    return;
  }

  container.innerHTML = messages.map(msg => {
    const isNew = msg.status === 'New';
    return `
      <div class="glass-card p-5 rounded-2xl relative ${isNew ? 'border-l-4 border-l-red-500' : ''}">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-bold text-white text-base">${escapeHtml(msg.name)}</h4>
            <p class="text-xs text-purple-300">${escapeHtml(msg.email)} • <span class="text-gray-400">${msg.date}</span></p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${isNew ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-gray-800 text-gray-400'}">${msg.status}</span>
        </div>
        <p class="text-xs font-semibold text-gray-300 mb-1">Subject: ${escapeHtml(msg.subject || 'General')}</p>
        <p class="text-xs text-gray-400 bg-[#000021] p-3 rounded-lg border border-gray-800">${escapeHtml(msg.message)}</p>

        <div class="mt-3 flex justify-end space-x-2">
          <a href="mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Portfolio Inquiry')}" class="px-3 py-1 bg-purple-950/60 hover:bg-purple-900 text-purple-300 text-xs font-semibold rounded border border-purple-800/40">Reply Email</a>
          ${isNew ? `<button onclick="handleMarkMessageReplied('${msg.id}')" class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded">Mark Replied</button>` : ''}
          <button onclick="handleDeleteMessage('${msg.id}')" class="px-3 py-1 bg-red-950/40 hover:bg-red-900 text-red-400 text-xs rounded border border-red-900/40">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

async function handleMarkMessageReplied(id) {
  await window.portfolioStore.updateMessageStatus(id, 'Replied');
  renderAllViews(currentData);
  showToast('Message marked as replied.', 'info');
}

async function handleDeleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  await window.portfolioStore.deleteMessage(id);
  renderAllViews(currentData);
  showToast('Message deleted.', 'info');
}

function exportMessagesCSV() {
  const msgs = currentData?.messages || [];
  if (msgs.length === 0) return;

  const headers = ['ID', 'Date', 'Name', 'Email', 'Subject', 'Status', 'Message'];
  const rows = msgs.map(m => [
    m.id, m.date, `"${m.name}"`, m.email, `"${m.subject || ''}"`, m.status, `"${(m.message || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csv, `portfolio-inquiries-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}


/* =========================================================================
 * TAB 7: PROFILE & BIO SETTINGS
 * ========================================================================= */

function populateSettingsForm(p) {
  document.getElementById('settingName').value = p.name || '';
  document.getElementById('settingRole').value = p.role || '';
  document.getElementById('settingHeadline').value = p.headline || '';
  document.getElementById('settingTargetGoal').value = p.targetGoal || '';
  document.getElementById('settingTypedStrings').value = (p.typedStrings || []).join(', ');
  document.getElementById('settingAbout').value = p.about || '';
  document.getElementById('settingEmail').value = p.email || '';
  document.getElementById('settingPhone').value = p.phone || '';
  document.getElementById('settingLeetCode').value = p.leetcodeUrl || '';
  document.getElementById('settingGithub').value = p.githubUrl || '';
  document.getElementById('settingLinkedin').value = p.linkedinUrl || '';
  document.getElementById('settingResume').value = p.resumeUrl || '';
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const rawTyped = document.getElementById('settingTypedStrings').value;
  const typedStrings = rawTyped.split(',').map(s => s.trim()).filter(Boolean);

  const profileData = {
    name: document.getElementById('settingName').value.trim(),
    role: document.getElementById('settingRole').value.trim(),
    headline: document.getElementById('settingHeadline').value.trim(),
    targetGoal: document.getElementById('settingTargetGoal').value.trim(),
    typedStrings: typedStrings.length > 0 ? typedStrings : ["Web Developer.", "Problem Solver."],
    about: document.getElementById('settingAbout').value.trim(),
    email: document.getElementById('settingEmail').value.trim(),
    phone: document.getElementById('settingPhone').value.trim(),
    leetcodeUrl: document.getElementById('settingLeetCode').value.trim(),
    githubUrl: document.getElementById('settingGithub').value.trim(),
    linkedinUrl: document.getElementById('settingLinkedin').value.trim(),
    resumeUrl: document.getElementById('settingResume').value.trim()
  };

  await window.portfolioStore.saveProfile(profileData);
  currentData.profile = profileData;
  showToast('Profile & Bio updated successfully!', 'success');
}


/* =========================================================================
 * UTILITY HELPERS & EXPORT / RESET
 * ========================================================================= */

function exportDataBackup() {
  if (!currentData) return;
  const json = JSON.stringify(currentData, null, 2);
  downloadBlob(json, `portfolio-data-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

async function resetDataPrompt() {
  if (!confirm('Reset all data back to initial defaults? All changes will be restored to seed values.')) return;
  await window.portfolioStore.resetToDefaults();
  await refreshDashboard();
  showToast('All data reset to initial defaults.', 'info');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-[#a855f7]');
  toast.className = `${bg} text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl pointer-events-auto transition-opacity duration-300 flex items-center space-x-2`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
