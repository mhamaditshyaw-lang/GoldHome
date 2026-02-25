import { pgTable, text, serial, integer, boolean, timestamp, numeric, json, index, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("cleaner"),
  isActive: boolean("is_active").notNull().default(true),
  avatar: text("avatar"),
  dailySalary: numeric("daily_salary", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  services: json("services").$type<{ id: number, name: string, price: string, quantity: number }[]>().notNull(),
  expenses: json("expenses").$type<{ id: number, name: string, price: string }[]>(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  photos: json("photos").$type<string[]>(),
  metadata: json("metadata").$type<{ invoiceType?: string, employeeName?: string, numberOfCustomers?: string, startingTime?: string, finishingTime?: string, cleaningMaterialsOrdered?: boolean, extraTime?: string, department?: string, dailySalary?: string, remainingAmount?: string, numberOfEmployees?: string, bookingId?: number, employeeNames?: string[], employeePay?: string, materialName?: string, materialPrice?: string, employees?: { name: string, salary: string }[], employeeSalaries?: Record<string, string> }>(),
  cleanerId: integer("cleaner_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  cleanerIdIdx: index("invoices_cleaner_id_idx").on(table.cleanerId),
  statusIdx: index("invoices_status_idx").on(table.status),
  createdAtIdx: index("invoices_created_at_idx").on(table.createdAt),
  customerNameIdx: index("invoices_customer_name_idx").on(table.customerName),
}));

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  isWorking: boolean("is_working").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdIdx: index("locations_user_id_idx").on(table.userId),
}));

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: json("value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull().default("general"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  settingKey: text("setting_key").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull(),
  receipt: text("receipt"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  creditorName: text("creditor_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  category: text("category").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const debtPayments = pgTable("debt_payments", {
  id: serial("id").primaryKey(),
  debtId: integer("debt_id").references(() => debts.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  remainingBalance: numeric("remaining_balance", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  debtIdIdx: index("debt_payments_debt_id_idx").on(table.debtId),
}));

export const userSessions = pgTable('user_sessions', {
  sid: varchar('sid', { length: 255 }).primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('available'),
  condition: text('condition').notNull(),
  purchaseDate: timestamp('purchase_date'),
  lastMaintenance: timestamp('last_maintenance'),
  assignedTo: text('assigned_to'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  relatedId: integer("related_id"),
  relatedType: text("related_type"),
  metadata: json("metadata").$type<{ bookingId?: number }>(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
}));

export const invoiceSettings = pgTable("invoice_settings", {
  id: serial("id").primaryKey(),
  headerText: text("header_text"),
  footerText: text("footer_text"),
  headerImage: text("header_image"),
  footerImage: text("footer_image"),
  headerWidth: varchar("header_width", { length: 20 }).default("100"),
  headerHeight: varchar("header_height", { length: 20 }).default("80"),
  footerWidth: varchar("footer_width", { length: 20 }).default("100"),
  footerHeight: varchar("footer_height", { length: 20 }).default("60"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const cloudflareConfig = pgTable("cloudflare_config", {
  id: serial("id").primaryKey(),
  apiToken: text("api_token").notNull(),
  zoneId: text("zone_id").notNull(),
  zoneName: text("zone_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const cloudflareDnsRecords = pgTable("cloudflare_dns_records", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull().unique(),
  zoneId: text("zone_id").notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  ttl: integer("ttl").notNull().default(3600),
  proxied: boolean("proxied").notNull().default(false),
  priority: integer("priority"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  recordIdIdx: index("cloudflare_dns_records_record_id_idx").on(table.recordId),
  zoneIdIdx: index("cloudflare_dns_records_zone_id_idx").on(table.zoneId),
}));

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address").notNull(),
  location: text("location"),
  services: json("services").$type<{ id: number, name: string, price: string, quantity: number }[]>().notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  preferredDate: timestamp("preferred_date"),
  preferredTime: varchar("preferred_time", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  statusIdx: index("bookings_status_idx").on(table.status),
  assignedToIdx: index("bookings_assigned_to_idx").on(table.assignedTo),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
}).extend({
  createdAt: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(`${arg}T12:00:00Z`);
    }
    return arg;
  }, z.coerce.date().optional()),
  photos: z.array(z.string()).optional().default([]),
  services: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.string(),
    quantity: z.number().min(1),
  })),
  expenses: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.string(),
  })).optional().default([]),
  location: z.string().optional(),
  metadata: z.object({
    invoiceType: z.string().optional(),
    employeeName: z.string().optional(),
    numberOfCustomers: z.string().optional(),
    startingTime: z.string().optional(),
    finishingTime: z.string().optional(),
    cleaningMaterialsOrdered: z.boolean().optional(),
    extraTime: z.string().optional(),
    department: z.string().optional(),
    dailySalary: z.string().optional(),
    remainingAmount: z.string().optional(),
    numberOfEmployees: z.string().optional(),
    bookingId: z.number().optional(),
    employeeNames: z.array(z.string()).optional(),
    employeePay: z.string().optional(),
    materialName: z.string().optional(),
    materialPrice: z.string().optional(),
    materials: z.array(z.object({
      name: z.string(),
      price: z.string(),
    })).optional().default([]),
    employees: z.array(z.object({
      name: z.string(),
      salary: z.string(),
    })).optional(),
    employeeSalaries: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  updatedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(`${arg}T12:00:00Z`);
    }
    return arg;
  }, z.coerce.date()),
});

export const insertDebtSchema = createInsertSchema(debts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(`${arg}T12:00:00Z`);
    }
    return arg;
  }, z.coerce.date()),
});

export const insertInvoiceSettingsSchema = createInsertSchema(invoiceSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCloudflareConfigSchema = createInsertSchema(cloudflareConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCloudflareDnsRecordSchema = createInsertSchema(cloudflareDnsRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  services: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.string(),
    quantity: z.number().min(1),
  })),
  preferredDate: z.coerce.date().optional(),
  assignedTo: z.number().optional().nullable(),
});

export const usersRelations = {
  invoices: invoices,
  location: locations,
  expenses: expenses,
};

export const invoicesRelations = {
  cleaner: users,
};

export const locationsRelations = {
  user: users,
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type Debt = typeof debts.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type CustomerBooking = typeof bookings.$inferSelect;

export const insertDebtPaymentSchema = createInsertSchema(debtPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertDebtPayment = z.infer<typeof insertDebtPaymentSchema>;
export type DebtPayment = typeof debtPayments.$inferSelect;

export type InsertInvoiceSettings = z.infer<typeof insertInvoiceSettingsSchema>;
export type InvoiceSettings = typeof invoiceSettings.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type CloudflareConfig = typeof cloudflareConfig.$inferSelect;
export type InsertCloudflareConfig = z.infer<typeof insertCloudflareConfigSchema>;
export type CloudflareDnsRecord = typeof cloudflareDnsRecords.$inferSelect;
export type InsertCloudflareDnsRecord = z.infer<typeof insertCloudflareDnsRecordSchema>;
