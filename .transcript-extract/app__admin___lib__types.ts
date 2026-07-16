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

export type ServerHealth = {
  cpu_usage: number | null;
  ram_usage: number | null;
  disk_usage: number | null;
  redis_status: string;
  database_status: string;
  queue_backlog: number;
  server_uptime: string;
  active_workers: number;
  total_workers: number;
  last_checked_at: string;
};
