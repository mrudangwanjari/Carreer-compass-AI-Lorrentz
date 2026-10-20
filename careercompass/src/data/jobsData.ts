/**
 * jobsData.ts
 * ───────────
 * Static job dataset that mirrors the LinkedIn postings used in the
 * CareerCompass AI research pipeline (123,849 real jobs).
 * In Milestone 5 this will be replaced by live FAISS + SBERT inference.
 *
 * Each entry contains every field that the real postings.csv exposes,
 * plus a pre-computed SBERT match_score and matched_skills list
 * (in production these come from the Python inference server).
 */

export type WorkType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
export type ExperienceLevel = 'Entry level' | 'Associate' | 'Mid-Senior level' | 'Director' | 'Executive'

export interface Job {
  job_id:            string
  title:             string
  company_name:      string
  location:          string
  description:       string
  work_type:         WorkType
  experience_level:  ExperienceLevel
  remote_allowed:    boolean
  industry:          string
  domain:            string           // primary domain label
  match_score:       number           // 0–100 SBERT cosine similarity × 100
  matched_skills:    string[]         // subset of user's skills found in posting
  min_salary?:       number
  max_salary?:       number
  pay_period?:       'YEARLY' | 'MONTHLY' | 'HOURLY'
  posted_days_ago:   number
  applies:           number
  skills_desc:       string[]         // skills listed in posting
  company_size:      string
  url:               string
}

/* ── 30 rich mock jobs derived from real LinkedIn postings structure ────────── */
export const JOBS: Job[] = [
  {
    job_id: 'j001',
    title: 'Senior Machine Learning Engineer',
    company_name: 'Google',
    location: 'Mountain View, CA',
    description:
      'Design and ship large-scale ML systems powering Google Search and Assistant. You will work with PyTorch and TensorFlow to develop transformer-based models, collaborate with research teams on BERT and LLM fine-tuning, and deploy services on GCP at billion-user scale. Strong Python and distributed systems background required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'ML/AI',
    match_score: 96,
    matched_skills: ['Python', 'PyTorch', 'TensorFlow', 'BERT', 'GCP', 'Kubernetes', 'Transformers'],
    min_salary: 180000,
    max_salary: 280000,
    pay_period: 'YEARLY',
    posted_days_ago: 2,
    applies: 412,
    skills_desc: ['Python', 'PyTorch', 'TensorFlow', 'BERT', 'GCP', 'Kubernetes', 'Transformers', 'Distributed Systems', 'MLflow'],
    company_size: '10,001+ employees',
    url: '#',
  },
  {
    job_id: 'j002',
    title: 'Staff Data Scientist',
    company_name: 'Meta',
    location: 'Menlo Park, CA',
    description:
      'Drive data science for Meta\'s News Feed ranking systems. You will build experimentation frameworks, develop causal inference models, and work closely with ML engineers on feature engineering and A/B testing at scale. Deep expertise in statistical modeling, Python, and Spark required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'Data Science',
    match_score: 91,
    matched_skills: ['Python', 'Spark', 'scikit-learn', 'PostgreSQL', 'Kafka', 'Airflow'],
    min_salary: 200000,
    max_salary: 320000,
    pay_period: 'YEARLY',
    posted_days_ago: 4,
    applies: 287,
    skills_desc: ['Python', 'Spark', 'scikit-learn', 'R', 'Causal Inference', 'PostgreSQL', 'Kafka', 'Airflow', 'Tableau'],
    company_size: '10,001+ employees',
    url: '#',
  },
  {
    job_id: 'j003',
    title: 'AI Research Lead',
    company_name: 'OpenAI',
    location: 'San Francisco, CA',
    description:
      'Lead a team of researchers working on alignment and safety for large language models. You will design and execute experiments on GPT-scale models, publish research, and translate findings into product-quality systems. Strong background in deep learning, NLP, and transformer architectures required.',
    work_type: 'Full-time',
    experience_level: 'Director',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'ML/AI',
    match_score: 88,
    matched_skills: ['Python', 'PyTorch', 'Transformers', 'BERT', 'TensorFlow'],
    min_salary: 250000,
    max_salary: 400000,
    pay_period: 'YEARLY',
    posted_days_ago: 7,
    applies: 198,
    skills_desc: ['Python', 'PyTorch', 'Transformers', 'RLHF', 'LLMs', 'Research', 'Publications', 'Leadership'],
    company_size: '501–1,000 employees',
    url: '#',
  },
  {
    job_id: 'j004',
    title: 'Senior Software Engineer – Platform',
    company_name: 'Apple',
    location: 'Cupertino, CA',
    description:
      'Build the distributed systems and APIs that power iCloud for hundreds of millions of users. You will work in TypeScript and Go, design RESTful and GraphQL APIs, and optimize PostgreSQL and Redis at scale. Experience with Kubernetes and CI/CD pipelines essential.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'Software Engineering',
    match_score: 85,
    matched_skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Kubernetes', 'Docker', 'REST', 'GraphQL', 'CI/CD'],
    min_salary: 170000,
    max_salary: 260000,
    pay_period: 'YEARLY',
    posted_days_ago: 3,
    applies: 534,
    skills_desc: ['TypeScript', 'Go', 'Node.js', 'PostgreSQL', 'Redis', 'Kubernetes', 'Docker', 'GraphQL', 'CI/CD'],
    company_size: '10,001+ employees',
    url: '#',
  },
  {
    job_id: 'j005',
    title: 'Principal Cloud Architect',
    company_name: 'Amazon Web Services',
    location: 'Seattle, WA',
    description:
      'Design reference architectures for AWS enterprise customers migrating to cloud-native workloads. Specialise in Kubernetes, Terraform, and serverless patterns. Work with solutions architects and product teams to develop best-practice frameworks for Kafka-based event streaming and microservices.',
    work_type: 'Full-time',
    experience_level: 'Director',
    remote_allowed: true,
    industry: 'Cloud Computing',
    domain: 'Cloud/DevOps',
    match_score: 83,
    matched_skills: ['AWS', 'Kubernetes', 'Terraform', 'Kafka', 'Docker', 'Python'],
    min_salary: 180000,
    max_salary: 275000,
    pay_period: 'YEARLY',
    posted_days_ago: 5,
    applies: 156,
    skills_desc: ['AWS', 'Kubernetes', 'Terraform', 'Kafka', 'Docker', 'Python', 'Serverless', 'CDK', 'CloudFormation'],
    company_size: '10,001+ employees',
    url: '#',
  },
  {
    job_id: 'j006',
    title: 'Senior MLOps Engineer',
    company_name: 'Stripe',
    location: 'Remote',
    description:
      'Own the ML platform that serves fraud detection and risk models for millions of Stripe transactions per second. Build and maintain MLflow pipelines, implement feature stores, and ensure sub-100ms model inference latency. Deep knowledge of Airflow, Spark, and cloud infrastructure required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'FinTech',
    domain: 'Cloud/DevOps',
    match_score: 81,
    matched_skills: ['Python', 'Airflow', 'Spark', 'Kafka', 'Docker', 'Kubernetes', 'AWS'],
    min_salary: 160000,
    max_salary: 240000,
    pay_period: 'YEARLY',
    posted_days_ago: 1,
    applies: 89,
    skills_desc: ['Python', 'Airflow', 'Spark', 'Kafka', 'Docker', 'Kubernetes', 'MLflow', 'AWS', 'Feature Store'],
    company_size: '5,001–10,000 employees',
    url: '#',
  },
  {
    job_id: 'j007',
    title: 'Full Stack Engineer – AI Products',
    company_name: 'Anthropic',
    location: 'San Francisco, CA',
    description:
      'Build the product interfaces for Claude AI. Work across React frontends, FastAPI backends, and LLM inference pipelines. You will ship streaming APIs, build evaluation dashboards, and own the developer experience for our API platform. TypeScript, Python, and GraphQL expertise required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'Software Engineering',
    match_score: 79,
    matched_skills: ['TypeScript', 'React', 'Python', 'FastAPI', 'GraphQL', 'REST', 'Node.js'],
    min_salary: 175000,
    max_salary: 260000,
    pay_period: 'YEARLY',
    posted_days_ago: 6,
    applies: 247,
    skills_desc: ['TypeScript', 'React', 'Python', 'FastAPI', 'GraphQL', 'REST', 'Node.js', 'PostgreSQL', 'Redis'],
    company_size: '501–1,000 employees',
    url: '#',
  },
  {
    job_id: 'j008',
    title: 'Data Engineer – Analytics Platform',
    company_name: 'Databricks',
    location: 'San Francisco, CA',
    description:
      'Design and operate petabyte-scale data pipelines on Databricks. Build Spark jobs, maintain Delta Lake tables, and work with dbt to power business intelligence dashboards. Experience with Airflow orchestration and Kafka streaming required. Python and SQL expertise essential.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'Data Engineering',
    match_score: 77,
    matched_skills: ['Python', 'Spark', 'Airflow', 'Kafka', 'PostgreSQL', 'SQL'],
    min_salary: 155000,
    max_salary: 225000,
    pay_period: 'YEARLY',
    posted_days_ago: 8,
    applies: 312,
    skills_desc: ['Python', 'Spark', 'Airflow', 'Kafka', 'dbt', 'Delta Lake', 'SQL', 'Scala', 'PostgreSQL'],
    company_size: '5,001–10,000 employees',
    url: '#',
  },
  {
    job_id: 'j009',
    title: 'Backend Engineer – Infrastructure',
    company_name: 'Cloudflare',
    location: 'Austin, TX',
    description:
      'Build high-throughput Go and Rust services handling 50 million requests per second at Cloudflare\'s edge. Work on distributed systems, network protocols, and observability tooling. Experience with Docker, Kubernetes, and CI/CD pipelines required. Strong systems programming background essential.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'Software Engineering',
    match_score: 74,
    matched_skills: ['Docker', 'Kubernetes', 'CI/CD', 'REST', 'Git'],
    min_salary: 150000,
    max_salary: 230000,
    pay_period: 'YEARLY',
    posted_days_ago: 10,
    applies: 203,
    skills_desc: ['Go', 'Rust', 'Docker', 'Kubernetes', 'CI/CD', 'Prometheus', 'gRPC', 'eBPF'],
    company_size: '1,001–5,000 employees',
    url: '#',
  },
  {
    job_id: 'j010',
    title: 'Machine Learning Researcher – NLP',
    company_name: 'Cohere',
    location: 'Toronto, ON (Remote)',
    description:
      'Research and develop large language models for enterprise NLP applications. Work on BERT fine-tuning, RAG architectures, and embedding models. Publish research and collaborate with product teams to ship models. Strong Python, PyTorch, and transformer expertise required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'ML/AI',
    match_score: 73,
    matched_skills: ['Python', 'PyTorch', 'BERT', 'Transformers', 'scikit-learn'],
    min_salary: 140000,
    max_salary: 220000,
    pay_period: 'YEARLY',
    posted_days_ago: 12,
    applies: 178,
    skills_desc: ['Python', 'PyTorch', 'BERT', 'Transformers', 'RAG', 'Embeddings', 'HuggingFace', 'scikit-learn'],
    company_size: '501–1,000 employees',
    url: '#',
  },
  {
    job_id: 'j011',
    title: 'Platform Engineer – Kubernetes',
    company_name: 'Spotify',
    location: 'New York, NY',
    description:
      'Own the internal developer platform used by 3,000 Spotify engineers. Maintain Kubernetes clusters, build Terraform modules, and integrate with GCP services. Work on CI/CD tooling, observability, and service mesh configurations. Helm and ArgoCD experience preferred.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'Cloud/DevOps',
    match_score: 71,
    matched_skills: ['Kubernetes', 'Terraform', 'GCP', 'Docker', 'CI/CD', 'Python'],
    min_salary: 145000,
    max_salary: 210000,
    pay_period: 'YEARLY',
    posted_days_ago: 9,
    applies: 134,
    skills_desc: ['Kubernetes', 'Terraform', 'GCP', 'Docker', 'Helm', 'ArgoCD', 'CI/CD', 'Python'],
    company_size: '5,001–10,000 employees',
    url: '#',
  },
  {
    job_id: 'j012',
    title: 'Software Engineer – Payments',
    company_name: 'Brex',
    location: 'Remote',
    description:
      'Build the core payments infrastructure handling billions in transaction volume. Work with Elixir microservices, PostgreSQL, and Kafka for real-time event streaming. You will design RESTful APIs, implement idempotency patterns, and ensure PCI-DSS compliance. TypeScript and Node.js experience helpful.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'FinTech',
    domain: 'Software Engineering',
    match_score: 70,
    matched_skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Kafka', 'REST', 'Docker'],
    min_salary: 140000,
    max_salary: 200000,
    pay_period: 'YEARLY',
    posted_days_ago: 3,
    applies: 98,
    skills_desc: ['Elixir', 'TypeScript', 'Node.js', 'PostgreSQL', 'Kafka', 'REST', 'Docker', 'PCI-DSS'],
    company_size: '1,001–5,000 employees',
    url: '#',
  },
  {
    job_id: 'j013',
    title: 'Applied Scientist – Recommendations',
    company_name: 'Netflix',
    location: 'Los Gatos, CA',
    description:
      'Develop recommendation algorithms that personalise content for 260 million Netflix subscribers. Work on two-tower neural networks, multi-armed bandits, and large-scale A/B testing. Strong Python, PyTorch, and Spark background required. Published research in RecSys a plus.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'ML/AI',
    match_score: 68,
    matched_skills: ['Python', 'PyTorch', 'Spark', 'scikit-learn', 'Airflow'],
    min_salary: 190000,
    max_salary: 300000,
    pay_period: 'YEARLY',
    posted_days_ago: 14,
    applies: 465,
    skills_desc: ['Python', 'PyTorch', 'Spark', 'scikit-learn', 'Airflow', 'A/B Testing', 'RecSys', 'Bandits'],
    company_size: '10,001+ employees',
    url: '#',
  },
  {
    job_id: 'j014',
    title: 'DevOps Engineer – CI/CD',
    company_name: 'HashiCorp',
    location: 'Remote',
    description:
      'Build and maintain the CI/CD infrastructure for HashiCorp\'s open-source and enterprise product suite. Manage Terraform Cloud deployments, GitHub Actions workflows, and Docker-based build pipelines. AWS, GCP, and Kubernetes experience required. Strong scripting and automation background.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'Cloud/DevOps',
    match_score: 67,
    matched_skills: ['Terraform', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Python', 'Git'],
    min_salary: 130000,
    max_salary: 190000,
    pay_period: 'YEARLY',
    posted_days_ago: 11,
    applies: 167,
    skills_desc: ['Terraform', 'AWS', 'GCP', 'Docker', 'Kubernetes', 'GitHub Actions', 'CI/CD', 'Python'],
    company_size: '1,001–5,000 employees',
    url: '#',
  },
  {
    job_id: 'j015',
    title: 'Senior React Engineer',
    company_name: 'Figma',
    location: 'San Francisco, CA',
    description:
      'Build the next generation of Figma\'s collaborative canvas editor. Work in TypeScript and React on highly performance-sensitive rendering code, WebAssembly integrations, and real-time multiplayer features. Deep expertise in browser performance, CSS, and WebGL preferred.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'Software Engineering',
    match_score: 65,
    matched_skills: ['TypeScript', 'React', 'Node.js', 'CI/CD', 'Git'],
    min_salary: 155000,
    max_salary: 235000,
    pay_period: 'YEARLY',
    posted_days_ago: 6,
    applies: 389,
    skills_desc: ['TypeScript', 'React', 'WebAssembly', 'WebGL', 'CSS', 'Node.js', 'CI/CD'],
    company_size: '1,001–5,000 employees',
    url: '#',
  },
  {
    job_id: 'j016',
    title: 'Machine Learning Engineer – Search',
    company_name: 'LinkedIn',
    location: 'Sunnyvale, CA',
    description:
      'Improve LinkedIn Search and Feed ranking using ML models serving 900 million members. Work on BERT-based semantic retrieval, FAISS-based approximate nearest neighbour search, and Learning to Rank systems. Python, PyTorch, and large-scale distributed systems experience required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'ML/AI',
    match_score: 63,
    matched_skills: ['Python', 'PyTorch', 'BERT', 'Transformers', 'Spark', 'Kubernetes'],
    min_salary: 165000,
    max_salary: 250000,
    pay_period: 'YEARLY',
    posted_days_ago: 5,
    applies: 521,
    skills_desc: ['Python', 'PyTorch', 'BERT', 'FAISS', 'Transformers', 'Spark', 'Scala', 'Kubernetes', 'LTR'],
    company_size: '10,001+ employees',
    url: '#',
  },
  {
    job_id: 'j017',
    title: 'Site Reliability Engineer',
    company_name: 'Cloudflare',
    location: 'London, UK',
    description:
      'Ensure 99.99% uptime across Cloudflare\'s global network. Build runbooks and automated remediation pipelines using Python and Terraform. Work with on-call rotations, service level objectives, and capacity planning. Experience with Prometheus, Grafana, and Kubernetes required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'Cloud/DevOps',
    match_score: 62,
    matched_skills: ['Python', 'Kubernetes', 'Docker', 'Terraform', 'GCP', 'CI/CD'],
    min_salary: 120000,
    max_salary: 180000,
    pay_period: 'YEARLY',
    posted_days_ago: 7,
    applies: 143,
    skills_desc: ['Python', 'Kubernetes', 'Docker', 'Terraform', 'Prometheus', 'Grafana', 'GCP'],
    company_size: '1,001–5,000 employees',
    url: '#',
  },
  {
    job_id: 'j018',
    title: 'Backend Engineer – Data Pipeline',
    company_name: 'Snowflake',
    location: 'San Mateo, CA',
    description:
      'Build high-throughput data ingestion pipelines that onboard petabytes of customer data into Snowflake. Work with Python, Spark, Kafka, and Airflow. Design fault-tolerant distributed systems and optimise SQL query performance. Experience with AWS and cloud data warehousing required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: true,
    industry: 'Technology',
    domain: 'Data Engineering',
    match_score: 61,
    matched_skills: ['Python', 'Spark', 'Kafka', 'Airflow', 'PostgreSQL', 'AWS'],
    min_salary: 150000,
    max_salary: 220000,
    pay_period: 'YEARLY',
    posted_days_ago: 4,
    applies: 204,
    skills_desc: ['Python', 'Spark', 'Kafka', 'Airflow', 'SQL', 'AWS', 'Snowflake', 'dbt'],
    company_size: '5,001–10,000 employees',
    url: '#',
  },
  {
    job_id: 'j019',
    title: 'Software Engineer – ML Infra',
    company_name: 'Waymo',
    location: 'Mountain View, CA',
    description:
      'Build the training infrastructure for Waymo\'s autonomous driving perception models. Work on distributed PyTorch training, model evaluation harnesses, and large-scale GPU cluster orchestration with Kubernetes. Python, CUDA, and ML infrastructure background required.',
    work_type: 'Full-time',
    experience_level: 'Mid-Senior level',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'ML/AI',
    match_score: 60,
    matched_skills: ['Python', 'PyTorch', 'Kubernetes', 'Docker', 'GCP'],
    min_salary: 170000,
    max_salary: 260000,
    pay_period: 'YEARLY',
    posted_days_ago: 9,
    applies: 176,
    skills_desc: ['Python', 'PyTorch', 'CUDA', 'Kubernetes', 'Docker', 'GCP', 'Ray', 'Distributed Training'],
    company_size: '1,001–5,000 employees',
    url: '#',
  },
  {
    job_id: 'j020',
    title: 'Engineering Manager – Platform',
    company_name: 'Airbnb',
    location: 'San Francisco, CA',
    description:
      'Lead a team of 8 engineers building Airbnb\'s data infrastructure platform. Drive technical direction for Spark, Airflow, and Kafka systems, recruit and mentor engineers, and collaborate with product and data science teams. Strong technical background in Python and distributed systems required.',
    work_type: 'Full-time',
    experience_level: 'Director',
    remote_allowed: false,
    industry: 'Technology',
    domain: 'Software Engineering',
    match_score: 58,
    matched_skills: ['Python', 'Spark', 'Airflow', 'Kafka', 'Agile'],
    min_salary: 200000,
    max_salary: 310000,
    pay_period: 'YEARLY',
    posted_days_ago: 13,
    applies: 89,
    skills_desc: ['Python', 'Spark', 'Airflow', 'Kafka', 'Leadership', 'Agile', 'PostgreSQL'],
    company_size: '5,001–10,000 employees',
    url: '#',
  },
]

/* ── Helper functions ────────────────────────────────────────────────────────── */
export const ALL_DOMAINS   = [...new Set(JOBS.map(j => j.domain))].sort()
export const ALL_WORK_TYPES = [...new Set(JOBS.map(j => j.work_type))].sort()
export const ALL_EXP_LEVELS = [...new Set(JOBS.map(j => j.experience_level))].sort()

export function formatSalary(job: Job): string {
  if (!job.min_salary && !job.max_salary) return 'Not disclosed'
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`
  if (job.min_salary && job.max_salary)
    return `${fmt(job.min_salary)} – ${fmt(job.max_salary)}`
  if (job.max_salary) return `Up to ${fmt(job.max_salary)}`
  return `From ${fmt(job.min_salary!)}`
}

export function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-brand-400'
  if (score >= 55) return 'text-amber-400'
  return 'text-slate-400'
}

export function scoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/25'
  if (score >= 70) return 'bg-brand-500/10 border-brand-500/25'
  if (score >= 55) return 'bg-amber-500/10 border-amber-500/25'
  return 'bg-white/6 border-white/12'
}
