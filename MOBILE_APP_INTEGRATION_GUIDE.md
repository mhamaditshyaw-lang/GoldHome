# Mobile App Integration Guide
**GoldHome Services - React Native Integration**

This guide provides complete React Native examples for integrating your mobile app with the GoldHome Services backend API.

---

## Table of Contents
1. [Project Setup](#project-setup)
2. [API Service Configuration](#api-service-configuration)
3. [Authentication Manager](#authentication-manager)
4. [API Service Methods](#api-service-methods)
5. [Example Screens](#example-screens)
6. [Best Practices](#best-practices)

---

## Project Setup

### 1. Install Dependencies

```bash
# Create a new React Native project (if starting fresh)
npx react-native init GoldHomeApp

# Navigate to your project
cd GoldHomeApp

# Install required dependencies
npm install axios react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-safe-area-context react-native-screens
```

### 2. Project Structure

```
src/
├── api/
│   ├── apiClient.ts          # Axios configuration
│   ├── authService.ts        # Authentication methods
│   ├── bookingService.ts     # Booking methods
│   ├── reviewService.ts      # Review methods
│   └── index.ts              # Export all services
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── screens/
│   ├── LoginScreen.tsx       # Login screen
│   ├── DashboardScreen.tsx   # Dashboard screen
│   ├── BookingScreen.tsx     # Booking list screen
│   └── ReviewScreen.tsx      # Review submission screen
├── types/
│   └── index.ts              # TypeScript types
└── utils/
    └── storage.ts            # AsyncStorage helpers
```

---

## API Service Configuration

### 1. API Client Setup (`src/api/apiClient.ts`)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - Replace with your backend URL
const API_BASE_URL = 'https://malialtwni.com/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    // Get auth token if using token-based auth
    const token = await AsyncStorage.getItem('authToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    console.error(`❌ API Error: ${error.config?.url} - ${status}`);

    // Handle 401 Unauthorized - redirect to login
    if (status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // You can trigger navigation to login here
    }

    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
```

---

## Authentication Manager

### 1. TypeScript Types (`src/types/index.ts`)

```typescript
// User Types
export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'supervisor' | 'cleaner' | 'customer';
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

// Booking Types
export interface Booking {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  area: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  services: BookingService[];
  totalCost: string;
  assignedCleanerId?: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface BookingService {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

export interface CreateBookingPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  area: string;
  preferredDate: string;
  preferredTime: string;
  services: { serviceId: number; quantity: number }[];
  notes?: string;
  latitude?: number;
  longitude?: number;
}

// Review Types
export interface Review {
  id: number;
  bookingId: number;
  customerId: number;
  cleanerId?: number;
  serviceRating: number;
  cleanerRating: number;
  comment: string;
  photos: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewPayload {
  bookingId: number;
  cleanerId?: number;
  serviceRating: number;
  cleanerRating: number;
  comment: string;
  photos: string[];
}

// Service Types
export interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  duration: string;
  imageUrl?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  monthlyExpenses: number;
  jobsCompleted: number;
  activeCleaners: number;
  workingNow: number;
  totalDebt: number;
  totalEmployeeSalary: number;
  averageRating: number;
}
```

### 2. Storage Helpers (`src/utils/storage.ts`)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const StorageKeys = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  REMEMBER_ME: 'rememberMe',
};

export const storage = {
  // Save user data
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  // Get user data
  async getUser(): Promise<User | null> {
    try {
      const user = await AsyncStorage.getItem(StorageKeys.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Save auth token
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageKeys.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  // Get auth token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(StorageKeys.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([StorageKeys.AUTH_TOKEN, StorageKeys.USER]);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  },
};
```

### 3. Auth Context (`src/contexts/AuthContext.tsx`)

```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../utils/storage';
import { authService } from '../api/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on app start
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsLoading(true);
    try {
      const savedUser = await storage.getUser();
      if (savedUser) {
        // Verify session with backend
        const sessionData = await authService.checkSession();
        if (sessionData.isAuthenticated) {
          setUser(sessionData.user);
        } else {
          await storage.clearAuth();
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      await storage.clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });
      setUser(response.user);
      await storage.saveUser(response.user);
      console.log('✅ Login successful:', response.user.name);
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      await storage.clearAuth();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## API Service Methods

### 1. Auth Service (`src/api/authService.ts`)

```typescript
import apiClient from './apiClient';
import { LoginCredentials, AuthResponse, User } from '../types';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Check session
  async checkSession(): Promise<{ user: User; isAuthenticated: boolean }> {
    const response = await apiClient.get('/auth/session');
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
```

### 2. Booking Service (`src/api/bookingService.ts`)

```typescript
import apiClient from './apiClient';
import { Booking, CreateBookingPayload } from '../types';

export const bookingService = {
  // Get all bookings
  async getAllBookings(): Promise<Booking[]> {
    const response = await apiClient.get<Booking[]>('/customer/bookings');
    return response.data;
  },

  // Create booking
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const response = await apiClient.post<Booking>('/customer/bookings', payload);
    return response.data;
  },

  // Update booking
  async updateBooking(
    id: number,
    updates: Partial<Booking>
  ): Promise<Booking> {
    const response = await apiClient.patch<Booking>(
      `/customer/bookings/${id}`,
      updates
    );
    return response.data;
  },

  // Get booking by ID
  async getBookingById(id: number): Promise<Booking> {
    const response = await apiClient.get<Booking>(`/customer/bookings/${id}`);
    return response.data;
  },
};
```

### 3. Review Service (`src/api/reviewService.ts`)

```typescript
import apiClient from './apiClient';
import { Review, CreateReviewPayload } from '../types';

interface ReviewResponse {
  success: boolean;
  reviewId?: number;
  review?: Review;
  error?: string;
  message?: string;
}

interface ReviewsListResponse {
  success: boolean;
  total: number;
  reviews: Review[];
  averageServiceRating: number;
  averageCleanerRating: number;
}

export const reviewService = {
  // Submit review
  async submitReview(payload: CreateReviewPayload): Promise<ReviewResponse> {
    const response = await apiClient.post<ReviewResponse>('/reviews', payload);
    return response.data;
  },

  // Get reviews for a cleaner
  async getCleanerReviews(
    cleanerId: number,
    limit = 20,
    offset = 0
  ): Promise<ReviewsListResponse> {
    const response = await apiClient.get<ReviewsListResponse>(
      `/reviews?cleanerId=${cleanerId}&limit=${limit}&offset=${offset}`
    );
    return response.data;
  },

  // Get review for a booking
  async getBookingReview(bookingId: number): Promise<Review | null> {
    try {
      const response = await apiClient.get<{ success: boolean; review: Review }>(
        `/reviews?bookingId=${bookingId}`
      );
      return response.data.review;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Update review
  async updateReview(
    id: number,
    updates: Partial<CreateReviewPayload>
  ): Promise<ReviewResponse> {
    const response = await apiClient.patch<ReviewResponse>(`/reviews/${id}`, updates);
    return response.data;
  },

  // Delete review
  async deleteReview(id: number): Promise<ReviewResponse> {
    const response = await apiClient.delete<ReviewResponse>(`/reviews/${id}`);
    return response.data;
  },
};
```

### 4. Service Methods (`src/api/serviceService.ts`)

```typescript
import apiClient from './apiClient';
import { Service } from '../types';

export const serviceService = {
  // Get all services
  async getAllServices(): Promise<Service[]> {
    const response = await apiClient.get<Service[]>('/services');
    return response.data;
  },

  // Get service by ID
  async getServiceById(id: number): Promise<Service> {
    const response = await apiClient.get<Service>(`/services/${id}`);
    return response.data;
  },
};
```

### 5. Dashboard Service (`src/api/dashboardService.ts`)

```typescript
import apiClient from './apiClient';
import { DashboardStats } from '../types';

export const dashboardService = {
  // Get dashboard stats
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};
```

### 6. Export All Services (`src/api/index.ts`)

```typescript
export { authService } from './authService';
export { bookingService } from './bookingService';
export { reviewService } from './reviewService';
export { serviceService } from './serviceService';
export { dashboardService } from './dashboardService';
export { default as apiClient, API_BASE_URL } from './apiClient';
```

---

## Example Screens

### 1. Login Screen (`src/screens/LoginScreen.tsx`)

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      await login(username, password);
      // Navigation will be handled automatically by auth state change
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>GoldHome Services</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LoginScreen;
```

### 2. Dashboard Screen (`src/screens/DashboardScreen.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../api';
import { DashboardStats } from '../types';

const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Revenue"
            value={`$${stats?.totalRevenue.toFixed(2) || '0.00'}`}
            color="#4CAF50"
          />
          <StatCard
            title="Total Expenses"
            value={`$${stats?.totalExpenses.toFixed(2) || '0.00'}`}
            color="#F44336"
          />
          <StatCard
            title="Jobs Completed"
            value={stats?.jobsCompleted.toString() || '0'}
            color="#2196F3"
          />
          <StatCard
            title="Average Rating"
            value={stats?.averageRating.toFixed(1) || '0.0'}
            color="#FF9800"
          />
          <StatCard
            title="Active Cleaners"
            value={stats?.activeCleaners.toString() || '0'}
            color="#9C27B0"
          />
          <StatCard
            title="Working Now"
            value={stats?.workingNow.toString() || '0'}
            color="#00BCD4"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Bookings')}
          >
            <Text style={styles.actionButtonText}>View Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Services')}
          >
            <Text style={styles.actionButtonText}>Browse Services</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Stat Card Component
const StatCard = ({ title, value, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
```

### 3. Bookings Screen (`src/screens/BookingScreen.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { bookingService } from '../api';
import { Booking } from '../types';

const BookingScreen = ({ navigation }: any) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#2196F3';
      case 'in_progress':
        return '#9C27B0';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation.navigate('BookingDetails', { booking: item })}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.bookingDetail}>📍 {item.customerAddress}</Text>
      <Text style={styles.bookingDetail}>📅 {item.preferredDate}</Text>
      <Text style={styles.bookingDetail}>🕐 {item.preferredTime}</Text>
      <Text style={styles.bookingDetail}>💰 ${item.totalCost}</Text>

      {item.services && item.services.length > 0 && (
        <View style={styles.servicesContainer}>
          <Text style={styles.servicesLabel}>Services:</Text>
          {item.services.map((service, index) => (
            <Text key={index} style={styles.serviceItem}>
              • {service.name} (x{service.quantity})
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  servicesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceItem: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default BookingScreen;
```

### 4. Review Screen (`src/screens/ReviewScreen.tsx`)

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { reviewService } from '../api';

interface ReviewScreenProps {
  route: {
    params: {
      bookingId: number;
      cleanerId: number;
    };
  };
  navigation: any;
}

const ReviewScreen = ({ route, navigation }: ReviewScreenProps) => {
  const { bookingId, cleanerId } = route.params;

  const [serviceRating, setServiceRating] = useState(0);
  const [cleanerRating, setCleanerRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (serviceRating === 0 || cleanerRating === 0) {
      Alert.alert('Error', 'Please provide both service and cleaner ratings');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await reviewService.submitReview({
        bookingId,
        cleanerId,
        serviceRating,
        cleanerRating,
        comment,
        photos: [], // Add photo functionality as needed
      });

      if (response.success) {
        Alert.alert('Success', 'Thank you for your review!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to submit review');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit review'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    rating: number,
    setRating: (rating: number) => void,
    label: string
  ) => (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            disabled={isSubmitting}
          >
            <Text style={styles.star}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
      </View>

      <View style={styles.content}>
        {renderStars(serviceRating, setServiceRating, 'Overall Service')}
        {renderStars(cleanerRating, setCleanerRating, 'Cleaner Performance')}

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Your Feedback (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={styles.characterCount}>
            {comment.length}/1000
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || serviceRating === 0 || cleanerRating === 0) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || serviceRating === 0 || cleanerRating === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  ratingSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  star: {
    fontSize: 36,
    marginHorizontal: 4,
  },
  commentSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ReviewScreen;
```

---

## Best Practices

### 1. Error Handling

```typescript
// Centralized error handler
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.error || error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

// Usage in component
try {
  await bookingService.createBooking(data);
} catch (error) {
  Alert.alert('Error', handleApiError(error));
}
```

### 2. Loading States

```typescript
// Use loading states for better UX
const [isLoading, setIsLoading] = useState(false);

const fetchData = async () => {
  setIsLoading(true);
  try {
    const data = await apiService.getData();
    // Handle data
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false); // Always reset loading state
  }
};
```

### 3. Retry Logic

```typescript
// Retry failed requests
const retryRequest = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
};
```

### 4. Caching Strategy

```typescript
// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = async <T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

### 5. Optimistic Updates

```typescript
// Update UI immediately, rollback on error
const optimisticUpdate = async () => {
  const previousData = [...bookings];
  
  // Update UI immediately
  setBookings([...bookings, newBooking]);
  
  try {
    await bookingService.createBooking(newBooking);
  } catch (error) {
    // Rollback on error
    setBookings(previousData);
    Alert.alert('Error', 'Failed to create booking');
  }
};
```

### 6. Request Cancellation

```typescript
import { useEffect, useRef } from 'react';
import axios from 'axios';

// Cancel requests on component unmount
const useCancelToken = () => {
  const cancelTokenSource = useRef(axios.CancelToken.source());
  
  useEffect(() => {
    return () => {
      cancelTokenSource.current.cancel('Component unmounted');
    };
  }, []);
  
  return cancelTokenSource.current;
};
```

### 7. Environment Configuration

```typescript
// config.ts
export const config = {
  apiUrl: __DEV__ 
    ? 'http://localhost:3000/api'  // Development
    : 'https://malialtwni.com/api', // Production
  timeout: 30000,
  enableLogging: __DEV__,
};
```

---

## App.tsx Integration

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BookingScreen from './src/screens/BookingScreen';
import ReviewScreen from './src/screens/ReviewScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or return a splash screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Bookings" component={BookingScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
```

---

## Testing

### Example Test for Auth Service

```typescript
import { authService } from '../api/authService';
import apiClient from '../api/apiClient';

jest.mock('../api/apiClient');

describe('AuthService', () => {
  it('should login successfully', async () => {
    const mockUser = { id: 1, username: 'test', name: 'Test User', role: 'customer' };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { user: mockUser } });

    const result = await authService.login({ username: 'test', password: 'password' });
    
    expect(result.user).toEqual(mockUser);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      username: 'test',
      password: 'password',
    });
  });
});
```

---

## Next Steps

1. **Clone this structure** into your React Native project
2. **Update API_BASE_URL** in `apiClient.ts` with your backend URL
3. **Install dependencies** as listed in the setup section
4. **Test authentication** with the login screen
5. **Customize UI** to match your brand
6. **Add more screens** as needed (Services, Profile, etc.)
7. **Implement push notifications** for booking updates
8. **Add offline support** with AsyncStorage caching

## Support

For questions or issues, refer to the main API documentation at `MOBILE_API_DOCUMENTATION.md`.
