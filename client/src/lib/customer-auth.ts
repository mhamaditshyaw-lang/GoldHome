export interface CustomerAuthState {
  customer: any | null;
  isAuthenticated: boolean;
}

class CustomerAuthManager {
  private listeners: ((state: CustomerAuthState) => void)[] = [];
  private state: CustomerAuthState = {
    customer: null,
    isAuthenticated: false,
  };

  getState(): CustomerAuthState {
    return this.state;
  }

  subscribe(listener: (state: CustomerAuthState) => void) {
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

  async login(identifier: string, password: string): Promise<any> {
    throw new Error('Customer authentication not implemented');
  }

  async register(data: any): Promise<any> {
    throw new Error('Customer authentication not implemented');
  }

  async logout() {
    this.state = {
      customer: null,
      isAuthenticated: false,
    };
    this.notify();
  }

  async initialize() {
    this.state = {
      customer: null,
      isAuthenticated: false,
    };
    this.notify();
  }
}

export const customerAuthManager = new CustomerAuthManager();
