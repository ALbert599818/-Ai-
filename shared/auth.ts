export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    displayName: string;
    region: string;
    roles: string[];
  };
}

export interface SessionResponse {
  userId: string;
  username: string;
  displayName: string;
  region: string;
  roles: string[];
}
