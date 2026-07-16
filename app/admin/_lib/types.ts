export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type WorkerStatus =
  | "running"
  | "stopped"
  | "paused"
  | "error"
  | "not_responding";

export type WorkerRow = {
  worker_name: string;
  queue_name: string;
  category: string;
  status: WorkerStatus;
  last_seen: string | null;
  current_job_uuid: string | null;
  current_store_hash: string | null;
  current_job_type: string | null;
  processed_jobs_today: number;
  failed_jobs_today: number;
  server_hostname: string | null;
  process_id: number | null;
  memory_usage: string | null;
  last_error_message: string | null;
  allowed_actions: string[];
};

export type DashboardCardTrend = {
  direction: "up" | "down";
  percent: number;
  label: string;
};

export type DashboardCardItem = {
  key: string;
  label: string;
  value: number;
  value_formatted: string;
  trend?: DashboardCardTrend;
  sparkline?: number[];
  color: "purple" | "blue" | "green" | "orange";
};

export type DashboardCardsData = {
  cards: DashboardCardItem[];
  checked_at?: string;
};

export type DashboardOverviewMetric = {
  value?: string;
  raw?: number;
  trend_percent?: number;
  trend_label?: string;
  sparkline?: number[];
};

export type DashboardStatsData = {
  overview?: {
    total_clients?: DashboardOverviewMetric;
    active_stores?: DashboardOverviewMetric;
    optimized_images?: DashboardOverviewMetric;
    storage_saved?: DashboardOverviewMetric;
  };
  cards: {
    total_clients?: number;
    active_stores?: number;
    total_workers: number;
    running: number;
    stopped?: number;
    warn?: number;
    at_risk?: number;
    pending_jobs: number;
    failed_jobs: number;
    workers?: {
      total_workers: number;
      running: number;
      stopped: number;
      warn: number;
      at_risk: number;
      pending_jobs: number;
      failed_jobs: number;
      active_jobs?: number;
      summary_label?: string;
      queues?: Array<{
        queue: string;
        category: string;
        status: string;
        workers_count: number;
        backlog: number;
        npm_script_hint?: string;
      }>;
    };
    optimized_images: number;
    total_saved: {
      bytes: number;
      value: string;
      average_saving_percent: number;
    };
    redis: { status: string; label: string };
    database: { status: string; label: string };
  };
  charts: {
    image_optimization: {
      unit?: string;
      total: number;
      total_images?: number;
      optimized_images?: number;
      pending_images?: number;
      failed_images?: number;
      skipped_images?: number;
      percent_optimized?: number;
      summary_label?: string;
      segments: Array<{
        key: string;
        label: string;
        value: number;
        color?: string;
        percent?: number;
      }>;
    };
    storage_saved_trend?: {
      unit?: string;
      labels: string[];
      values: number[];
      points?: Array<{ date: string; bytes: number; display: string }>;
      total_in_window?: number;
      total_in_window_display?: string;
      summary_label?: string;
    };
    optimization_by_type?: {
      unit?: string;
      product_images?: number;
      category_images?: number;
      brand_images?: number;
      summary_label?: string;
      total: number;
      segments: Array<{
        key: string;
        label: string;
        value: number;
        color?: string;
        percent?: number;
      }>;
    };
    worker_status?: {
      unit?: string;
      total_workers?: number;
      summary_label?: string;
      total: number;
      segments: Array<{
        key: string;
        label: string;
        value: number;
        color?: string;
        percent?: number;
      }>;
    };
  };
  checked_at?: string;
};

export type AdminHealthData = {
  healthy?: boolean;
  status?: string;
  checked_at?: string;
  server_health: {
    ram: { percentage: number; used_mb: number; total_mb: number };
    api_process: { memory_mb: number; heap_mb: number; heap_total_mb?: number };
    disk_usage_percentage: number;
    uptime_days?: number;
    uptime_seconds?: number;
    uptime_label: string;
  };
  services: {
    mongodb: { ok: boolean; status: string; ping_ms?: number; database?: string };
    redis: {
      ok: boolean;
      ping_ms?: number | null;
      host?: string;
      port?: number;
      error?: string | null;
    };
  };
  recent_alerts: Array<{
    message: string;
    severity: string;
    source?: string;
  }>;
  process?: {
    node_version?: string;
    pid?: number;
    env?: string;
    load_average?: number[];
    cpu_count?: number;
  };
};

export type RecentErrorLog = {
  message: string;
  category?: string;
  source?: string;
  created_at?: string;
  time_ago?: string;
  store_hash?: string;
  job_uuid?: string;
  job_type?: string;
  step?: string;
};

export type RecentErrorsData = {
  recent_errors: RecentErrorLog[];
  count: number;
  limit: number;
};

export type DashboardData = {
  workers: {
    total: number;
    running: number;
    stopped: number;
    paused: number;
    not_responding: number;
  };
  queues: {
    pending_jobs: number;
    failed_jobs: number;
    queues: Array<{
      queue_name: string;
      waiting?: number;
      active?: number;
      failed?: number;
      delayed?: number;
    }>;
  };
  image_optimization: {
    total_images: number;
    optimized_images: number;
    failed_images: number;
    total_saved_size: number;
    average_compression_percent: number;
  };
  server: {
    cpu_usage: number | null;
    ram_usage: number | null;
    system_ram_usage_percent: number | null;
    system_ram_total_mb: number | null;
    system_ram_used_mb: number | null;
    system_ram_free_mb: number | null;
    api_process_memory_mb: number | null;
    api_process_heap_mb: number | null;
    memory_scope_note: string | null;
    disk_usage: number | null;
    redis_status: string;
    database_status: string;
    uptime: string;
  };
  recent_alerts: AlertRow[];
  recent_error_logs: WorkerLogRow[];
};

export type WorkerLogRow = {
  _id: string;
  level: string;
  worker_name?: string;
  queue_name?: string;
  store_hash?: string;
  job_type?: string;
  job_uuid?: string;
  message?: string;
  created_at?: string;
  error_message?: string;
  error_stack?: string;
  context?: Record<string, unknown>;
};

export type FailedJobRow = {
  _id: string;
  failed_at?: string;
  job_uuid?: string;
  store_hash?: string;
  job_type?: string;
  queue_name?: string;
  worker_name?: string;
  error_reason?: string;
  retry_count?: number;
  status?: string;
};

export type AlertRow = {
  _id: string;
  title?: string;
  alert_type?: string;
  severity?: string;
  worker_name?: string;
  store_hash?: string;
  message?: string;
  last_sent_at?: string;
  status?: string;
  brief_explanation?: string;
  possible_reason?: string;
  recommended_action?: string;
  context?: Record<string, unknown>;
  email_recipients?: string[];
  related_logs?: WorkerLogRow[];
};

export type ImageStatRow = {
  _id: string;
  store_hash?: string;
  source_type?: string;
  source_id?: string | number;
  image_id?: string | number;
  original_size?: number;
  optimized_size?: number;
  saved_size?: number;
  compression_percent?: number;
  status?: string;
  error_message?: string;
  optimized_at?: string;
};

export type ImageStatsSummary = {
  total_images: number;
  optimized_images: number;
  failed_images: number;
  pending_images: number;
  skipped_images: number;
  total_original_size: number;
  total_optimized_size: number;
  total_saved_size: number;
  average_compression_percent: number;
  last_optimized_at?: string | null;
};

export type ServerMemorySnapshot = {
  ram_usage?: number | null;
  system_ram_usage_percent?: number | null;
  system_ram_total_mb?: number | null;
  system_ram_used_mb?: number | null;
  system_ram_free_mb?: number | null;
  api_process_memory_mb?: number | null;
  api_process_heap_mb?: number | null;
  memory_scope_note?: string | null;
};

export type ServerHealth = {
  cpu_usage: number | null;
  ram_usage: number | null;
  system_ram_usage_percent: number | null;
  system_ram_total_mb: number | null;
  system_ram_used_mb: number | null;
  system_ram_free_mb: number | null;
  api_process_memory_mb: number | null;
  api_process_heap_mb: number | null;
  memory_scope_note: string | null;
  memory?: ServerMemorySnapshot;
  disk_usage: number | null;
  redis_status: string;
  database_status: string;
  queue_backlog: number;
  server_uptime: string;
  active_workers: number;
  total_workers: number;
  last_checked_at: string;
};

export type ClientRow = {
  _id: string;
  store_hash: string;
  store_name: string;
  store_url: string;
  platform: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "trial" | "suspended";
  owner_email: string;
  installed_at: string;
  last_active_at: string;
  channel_count: number;
  total_images: number;
  optimized_images: number;
  failed_images: number;
  pending_images: number;
  total_saved_size: number;
  average_compression_percent: number;
  pending_jobs: number;
};

export type AdminPlan = {
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  monthly_image_limit: number | null;
  display_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminPlansData = {
  plans: AdminPlan[];
};

export type AdminPlanUpdatePayload = {
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  monthly_image_limit: number | null;
  display_order: number;
  is_active: boolean;
};
