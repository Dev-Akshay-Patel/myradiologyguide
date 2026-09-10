/**
 * posts-data.js
 * Central Data Source for Clinical Radiology Posts
 * 
 * Schema:
 * {
 *   id: string,
 *   slug: string,
 *   title: string,
 *   description: string,
 *   url: string,
 *   thumbnail: string,
 *   alt: string,
 *   Topic: string,
 *   tags: string[],
 *   readTime: string,
 *   publishedAt: string (YYYY-MM-DD),
 *   pinned: boolean,
 *   popular: { enabled: boolean, position: number },
 *   search: { keywords: string[] },
 *   related: string[]
 * }
 */
window.POSTS_DATA = [
  {
    id: "stroke-cta-protocol",
    slug: "stroke-cta-protocol",
    title: "Acute Ischemic Stroke: Multiphase CTA Collateral Atlas & ASPECTS Triage Protocol",
    description: "Standardized emergency triage criteria for grading leptomeningeal collateral circulation, verifying Alberta Stroke Program Early CT Scores (ASPECTS ≥ 6), and optimizing rapid endovascular thrombectomy candidate selection within the extended window.",
    url: "#stroke-cta-protocol",
    thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    alt: "Emergency neurovascular CTA imaging display",
    Topic: "Neuroradiology",
    tags: [
      "ASPECTS ≥ 6 Cutoff Verification",
      "Multiphase Phase II/III Washout Timing",
      "Core vs. Penumbra Perfusion Thresholds"
    ],
    readTime: "7 min read",
    publishedAt: "2026-03-08",
    pinned: true,
    popular: {
      enabled: true,
      position: 1
    },
    search: {
      keywords: [
        "stroke",
        "aspects",
        "cta",
        "collaterals",
        "thrombectomy",
        "ischemic",
        "penumbra",
        "dwi",
        "brain mri",
        "acute stroke"
      ]
    },
    related: [
      "post-trauma-ct",
      "post-17",
      "post-6"
    ]
  },
  {
    id: "post-1",
    slug: "cardiac-mri-non-ischemic",
    title: "Cardiac MRI in Non-Ischemic Cardiomyopathy",
    description: "T1/T2 mapping quantification, late gadolinium enhancement (LGE) distribution patterns, and acute myocarditis diagnostic criteria.",
    url: "#post-cardiac-mri",
    thumbnail: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    alt: "Cardiac diagnostic MRI multiplanar imaging",
    Topic: "Cardiac MRI",
    tags: [
      "MRI",
      "Cardiology",
      "LGE",
      "T1 Mapping"
    ],
    readTime: "5 min read",
    publishedAt: "2026-03-07",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "cardiac mri",
        "myocarditis",
        "lge",
        "t1 mapping",
        "t2 mapping",
        "heart mri",
        "cardiomyopathy"
      ]
    },
    related: [
      "post-8",
      "post-12"
    ]
  },
  {
    id: "post-2",
    slug: "emergency-trauma-ct-pan-scan",
    title: "Emergency Trauma CT Pan-Scan Protocols",
    description: "Whole-body polytrauma acquisition timing, active arterial extravasation detection, and solid organ injury grading guidelines.",
    url: "#post-trauma-ct",
    thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    alt: "Computed tomography trauma emergency imaging workstation",
    Topic: "Emergency",
    tags: [
      "CT",
      "Trauma",
      "Pan-Scan",
      "Extravasation"
    ],
    readTime: "6 min read",
    publishedAt: "2026-03-06",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "trauma ct",
        "pan scan",
        "polytrauma",
        "arterial blush",
        "solid organ injury",
        "ct abdomen"
      ]
    },
    related: [
      "stroke-cta-protocol",
      "post-9",
      "post-3"
    ]
  },
  {
    id: "post-3",
    slug: "head-neck-ct-mass-algorithm",
    title: "Advanced Head & Neck CT Neck Mass Algorithm",
    description: "Deep cervical fascial spaces, nodal staging in mucosal HPV-positive carcinomas, and critical carotid sheath involvement.",
    url: "#post-neck-mass",
    thumbnail: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
    alt: "Cervical spine and neck CT diagnostic display",
    Topic: "Head & Neck",
    tags: [
      "Head & Neck",
      "CT",
      "Cervical Spaces",
      "Oncology"
    ],
    readTime: "4 min read",
    publishedAt: "2026-03-05",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "neck mass",
        "cervical lymph nodes",
        "carotid space",
        "hpv carcinoma",
        "head neck ct",
        "pharynx"
      ]
    },
    related: [
      "post-4",
      "post-6"
    ]
  },
  {
    id: "post-4",
    slug: "pediatric-neuroimaging-malformations",
    title: "Pediatric Neuroimaging: Congenital Malformations",
    description: "Posterior fossa anomalies, cortical dysplasias on 3T MRI, and age-specific myelination chronological milestones.",
    url: "#post-pediatric-neuro",
    thumbnail: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80",
    alt: "Pediatric clinical magnetic resonance scan display",
    Topic: "Pediatrics",
    tags: [
      "Pediatrics",
      "MRI",
      "Neuroradiology",
      "Myelination"
    ],
    readTime: "5 min read",
    publishedAt: "2026-03-04",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "pediatric brain",
        "congenital malformations",
        "chiari",
        "myelination mri",
        "dandy walker",
        "cortical dysplasia"
      ]
    },
    related: [
      "post-14",
      "post-6"
    ]
  },
  {
    id: "post-5",
    slug: "interventional-fluoroscopy-vascular-embolization",
    title: "Interventional Fluoroscopy & Vascular Embolization",
    description: "Superselective microcatheter navigation, microparticle vs. coil embolization, and radiation dose-reduction mechanics.",
    url: "#post-interventional-fluoroscopy",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    alt: "Endovascular interventional fluoroscopy angiography suite",
    Topic: "Intervention",
    tags: [
      "Interventional",
      "Fluoroscopy",
      "Embolization",
      "Angiography"
    ],
    readTime: "7 min read",
    publishedAt: "2026-03-03",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "interventional radiology",
        "embolization",
        "microcatheter",
        "coils",
        "fluoroscopy",
        "vascular"
      ]
    },
    related: [
      "stroke-cta-protocol",
      "post-18",
      "post-12"
    ]
  },
  {
    id: "post-6",
    slug: "spine-mri-stenosis-epidural",
    title: "Spine MRI: Degenerative Stenosis vs. Epidural Pathology",
    description: "Central canal dimensions, neural foraminal impingement grading, and post-operative epidural fibrosis versus recurrent disc herniation.",
    url: "#post-spine-mri",
    thumbnail: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    alt: "Spine MRI lumbar sagittal diagnostic sequence",
    Topic: "Neuroradiology",
    tags: [
      "Spine",
      "MRI",
      "Stenosis",
      "Neuroradiology"
    ],
    readTime: "6 min read",
    publishedAt: "2026-03-02",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "spine mri",
        "lumbar stenosis",
        "disc herniation",
        "foraminal stenosis",
        "epidural hematoma",
        "spondylolisthesis"
      ]
    },
    related: [
      "stroke-cta-protocol",
      "post-4"
    ]
  },
  {
    id: "post-7",
    slug: "multiparametric-prostate-mri-pirads",
    title: "Multiparametric Prostate MRI: PI-RADS v2.1 Scoring",
    description: "T2-weighted transition zone assessment, high b-value diffusion restriction, and targeted fusion biopsy planning.",
    url: "#post-prostate-mri",
    thumbnail: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    alt: "Pelvic and prostate multiparametric MRI examination",
    Topic: "Uroradiology",
    tags: [
      "Prostate",
      "MRI",
      "PI-RADS",
      "Uroradiology"
    ],
    readTime: "5 min read",
    publishedAt: "2026-02-28",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "prostate mri",
        "pi-rads",
        "mpmri",
        "peripheral zone",
        "diffusion restriction",
        "dce"
      ]
    },
    related: [
      "post-10",
      "post-15"
    ]
  },
  {
    id: "post-8",
    slug: "diffuse-lung-diseases-hrct",
    title: "Diffuse Lung Diseases on High-Resolution CT (HRCT)",
    description: "Usual interstitial pneumonia (UIP) vs NSIP patterns, traction bronchiectasis, and mosaic attenuation differentials.",
    url: "#post-diffuse-lung-hrct",
    thumbnail: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
    alt: "High resolution thoracic pulmonary axial CT scans",
    Topic: "Chest CT",
    tags: [
      "HRCT",
      "Chest",
      "Interstitial Lung Disease",
      "Pulmonology"
    ],
    readTime: "4 min read",
    publishedAt: "2026-02-26",
    pinned: false,
    popular: {
      enabled: true,
      position: 2
    },
    search: {
      keywords: [
        "hrct chest",
        "diffuse lung",
        "uip",
        "nsip",
        "interstitial pneumonia",
        "honeycombing",
        "ground glass"
      ]
    },
    related: [
      "post-2",
      "post-12"
    ]
  },
  {
    id: "post-9",
    slug: "abdominal-organ-laceration-grading",
    title: "Abdominal Solid Organ Laceration Grading Matrix",
    description: "AAST hepatic and splenic injury scoring, subcapsular hematoma evaluation, and conservative vs angiographic triage.",
    url: "#post-abdominal-laceration",
    thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    alt: "Contrast enhanced abdominal CT diagnostic review",
    Topic: "Abdominal",
    tags: [
      "Abdomen",
      "CT",
      "Trauma",
      "AAST"
    ],
    readTime: "5 min read",
    publishedAt: "2026-02-24",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "abdominal trauma",
        "splenic laceration",
        "liver trauma",
        "aast grading",
        "hemoperitoneum"
      ]
    },
    related: [
      "post-2",
      "post-15"
    ]
  },
  {
    id: "post-10",
    slug: "whole-body-pet-ct-tumor-restaging",
    title: "Whole-Body PET-CT Tumor Restaging with 18F-FDG",
    description: "SUVmax metabolic response assessment, physiological brown fat pitfalls, and PERCIST 1.0 criteria application.",
    url: "#post-pet-ct-restaging",
    thumbnail: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    alt: "Oncology hybrid PET-CT emission scan reconstruction",
    Topic: "Nuclear Medicine",
    tags: [
      "PET-CT",
      "Nuclear Medicine",
      "Oncology",
      "FDG"
    ],
    readTime: "8 min read",
    publishedAt: "2026-02-21",
    pinned: false,
    popular: {
      enabled: true,
      position: 4
    },
    search: {
      keywords: [
        "pet-ct",
        "suvmax",
        "18f-fdg",
        "percist",
        "metabolic tumor response",
        "nuclear medicine oncology"
      ]
    },
    related: [
      "post-7",
      "post-13"
    ]
  },
  {
    id: "post-11",
    slug: "dynamic-msk-ultrasound-rotator-cuff",
    title: "Dynamic Musculoskeletal Ultrasound: Rotator Cuff Tears",
    description: "Supraspinatus footprint delamination, dynamic impingement maneuvers, and ultrasound-guided subacromial bursa injection.",
    url: "#post-msk-us-rotator",
    thumbnail: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80",
    alt: "Shoulder dynamic musculoskeletal ultrasound scan",
    Topic: "Musculoskeletal",
    tags: [
      "MSK",
      "Ultrasound",
      "Rotator Cuff",
      "Shoulder"
    ],
    readTime: "6 min read",
    publishedAt: "2026-02-18",
    pinned: false,
    popular: {
      enabled: true,
      position: 3
    },
    search: {
      keywords: [
        "msk ultrasound",
        "rotator cuff tear",
        "supraspinatus",
        "shoulder us",
        "dynamic ultrasound",
        "joint ultrasound"
      ]
    },
    related: [
      "post-16"
    ]
  },
  {
    id: "post-12",
    slug: "dynamic-cta-aortic-dissection",
    title: "Dynamic CT Angiography in Aortic Dissection Types",
    description: "Stanford Type A vs Type B differentiation, true vs false lumen identification, and visceral vessel malperfusion syndromes.",
    url: "#post-aortic-dissection",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    alt: "Thoracoabdominal aortic angiography 3D reformat",
    Topic: "Vascular CT",
    tags: [
      "CTA",
      "Vascular",
      "Aorta",
      "Dissection"
    ],
    readTime: "5 min read",
    publishedAt: "2026-02-15",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "aortic dissection",
        "cta aorta",
        "stanford type a",
        "stanford type b",
        "false lumen",
        "malperfusion"
      ]
    },
    related: [
      "post-2",
      "post-5"
    ]
  },
  {
    id: "post-13",
    slug: "breast-mri-birads-kinetic-curves",
    title: "Breast MRI: BI-RADS Diagnostic Kinetic Curves",
    description: "Ultrafast early phase enhancement, Type III washout kinetic curves, and non-mass enhancement distribution descriptors.",
    url: "#post-breast-mri",
    thumbnail: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    alt: "Breast MRI contrast kinetic analysis workstation",
    Topic: "Breast Imaging",
    tags: [
      "Breast",
      "MRI",
      "BI-RADS",
      "Kinetics"
    ],
    readTime: "5 min read",
    publishedAt: "2026-02-12",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "breast mri",
        "bi-rads",
        "kinetic curve",
        "washout",
        "non mass enhancement",
        "breast cancer imaging"
      ]
    },
    related: [
      "post-10"
    ]
  },
  {
    id: "post-14",
    slug: "neonatal-cranial-ultrasound-white-matter",
    title: "Neonatal Cranial Ultrasound & White Matter Injury",
    description: "Anterior fontanelle acoustic window, periventricular leukomalacia echogenicity, and germinal matrix hemorrhage grading.",
    url: "#post-neonatal-cranial-us",
    thumbnail: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80",
    alt: "Neonatal neurosonography cranial exam display",
    Topic: "Pediatrics",
    tags: [
      "Pediatrics",
      "Ultrasound",
      "Neonatal",
      "Neurosonography"
    ],
    readTime: "4 min read",
    publishedAt: "2026-02-09",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "neonatal ultrasound",
        "cranial ultrasound",
        "pvl",
        "germinal matrix",
        "intraventricular hemorrhage",
        "pediatric brain"
      ]
    },
    related: [
      "post-4"
    ]
  },
  {
    id: "post-15",
    slug: "liver-mri-primovist-hepatobiliary",
    title: "Liver MRI: Primovist Hepatobiliary Phase Assessment",
    description: "Gd-EOB-DTPA 20-minute delayed imaging, distinguishing FNH from hepatocellular adenoma, and micro-HCC sensitivity.",
    url: "#post-liver-primovist",
    thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    alt: "Hepatobiliary MRI liver diagnostic series",
    Topic: "Abdominal",
    tags: [
      "Liver",
      "MRI",
      "Primovist",
      "Hepatobiliary"
    ],
    readTime: "6 min read",
    publishedAt: "2026-02-06",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "liver mri",
        "primovist",
        "eovist",
        "hcc",
        "fnh",
        "hepatobiliary phase",
        "adenoma"
      ]
    },
    related: [
      "post-7",
      "post-9"
    ]
  },
  {
    id: "post-16",
    slug: "dual-energy-ct-gout-urate-mapping",
    title: "Dual-Energy CT: Gout & Monosodium Urate Mapping",
    description: "Two-material decomposition algorithms, color-coded crystal mapping, and differentiating tophi from calcium pyrophosphate.",
    url: "#post-dect-gout",
    thumbnail: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
    alt: "Spectral dual energy CT extremity reconstruction",
    Topic: "Musculoskeletal",
    tags: [
      "DECT",
      "Spectral CT",
      "Gout",
      "MSK"
    ],
    readTime: "4 min read",
    publishedAt: "2026-02-03",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "dual energy ct",
        "gout dect",
        "monosodium urate",
        "spectral ct",
        "tophi",
        "urate crystal"
      ]
    },
    related: [
      "post-11"
    ]
  },
  {
    id: "post-17",
    slug: "endovascular-stroke-thrombectomy-tici",
    title: "Endovascular Stroke Thrombectomy TICI Scoring",
    description: "Modified TICI 2b/3 reperfusion benchmarks, first-pass effect significance, and distal embolization rescue techniques.",
    url: "#post-stroke-thrombectomy",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    alt: "Catheter cerebral angiogram thrombectomy fluoroscopy",
    Topic: "Intervention",
    tags: [
      "Angiography",
      "Thrombectomy",
      "Stroke",
      "TICI"
    ],
    readTime: "5 min read",
    publishedAt: "2026-01-30",
    pinned: false,
    popular: {
      enabled: false,
      position: 0
    },
    search: {
      keywords: [
        "stroke thrombectomy",
        "tici score",
        "reperfusion",
        "endovascular stroke",
        "angiography",
        "stent retriever"
      ]
    },
    related: [
      "stroke-cta-protocol",
      "post-5"
    ]
  },
  {
    id: "post-18",
    slug: "alara-radiation-protection-multislice-ct",
    title: "ALARA Radiation Protection in Modern Multislice CT",
    description: "Iterative model reconstruction algorithms, tube current modulation, organ-based bismuth shielding, and diagnostic reference levels.",
    url: "#post-alara-dosimetry",
    thumbnail: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    alt: "Diagnostic CT dosimetry and medical physics QA system",
    Topic: "Safety / QA",
    tags: [
      "Radiation Safety",
      "Dosimetry",
      "ALARA",
      "Physics"
    ],
    readTime: "3 min read",
    publishedAt: "2026-01-27",
    pinned: false,
    popular: {
      enabled: true,
      position: 5
    },
    search: {
      keywords: [
        "alara radiation",
        "ct dosimetry",
        "ctdi",
        "dlp",
        "radiation protection",
        "dose reduction",
        "iterative reconstruction"
      ]
    },
    related: [
      "post-2",
      "post-5"
    ]
  }
];
