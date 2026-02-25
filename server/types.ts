import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      customer?: any;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    customerId?: number;
  }
}

export {};