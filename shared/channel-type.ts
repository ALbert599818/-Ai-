export interface ChannelTypeItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelTypeListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface ChannelTypeListResponse {
  items: ChannelTypeItem[];
  total: number;
}

export interface CreateChannelTypeRequest {
  name: string;
}

export interface UpdateChannelTypeRequest {
  name: string;
}
