import {
  users, services, invoices, locations, settings, userSettings, expenses, equipment, notifications, invoiceSettings,
  type User, type Service, type Invoice, type Location, type Settings,
  type InsertUser, type InsertService, type InsertInvoice, type InsertLocation,
  type InsertSettings, type UserSettings, type InsertUserSettings, type Expense,
  type InsertExpense, type Notification, type InsertNotification,
  type InvoiceSettings, type InsertInvoiceSettings,
  debts, debtPayments, type Debt, type InsertDebt,
  cloudflareConfig, cloudflareDnsRecords, type CloudflareConfig, type InsertCloudflareConfig, type CloudflareDnsRecord, type InsertCloudflareDnsRecord,
  bookings, type CustomerBooking, type InsertBooking
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, inArray, sql } from "drizzle-orm";

// Add query result caching for frequently accessed data
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResult(key: string) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedResult(key: string, data: any) {
  queryCache.set(key, { data, timestamp: Date.now() });
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Services
  createService(service: InsertService): Promise<Service>;
  getServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  updateService(id: number, updates: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<void>;

  // Invoices
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByUser(userId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<void>;

  // Locations
  updateUserLocation(location: InsertLocation): Promise<Location>;
  getUserLocation(userId: number): Promise<Location | undefined>;
  getActiveLocations(): Promise<Location[]>;
  getLocationHistory(filters: {
    startDate?: string;
    endDate?: string;
    userId?: number;
    search?: string;
  }): Promise<Location[]>;

  // Settings
  getAllSettings(): Promise<Settings[]>;
  getSetting(key: string): Promise<Settings | undefined>;
  updateSetting(key: string, value: any): Promise<Settings>;
  createSetting(setting: InsertSettings): Promise<Settings>;

  // User-specific settings
  getUserSettings(userId: number): Promise<UserSettings[]>;
  getUserSetting(userId: number, settingKey: string): Promise<UserSettings | undefined>;
  setUserSetting(userSetting: InsertUserSettings): Promise<UserSettings>;
  deleteUserSetting(userId: number, settingKey: string): Promise<void>;

  // Invoice settings
  getInvoiceSettings(): Promise<InvoiceSettings | undefined>;
  updateInvoiceSettings(settings: InsertInvoiceSettings): Promise<InvoiceSettings>;
  createInvoiceSettings(settings: InsertInvoiceSettings): Promise<InvoiceSettings>;

  // Expenses
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpense(id: number): Promise<Expense | undefined>;
  getExpensesByUser(userId: number): Promise<Expense[]>;
  getExpenses(): Promise<Expense[]>;
  getAllExpenses(): Promise<Expense[]>;
  updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;

  // Debts
  createDebt(debt: InsertDebt): Promise<Debt>;
  getDebt(id: number): Promise<Debt | undefined>;
  getDebtsByUser(userId: number): Promise<Debt[]>;
  getDebts(): Promise<Debt[]>;
  getAllDebts(): Promise<Debt[]>;
  updateDebt(id: number, updates: Partial<Debt>): Promise<Debt | undefined>;
  deleteDebt(id: number): Promise<void>;

  // Debt payment history
  createDebtPayment(payment: { debtId: number; amount: string; remainingBalance: string; notes?: string }): Promise<any>;
  getDebtPayments(debtId: number): Promise<any[]>;
  getAllDebtPayments(userId?: number): Promise<any[]>;

  // Equipment management
  createEquipment(equipment: any): Promise<any>;
  getEquipment(): Promise<any[]>;
  getAllEquipment(): Promise<any[]>;
  updateEquipment(id: number, updates: any): Promise<any>;
  deleteEquipment(id: number): Promise<void>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number, userId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number, userId: number): Promise<void>;

  // Cloudflare Configuration
  createCloudflareConfig(config: InsertCloudflareConfig): Promise<CloudflareConfig>;
  getCloudflareConfig(): Promise<CloudflareConfig | undefined>;
  updateCloudflareConfig(id: number, updates: Partial<CloudflareConfig>): Promise<CloudflareConfig | undefined>;
  deleteCloudflareConfig(id: number): Promise<void>;

  // Cloudflare DNS Records
  createDnsRecord(record: InsertCloudflareDnsRecord): Promise<CloudflareDnsRecord>;
  getAllDnsRecords(): Promise<CloudflareDnsRecord[]>;
  getDnsRecord(recordId: string): Promise<CloudflareDnsRecord | undefined>;
  updateDnsRecord(recordId: string, updates: Partial<CloudflareDnsRecord>): Promise<CloudflareDnsRecord | undefined>;
  deleteDnsRecord(recordId: string): Promise<void>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<CustomerBooking>;
  getBookings(): Promise<CustomerBooking[]>;
  getBooking(id: number): Promise<CustomerBooking | undefined>;
  getBookingsByUser(userId: number): Promise<CustomerBooking[]>;
  updateBooking(id: number, updates: Partial<CustomerBooking>): Promise<CustomerBooking | undefined>;
  deleteBooking(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    try {
      const cacheKey = `user:${id}`;
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;

      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (user) setCachedResult(cacheKey, user);
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      // Invalidate the 'all:users' cache immediately
      queryCache.delete('all:users');
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const cacheKey = 'all:users';
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;

      const allUsers = await db.select().from(users);
      setCachedResult(cacheKey, allUsers);
      return allUsers;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      // Invalidate caches
      queryCache.delete('all:users');
      queryCache.delete(`user:${id}`);
      return updatedUser || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, id));
      // Invalidate caches
      queryCache.delete('all:users');
      queryCache.delete(`user:${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Services
  async createService(service: InsertService): Promise<Service> {
    try {
      const [newService] = await db.insert(services).values(service).returning();
      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      return await db.select().from(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async getActiveServices(): Promise<Service[]> {
    try {
      return await db.select().from(services).where(eq(services.isActive, true));
    } catch (error) {
      console.error('Error fetching active services:', error);
      return [];
    }
  }

  async getService(id: number): Promise<Service | undefined> {
    try {
      const [service] = await db.select().from(services).where(eq(services.id, id));
      return service || undefined;
    } catch (error) {
      console.error('Error fetching service:', error);
      return undefined;
    }
  }

  // New method to get service by ID
  async getServiceById(id: number): Promise<Service | undefined> {
    try {
      const [service] = await db.select().from(services).where(eq(services.id, id));
      return service || undefined;
    } catch (error) {
      console.error('Error fetching service by ID:', error);
      return undefined;
    }
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    try {
      const [updatedService] = await db
        .update(services)
        .set(updates)
        .where(eq(services.id, id))
        .returning();
      return updatedService || undefined;
    } catch (error) {
      console.error('Error updating service:', error);
      return undefined;
    }
  }

  async deleteService(id: number): Promise<void> {
    try {
      await db.delete(services).where(eq(services.id, id));
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // Invoices
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const [newInvoice] = await db.insert(invoices).values(invoice).returning();
      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async getInvoicesByUser(userId: number): Promise<Invoice[]> {
    try {
      return await db.select().from(invoices).where(eq(invoices.cleanerId, userId)).orderBy(desc(invoices.createdAt));
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      return [];
    }
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      return invoice || undefined;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return undefined;
    }
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      const [updatedInvoice] = await db
        .update(invoices)
        .set(updates)
        .where(eq(invoices.id, id))
        .returning();
      return updatedInvoice || undefined;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return undefined;
    }
  }

  async deleteInvoice(id: number): Promise<void> {
    try {
      await db.delete(invoices).where(eq(invoices.id, id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Locations
  async updateUserLocation(location: InsertLocation): Promise<Location> {
    try {
      // Check if user already has a location record
      const existingLocation = await this.getUserLocation(location.userId);

      if (existingLocation) {
        // Update existing location
        const [updatedLocation] = await db
          .update(locations)
          .set({
            latitude: location.latitude,
            longitude: location.longitude,
            isWorking: location.isWorking,
            updatedAt: new Date()
          })
          .where(eq(locations.userId, location.userId))
          .returning();
        return updatedLocation;
      } else {
        // Create new location record
        const [newLocation] = await db.insert(locations).values(location).returning();
        return newLocation;
      }
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }

  async getUserLocation(userId: number): Promise<Location | undefined> {
    try {
      const [location] = await db.select().from(locations).where(eq(locations.userId, userId));
      return location || undefined;
    } catch (error) {
      console.error('Error fetching user location:', error);
      return undefined;
    }
  }

  async getActiveLocations(): Promise<Location[]> {
    try {
      return await db.select().from(locations).where(eq(locations.isWorking, true));
    } catch (error) {
      console.error('Error fetching active locations:', error);
      return [];
    }
  }

  async getLocationHistory(filters: {
    startDate?: string;
    endDate?: string;
    userId?: number;
    search?: string;
  }): Promise<Location[]> {
    try {
      let query = db.select().from(locations);

      const conditions = [];

      if (filters.startDate) {
        conditions.push(gte(locations.updatedAt, new Date(filters.startDate)));
      }

      if (filters.endDate) {
        conditions.push(lte(locations.updatedAt, new Date(filters.endDate)));
      }

      if (filters.userId) {
        conditions.push(eq(locations.userId, filters.userId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await query.orderBy(desc(locations.updatedAt));
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }

  // Settings
  async getAllSettings(): Promise<Settings[]> {
    try {
      return await db.select().from(settings);
    } catch (error) {
      console.error('Error fetching all settings:', error);
      return [];
    }
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    try {
      const [setting] = await db.select().from(settings).where(eq(settings.key, key));
      return setting || undefined;
    } catch (error) {
      console.error('Error fetching setting:', error);
      return undefined;
    }
  }

  async updateSetting(key: string, value: any): Promise<Settings> {
    try {
      const existing = await this.getSetting(key);

      if (existing) {
        // Update existing setting
        const [updated] = await db
          .update(settings)
          .set({ value, updatedAt: new Date() })
          .where(eq(settings.key, key))
          .returning();
        return updated;
      } else {
        // Create new setting
        const [newSetting] = await db
          .insert(settings)
          .values({ key, value })
          .returning();
        return newSetting;
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  async createSetting(setting: InsertSettings): Promise<Settings> {
    try {
      const [newSetting] = await db.insert(settings).values(setting).returning();
      return newSetting;
    } catch (error) {
      console.error('Error creating setting:', error);
      throw error;
    }
  }

  // User Settings
  async getUserSettings(userId: number): Promise<UserSettings[]> {
    try {
      return await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return [];
    }
  }

  async getUserSetting(userId: number, settingKey: string): Promise<UserSettings | undefined> {
    try {
      const [setting] = await db
        .select()
        .from(userSettings)
        .where(and(eq(userSettings.userId, userId), eq(userSettings.settingKey, settingKey)));
      return setting || undefined;
    } catch (error) {
      console.error('Error fetching user setting:', error);
      return undefined;
    }
  }

  async setUserSetting(userSetting: InsertUserSettings): Promise<UserSettings> {
    try {
      const existing = await this.getUserSetting(userSetting.userId, userSetting.settingKey);

      if (existing) {
        // Update existing setting
        const [updated] = await db
          .update(userSettings)
          .set({ isEnabled: userSetting.isEnabled, updatedAt: new Date() })
          .where(and(
            eq(userSettings.userId, userSetting.userId),
            eq(userSettings.settingKey, userSetting.settingKey)
          ))
          .returning();
        return updated;
      } else {
        // Create new setting
        const [newSetting] = await db
          .insert(userSettings)
          .values(userSetting)
          .returning();
        return newSetting;
      }
    } catch (error) {
      console.error('Error setting user setting:', error);
      throw error;
    }
  }

  async deleteUserSetting(userId: number, settingKey: string): Promise<void> {
    try {
      await db
        .delete(userSettings)
        .where(and(eq(userSettings.userId, userId), eq(userSettings.settingKey, settingKey)));
    } catch (error) {
      console.error('Error deleting user setting:', error);
      throw error;
    }
  }

  // Expenses
  async createExpense(expense: InsertExpense): Promise<Expense> {
    try {
      const [newExpense] = await db.insert(expenses).values(expense).returning();
      return newExpense;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
      return expense || undefined;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return undefined;
    }
  }

  async getExpensesByUser(userId: number): Promise<Expense[]> {
    try {
      return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date));
    } catch (error) {
      console.error('Error fetching user expenses:', error);
      return [];
    }
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      return await db.select().from(expenses).orderBy(desc(expenses.date));
    } catch (error) {
      console.error('Error fetching all expenses:', error);
      return [];
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    return this.getExpenses();
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    try {
      const [updatedExpense] = await db
        .update(expenses)
        .set(updates)
        .where(eq(expenses.id, id))
        .returning();
      return updatedExpense || undefined;
    } catch (error) {
      console.error('Error updating expense:', error);
      return undefined;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    try {
      await db.delete(expenses).where(eq(expenses.id, id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Debts
  async createDebt(debt: InsertDebt): Promise<Debt> {
    try {
      const [newDebt] = await db.insert(debts).values(debt).returning();
      return newDebt;
    } catch (error) {
      console.error('Error creating debt:', error);
      throw error;
    }
  }

  async getDebt(id: number): Promise<Debt | undefined> {
    try {
      const [debt] = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
      return debt || undefined;
    } catch (error) {
      console.error('Error fetching debt:', error);
      return undefined;
    }
  }

  async getDebtsByUser(userId: number): Promise<Debt[]> {
    try {
      return await db.select().from(debts).where(eq(debts.userId, userId)).orderBy(desc(debts.dueDate));
    } catch (error) {
      console.error('Error fetching user debts:', error);
      return [];
    }
  }

  async getDebts(): Promise<Debt[]> {
    try {
      return await db.select().from(debts).orderBy(desc(debts.dueDate));
    } catch (error) {
      console.error('Error fetching all debts:', error);
      return [];
    }
  }

  async getAllDebts(): Promise<Debt[]> {
    return this.getDebts();
  }

  async updateDebt(id: number, updates: Partial<Debt>): Promise<Debt | undefined> {
    try {
      const [updatedDebt] = await db
        .update(debts)
        .set(updates)
        .where(eq(debts.id, id))
        .returning();
      return updatedDebt || undefined;
    } catch (error) {
      console.error('Error updating debt:', error);
      return undefined;
    }
  }

  async deleteDebt(id: number): Promise<void> {
    try {
      await db.delete(debts).where(eq(debts.id, id));
    } catch (error) {
      console.error('Error deleting debt:', error);
      throw error;
    }
  }

  async createDebtPayment(payment: { debtId: number; amount: string; remainingBalance: string; notes?: string }): Promise<any> {
    try {
      const [newPayment] = await db
        .insert(debtPayments)
        .values({
          debtId: payment.debtId,
          amount: payment.amount,
          remainingBalance: payment.remainingBalance,
          notes: payment.notes || null,
        })
        .returning();
      return newPayment;
    } catch (error) {
      console.error('Storage: Error creating debt payment:', error);
      throw error;
    }
  }

  async getDebtPayments(debtId: number): Promise<any[]> {
    try {
      const payments = await db
        .select()
        .from(debtPayments)
        .where(eq(debtPayments.debtId, debtId))
        .orderBy(desc(debtPayments.createdAt));
      return payments;
    } catch (error) {
      console.error('Storage: Error fetching debt payments:', error);
      throw error;
    }
  }

  async getAllDebtPayments(userId?: number): Promise<any[]> {
    try {
      if (userId) {
        const userDebts = await db
          .select()
          .from(debts)
          .where(eq(debts.userId, userId));

        const debtIds = userDebts.map(debt => debt.id);

        if (debtIds.length === 0) {
          return [];
        }

        const payments = await db
          .select({
            id: debtPayments.id,
            debtId: debtPayments.debtId,
            amount: debtPayments.amount,
            remainingBalance: debtPayments.remainingBalance,
            notes: debtPayments.notes,
            createdAt: debtPayments.createdAt,
            creditorName: debts.creditorName,
            category: debts.category,
          })
          .from(debtPayments)
          .leftJoin(debts, eq(debtPayments.debtId, debts.id))
          .where(sql`${debtPayments.debtId} IN (${sql.join(debtIds.map(id => sql`${id}`), sql`, `)})`)
          .orderBy(desc(debtPayments.createdAt));

        return payments;
      } else {
        const payments = await db
          .select({
            id: debtPayments.id,
            debtId: debtPayments.debtId,
            amount: debtPayments.amount,
            remainingBalance: debtPayments.remainingBalance,
            notes: debtPayments.notes,
            createdAt: debtPayments.createdAt,
            creditorName: debts.creditorName,
            category: debts.category,
          })
          .from(debtPayments)
          .leftJoin(debts, eq(debtPayments.debtId, debts.id))
          .orderBy(desc(debtPayments.createdAt));

        return payments;
      }
    } catch (error) {
      console.error('Storage: Error fetching all debt payments:', error);
      throw error;
    }
  }

  // Equipment management
  async createEquipment(equipmentData: any): Promise<any> {
    try {
      const [newEquipment] = await db.insert(equipment).values(equipmentData).returning();
      return newEquipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  }

  async getEquipment(): Promise<any[]> {
    try {
      return await db.select().from(equipment).orderBy(desc(equipment.createdAt));
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  }

  async getAllEquipment(): Promise<any[]> {
    return this.getEquipment();
  }

  async updateEquipment(id: number, updates: any): Promise<any> {
    try {
      const [updatedEquipment] = await db
        .update(equipment)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(equipment.id, id))
        .returning();
      return updatedEquipment;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  async deleteEquipment(id: number): Promise<void> {
    try {
      await db.delete(equipment).where(eq(equipment.id, id));
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const [newNotification] = await db.insert(notifications).values(notification as any).returning();
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    const results = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return results;
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      return await db.select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(id: number, userId: number): Promise<void> {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: number, userId: number): Promise<void> {
    try {
      await db.delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Invoice settings methods
  async getInvoiceSettings(): Promise<InvoiceSettings | undefined> {
    try {
      const [settings] = await db.select().from(invoiceSettings).limit(1);
      return settings || undefined;
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
      return undefined;
    }
  }

  async createInvoiceSettings(settings: InsertInvoiceSettings): Promise<InvoiceSettings> {
    try {
      const [newSettings] = await db
        .insert(invoiceSettings)
        .values(settings)
        .returning();
      return newSettings;
    } catch (error) {
      console.error('Error creating invoice settings:', error);
      throw error;
    }
  }

  async updateInvoiceSettings(settings: InsertInvoiceSettings): Promise<InvoiceSettings> {
    try {
      // Check if settings exist
      const existingSettings = await this.getInvoiceSettings();

      if (existingSettings) {
        // Update existing settings
        const [updatedSettings] = await db
          .update(invoiceSettings)
          .set({ ...settings, updatedAt: new Date() })
          .where(eq(invoiceSettings.id, existingSettings.id))
          .returning();
        return updatedSettings;
      } else {
        // Create new settings if none exist
        return await this.createInvoiceSettings(settings);
      }
    } catch (error) {
      console.error('Error updating invoice settings:', error);
      throw error;
    }
  }

  // Cloudflare Configuration methods
  async createCloudflareConfig(config: InsertCloudflareConfig): Promise<CloudflareConfig> {
    try {
      const [newConfig] = await db.insert(cloudflareConfig).values(config).returning();
      return newConfig;
    } catch (error) {
      console.error('Error creating Cloudflare config:', error);
      throw error;
    }
  }

  async getCloudflareConfig(): Promise<CloudflareConfig | undefined> {
    try {
      const [config] = await db.select().from(cloudflareConfig).where(eq(cloudflareConfig.isActive, true)).limit(1);
      return config || undefined;
    } catch (error) {
      console.error('Error fetching Cloudflare config:', error);
      return undefined;
    }
  }

  async updateCloudflareConfig(id: number, updates: Partial<CloudflareConfig>): Promise<CloudflareConfig | undefined> {
    try {
      const [updatedConfig] = await db
        .update(cloudflareConfig)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(cloudflareConfig.id, id))
        .returning();
      return updatedConfig || undefined;
    } catch (error) {
      console.error('Error updating Cloudflare config:', error);
      return undefined;
    }
  }

  async deleteCloudflareConfig(id: number): Promise<void> {
    try {
      await db.delete(cloudflareConfig).where(eq(cloudflareConfig.id, id));
    } catch (error) {
      console.error('Error deleting Cloudflare config:', error);
      throw error;
    }
  }

  // Cloudflare DNS Records methods
  async createDnsRecord(record: InsertCloudflareDnsRecord): Promise<CloudflareDnsRecord> {
    try {
      const [newRecord] = await db.insert(cloudflareDnsRecords).values(record).returning();
      return newRecord;
    } catch (error) {
      console.error('Error creating DNS record:', error);
      throw error;
    }
  }

  async getAllDnsRecords(): Promise<CloudflareDnsRecord[]> {
    try {
      return await db.select().from(cloudflareDnsRecords).orderBy(desc(cloudflareDnsRecords.createdAt));
    } catch (error) {
      console.error('Error fetching DNS records:', error);
      return [];
    }
  }

  async getDnsRecord(recordId: string): Promise<CloudflareDnsRecord | undefined> {
    try {
      const [record] = await db.select().from(cloudflareDnsRecords).where(eq(cloudflareDnsRecords.recordId, recordId));
      return record || undefined;
    } catch (error) {
      console.error('Error fetching DNS record:', error);
      return undefined;
    }
  }

  async updateDnsRecord(recordId: string, updates: Partial<CloudflareDnsRecord>): Promise<CloudflareDnsRecord | undefined> {
    try {
      const [updatedRecord] = await db
        .update(cloudflareDnsRecords)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(cloudflareDnsRecords.recordId, recordId))
        .returning();
      return updatedRecord || undefined;
    } catch (error) {
      console.error('Error updating DNS record:', error);
      return undefined;
    }
  }

  async deleteDnsRecord(recordId: string): Promise<void> {
    try {
      await db.delete(cloudflareDnsRecords).where(eq(cloudflareDnsRecords.recordId, recordId));
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      throw error;
    }
  }

  // Bookings
  async createBooking(booking: InsertBooking): Promise<CustomerBooking> {
    try {
      const [newBooking] = await db.insert(bookings).values(booking).returning();
      return newBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getBookings(): Promise<CustomerBooking[]> {
    try {
      return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  async getBooking(id: number): Promise<CustomerBooking | undefined> {
    try {
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
      return booking || undefined;
    } catch (error) {
      console.error('Error fetching booking:', error);
      return undefined;
    }
  }

  async getBookingsByUser(userId: number): Promise<CustomerBooking[]> {
    try {
      return await db.select().from(bookings).where(eq(bookings.assignedTo, userId)).orderBy(desc(bookings.createdAt));
    } catch (error) {
      console.error('Error fetching bookings for user:', error);
      return [];
    }
  }

  async updateBooking(id: number, updates: Partial<CustomerBooking>): Promise<CustomerBooking | undefined> {
    try {
      const [updatedBooking] = await db.update(bookings).set({ ...updates, updatedAt: new Date() }).where(eq(bookings.id, id)).returning();
      return updatedBooking || undefined;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  async deleteBooking(id: number): Promise<void> {
    try {
      await db.delete(bookings).where(eq(bookings.id, id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();