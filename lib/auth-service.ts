
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';
const AUTH_API_URL = API_URL; // Use the same API URL for auth

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  role: string;
  isImpersonating?: boolean;
  originalRole?: string;
}

export const authService = {
  // ...existing code...
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: 'POST',
        // Content-Type is automatically set to application/x-www-form-urlencoded when using URLSearchParams
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid email or password');
      }

      return response.json();
    } catch (error: any) {
      console.error("Login error details:", error);
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please ensure the backend is running on port 8000.');
      }
      throw error;
    }
  },

  async register(email: string, password: string, fullName: string, role: string = 'pharmacist') {
    const response = await fetch(`${AUTH_API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  },

  async getMe(token: string): Promise<User> {
    const response = await fetch(`${AUTH_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const user = await response.json();
    
    // Patch for admin role mapping
    if (user.email === 'admin@example.com') {
      user.role = 'owner';
    }

    // Handle Impersonation
    if (typeof window !== 'undefined') {
      const impersonatedRole = localStorage.getItem('impersonatedRole');
      if (impersonatedRole) {
        user.originalRole = user.role;
        user.role = impersonatedRole;
        user.isImpersonating = true;
      }
    }
    
    return user;
  },

  impersonateRole(role: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('impersonatedRole', role);
      window.location.reload(); // Reload to apply changes
    }
  },

  stopImpersonating() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('impersonatedRole');
      window.location.reload(); // Reload to apply changes
    }
  },
  
  // Helper to store token (in a real app, use httpOnly cookies via server actions or middleware)
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      // Also set a cookie for middleware if needed, but for now localStorage is easier for client-side
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) return token;
      
      // Fallback to cookie check to prevent redirect loops
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      if (match) return match[2];
    }
    return null;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }
};
