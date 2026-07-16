import type {
  AlertRow,
  ClientRow,
  DashboardData,
  FailedJobRow,
  ImageStatRow,
  ImageStatsSummary,
  Paginated,
  ServerHealth,
  WorkerLogRow,
  WorkerRow,
} from "./types";

const NOW = new Date();
const ago = (mins: number) =>
  new Date(NOW.getTime() - mins * 60_000).toISOString();

export const MOCK_DASHBOARD: DashboardData = {
  workers: {
    total: 12,
    running: 10,
    stopped: 1,
    paused: 1,
    not_responding: 0,
  },
  queues: {
    pending_jobs: 120,
    failed_jobs: 8,
    queues: [
      { queue_name: "image-optimization-2", waiting: 45, active: 3, failed: 2 },
      { queue_name: "image-optimization-3", waiting: 32, active: 2, failed: 1 },
      { queue_name: "category-image", waiting: 18, active: 1, failed: 3 },
      { queue_name: "brand-image", waiting: 12, active: 0, failed: 1 },
      { queue_name: "catalog-fetch", waiting: 8, active: 1, failed: 0 },
      { queue_name: "home-image", waiting: 5, active: 0, failed: 1 },
    ],
  },
  image_optimization: {
    total_images: 20000,
    optimized_images: 14500,
    failed_images: 320,
    total_saved_size: 5_368_709_120,
    average_compression_percent: 63.5,
  },
  server: {
    cpu_usage: 42,
    ram_usage: 92,
    system_ram_usage_percent: 92,
    system_ram_total_mb: 8192,
    system_ram_used_mb: 7537,
    system_ram_free_mb: 655,
    api_process_memory_mb: 185,
    api_process_heap_mb: 72,
    memory_scope_note:
      "system_ram_* is whole-machine RAM on the host (workers, MongoDB, Redis, OS). api_process_* is this API server only.",
    disk_usage: 72,
    redis_status: "ok",
    database_status: "ok",
    uptime: "5 days",
  },
  recent_alerts: [
    {
      _id: "alert-1",
      title: "Worker not responding",
      severity: "high",
      message: "image-restore-2 missed heartbeat",
    },
    {
      _id: "alert-2",
      title: "Queue backlog high",
      severity: "medium",
      message: "image-optimization-2 waiting jobs > 40",
    },
  ],
  recent_error_logs: [
    {
      _id: "log-err-1",
      level: "error",
      worker_name: "category-image",
      message: "Sharp processing failed: invalid image buffer",
      created_at: ago(12),
    },
    {
      _id: "log-err-2",
      level: "error",
      worker_name: "brand-image",
      message: "BigCommerce API rate limit exceeded",
      created_at: ago(45),
    },
  ],
};

export const MOCK_SERVER_HEALTH: ServerHealth = {
  cpu_usage: 42,
  ram_usage: 92,
  system_ram_usage_percent: 92,
  system_ram_total_mb: 8192,
  system_ram_used_mb: 7537,
  system_ram_free_mb: 655,
  api_process_memory_mb: 185,
  api_process_heap_mb: 72,
  memory_scope_note: MOCK_DASHBOARD.server.memory_scope_note,
  disk_usage: 72,
  redis_status: "ok",
  database_status: "ok",
  queue_backlog: 120,
  server_uptime: "5 days",
  active_workers: 10,
  total_workers: 12,
  last_checked_at: NOW.toISOString(),
};

const WORKER_NAMES = [
  { name: "optimization-heavy-supervisor", queue: "optimization-heavy-supervisor", category: "supervisor", status: "running" as const },
  { name: "restore-heavy-supervisor", queue: "restore-heavy-supervisor", category: "supervisor", status: "running" as const },
  { name: "image-optimization-2", queue: "image-optimization-2", category: "optimization", status: "running" as const },
  { name: "image-optimization-3", queue: "image-optimization-3", category: "optimization", status: "running" as const },
  { name: "image-restore-2", queue: "image-restore-2", category: "restore", status: "paused" as const },
  { name: "image-restore-3", queue: "image-restore-3", category: "restore", status: "running" as const },
  { name: "category-image", queue: "category-image", category: "category", status: "running" as const },
  { name: "category-image-restore", queue: "category-image-restore", category: "category", status: "running" as const },
  { name: "catalog-fetch", queue: "catalog-fetch", category: "catalog", status: "running" as const },
  { name: "home-image", queue: "home-image", category: "home", status: "running" as const },
  { name: "brand-image", queue: "brand-image", category: "brand", status: "running" as const },
  { name: "brand-image-restore", queue: "brand-image-restore", category: "brand", status: "stopped" as const },
];

export const MOCK_WORKERS: WorkerRow[] = WORKER_NAMES.map((w, i) => ({
  worker_name: w.name,
  queue_name: w.queue,
  category: w.category,
  status: w.status,
  last_seen: ago(i * 2 + 1),
  current_job_uuid: i % 3 === 0 ? `job-${1000 + i}` : null,
  current_store_hash: i % 3 === 0 ? "gxxvzd4and" : null,
  current_job_type: i % 3 === 0 ? "bulk" : null,
  processed_jobs_today: 80 + i * 7,
  failed_jobs_today: i % 4,
  server_hostname: "app-server-1",
  process_id: 12000 + i,
  memory_usage: `${120 + i * 8}MB`,
  last_error_message: i === 4 ? "Paused by admin" : i === 11 ? "Process exited" : null,
  allowed_actions:
    w.status === "running"
      ? ["pause", "restart", "stop", "view_logs"]
      : w.status === "paused"
        ? ["resume", "stop", "view_logs"]
        : ["start", "view_logs"],
}));

export const MOCK_LOGS: WorkerLogRow[] = [
  {
    _id: "log-1",
    level: "info",
    worker_name: "image-optimization-2",
    store_hash: "gxxvzd4and",
    job_type: "bulk",
    job_uuid: "job-1001",
    message: "Started bulk optimization for 24 images",
    created_at: ago(5),
  },
  {
    _id: "log-2",
    level: "success",
    worker_name: "image-optimization-2",
    store_hash: "gxxvzd4and",
    job_uuid: "job-1001",
    message: "Optimized product image 4821 (saved 312 KB)",
    created_at: ago(4),
  },
  {
    _id: "log-3",
    level: "warning",
    worker_name: "catalog-fetch",
    store_hash: "gxxvzd4and",
    message: "Catalog page fetch slower than usual (4.2s)",
    created_at: ago(20),
  },
  {
    _id: "log-4",
    level: "error",
    worker_name: "category-image",
    store_hash: "gxxvzd4and",
    job_uuid: "job-992",
    message: "Sharp processing failed: invalid image buffer",
    created_at: ago(12),
    error_message: "Input buffer contains unsupported image format",
    error_stack: "Error: Input buffer contains unsupported image format\n    at Sharp.toBuffer (...)",
    context: { image_id: 9912, source_type: "category" },
  },
  {
    _id: "log-5",
    level: "error",
    worker_name: "brand-image",
    store_hash: "storeabc123",
    message: "BigCommerce API rate limit exceeded",
    created_at: ago(45),
    error_message: "429 Too Many Requests",
    context: { retry_after: 30 },
  },
  {
    _id: "log-6",
    level: "info",
    worker_name: "home-image",
    store_hash: "gxxvzd4and",
    message: "Home banner optimization completed",
    created_at: ago(90),
  },
];

export const MOCK_FAILED_JOBS: FailedJobRow[] = [
  {
    _id: "fj-1",
    failed_at: ago(30),
    job_uuid: "job-992",
    store_hash: "gxxvzd4and",
    job_type: "category",
    queue_name: "category-image",
    worker_name: "category-image",
    error_reason: "Sharp processing failed: invalid image buffer",
    retry_count: 2,
    status: "failed",
  },
  {
    _id: "fj-2",
    failed_at: ago(120),
    job_uuid: "job-880",
    store_hash: "storeabc123",
    job_type: "brand",
    queue_name: "brand-image",
    worker_name: "brand-image",
    error_reason: "429 Too Many Requests",
    retry_count: 1,
    status: "failed",
  },
  {
    _id: "fj-3",
    failed_at: ago(300),
    job_uuid: "job-701",
    store_hash: "gxxvzd4and",
    job_type: "product",
    queue_name: "image-optimization-3",
    worker_name: "image-optimization-3",
    error_reason: "Download timeout after 30s",
    retry_count: 0,
    status: "ignored",
  },
];

export const MOCK_ALERTS: AlertRow[] = [
  {
    _id: "alert-1",
    title: "Worker not responding",
    alert_type: "worker_heartbeat",
    severity: "high",
    worker_name: "image-restore-2",
    message: "No heartbeat for 120 seconds",
    last_sent_at: ago(15),
    status: "active",
    brief_explanation: "Worker process may be stuck or crashed.",
    possible_reason: "High CPU load or blocked I/O on worker host.",
    recommended_action: "Check worker logs and restart if needed.",
    email_recipients: ["alerts@example.com"],
    context: { last_seen: ago(120) },
    related_logs: [MOCK_LOGS[3]!],
  },
  {
    _id: "alert-2",
    title: "Queue backlog high",
    alert_type: "queue_depth",
    severity: "medium",
    worker_name: "image-optimization-2",
    message: "Waiting jobs exceeded threshold (45)",
    last_sent_at: ago(60),
    status: "active",
    brief_explanation: "Optimization queue is backing up.",
    possible_reason: "Spike in new images or slow worker throughput.",
    recommended_action: "Scale workers or investigate slow jobs.",
    context: { waiting: 45, threshold: 40 },
  },
  {
    _id: "alert-3",
    title: "Disk usage warning",
    alert_type: "server_resource",
    severity: "low",
    message: "Disk usage at 72%",
    last_sent_at: ago(240),
    status: "resolved",
    brief_explanation: "Server disk crossed 70% threshold.",
    recommended_action: "Archive old logs or expand storage.",
  },
];

export const MOCK_IMAGE_SUMMARY: ImageStatsSummary = {
  total_images: 1500,
  optimized_images: 1200,
  failed_images: 15,
  pending_images: 285,
  skipped_images: 0,
  total_original_size: 524_288_000,
  total_optimized_size: 209_715_200,
  total_saved_size: 314_572_800,
  average_compression_percent: 60,
  last_optimized_at: ago(8),
};

export const MOCK_IMAGE_STATS: ImageStatRow[] = [
  {
    _id: "img-1",
    store_hash: "gxxvzd4and",
    source_type: "product",
    source_id: 4821,
    image_id: 9912,
    original_size: 890_000,
    optimized_size: 312_000,
    saved_size: 578_000,
    compression_percent: 65,
    status: "optimized",
    optimized_at: ago(8),
  },
  {
    _id: "img-2",
    store_hash: "gxxvzd4and",
    source_type: "category",
    source_id: 102,
    image_id: 44,
    original_size: 1_200_000,
    optimized_size: 480_000,
    saved_size: 720_000,
    compression_percent: 60,
    status: "optimized",
    optimized_at: ago(25),
  },
  {
    _id: "img-3",
    store_hash: "gxxvzd4and",
    source_type: "brand",
    source_id: 7,
    image_id: 3,
    original_size: 650_000,
    optimized_size: 650_000,
    saved_size: 0,
    compression_percent: 0,
    status: "failed",
    error_message: "Unsupported format",
    optimized_at: ago(40),
  },
  {
    _id: "img-4",
    store_hash: "storeabc123",
    source_type: "home_banner",
    source_id: 1,
    image_id: 1,
    original_size: 2_100_000,
    optimized_size: 840_000,
    saved_size: 1_260_000,
    compression_percent: 60,
    status: "optimized",
    optimized_at: ago(90),
  },
];

export const MOCK_CLIENTS: ClientRow[] = [
  {
    _id: "client-1",
    store_hash: "gxxvzd4and",
    store_name: "Favloyalty Demo Store",
    store_url: "https://favloyalty-demo.mybigcommerce.com",
    platform: "BigCommerce",
    plan: "pro",
    status: "active",
    owner_email: "mikegorge42@gmail.com",
    installed_at: ago(60 * 24 * 45),
    last_active_at: ago(15),
    channel_count: 2,
    total_images: 4200,
    optimized_images: 3850,
    failed_images: 42,
    pending_images: 308,
    total_saved_size: 1_842_000_000,
    average_compression_percent: 64.2,
    pending_jobs: 28,
  },
  {
    _id: "client-2",
    store_hash: "storeabc123",
    store_name: "Outdoor Gear Co",
    store_url: "https://outdoor-gear.mybigcommerce.com",
    platform: "BigCommerce",
    plan: "enterprise",
    status: "active",
    owner_email: "ops@outdoorgear.com",
    installed_at: ago(60 * 24 * 120),
    last_active_at: ago(45),
    channel_count: 4,
    total_images: 12800,
    optimized_images: 11200,
    failed_images: 95,
    pending_images: 1505,
    total_saved_size: 4_200_000_000,
    average_compression_percent: 61.8,
    pending_jobs: 52,
  },
  {
    _id: "client-3",
    store_hash: "beautyhub99",
    store_name: "Beauty Hub",
    store_url: "https://beautyhub99.mybigcommerce.com",
    platform: "BigCommerce",
    plan: "pro",
    status: "active",
    owner_email: "admin@beautyhub.com",
    installed_at: ago(60 * 24 * 30),
    last_active_at: ago(120),
    channel_count: 1,
    total_images: 2100,
    optimized_images: 1980,
    failed_images: 18,
    pending_images: 102,
    total_saved_size: 680_000_000,
    average_compression_percent: 58.5,
    pending_jobs: 12,
  },
  {
    _id: "client-4",
    store_hash: "petworldx",
    store_name: "Pet World Express",
    store_url: "https://petworldx.mybigcommerce.com",
    platform: "BigCommerce",
    plan: "free",
    status: "trial",
    owner_email: "hello@petworldx.com",
    installed_at: ago(60 * 24 * 5),
    last_active_at: ago(300),
    channel_count: 1,
    total_images: 380,
    optimized_images: 210,
    failed_images: 5,
    pending_images: 165,
    total_saved_size: 42_000_000,
    average_compression_percent: 55.0,
    pending_jobs: 8,
  },
  {
    _id: "client-5",
    store_hash: "vintagefinds",
    store_name: "Vintage Finds",
    store_url: "https://vintagefinds.mybigcommerce.com",
    platform: "BigCommerce",
    plan: "pro",
    status: "suspended",
    owner_email: "billing@vintagefinds.com",
    installed_at: ago(60 * 24 * 200),
    last_active_at: ago(60 * 24 * 14),
    channel_count: 1,
    total_images: 890,
    optimized_images: 890,
    failed_images: 0,
    pending_images: 0,
    total_saved_size: 210_000_000,
    average_compression_percent: 62.1,
    pending_jobs: 0,
  },
  {
    _id: "client-6",
    store_hash: "techparts24",
    store_name: "Tech Parts 24",
    store_url: "https://techparts24.mybigcommerce.com",
    platform: "BigCommerce",
    plan: "enterprise",
    status: "active",
    owner_email: "dev@techparts24.com",
    installed_at: ago(60 * 24 * 90),
    last_active_at: ago(8),
    channel_count: 3,
    total_images: 6500,
    optimized_images: 6100,
    failed_images: 67,
    pending_images: 333,
    total_saved_size: 2_100_000_000,
    average_compression_percent: 66.3,
    pending_jobs: 18,
  },
];

export function filterClients(
  clients: ClientRow[],
  filters: Record<string, string>,
): ClientRow[] {
  return clients.filter((c) => {
    if (filters.status && c.status !== filters.status) return false;
    if (filters.plan && c.plan !== filters.plan) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${c.store_name} ${c.store_hash} ${c.owner_email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): Paginated<T> {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page: safePage,
    limit,
    pages,
  };
}

export function filterLogs(
  logs: WorkerLogRow[],
  filters: Record<string, string>,
): WorkerLogRow[] {
  return logs.filter((log) => {
    if (filters.store_hash && !log.store_hash?.includes(filters.store_hash))
      return false;
    if (filters.worker_name && log.worker_name !== filters.worker_name)
      return false;
    if (filters.queue_name && log.queue_name !== filters.queue_name)
      return false;
    if (filters.level && log.level !== filters.level) return false;
    if (filters.job_uuid && log.job_uuid !== filters.job_uuid) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!log.message?.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export function filterFailedJobs(
  jobs: FailedJobRow[],
  filters: Record<string, string>,
): FailedJobRow[] {
  return jobs.filter((job) => {
    if (filters.store_hash && job.store_hash !== filters.store_hash) return false;
    if (filters.worker_name && job.worker_name !== filters.worker_name)
      return false;
    if (filters.status && job.status !== filters.status) return false;
    return true;
  });
}

export function filterAlerts(
  alerts: AlertRow[],
  filters: Record<string, string>,
): AlertRow[] {
  return alerts.filter((a) => {
    if (filters.status && a.status !== filters.status) return false;
    if (filters.severity && a.severity !== filters.severity) return false;
    return true;
  });
}

export function filterImageStats(
  rows: ImageStatRow[],
  filters: Record<string, string>,
): ImageStatRow[] {
  return rows.filter((row) => {
    if (filters.store_hash && row.store_hash !== filters.store_hash) return false;
    if (filters.source_type && row.source_type !== filters.source_type)
      return false;
    if (filters.status && row.status !== filters.status) return false;
    return true;
  });
}
