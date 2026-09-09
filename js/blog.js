/**
 * blog.js - Interactive Blog Cards Feed & Pagination
 * Manages clinical article pagination, page switching, accessible states,
 * and smooth transitions between pages.
 */
(function () {
  'use strict';

  const ARTICLES_DATA = [
    // Page 1
    {
      id: 'post-1',
      title: 'Cardiac MRI in Non-Ischemic Cardiomyopathy',
      labels: 'MRI / CT',
      tag: 'Cardiac MRI',
      date: 'March 7, 2026',
      excerpt: 'T1/T2 mapping quantification, late gadolinium enhancement (LGE) distribution patterns, and acute myocarditis diagnostic criteria.',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      alt: 'Cardiac diagnostic MRI multiplanar imaging',
      url: '#post-cardiac-mri'
    },
    {
      id: 'post-2',
      title: 'Emergency Trauma CT Pan-Scan Protocols',
      labels: 'CT / Trauma',
      tag: 'Emergency',
      date: 'March 6, 2026',
      excerpt: 'Whole-body polytrauma acquisition timing, active arterial extravasation detection, and solid organ injury grading guidelines.',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      alt: 'Computed tomography trauma emergency imaging workstation',
      url: '#post-trauma-ct'
    },
    {
      id: 'post-3',
      title: 'Advanced Head & Neck CT Neck Mass Algorithm',
      labels: 'CT / Head & Neck',
      tag: 'Head & Neck',
      date: 'March 5, 2026',
      excerpt: 'Deep cervical fascial spaces, nodal staging in mucosal HPV-positive carcinomas, and critical carotid sheath involvement.',
      image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      alt: 'Cervical spine and neck CT diagnostic display',
      url: '#post-neck-mass'
    },
    {
      id: 'post-4',
      title: 'Pediatric Neuroimaging: Congenital Malformations',
      labels: 'MRI / Pediatrics',
      tag: 'Pediatrics',
      date: 'March 4, 2026',
      excerpt: 'Posterior fossa anomalies, cortical dysplasias on 3T MRI, and age-specific myelination chronological milestones.',
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
      alt: 'Pediatric clinical magnetic resonance scan display',
      url: '#post-pediatric-neuro'
    },
    {
      id: 'post-5',
      title: 'Interventional Fluoroscopy & Vascular Embolization',
      labels: 'Fluoroscopy / Vascular',
      tag: 'Intervention',
      date: 'March 3, 2026',
      excerpt: 'Superselective microcatheter navigation, microparticle vs. coil embolization, and radiation dose-reduction mechanics.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      alt: 'Endovascular interventional fluoroscopy angiography suite',
      url: '#post-interventional-fluoroscopy'
    },
    {
      id: 'post-6',
      title: 'Spine MRI: Degenerative Stenosis vs. Epidural Pathology',
      labels: 'MRI / Spine',
      tag: 'Neuroradiology',
      date: 'March 2, 2026',
      excerpt: 'Central canal dimensions, neural foraminal impingement grading, and post-operative epidural fibrosis versus recurrent disc herniation.',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      alt: 'Spine MRI lumbar sagittal diagnostic sequence',
      url: '#post-spine-mri'
    },

    // Page 2
    {
      id: 'post-7',
      title: 'Multiparametric Prostate MRI: PI-RADS v2.1 Scoring',
      labels: 'MRI / Urology',
      tag: 'Uroradiology',
      date: 'February 28, 2026',
      excerpt: 'T2-weighted transition zone assessment, high b-value diffusion restriction, and targeted fusion biopsy planning.',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      alt: 'Pelvic and prostate multiparametric MRI examination',
      url: '#post-prostate-mri'
    },
    {
      id: 'post-8',
      title: 'Diffuse Lung Diseases on High-Resolution CT (HRCT)',
      labels: 'HRCT / Chest',
      tag: 'Chest CT',
      date: 'February 26, 2026',
      excerpt: 'Usual interstitial pneumonia (UIP) vs NSIP patterns, traction bronchiectasis, and mosaic attenuation differentials.',
      image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      alt: 'High resolution thoracic pulmonary axial CT scans',
      url: '#post-diffuse-lung-hrct'
    },
    {
      id: 'post-9',
      title: 'Abdominal Solid Organ Laceration Grading Matrix',
      labels: 'CT / Abdomen',
      tag: 'Abdominal',
      date: 'February 24, 2026',
      excerpt: 'AAST hepatic and splenic injury scoring, subcapsular hematoma evaluation, and conservative vs angiographic triage.',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      alt: 'Contrast enhanced abdominal CT diagnostic review',
      url: '#post-abdominal-laceration'
    },
    {
      id: 'post-10',
      title: 'Whole-Body PET-CT Tumor Restaging with 18F-FDG',
      labels: 'PET-CT / Oncology',
      tag: 'Nuclear Medicine',
      date: 'February 21, 2026',
      excerpt: 'SUVmax metabolic response assessment, physiological brown fat pitfalls, and PERCIST 1.0 criteria application.',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      alt: 'Oncology hybrid PET-CT emission scan reconstruction',
      url: '#post-pet-ct-restaging'
    },
    {
      id: 'post-11',
      title: 'Dynamic Musculoskeletal Ultrasound: Rotator Cuff Tears',
      labels: 'Ultrasound / MSK',
      tag: 'Musculoskeletal',
      date: 'February 18, 2026',
      excerpt: 'Supraspinatus footprint delamination, dynamic impingement maneuvers, and ultrasound-guided subacromial bursa injection.',
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
      alt: 'Shoulder dynamic musculoskeletal ultrasound scan',
      url: '#post-msk-us-rotator'
    },
    {
      id: 'post-12',
      title: 'Dynamic CT Angiography in Aortic Dissection Types',
      labels: 'CTA / Vascular',
      tag: 'Vascular CT',
      date: 'February 15, 2026',
      excerpt: 'Stanford Type A vs Type B differentiation, true vs false lumen identification, and visceral vessel malperfusion syndromes.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      alt: 'Thoracoabdominal aortic angiography 3D reformat',
      url: '#post-aortic-dissection'
    },

    // Page 3
    {
      id: 'post-13',
      title: 'Breast MRI: BI-RADS Diagnostic Kinetic Curves',
      labels: 'MRI / Breast',
      tag: 'Breast Imaging',
      date: 'February 12, 2026',
      excerpt: 'Ultrafast early phase enhancement, Type III washout kinetic curves, and non-mass enhancement distribution descriptors.',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      alt: 'Breast MRI contrast kinetic analysis workstation',
      url: '#post-breast-mri'
    },
    {
      id: 'post-14',
      title: 'Neonatal Cranial Ultrasound & White Matter Injury',
      labels: 'Ultrasound / Pediatrics',
      tag: 'Pediatrics',
      date: 'February 9, 2026',
      excerpt: 'Anterior fontanelle acoustic window, periventricular leukomalacia echogenicity, and germinal matrix hemorrhage grading.',
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
      alt: 'Neonatal neurosonography cranial exam display',
      url: '#post-neonatal-cranial-us'
    },
    {
      id: 'post-15',
      title: 'Liver MRI: Primovist Hepatobiliary Phase Assessment',
      labels: 'MRI / Hepatobiliary',
      tag: 'Abdominal',
      date: 'February 6, 2026',
      excerpt: 'Gd-EOB-DTPA 20-minute delayed imaging, distinguishing FNH from hepatocellular adenoma, and micro-HCC sensitivity.',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      alt: 'Hepatobiliary MRI liver diagnostic series',
      url: '#post-liver-primovist'
    },
    {
      id: 'post-16',
      title: 'Dual-Energy CT: Gout & Monosodium Urate Mapping',
      labels: 'DECT / MSK',
      tag: 'Musculoskeletal',
      date: 'February 3, 2026',
      excerpt: 'Two-material decomposition algorithms, color-coded crystal mapping, and differentiating tophi from calcium pyrophosphate.',
      image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      alt: 'Spectral dual energy CT extremity reconstruction',
      url: '#post-dect-gout'
    },
    {
      id: 'post-17',
      title: 'Endovascular Stroke Thrombectomy TICI Scoring',
      labels: 'Angiography / Neuro',
      tag: 'Neurointervention',
      date: 'January 30, 2026',
      excerpt: 'Modified TICI 2b/3 reperfusion benchmarks, first-pass effect significance, and distal embolization rescue techniques.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      alt: 'Catheter cerebral angiogram thrombectomy fluoroscopy',
      url: '#post-stroke-thrombectomy'
    },
    {
      id: 'post-18',
      title: 'ALARA Radiation Protection in Modern Multislice CT',
      labels: 'CT / Radiation QA',
      tag: 'Safety / QA',
      date: 'January 27, 2026',
      excerpt: 'Iterative model reconstruction algorithms, tube current modulation, organ-based bismuth shielding, and diagnostic reference levels.',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      alt: 'Diagnostic CT dosimetry and medical physics QA system',
      url: '#post-alara-dosimetry'
    }
  ];

  const ITEMS_PER_PAGE = 6;
  const TOTAL_PAGES = Math.ceil(ARTICLES_DATA.length / ITEMS_PER_PAGE);
  let currentPage = 1;

  // Single SVG templates: Plus when not bookmarked, Minus when bookmarked
  const SVG_BOOKMARK_PLUS = `<svg class="blog-save-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 8.21094V13.2109" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

  const SVG_BOOKMARK_MINUS = `<svg class="blog-save-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.5 10.6504H9.5" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M16.8199 2H7.17995C5.04995 2 3.31995 3.74 3.31995 5.86V19.95C3.31995 21.75 4.60995 22.51 6.18995 21.64L11.0699 18.93C11.5899 18.64 12.4299 18.64 12.9399 18.93L17.8199 21.64C19.3999 22.52 20.6899 21.76 20.6899 19.95V5.86C20.6799 3.74 18.9499 2 16.8199 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

  let savedPosts = new Set();
  try {
    const stored = localStorage.getItem('radiology_saved_protocols');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        savedPosts = new Set(parsed);
      }
    }
  } catch (err) {
    savedPosts = new Set();
  }

  function initBlog() {
    const grid = document.getElementById('blog-grid');
    const homeBtn = document.getElementById('pagination-home-btn');
    const prevBtn = document.getElementById('pagination-prev-btn');
    const nextBtn = document.getElementById('pagination-next-btn');
    const numbersContainer = document.getElementById('pagination-numbers');
    const countBadge = document.getElementById('blog-count-badge');

    if (!grid) return;

    if (countBadge) {
      countBadge.textContent = `${ARTICLES_DATA.length} Articles`;
    }

    renderCards(currentPage);
    renderPagination();

    // Event listeners
    if (homeBtn) {
      homeBtn.addEventListener('click', function () {
        if (currentPage !== 1) {
          goToPage(1);
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (currentPage > 1) {
          goToPage(currentPage - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (currentPage < TOTAL_PAGES) {
          goToPage(currentPage + 1);
        }
      });
    }
  }

  function handleSaveToggle(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;
    const postId = btn.getAttribute('data-post-id');
    if (!postId) return;

    const labelSpan = btn.querySelector('.blog-card-save-text');
    const iconSpan = btn.querySelector('.blog-card-save-icon');

    if (savedPosts.has(postId)) {
      savedPosts.delete(postId);
      btn.classList.remove('is-saved');
      btn.setAttribute('aria-label', 'Save protocol');
      btn.setAttribute('title', 'Save');
      if (labelSpan) labelSpan.textContent = 'Save';
      if (iconSpan) iconSpan.innerHTML = SVG_BOOKMARK_PLUS;
    } else {
      savedPosts.add(postId);
      btn.classList.add('is-saved');
      btn.setAttribute('aria-label', 'Remove saved protocol');
      btn.setAttribute('title', 'Saved');
      if (labelSpan) labelSpan.textContent = 'Saved';
      if (iconSpan) iconSpan.innerHTML = SVG_BOOKMARK_MINUS;
    }

    try {
      localStorage.setItem('radiology_saved_protocols', JSON.stringify([...savedPosts]));
    } catch (err) {
      // Storage error fallback
    }
  }

  function attachSaveListeners() {
    const saveBtns = document.querySelectorAll('.blog-card-save-btn');
    saveBtns.forEach((btn) => {
      btn.removeEventListener('click', handleSaveToggle);
      btn.addEventListener('click', handleSaveToggle);
    });
  }

  function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > TOTAL_PAGES || pageNum === currentPage) return;

    const grid = document.getElementById('blog-grid');
    if (grid) {
      grid.style.opacity = '0.35';
    }

    setTimeout(() => {
      currentPage = pageNum;
      renderCards(currentPage);
      renderPagination();

      if (grid) {
        grid.style.opacity = '1';
      }

      // Smooth scroll back to blog section header if scrolled past
      const section = document.getElementById('blog-section');
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top < 0) {
          window.scrollTo({
            top: window.pageYOffset + rect.top - 80,
            behavior: 'smooth'
          });
        }
      }
    }, 140);
  }

  function renderCards(page) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const items = ARTICLES_DATA.slice(startIdx, endIdx);

    grid.innerHTML = items
      .map((item) => {
        const isSaved = savedPosts.has(item.id);
        const iconSvg = isSaved ? SVG_BOOKMARK_MINUS : SVG_BOOKMARK_PLUS;
        return `
        <article class="blog-card" id="${item.id}">
          <a href="${item.url}" class="blog-card-media" aria-label="${item.title}">
            <img
              src="${item.image}"
              alt="${item.alt}"
              class="blog-card-img"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              class="blog-card-save-btn ${isSaved ? 'is-saved' : ''}"
              aria-label="${isSaved ? 'Remove saved protocol' : 'Save protocol'}"
              data-post-id="${item.id}"
              title="${isSaved ? 'Saved' : 'Save'}"
            >
              <span class="blog-card-save-text">${isSaved ? 'Saved' : 'Save'}</span>
              <span class="blog-card-save-icon">
                ${iconSvg}
              </span>
            </button>
          </a>

          <div class="blog-card-body">
            <div class="blog-card-meta">
              <span class="blog-card-in">in</span>
              <span class="blog-card-labels">${item.labels}</span>
            </div>

            <a href="${item.url}" class="blog-card-title-link">
              <h4 class="blog-card-title">${item.title}</h4>
            </a>

            <p class="blog-card-excerpt">${item.excerpt}</p>
          </div>

          <div class="blog-card-footer">
            <span class="blog-card-date">${item.date}</span>
            <a href="${item.url}" class="blog-card-read-label" aria-label="Read Protocol: ${item.title}">
              <span>Read Protocol</span>
              <svg class="blog-card-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8.9502 4.08008L15.4702 10.6001C16.2402 11.3701 16.2402 12.6301 15.4702 13.4001L8.9502 19.9201" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </div>
        </article>
      `;
      })
      .join('');

    attachSaveListeners();
  }

  function renderPagination() {
    const homeBtn = document.getElementById('pagination-home-btn');
    const prevBtn = document.getElementById('pagination-prev-btn');
    const nextBtn = document.getElementById('pagination-next-btn');
    const numbersContainer = document.getElementById('pagination-numbers');

    if (homeBtn) {
      homeBtn.disabled = currentPage === 1;
      homeBtn.setAttribute('aria-disabled', String(currentPage === 1));
    }

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
      prevBtn.setAttribute('aria-disabled', String(currentPage === 1));
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage === TOTAL_PAGES;
      nextBtn.setAttribute('aria-disabled', String(currentPage === TOTAL_PAGES));
    }

    if (!numbersContainer) return;

    let html = '';
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const isActive = i === currentPage;
      html += `
        <button
          type="button"
          class="pagination-number ${isActive ? 'is-active' : ''}"
          data-page="${i}"
          aria-current="${isActive ? 'page' : 'false'}"
          aria-label="Go to page ${i}"
        >
          ${i}
        </button>
      `;
    }

    numbersContainer.innerHTML = html;

    // Attach click events to number buttons
    const numBtns = numbersContainer.querySelectorAll('.pagination-number');
    numBtns.forEach((btn) => {
      btn.addEventListener('click', function () {
        const page = parseInt(this.getAttribute('data-page'), 10);
        if (page && page !== currentPage) {
          goToPage(page);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
  } else {
    initBlog();
  }
})();
