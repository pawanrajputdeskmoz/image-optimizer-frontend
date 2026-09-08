export interface InstallResponse {
  status_code?: number;
  error?: string;
  message?: string;
  success?: boolean;
  data?: {
    api_token?: string;
    shop?: string;
    storeHash?: string;
    manage_services?: string;
    email?: string | null;
    /** DB user id (also Intercom Messenger user_id) */
    user_id?: string;
    /** Intercom Identity Verification HMAC of user_id */
    user_hash?: string | null;
    channel_list?: Array<{ channel_id?: number }>;
    user?: unknown;
    owner?: unknown;
  };
}
