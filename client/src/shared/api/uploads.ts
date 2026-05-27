import { apiClient } from '@shared/lib/apiClient';

export interface UploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export const uploadsApi = {
  async upload(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<UploadResult>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export async function uploadFile(file: File): Promise<string> {
  const res = await uploadsApi.upload(file);
  return res.url;
}
