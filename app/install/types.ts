export interface InstallResponse {
  status_code?: number;
  error?: string;
  success?: boolean;
  data?: {
    api_token?: string;
    shop?: string;
    storeHash?: string;
    manage_services?: string;
    user_id?: string;
    channel_list?: Array<{ channel_id?: number }>;
  };
}

