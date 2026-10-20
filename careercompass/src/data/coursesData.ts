/**
 * coursesData.ts
 * ──────────────
 * Course catalogue and research domain data used by Milestone 4.
 * In Milestone 5 these are fetched from the recommendations API;
 * here they are derived from the same skill-gap logic as the SBERT pipeline.
 */

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
export type CoursePlatform = 'Coursera' | 'Udemy' | 'edX' | 'Pluralsight' | 'LinkedIn Learning' | 'AWS' | 'Google Cloud' | 'Microsoft Learn' | 'fast.ai' | 'DeepLearning.AI'

export interface Course {
  id:           string
  title:        string
  provider:     string
  platform:     CoursePlatform
  level:        CourseLevel
  domain:       string          // matches domain labels from jobsData
  skills:       string[]        // skills taught — used for gap matching
  hours:        number
  rating:       number
  reviews:      number
  price_usd:    number | 'Free'
  url:          string
  description:  string
  certificate:  boolean
  badge_color:  'brand' | 'accent' | 'success' | 'warning' | 'neutral'
  is_featured:  boolean
  gap_score?:   number          // 0–100, set at runtime based on missing skills
}

export const COURSES: Course[] = [
  /* ── ML / AI ──────────────────────────────────────────────────────────────── */
  {
    id: 'c001',
    title: 'Deep Learning Specialization',
    provider: 'DeepLearning.AI',
    platform: 'Coursera',
    level: 'Intermediate',
    domain: 'ML/AI',
    skills: ['Python', 'TensorFlow', 'Neural Networks', 'CNN', 'RNN', 'Transformers', 'Hyperparameter Tuning'],
    hours: 80,
    rating: 4.9,
    reviews: 142_000,
    price_usd: 49,
    url: 'https://www.coursera.org/specializations/deep-learning',
    description: 'Master deep learning fundamentals from Andrew Ng. Build and train neural networks for vision, sequence models, and structured data across 5 hands-on courses.',
    certificate: true,
    badge_color: 'brand',
    is_featured: true,
  },
  {
    id: 'c002',
    title: 'Machine Learning Engineering for Production (MLOps)',
    provider: 'DeepLearning.AI',
    platform: 'Coursera',
    level: 'Advanced',
    domain: 'ML/AI',
    skills: ['MLflow', 'Kubernetes', 'CI/CD', 'Docker', 'Data Pipelines', 'Model Monitoring', 'Airflow'],
    hours: 64,
    rating: 4.7,
    reviews: 28_400,
    price_usd: 49,
    url: 'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops',
    description: 'Deploy ML models to production with MLOps best practices. Learn model serving, feature stores, experiment tracking, and monitoring at scale.',
    certificate: true,
    badge_color: 'accent',
    is_featured: true,
  },
  {
    id: 'c003',
    title: 'Practical Deep Learning for Coders',
    provider: 'fast.ai',
    platform: 'fast.ai',
    level: 'Intermediate',
    domain: 'ML/AI',
    skills: ['PyTorch', 'Computer Vision', 'NLP', 'Tabular', 'Stable Diffusion', 'Hugging Face'],
    hours: 30,
    rating: 4.8,
    reviews: 54_000,
    price_usd: 'Free',
    url: 'https://course.fast.ai',
    description: 'Top-down approach to deep learning with PyTorch. Build state-of-the-art models from week 1 — vision, NLP, recommendation, and generative AI.',
    certificate: false,
    badge_color: 'brand',
    is_featured: false,
  },
  {
    id: 'c004',
    title: 'Hugging Face NLP Course',
    provider: 'Hugging Face',
    platform: 'DeepLearning.AI',
    level: 'Intermediate',
    domain: 'ML/AI',
    skills: ['Transformers', 'BERT', 'Hugging Face', 'Fine-tuning', 'NLP', 'RAG', 'Python'],
    hours: 20,
    rating: 4.8,
    reviews: 38_000,
    price_usd: 'Free',
    url: 'https://huggingface.co/learn/nlp-course',
    description: 'End-to-end NLP with the Hugging Face ecosystem. Fine-tune BERT, GPT-2, and T5 for classification, QA, translation, and generation tasks.',
    certificate: false,
    badge_color: 'accent',
    is_featured: false,
  },
  /* ── Cloud / DevOps ────────────────────────────────────────────────────────── */
  {
    id: 'c005',
    title: 'AWS Certified Solutions Architect – Associate',
    provider: 'Amazon Web Services',
    platform: 'AWS',
    level: 'Intermediate',
    domain: 'Cloud/DevOps',
    skills: ['AWS', 'EC2', 'S3', 'RDS', 'Lambda', 'VPC', 'IAM', 'CloudFormation', 'Terraform'],
    hours: 40,
    rating: 4.8,
    reviews: 89_000,
    price_usd: 300,
    url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    description: 'Design resilient, high-performing, secure, and cost-optimized architectures on AWS. Covers core services, networking, security, and best practices.',
    certificate: true,
    badge_color: 'warning',
    is_featured: true,
  },
  {
    id: 'c006',
    title: 'Google Cloud Professional Data Engineer',
    provider: 'Google Cloud',
    platform: 'Google Cloud',
    level: 'Advanced',
    domain: 'Cloud/DevOps',
    skills: ['GCP', 'BigQuery', 'Dataflow', 'Pub/Sub', 'Cloud Composer', 'Vertex AI', 'Terraform'],
    hours: 45,
    rating: 4.7,
    reviews: 31_000,
    price_usd: 200,
    url: 'https://cloud.google.com/certification/data-engineer',
    description: 'Design and build data processing systems on Google Cloud. Master BigQuery, Dataflow pipelines, and ML model deployment with Vertex AI.',
    certificate: true,
    badge_color: 'success',
    is_featured: true,
  },
  {
    id: 'c007',
    title: 'Kubernetes for Developers',
    provider: 'Linux Foundation',
    platform: 'edX',
    level: 'Intermediate',
    domain: 'Cloud/DevOps',
    skills: ['Kubernetes', 'Docker', 'Helm', 'Ingress', 'CI/CD', 'GitOps', 'ArgoCD'],
    hours: 28,
    rating: 4.6,
    reviews: 21_000,
    price_usd: 299,
    url: 'https://training.linuxfoundation.org/training/kubernetes-for-developers',
    description: 'Learn to containerise applications, deploy them to Kubernetes clusters, manage scaling, rolling updates, secrets, and configure CI/CD pipelines.',
    certificate: true,
    badge_color: 'neutral',
    is_featured: false,
  },
  {
    id: 'c008',
    title: 'HashiCorp Terraform Associate',
    provider: 'HashiCorp',
    platform: 'Pluralsight',
    level: 'Intermediate',
    domain: 'Cloud/DevOps',
    skills: ['Terraform', 'AWS', 'GCP', 'Azure', 'Infrastructure as Code', 'CI/CD', 'Vault'],
    hours: 22,
    rating: 4.7,
    reviews: 17_500,
    price_usd: 70,
    url: 'https://developer.hashicorp.com/certifications/infrastructure-automation',
    description: 'Master Terraform for multi-cloud infrastructure automation. Write, plan, apply, and manage IaC across AWS, GCP, and Azure at enterprise scale.',
    certificate: true,
    badge_color: 'warning',
    is_featured: false,
  },
  /* ── Data Science / Engineering ────────────────────────────────────────────── */
  {
    id: 'c009',
    title: 'IBM Data Science Professional Certificate',
    provider: 'IBM',
    platform: 'Coursera',
    level: 'Beginner',
    domain: 'Data Science',
    skills: ['Python', 'SQL', 'scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Jupyter', 'Machine Learning'],
    hours: 60,
    rating: 4.6,
    reviews: 198_000,
    price_usd: 49,
    url: 'https://www.coursera.org/professional-certificates/ibm-data-science',
    description: '10-course certificate covering the full data science lifecycle — data collection, analysis, visualisation, ML modelling, and deployment.',
    certificate: true,
    badge_color: 'success',
    is_featured: false,
  },
  {
    id: 'c010',
    title: 'Apache Spark with Scala and Python',
    provider: 'Udemy',
    platform: 'Udemy',
    level: 'Intermediate',
    domain: 'Data Engineering',
    skills: ['Spark', 'Python', 'Scala', 'SQL', 'Streaming', 'Delta Lake', 'Databricks'],
    hours: 35,
    rating: 4.6,
    reviews: 44_000,
    price_usd: 15,
    url: 'https://www.udemy.com/course/apache-spark-with-scala-hands-on-with-big-data/',
    description: 'Hands-on Apache Spark for large-scale data processing. Build batch and streaming pipelines in PySpark and Scala with Delta Lake and Databricks.',
    certificate: true,
    badge_color: 'accent',
    is_featured: false,
  },
  {
    id: 'c011',
    title: 'dbt Analytics Engineering',
    provider: 'dbt Labs',
    platform: 'Coursera',
    level: 'Intermediate',
    domain: 'Data Engineering',
    skills: ['dbt', 'SQL', 'Snowflake', 'BigQuery', 'Data Modelling', 'CI/CD', 'Airflow'],
    hours: 16,
    rating: 4.7,
    reviews: 12_000,
    price_usd: 'Free',
    url: 'https://learn.getdbt.com/courses/dbt-fundamentals',
    description: 'Transform raw data into analytics-ready models with dbt. Learn modular SQL, testing, documentation, and orchestration with Airflow and Snowflake.',
    certificate: true,
    badge_color: 'neutral',
    is_featured: false,
  },
  {
    id: 'c012',
    title: 'Data Engineering with Python',
    provider: 'DataCamp',
    platform: 'LinkedIn Learning',
    level: 'Intermediate',
    domain: 'Data Engineering',
    skills: ['Python', 'Airflow', 'Kafka', 'PostgreSQL', 'Redis', 'ETL', 'REST'],
    hours: 24,
    rating: 4.5,
    reviews: 19_000,
    price_usd: 29,
    url: '#',
    description: 'Build robust data pipelines in Python. Cover Apache Airflow orchestration, Kafka streaming, PostgreSQL optimisation, and Redis caching.',
    certificate: true,
    badge_color: 'brand',
    is_featured: false,
  },
  /* ── Software Engineering ──────────────────────────────────────────────────── */
  {
    id: 'c013',
    title: 'System Design Interview – An Insider\'s Guide',
    provider: 'ByteByteGo',
    platform: 'Pluralsight',
    level: 'Advanced',
    domain: 'Software Engineering',
    skills: ['System Design', 'Distributed Systems', 'Scalability', 'Microservices', 'API Design', 'Caching', 'Load Balancing'],
    hours: 18,
    rating: 4.9,
    reviews: 67_000,
    price_usd: 29,
    url: 'https://bytebytego.com',
    description: 'Master large-scale system design. Design URL shorteners, social media feeds, payment systems, and chat apps using industry-standard patterns.',
    certificate: false,
    badge_color: 'neutral',
    is_featured: false,
  },
  {
    id: 'c014',
    title: 'Full Stack React & Node.js',
    provider: 'Meta',
    platform: 'Coursera',
    level: 'Intermediate',
    domain: 'Software Engineering',
    skills: ['React', 'Node.js', 'TypeScript', 'REST', 'GraphQL', 'PostgreSQL', 'Docker'],
    hours: 42,
    rating: 4.7,
    reviews: 38_000,
    price_usd: 49,
    url: 'https://www.coursera.org/professional-certificates/meta-back-end-developer',
    description: 'Build full-stack web applications with React, Node.js, and PostgreSQL. Learn REST and GraphQL APIs, testing, and containerisation with Docker.',
    certificate: true,
    badge_color: 'brand',
    is_featured: false,
  },
  /* ── Research / Academia ───────────────────────────────────────────────────── */
  {
    id: 'c015',
    title: 'Research Methods in Computer Science',
    provider: 'Stanford Online',
    platform: 'Coursera',
    level: 'Advanced',
    domain: 'Research',
    skills: ['Research Design', 'Statistical Analysis', 'Academic Writing', 'Hypothesis Testing', 'Python', 'R'],
    hours: 20,
    rating: 4.5,
    reviews: 8_200,
    price_usd: 49,
    url: '#',
    description: 'Rigorous introduction to computer science research methodology — experimental design, reproducibility, statistical significance, and academic publication.',
    certificate: true,
    badge_color: 'accent',
    is_featured: false,
  },
]

/* ── Research domain definitions ──────────────────────────────────────────── */
export interface ResearchDomain {
  id:          string
  name:        string           // matches DOMAIN_COLUMNS in dataset.py
  score:       number           // 0–100 predicted alignment
  trend:       'rising' | 'stable' | 'declining'
  papers:      number           // active research papers in area
  top_skills:  string[]
  description: string
  color:       string           // tailwind bg class
  text_color:  string
  icon_color:  string
}

export const RESEARCH_DOMAINS: ResearchDomain[] = [
  {
    id: 'dom_Software_Engineering',
    name: 'Software Engineering',
    score: 92,
    trend: 'stable',
    papers: 4_820,
    top_skills: ['Python', 'TypeScript', 'System Design', 'Distributed Systems', 'REST', 'GraphQL'],
    description: 'Core software architecture, API design, distributed systems, and DevOps practices driving modern large-scale applications.',
    color: 'bg-brand-500',
    text_color: 'text-brand-400',
    icon_color: 'text-brand-400',
  },
  {
    id: 'dom_Cloud___DevOps',
    name: 'Cloud & DevOps',
    score: 83,
    trend: 'rising',
    papers: 3_210,
    top_skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'CI/CD', 'GCP'],
    description: 'Cloud-native architectures, infrastructure automation, container orchestration, and platform engineering at enterprise scale.',
    color: 'bg-sky-500',
    text_color: 'text-sky-400',
    icon_color: 'text-sky-400',
  },
  {
    id: 'dom_Machine_Learning___AI',
    name: 'Machine Learning & AI',
    score: 78,
    trend: 'rising',
    papers: 12_450,
    top_skills: ['PyTorch', 'TensorFlow', 'Transformers', 'BERT', 'MLflow', 'scikit-learn'],
    description: 'Deep learning, large language models, computer vision, reinforcement learning, and AI alignment research at the frontier.',
    color: 'bg-accent-500',
    text_color: 'text-accent-400',
    icon_color: 'text-accent-400',
  },
  {
    id: 'dom_Data_Science___Analytics',
    name: 'Data Science & Analytics',
    score: 71,
    trend: 'stable',
    papers: 5_640,
    top_skills: ['Python', 'Spark', 'SQL', 'scikit-learn', 'Pandas', 'Tableau'],
    description: 'Statistical modelling, exploratory data analysis, predictive analytics, and business intelligence driving data-driven decisions.',
    color: 'bg-emerald-500',
    text_color: 'text-emerald-400',
    icon_color: 'text-emerald-400',
  },
  {
    id: 'dom_Data_Engineering',
    name: 'Data Engineering',
    score: 64,
    trend: 'rising',
    papers: 2_890,
    top_skills: ['Spark', 'Airflow', 'Kafka', 'dbt', 'Snowflake', 'Delta Lake'],
    description: 'Data pipeline engineering, stream processing, data warehouse design, and modern lakehouse architectures powering analytics at scale.',
    color: 'bg-rose-500',
    text_color: 'text-rose-400',
    icon_color: 'text-rose-400',
  },
  {
    id: 'dom_Product_Management',
    name: 'Product Management',
    score: 42,
    trend: 'stable',
    papers: 980,
    top_skills: ['Product Strategy', 'Roadmapping', 'Agile', 'User Research', 'Metrics', 'OKRs'],
    description: 'Product discovery, prioritisation frameworks, growth strategy, and cross-functional collaboration in technology organisations.',
    color: 'bg-amber-500',
    text_color: 'text-amber-400',
    icon_color: 'text-amber-400',
  },
  {
    id: 'dom_Cybersecurity',
    name: 'Cybersecurity',
    score: 35,
    trend: 'rising',
    papers: 6_120,
    top_skills: ['Penetration Testing', 'SIEM', 'Zero Trust', 'Cryptography', 'Cloud Security'],
    description: 'Application security, cloud security posture management, threat modelling, and security engineering for modern cloud-native systems.',
    color: 'bg-red-500',
    text_color: 'text-red-400',
    icon_color: 'text-red-400',
  },
]

/* ── Career roadmap milestone definitions ─────────────────────────────────── */
export interface RoadmapMilestone {
  id:        string
  phase:     string
  role:      string
  level:     string
  skills:    string[]
  skills_to_gain: string[]
  done:      boolean
  courses:   string[]    // course ids
  salary:    string
  timeline:  string
  description: string
}

export const ROADMAP: RoadmapMilestone[] = [
  {
    id: 'rm0',
    phase: 'Current',
    role: 'Senior Software Engineer',
    level: 'Mid-Senior',
    skills: ['Python', 'TypeScript', 'React', 'Node.js', 'FastAPI', 'AWS', 'Docker', 'PostgreSQL'],
    skills_to_gain: [],
    done: true,
    courses: [],
    salary: '$150K–$200K',
    timeline: 'Now',
    description: 'Strong foundation in full-stack engineering and cloud infrastructure. Ready to specialise in ML/AI engineering.',
  },
  {
    id: 'rm1',
    phase: '3 Months',
    role: 'ML Engineer',
    level: 'Mid-Senior',
    skills: ['PyTorch', 'TensorFlow', 'Transformers', 'MLflow', 'BERT'],
    skills_to_gain: ['PyTorch', 'Transformers', 'MLflow', 'Feature Engineering'],
    done: false,
    courses: ['c001', 'c002'],
    salary: '$170K–$230K',
    timeline: 'Q1 2027',
    description: 'Bridge into ML engineering by building transformer-based models, feature pipelines, and deploying via MLflow. Leverage existing Python and AWS expertise.',
  },
  {
    id: 'rm2',
    phase: '6 Months',
    role: 'Senior ML Engineer',
    level: 'Senior',
    skills: ['Large-Scale ML Systems', 'Kubernetes', 'Spark', 'CUDA', 'System Design'],
    skills_to_gain: ['Large-Scale ML', 'CUDA', 'Distributed Training', 'RAG Systems'],
    done: false,
    courses: ['c002', 'c004', 'c007'],
    salary: '$200K–$270K',
    timeline: 'Q2 2027',
    description: 'Scale ML systems to production with distributed training, Kubernetes orchestration, and real-time inference pipelines handling millions of requests.',
  },
  {
    id: 'rm3',
    phase: '12 Months',
    role: 'Staff ML Engineer / AI Lead',
    level: 'Staff / Principal',
    skills: ['AI Research', 'Team Leadership', 'Technical Strategy', 'LLM Fine-tuning', 'AI Architecture'],
    skills_to_gain: ['Leadership', 'Research', 'LLM Alignment', 'Technical Vision'],
    done: false,
    courses: ['c015'],
    salary: '$260K–$380K',
    timeline: 'Q4 2027',
    description: 'Lead cross-functional AI teams, define technical direction for LLM-powered products, publish research, and influence company-wide ML strategy.',
  },
]
