/**
 * Public Portfolio Controller for Ravi Ardhana
 * Renders dynamic profile, skills (with learning duration),
 * roadmap concepts to cover soon, projects (with completion duration & timeline),
 * and LeetCode problem solving metrics (per day, per week, per month).
 */

let typedInstance = null;
let activeProjectCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
  initPortfolio();
});

async function initPortfolio() {
  try {
    if (window.portfolioStore) {
      window.portfolioStore.logVisit(window.location.pathname);
    }
  } catch (e) {}

  await renderPortfolioData();

  // Listen for real-time updates from Dashboard
  window.addEventListener('portfolioDataChanged', (e) => {
    renderPortfolioData();
  });

  // Cross-tab Broadcast Channel
  try {
    const bus = new BroadcastChannel('ravi_portfolio_bus');
    bus.onmessage = (event) => {
      if (window.portfolioStore && event.data) {
        window.portfolioStore.cache = event.data;
      }
      renderPortfolioData();
    };
  } catch (e) {}

  // LocalStorage sync across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'ravi_portfolio_state_v2' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (window.portfolioStore) {
          window.portfolioStore.cache = parsed;
        }
        renderPortfolioData();
      } catch (err) {}
    }
  });

  setupContactForm();
}

async function renderPortfolioData() {
  if (!window.portfolioStore) return;
  const data = await window.portfolioStore.getData();

  // 1. Profile & Hero Section
  if (data.profile) {
    const p = data.profile;
    
    const brandName = document.getElementById('navBrandName');
    if (brandName) brandName.textContent = p.name || 'Ravi Ardhana';

    const heroName = document.querySelector('.hero-name');
    if (heroName) heroName.textContent = p.name || 'Ravi Ardhana';

    const heroIntro = document.querySelector('.hero-intro');
    if (heroIntro) heroIntro.textContent = `Hello, I'm`;

    const heroHeadline = document.querySelector('.hero-headline');
    if (heroHeadline) heroHeadline.textContent = `${p.headline || 'A Passionate'} `;

    const targetGoalText = document.getElementById('heroTargetGoalText');
    if (targetGoalText) targetGoalText.textContent = p.targetGoal || 'Target: 300+ Problems & Full-Stack Mastery';

    const resumeBtn = document.getElementById('viewResumeBtn');
    if (resumeBtn && p.resumeUrl) {
      resumeBtn.href = p.resumeUrl;
      resumeBtn.target = p.resumeUrl.startsWith('http') ? '_blank' : '_self';
    }

    // Typed.js Dynamic Reload
    if (window.Typed && p.typedStrings && p.typedStrings.length > 0) {
      if (typedInstance) {
        typedInstance.destroy();
      }
      typedInstance = new Typed('#element', {
        strings: p.typedStrings,
        typeSpeed: 45,
        backSpeed: 25,
        loop: true
      });
    }

    // About Section
    const aboutText = document.getElementById('aboutBioText');
    if (aboutText && p.about) {
      aboutText.textContent = p.about;
    }

    // Contact Coordinates
    const emailLink = document.getElementById('contactEmail');
    if (emailLink && p.email) {
      emailLink.textContent = p.email;
      emailLink.href = `mailto:${p.email}`;
    }

    const instaLink = document.getElementById('contactInstagram');
    if (instaLink && p.instagram) {
      instaLink.textContent = p.instagram;
      instaLink.href = p.instagramUrl || `https://instagram.com/${p.instagram.replace('@', '')}`;
    }

    const phoneText = document.getElementById('contactPhone');
    if (phoneText && p.phone) {
      phoneText.textContent = p.phone;
    }

    const footerCopy = document.getElementById('footerCopyright');
    if (footerCopy) {
      const year = new Date().getFullYear();
      footerCopy.innerHTML = `&copy; ${year} ${p.name || 'Ravi Ardhana'}. All rights reserved. | Built with Passion & Dynamic Dashboard.`;
    }
  }

  // 2. Technical Skills with Learning Duration
  renderSkills(data.skills || []);

  // 3. Roadmap: Upcoming Concepts to Cover Soon
  renderRoadmap(data.topics || []);

  // 4. Projects with Milestones & Completion Timeline Duration
  renderProjects(data.projects || []);

  // 5. LeetCode Showcase (Day, Week, Month)
  renderLeetCodeShowcase();
}

function renderSkills(skills) {
  const container = document.getElementById('skillsContainer');
  if (!container) return;

  if (skills.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-8 text-gray-400">No skills listed yet. Add some in the dashboard!</div>`;
    return;
  }

  container.innerHTML = skills.map(skill => {
    const level = skill.level || 80;
    return `
      <div class="skill-card bg-[#12123e] p-6 rounded-xl text-center group relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
        <div>
          <div class="text-5xl mb-3 transform group-hover:scale-110 transition duration-300" role="img" aria-label="${skill.name}">
            ${skill.icon || '⚡'}
          </div>
          <h3 class="text-xl font-semibold text-white mb-1">${escapeHtml(skill.name)}</h3>
          <p class="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wider">${escapeHtml(skill.category || 'General')}</p>
          <p class="text-sm text-gray-400 mb-4 line-clamp-2">${escapeHtml(skill.description || '')}</p>
          
          <!-- Animated Progress Meter -->
          <div class="w-full bg-[#000021] rounded-full h-2.5 overflow-hidden border border-gray-700 mb-1.5">
            <div class="bg-gradient-to-r from-purple-600 to-[#a855f7] h-2.5 rounded-full transition-all duration-1000 ease-out" style="width: ${level}%"></div>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-400 font-mono-code mb-4">
            <span>Proficiency</span>
            <span class="text-purple-300 font-bold">${level}%</span>
          </div>
        </div>

        <!-- How Long It Took To Complete / Learn Badge -->
        <div class="pt-3 border-t border-gray-800/80">
          <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#000021] border border-purple-900/50 text-xs text-purple-300 font-semibold font-mono-code">
            <span>⏱️ Took:</span>
            <span>${escapeHtml(skill.duration || '3 months')}</span>
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderRoadmap(topics) {
  const container = document.getElementById('roadmapContainer');
  if (!container) return;

  const pendingTopics = topics.filter(t => t.status !== 'Mastered');

  if (pendingTopics.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-10 bg-[#12123e]/50 rounded-xl border border-dashed border-gray-800">
        <p class="text-gray-400">All topics currently mastered! Add upcoming concepts in the dashboard.</p>
        <a href="dashboard.html#topics-tab" class="inline-block mt-2 text-sm text-amber-400 hover:underline">Open Roadmap Manager →</a>
      </div>
    `;
    return;
  }

  container.innerHTML = pendingTopics.slice(0, 6).map(t => {
    const isHigh = t.priority === 'High';
    const priorityBadge = isHigh 
      ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 text-red-300 border border-red-800/50">High Priority</span>'
      : '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/50">Medium</span>';

    const statusBadge = t.status === 'In Progress'
      ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-800/50 animate-pulse">In Progress</span>'
      : '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-gray-400 border border-gray-800">To Do</span>';

    return `
      <div class="bg-[#12123e] p-6 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition duration-300 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
              <span>⚡</span>
              <span>${escapeHtml(t.skillName || 'Technical Skill')}</span>
            </span>
            <div class="flex items-center space-x-1.5">
              ${priorityBadge}
              ${statusBadge}
            </div>
          </div>

          <h3 class="text-xl font-bold text-white mb-2">${escapeHtml(t.title)}</h3>
          <p class="text-sm text-gray-300 leading-relaxed mb-4">${escapeHtml(t.concept || '')}</p>
        </div>

        <div class="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
          <span class="text-amber-300 font-mono-code">📅 Cover by: ${t.targetDate || 'Soon'}</span>
          ${t.resource ? `
            <a href="${t.resource}" target="_blank" class="text-purple-400 hover:text-white flex items-center space-x-1 font-semibold">
              <span>Documentation</span>
              <span>↗</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderProjects(projects) {
  const container = document.getElementById('projectsContainer');
  const filterContainer = document.getElementById('projectFilterContainer');
  if (!container) return;

  const categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];

  if (filterContainer) {
    filterContainer.innerHTML = categories.map(cat => `
      <button onclick="setProjectFilter('${cat}')" 
        class="px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${activeProjectCategory === cat ? 'bg-[#a855f7] text-white shadow-md shadow-purple-900/50' : 'bg-[#12123e] text-gray-300 hover:text-white hover:bg-purple-900/40'}">
        ${cat}
      </button>
    `).join('');
  }

  const filtered = activeProjectCategory === 'All' 
    ? projects 
    : projects.filter(p => p.category === activeProjectCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 bg-[#12123e]/50 rounded-xl border border-dashed border-gray-700">
        <p class="text-gray-400 text-lg">No projects found in this category.</p>
        <a href="dashboard.html" class="inline-block mt-3 text-sm text-[#a855f7] hover:underline">Manage projects in Dashboard →</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(proj => {
    const techBadges = (Array.isArray(proj.techStack) ? proj.techStack : (proj.techStack ? proj.techStack.split(',') : []))
      .map(tech => `
        <span class="text-xs bg-[#000021] border border-gray-700 text-purple-300 px-2.5 py-1 rounded-md font-medium font-mono-code">
          ${escapeHtml(tech.trim())}
        </span>
      `).join('');

    const isCompleted = proj.status === 'Completed';
    const statusBadge = isCompleted
      ? `<span class="bg-green-950/80 text-green-400 border border-green-700/50 text-xs px-2.5 py-0.5 rounded-full font-semibold">Completed</span>`
      : `<span class="bg-purple-950/80 text-purple-300 border border-purple-700/50 text-xs px-2.5 py-0.5 rounded-full font-semibold">In Progress</span>`;

    return `
      <div class="bg-[#12123e] rounded-2xl border border-gray-800 p-6 md:p-8 flex flex-col justify-between hover:border-[#a855f7] hover:shadow-xl hover:shadow-purple-950/30 transition-all duration-300 group">
        <div>
          <div class="flex justify-between items-start mb-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-purple-400">${escapeHtml(proj.category || 'Development')}</span>
            ${statusBadge}
          </div>
          <h3 class="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">${escapeHtml(proj.title)}</h3>
          <p class="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">${escapeHtml(proj.description)}</p>

          <!-- Timeline & Completion Duration Strip -->
          <div class="p-3.5 rounded-xl bg-[#000021] border border-purple-900/40 mb-5 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-400 font-medium">⏱️ How Long It Took:</span>
              <span class="text-purple-300 font-bold font-mono-code">${escapeHtml(proj.duration || 'N/A')}</span>
            </div>
            ${proj.startDate ? `
              <div class="flex justify-between items-center text-[11px] text-gray-500">
                <span>Timeline:</span>
                <span class="font-mono-code">${proj.startDate} → ${proj.endDate || 'Present'}</span>
              </div>
            ` : ''}
            <!-- Mini Progress Bar -->
            <div class="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div class="${isCompleted ? 'bg-gradient-to-r from-purple-500 to-green-400' : 'bg-gradient-to-r from-purple-500 to-blue-400'} h-1.5 rounded-full" style="width: ${isCompleted ? '100%' : '65%'}"></div>
            </div>
          </div>
        </div>
        
        <div>
          <div class="flex flex-wrap gap-1.5 mb-6">
            ${techBadges}
          </div>
          <div class="flex items-center space-x-4 border-t border-gray-800 pt-4">
            ${proj.liveUrl && proj.liveUrl !== '#' ? `
              <a href="${proj.liveUrl}" target="_blank" class="flex items-center space-x-1.5 text-sm font-semibold text-[#a855f7] hover:text-purple-300 transition-colors">
                <span>Live Demo</span>
                <span>↗</span>
              </a>
            ` : ''}
            ${proj.githubUrl && proj.githubUrl !== '#' ? `
              <a href="${proj.githubUrl}" target="_blank" class="flex items-center space-x-1.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                <span>Source Code</span>
                <span>↗</span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.setProjectFilter = function(category) {
  activeProjectCategory = category;
  if (window.portfolioStore) {
    const data = window.portfolioStore.cache;
    renderProjects(data.projects || []);
  }
};

function renderLeetCodeShowcase() {
  if (!window.portfolioStore) return;
  const analytics = window.portfolioStore.getLeetCodeAnalytics();

  // Header Numbers
  const tEl = document.getElementById('publicLcToday');
  if (tEl) tEl.textContent = analytics.solvedToday;

  const wEl = document.getElementById('publicLcWeek');
  if (wEl) wEl.textContent = analytics.solvedThisWeek;

  const mEl = document.getElementById('publicLcMonth');
  if (mEl) mEl.textContent = analytics.solvedThisMonth;

  const totEl = document.getElementById('publicLcTotal');
  if (totEl) totEl.textContent = analytics.totalSolved;

  const strkEl = document.getElementById('publicLcStreak');
  if (strkEl) strkEl.textContent = `🔥 ${analytics.currentStreak}`;

  // Hero strip pill
  const heroLcText = document.getElementById('heroLeetCodeText');
  if (heroLcText) heroLcText.textContent = `${analytics.totalSolved}+ LeetCode Solved`;

  const heroStreakText = document.getElementById('heroStreakText');
  if (heroStreakText) heroStreakText.textContent = `${analytics.currentStreak}-Day Active Streak`;

  // Difficulty percentages & bar
  const total = analytics.totalSolved || 1;
  const easyPct = Math.round(((analytics.byDifficulty.Easy || 0) / total) * 100);
  const medPct = Math.round(((analytics.byDifficulty.Medium || 0) / total) * 100);
  const hardPct = Math.max(0, 100 - easyPct - medPct);

  const easyLabel = document.getElementById('publicLcEasyPct');
  if (easyLabel) easyLabel.textContent = `Easy: ${easyPct}% (${analytics.byDifficulty.Easy || 0})`;

  const medLabel = document.getElementById('publicLcMedPct');
  if (medLabel) medLabel.textContent = `Medium: ${medPct}% (${analytics.byDifficulty.Medium || 0})`;

  const hardLabel = document.getElementById('publicLcHardPct');
  if (hardLabel) hardLabel.textContent = `Hard: ${hardPct}% (${analytics.byDifficulty.Hard || 0})`;

  const barSplit = document.getElementById('publicLcBarSplit');
  if (barSplit) {
    barSplit.innerHTML = `
      <div class="bg-green-500 h-3" style="width: ${easyPct}%" title="Easy (${easyPct}%)"></div>
      <div class="bg-amber-500 h-3" style="width: ${medPct}%" title="Medium (${medPct}%)"></div>
      <div class="bg-red-500 h-3" style="width: ${hardPct}%" title="Hard (${hardPct}%)"></div>
    `;
  }

  // Recent Solves list
  const recentContainer = document.getElementById('publicRecentLcSolves');
  if (recentContainer) {
    const problems = (window.portfolioStore.cache?.leetcode?.problems || []).slice(0, 3);
    recentContainer.innerHTML = problems.map(p => {
      const diffColor = p.difficulty === 'Easy' ? 'text-green-400 bg-green-950/60 border-green-800/40' :
                        (p.difficulty === 'Hard' ? 'text-red-400 bg-red-950/60 border-red-800/40' : 'text-amber-400 bg-amber-950/60 border-amber-800/40');
      return `
        <div class="p-3 rounded-xl bg-[#000021] border border-gray-800">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold text-white truncate max-w-[180px]">#${p.number} ${escapeHtml(p.title)}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold ${diffColor}">${p.difficulty}</span>
          </div>
          <p class="text-[11px] text-gray-400 line-clamp-2">${escapeHtml(p.approach || 'Solved efficiently.')}</p>
          <div class="mt-2 flex justify-between items-center text-[10px] text-gray-500 font-mono-code">
            <span>${p.topic || 'Algorithms'}</span>
            <span>⏱️ ${p.timeMinutes || 20}m • ${p.date || 'Recent'}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const origHtml = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<span>Transmitting to Dashboard...</span><span class="animate-spin">↻</span>`;

    const payload = {
      name: document.getElementById('formName').value.trim(),
      email: document.getElementById('formEmail').value.trim(),
      subject: document.getElementById('formSubject').value.trim(),
      message: document.getElementById('formMessage').value.trim()
    };

    try {
      await window.portfolioStore.submitContactForm(payload);
      form.reset();
      btn.className = 'w-full py-3.5 bg-green-600 text-white font-semibold rounded-lg shadow-lg shadow-green-900/50 flex items-center justify-center space-x-2';
      btn.innerHTML = `<span>Delivered Successfully to Dashboard!</span><span>✓</span>`;
      setTimeout(() => {
        btn.disabled = false;
        btn.className = 'w-full py-3.5 bg-[#a855f7] hover:bg-purple-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-900/50 transition duration-300 flex items-center justify-center space-x-2';
        btn.innerHTML = origHtml;
      }, 4000);
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `<span>Failed to send. Try again</span><span>❌</span>`;
      setTimeout(() => { btn.innerHTML = origHtml; }, 3000);
    }
  });
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
