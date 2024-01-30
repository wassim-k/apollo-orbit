export interface HttpConfig {
    [key: string]: any;
    method: string;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
}
