/**
 * 404.js
 * Interactive PACS Workstation Controller & Clinical Recovery Engine
 * My Radiology Guide
 */

(function () {
  'use strict';

  // Modality SVG Geometry & Configurations
  const MODALITIES = {
    ct: {
      name: 'CT Scan (Axial)',
      series: 'SERIES: CT-BRAIN-AXIAL',
      matrix: '512 x 512 · 12-bit HU',
      thickness: '1.25 mm',
      defaultWindow: 80,
      defaultLevel: 40,
      svg: `
        <g id="ct-slice" stroke="#38bdf8" stroke-width="1.5" fill="none" opacity="0.85">
          <!-- Outer Cranial Vault -->
          <ellipse cx="256" cy="256" rx="190" ry="215" stroke-width="6" stroke="#94a3b8" />
          <ellipse cx="256" cy="256" rx="178" ry="202" stroke-width="2" stroke="#64748b" />
          <!-- Falx Cerebri -->
          <line x1="256" y1="58" x2="256" y2="454" stroke-dasharray="4,4" stroke="#0ea5e9" stroke-width="1.5" />
          <!-- Lateral Ventricles (Frontal & Occipital Horns) -->
          <path d="M225,210 Q240,240 220,285 Q205,270 210,230 Z" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" />
          <path d="M287,210 Q272,240 292,285 Q307,270 302,230 Z" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" />
          <!-- Third Ventricle -->
          <line x1="256" y1="230" x2="256" y2="270" stroke-width="3" stroke="#38bdf8" />
          <!-- Cortical Sulcal Grooves -->
          <path d="M120,170 Q145,190 125,230" stroke="#0284c7" stroke-width="1.2" />
          <path d="M392,170 Q367,190 387,230" stroke="#0284c7" stroke-width="1.2" />
          <path d="M110,290 Q150,300 130,350" stroke="#0284c7" stroke-width="1.2" />
          <path d="M402,290 Q362,300 382,350" stroke="#0284c7" stroke-width="1.2" />
          <!-- Diagnostic Grid -->
          <circle cx="256" cy="256" r="235" stroke="rgba(56, 189, 248, 0.15)" stroke-dasharray="2,6" />
          <circle cx="256" cy="256" r="140" stroke="rgba(56, 189, 248, 0.1)" stroke-dasharray="2,6" />
        </g>
      `
    },
    mri: {
      name: 'MRI (T2-FLAIR)',
      series: 'SERIES: MR-T2-FLAIR-TSE',
      matrix: '384 x 384 · TR: 9000 TE: 120',
      thickness: '3.00 mm',
      defaultWindow: 120,
      defaultLevel: 60,
      svg: `
        <g id="mri-slice" stroke="#a855f7" stroke-width="1.5" fill="none" opacity="0.85">
          <!-- Brain Parenchyma Boundary -->
          <path d="M256,50 C140,50 80,140 80,260 C80,380 140,460 256,460 C372,460 432,380 432,260 C432,140 372,50 256,50 Z" stroke-width="3" stroke="#c084fc" fill="rgba(168, 85, 247, 0.08)" />
          <!-- Gray-White Differentiation Contours -->
          <path d="M140,140 Q256,120 372,140 Q390,260 360,370 Q256,400 152,370 Q122,260 140,140 Z" stroke="#9333ea" stroke-dasharray="3,3" />
          <!-- Hyperintense CSF Sulci -->
          <path d="M210,180 Q256,195 302,180" stroke="#e9d5ff" stroke-width="2" />
          <path d="M220,320 Q256,310 292,320" stroke="#e9d5ff" stroke-width="2" />
          <!-- Basal Ganglia Nuclei -->
          <ellipse cx="205" cy="250" rx="20" ry="35" fill="rgba(192, 132, 252, 0.2)" stroke="#c084fc" />
          <ellipse cx="307" cy="250" rx="20" ry="35" fill="rgba(192, 132, 252, 0.2)" stroke="#c084fc" />
          <!-- Midline Shift Marker -->
          <line x1="256" y1="50" x2="256" y2="460" stroke="#a855f7" stroke-width="1" stroke-dasharray="6,4" />
        </g>
      `
    },
    xray: {
      name: 'Digital X-Ray',
      series: 'SERIES: CR-CHEST-PA',
      matrix: '2048 x 2048 · 14-bit',
      thickness: 'Projection (PA)',
      defaultWindow: 350,
      defaultLevel: 50,
      svg: `
        <g id="xray-slice" stroke="#e2e8f0" stroke-width="1.5" fill="none" opacity="0.8">
          <!-- Thoracic Cage Outline -->
          <path d="M140,90 Q256,120 372,90 L420,420 Q256,470 92,420 Z" stroke="#64748b" stroke-width="2" />
          <!-- Clavicles -->
          <path d="M130,110 Q190,130 250,135" stroke="#f1f5f9" stroke-width="3" />
          <path d="M382,110 Q322,130 262,135" stroke="#f1f5f9" stroke-width="3" />
          <!-- Rib Arcs -->
          <path d="M120,170 Q256,210 392,170" stroke="#94a3b8" stroke-width="1.8" />
          <path d="M110,220 Q256,260 402,220" stroke="#94a3b8" stroke-width="1.8" />
          <path d="M105,270 Q256,310 407,270" stroke="#94a3b8" stroke-width="1.8" />
          <path d="M102,320 Q256,360 410,320" stroke="#94a3b8" stroke-width="1.8" />
          <!-- Cardiac Silhouette -->
          <path d="M256,220 C230,220 200,260 200,320 C200,370 256,390 290,390 C330,390 340,330 310,270 C290,230 270,220 256,220 Z" fill="rgba(255, 255, 255, 0.15)" stroke="#ffffff" stroke-width="2" />
          <!-- Trachea -->
          <line x1="256" y1="70" x2="256" y2="180" stroke="#38bdf8" stroke-width="4" stroke-dasharray="2,2" />
          <!-- Diaphragm Domes -->
          <path d="M100,420 Q180,370 256,395 Q332,370 412,420" stroke="#e2e8f0" stroke-width="2.5" />
        </g>
      `
    },
    angio: {
      name: 'Angiography (DSA)',
      series: 'SERIES: XA-DSA-CAROTID',
      matrix: '1024 x 1024 · 30 FPS',
      thickness: 'Arterial Phase',
      defaultWindow: 200,
      defaultLevel: 80,
      svg: `
        <g id="angio-slice" stroke="#f43f5e" stroke-width="2" fill="none" opacity="0.9">
          <!-- Internal Carotid Artery Trunk -->
          <path d="M256,470 Q250,380 230,320 Q210,270 230,220 Q245,190 256,180" stroke-width="5" stroke="#f43f5e" />
          <!-- Middle Cerebral Artery (MCA) M1 & M2 Branches -->
          <path d="M256,180 Q320,160 380,130" stroke-width="3.5" stroke="#fb7185" />
          <path d="M320,160 Q360,190 410,180" stroke-width="2.2" stroke="#fda4af" />
          <path d="M350,145 Q390,110 430,100" stroke-width="1.8" stroke="#fda4af" />
          <!-- Anterior Cerebral Artery (ACA) A1 & A2 Branches -->
          <path d="M256,180 Q250,110 230,60" stroke-width="3.5" stroke="#fb7185" />
          <path d="M245,130 Q210,100 180,70" stroke-width="2" stroke="#fda4af" />
          <path d="M238,90 Q200,60 170,40" stroke-width="1.5" stroke="#fda4af" />
          <!-- Ophthalmic Artery Branch -->
          <path d="M235,210 Q280,215 310,210" stroke-width="1.8" stroke="#fda4af" />
          <!-- Capillary Blush Cloud (Subtle) -->
          <circle cx="340" cy="140" r="50" fill="rgba(244, 63, 94, 0.12)" stroke="none" />
        </g>
      `
    }
  };

  // Window/Level Presets
  const PRESETS = {
    brain: { w: 80, l: 40 },
    bone: { w: 2000, l: 350 },
    lung: { w: 1500, l: -600 },
    soft: { w: 350, l: 50 }
  };

  let currentModality = 'ct';
  let currentPreset = 'brain';
  let currentWindow = 80;
  let currentLevel = 40;
  let currentSlice = 4; // Slice 004 representing 404

  // DOM Elements
  function initWorkstation() {
    const screenWrap = document.getElementById('pacs-screen-wrapper');
    const svgCanvas = document.getElementById('pacs-svg-canvas');
    const modalityBtns = document.querySelectorAll('.pacs-modality-btn');
    const presetBtns = document.querySelectorAll('.pacs-preset-btn');
    const windowSlider = document.getElementById('pacs-window-slider');
    const levelSlider = document.getElementById('pacs-level-slider');
    const sliceSlider = document.getElementById('pacs-slice-slider');
    const windowVal = document.getElementById('pacs-window-val');
    const levelVal = document.getElementById('pacs-level-val');
    const sliceVal = document.getElementById('pacs-slice-val');
    const seriesReadout = document.getElementById('pacs-hud-series');
    const matrixReadout = document.getElementById('pacs-hud-matrix');
    const thickReadout = document.getElementById('pacs-hud-thick');
    const coordReadout = document.getElementById('pacs-coord-readout');
    const reconBtn = document.getElementById('pacs-recon-btn');
    const crosshairH = document.getElementById('pacs-crosshair-h');
    const crosshairV = document.getElementById('pacs-crosshair-v');
    const crosshairBox = document.getElementById('pacs-crosshair-box');

    if (!screenWrap || !svgCanvas) return;

    // Render Selected Modality SVG
    function renderModality(modKey) {
      currentModality = modKey;
      const mod = MODALITIES[modKey] || MODALITIES.ct;
      svgCanvas.innerHTML = mod.svg;

      if (seriesReadout) seriesReadout.textContent = mod.series;
      if (matrixReadout) matrixReadout.textContent = mod.matrix;
      if (thickReadout) thickReadout.textContent = `THICK: ${mod.thickness}`;

      // Update active button state
      modalityBtns.forEach(btn => {
        const isActive = btn.dataset.modality === modKey;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      applyFilters();
    }

    // Apply Real-time Contrast/Brightness Filter
    function applyFilters() {
      // Convert Window/Level into a representative filter
      const contrastFactor = Math.min(2.5, Math.max(0.4, 400 / (currentWindow || 100)));
      const brightnessFactor = Math.min(2.0, Math.max(0.3, 1 + (currentLevel / 400)));
      
      let filterStyle = `contrast(${contrastFactor.toFixed(2)}) brightness(${brightnessFactor.toFixed(2)})`;
      if (currentModality === 'angio') {
        filterStyle += ' drop-shadow(0 0 6px rgba(244, 63, 94, 0.4))';
      } else if (currentModality === 'mri') {
        filterStyle += ' drop-shadow(0 0 6px rgba(168, 85, 247, 0.3))';
      } else {
        filterStyle += ' drop-shadow(0 0 6px rgba(56, 189, 248, 0.3))';
      }

      svgCanvas.style.filter = filterStyle;

      if (windowVal) windowVal.textContent = currentWindow;
      if (levelVal) levelVal.textContent = currentLevel;
    }

    // Modality Switch Handlers
    modalityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        renderModality(btn.dataset.modality);
      });
    });

    // Preset Buttons
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pKey = btn.dataset.preset;
        if (PRESETS[pKey]) {
          currentPreset = pKey;
          currentWindow = PRESETS[pKey].w;
          currentLevel = PRESETS[pKey].l;

          if (windowSlider) windowSlider.value = currentWindow;
          if (levelSlider) levelSlider.value = currentLevel;

          presetBtns.forEach(b => b.classList.toggle('is-active', b === btn));
          applyFilters();

          if (window.showToast) {
            window.showToast({
              message: `Windowing calibrated: ${btn.textContent.trim()} (W:${currentWindow} L:${currentLevel})`,
              type: 'info',
              duration: 2000
            });
          }
        }
      });
    });

    // Slider Listeners
    if (windowSlider) {
      windowSlider.addEventListener('input', e => {
        currentWindow = parseInt(e.target.value, 10);
        presetBtns.forEach(b => b.classList.remove('is-active'));
        applyFilters();
      });
    }

    if (levelSlider) {
      levelSlider.addEventListener('input', e => {
        currentLevel = parseInt(e.target.value, 10);
        presetBtns.forEach(b => b.classList.remove('is-active'));
        applyFilters();
      });
    }

    if (sliceSlider) {
      sliceSlider.addEventListener('input', e => {
        currentSlice = parseInt(e.target.value, 10);
        if (sliceVal) {
          sliceVal.textContent = `Slice ${String(currentSlice).padStart(2, '0')}/24`;
        }
        
        // Micro scale effect on slice navigation
        const scaleVal = 0.96 + (currentSlice / 24) * 0.08;
        svgCanvas.style.transform = `scale(${scaleVal})`;
      });
    }

    // Interactive Crosshair on Mouse/Touch Move
    function updateCrosshair(clientX, clientY) {
      const rect = screenWrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      if (crosshairH) crosshairH.style.top = `${y}px`;
      if (crosshairV) crosshairV.style.left = `${x}px`;
      if (crosshairBox) {
        crosshairBox.style.left = `${x}px`;
        crosshairBox.style.top = `${y}px`;
      }

      // Simulated Hounsfield value at coordinate
      const huSim = Math.round(((x + y) / (rect.width + rect.height)) * 800 - 400);
      if (coordReadout) {
        coordReadout.textContent = `X: ${Math.round(x)}px · Y: ${Math.round(y)}px · HU: ${huSim}`;
      }
    }

    screenWrap.addEventListener('mousemove', e => {
      updateCrosshair(e.clientX, e.clientY);
    });

    screenWrap.addEventListener('touchmove', e => {
      if (e.touches && e.touches[0]) {
        updateCrosshair(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // Scout Sweep Trigger Action
    if (reconBtn) {
      reconBtn.addEventListener('click', () => {
        const beam = document.querySelector('.pacs-scout-beam');
        if (beam) {
          beam.style.animation = 'none';
          void beam.offsetWidth; // Force Reflow
          beam.style.animation = 'pacsSweep 2.5s ease-out';
        }

        svgCanvas.style.transition = 'transform 0.3s ease, filter 0.3s ease';
        svgCanvas.style.transform = 'scale(1.05)';
        setTimeout(() => {
          svgCanvas.style.transform = 'scale(1)';
        }, 300);

        if (window.showToast) {
          window.showToast({
            message: 'Diagnostic scout sweep complete: Missing voxel 404 confirmed.',
            type: 'warning',
            duration: 3200
          });
        }
      });
    }

    // Initial render
    renderModality('ct');
  }

  // --------------------------------------------------------------------------
  // Live Clinical Search Integration
  // --------------------------------------------------------------------------
  function initLiveSearch() {
    const input = document.getElementById('nf-search-input');
    const clearBtn = document.getElementById('nf-search-clear');
    const resultsContainer = document.getElementById('nf-search-results');
    const resultList = document.getElementById('nf-result-list');

    if (!input || !resultsContainer || !resultList) return;

    function doSearch(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) {
        resultsContainer.classList.remove('is-open');
        if (clearBtn) clearBtn.classList.remove('is-visible');
        return;
      }

      if (clearBtn) clearBtn.classList.add('is-visible');

      const posts = window.POSTS_DATA || [];
      const matches = posts.filter(post => {
        const titleMatch = post.title && post.title.toLowerCase().includes(q);
        const descMatch = post.description && post.description.toLowerCase().includes(q);
        const topicMatch = post.Topic && post.Topic.toLowerCase().includes(q);
        const kwMatch = post.search && post.search.keywords && post.search.keywords.some(k => k.toLowerCase().includes(q));
        return titleMatch || descMatch || topicMatch || kwMatch;
      });

      if (matches.length === 0) {
        resultList.innerHTML = `<li class="nf-no-results">No clinical articles or protocols matching "<strong>${escapeHtml(q)}</strong>". Try terms like <em>Stroke</em>, <em>MRI</em>, <em>Physics</em>, or <em>Anatomy</em>.</li>`;
      } else {
        resultList.innerHTML = matches.slice(0, 6).map(item => `
          <li class="nf-result-item">
            <a href="${item.url || '/post/index.html'}">
              <span class="nf-result-title">${escapeHtml(item.title)}</span>
              <div class="nf-result-meta">
                <span class="nf-result-topic">${escapeHtml(item.Topic || 'Radiology')}</span>
                <span>·</span>
                <span>${escapeHtml(item.readTime || '5 min read')}</span>
              </div>
            </a>
          </li>
        `).join('');
      }

      resultsContainer.classList.add('is-open');
    }

    input.addEventListener('input', e => {
      doSearch(e.target.value);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        doSearch('');
        input.focus();
      });
    }

    // Close search dropdown on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.nf-search-wrapper')) {
        resultsContainer.classList.remove('is-open');
      }
    });

    // Reopen on focus if query present
    input.addEventListener('focus', () => {
      if (input.value.trim()) {
        resultsContainer.classList.add('is-open');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Suggested High-Yield Posts Grid
  // --------------------------------------------------------------------------
  function initSuggestedPosts() {
    const grid = document.getElementById('nf-posts-grid');
    if (!grid) return;

    const posts = window.POSTS_DATA || [];
    // Pick 3 high-yield posts
    const featured = posts.slice(0, 3);

    if (featured.length === 0) return;

    grid.innerHTML = featured.map(post => `
      <a href="${post.url || '/post/index.html'}" class="nf-post-card">
        <div class="nf-post-thumb-wrap">
          <img
            src="${post.thumbnail || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'}"
            alt="${escapeHtml(post.alt || post.title)}"
            class="nf-post-thumb"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </div>
        <div class="nf-post-body">
          <div class="nf-post-meta">
            <span class="nf-post-topic">${escapeHtml(post.Topic || 'Radiology')}</span>
            <span>·</span>
            <span>${escapeHtml(post.readTime || '6 min read')}</span>
          </div>
          <h3 class="nf-post-title">${escapeHtml(post.title)}</h3>
          <p class="nf-post-desc">${escapeHtml(post.description || '')}</p>
          <div class="nf-post-footer">
            <span>Read Protocol</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </a>
    `).join('');
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

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initWorkstation();
      initLiveSearch();
      initSuggestedPosts();
    });
  } else {
    initWorkstation();
    initLiveSearch();
    initSuggestedPosts();
  }
})();
