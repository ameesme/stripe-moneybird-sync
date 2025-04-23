import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, headers: Record<string, string>) {
    this.client = axios.create({
      baseURL,
      headers,
    });

    // Add response interceptor for error logging
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error("[API] Request failed:", {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response.status,
            statusText: error.response.statusText,
          });

          if (error.response.data) {
            console.error(
              "[API] Response data:",
              JSON.stringify(error.response.data, null, 2)
            );
          }
        } else if (error.request) {
          console.error("[API] No response received:", {
            url: error.config?.url,
            method: error.config?.method,
            error: error.message,
          });
        } else {
          console.error("[API] Request setup error:", error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}
