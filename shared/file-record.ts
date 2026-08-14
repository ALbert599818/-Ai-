export interface FileRecordItem {
  id: string;
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
  folderPath: string;
  uploadStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileRecordListParams {
  folderPath?: string;
  page?: number;
  pageSize?: number;
}

export interface FileRecordListResponse {
  items: FileRecordItem[];
  total: number;
}

export interface CreateFileRecordRequest {
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
  folderPath: string;
}

export interface BatchCreateFileRecordRequest {
  files: CreateFileRecordRequest[];
}

export interface BatchCreateFileRecordResponse {
  success: boolean;
  createdCount: number;
}
