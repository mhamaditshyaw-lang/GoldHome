import { User } from "@shared/schema";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

class AuthManager {
  private listeners: ((state: AuthState) => void)[] = [];
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
  };

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  async login(username: string, password: string): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include' // Include cookies for session
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { user } = await response.json();
    this.state = {
      user,
      isAuthenticated: true,
    };

    // Store in localStorage for persistence
    localStorage.setItem('auth', JSON.stringify(this.state));
    this.notify();

    return user;
  }

  async logout() {
    // Trigger logout animation
    this.triggerLogoutAnimation();

    try {
      // Stop location tracking before logout
      const { locationTracker } = await import('@/services/location-tracker');
      locationTracker.stopTracking();

      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: 'include' // Include cookies for session
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.state = {
        user: null,
        isAuthenticated: false,
      };
      localStorage.removeItem('auth');
      this.notify();
    }
  }

  private logoutAnimationListeners: ((show: boolean) => void)[] = [];

  subscribeToLogoutAnimation(listener: (show: boolean) => void) {
    this.logoutAnimationListeners.push(listener);
    return () => {
      const index = this.logoutAnimationListeners.indexOf(listener);
      if (index > -1) {
        this.logoutAnimationListeners.splice(index, 1);
      }
    };
  }

  private triggerLogoutAnimation() {
    this.logoutAnimationListeners.forEach(listener => listener(true));
  }

  completeLogout() {
    // This will be called when the animation completes
    window.location.href = '/';
  }

  async initialize() {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          this.state = {
            user: data.user,
            isAuthenticated: true,
          };
          this.notify();
          return;
        } else {
          console.warn("Session check returned non-JSON response");
        }
      }

      // No valid session
      this.state = {
        user: null,
        isAuthenticated: false,
      };
    } catch (error) {
      console.error("Session check error:", error);
      this.state = {
        user: null,
        isAuthenticated: false,
      };
    }

    this.notify();
  }
}

export const authManager = new AuthManager();