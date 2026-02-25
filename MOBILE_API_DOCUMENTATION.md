# Mobile App API Documentation

## Base URL
```
https://your-domain.com/api
```

## Authentication

### 1. Login
**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate a user and create a session

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "name": "John Doe",
    "role": "cleaner",
    "email": "john@example.com",
    "phone": "+1234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Missing credentials
- `401`: Invalid credentials or inactive account
- `500`: Server error

---

### 2. Check Session
**Endpoint:** `GET /api/auth/session`

**Description:** Validate current session

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "name": "John Doe",
    "role": "cleaner"
  },
  "isAuthenticated": true
}
```

---

### 3. Logout
**Endpoint:** `POST /api/auth/logout`

**Description:** Destroy the current session

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Invoices

### 1. Get All Invoices
**Endpoint:** `GET /api/invoices`

**Description:** Get all invoices (filtered by user role)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "customerName": "ABC Company",
    "totalAmount": "500.00",
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "cleanerId": 1,
    "services": [
      {
        "id": 1,
        "name": "Deep Cleaning",
        "price": "500.00",
        "quantity": 1
      }
    ],
    "metadata": {
      "invoiceType": "daily",
      "employeeName": "John Doe",
      "numberOfCustomers": "5",
      "dailySalary": "100.00"
    }
  }
]
```

---

### 2. Create Invoice (Daily)
**Endpoint:** `POST /api/invoices`

**Description:** Create a new daily employee invoice

**Request Body:**
```json
{
  "type": "daily",
  "customerName": "ABC Company",
  "address": "123 Main St",
  "flatNumber": "Apt 4B",
  "numberOfCustomers": "5",
  "employeeName": "John Doe",
  "date": "2024-01-01",
  "startingTime": "09:00",
  "finishingTime": "17:00",
  "dailySalary": "100.00",
  "taxiFare": "10.00",
  "department": "Sales",
  "extraTime": "2",
  "cleaningMaterialsOrdered": true,
  "materials": [
    {
      "name": "Detergent",
      "price": "15.00"
    },
    {
      "name": "Mop",
      "price": "25.00"
    }
  ],
  "services": [
    {
      "id": 1,
      "name": "Deep Cleaning",
      "price": "500.00",
      "quantity": 1
    }
  ],
  "totalAmount": "500.00",
  "remainingAmount": "350.00"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "customerName": "ABC Company",
  "totalAmount": "500.00",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "cleanerId": 1
}
```

---

### 3. Create Invoice (Group)
**Endpoint:** `POST /api/invoices`

**Description:** Create a new group employee invoice

**Request Body:**
```json
{
  "type": "group",
  "groupName": "ABC Company",
  "address": "123 Main St",
  "numberOfCustomers": "10",
  "startDate": "2024-01-01",
  "endDate": "2024-01-05",
  "maleCount": "3",
  "femaleCount": "2",
  "employeeNames": ["John Doe", "Jane Smith", "Bob Johnson"],
  "startingHr": "09:00",
  "endHr": "17:00",
  "workDuration": "8",
  "extraTimeHr": "2",
  "employeePay": "50.00",
  "foodExpense": "100.00",
  "taxiFare": "50.00",
  "cleaningMaterialsOrdered": true,
  "materials": [
    {
      "name": "Detergent",
      "price": "30.00"
    }
  ],
  "services": [
    {
      "id": 1,
      "name": "Deep Cleaning",
      "price": "1000.00",
      "quantity": 1
    }
  ],
  "amountReceived": "1000.00",
  "totalNet": "670.00",
  "notes": "Special instructions here"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "customerName": "ABC Company",
  "totalAmount": "1000.00",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "cleanerId": 1
}
```

---

### 4. Update Invoice
**Endpoint:** `PATCH /api/invoices/:id`

**Description:** Update an existing invoice

**Request Body:**
```json
{
  "status": "completed",
  "totalAmount": "550.00"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "customerName": "ABC Company",
  "totalAmount": "550.00",
  "status": "completed"
}
```

---

### 5. Delete Invoice
**Endpoint:** `DELETE /api/invoices/:id`

**Description:** Delete an invoice

**Response (200 OK):**
```json
{
  "message": "Invoice deleted successfully"
}
```

---

## Services

### 1. Get All Services
**Endpoint:** `GET /api/services`

**Description:** Get all available services

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Deep Cleaning",
    "description": "Comprehensive deep cleaning service",
    "price": "500.00",
    "category": "cleaning",
    "duration": "4 hours",
    "imageUrl": "/uploads/service-images/service-123.jpg"
  }
]
```

---

### 2. Create Service
**Endpoint:** `POST /api/services`

**Description:** Create a new service (Admin/Supervisor only)

**Request Body:**
```json
{
  "name": "Deep Cleaning",
  "description": "Comprehensive deep cleaning service",
  "price": "500.00",
  "category": "cleaning",
  "duration": "4 hours",
  "imageUrl": "/uploads/service-images/service-123.jpg"
}
```

---

## Bookings

### 1. Get All Bookings
**Endpoint:** `GET /api/customer/bookings`

**Description:** Get all customer bookings

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "customerEmail": "john@example.com",
    "customerAddress": "123 Main St",
    "area": "Downtown",
    "preferredDate": "2024-01-15",
    "preferredTime": "10:00",
    "status": "pending",
    "notes": "Please bring extra supplies",
    "services": [
      {
        "id": 1,
        "name": "Deep Cleaning",
        "price": "500.00",
        "quantity": 1
      }
    ],
    "totalCost": "500.00",
    "assignedCleanerId": null,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Create Booking
**Endpoint:** `POST /api/customer/bookings`

**Description:** Create a new booking

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "john@example.com",
  "customerAddress": "123 Main St",
  "area": "Downtown",
  "preferredDate": "2024-01-15",
  "preferredTime": "10:00",
  "services": [
    {
      "serviceId": 1,
      "quantity": 1
    }
  ],
  "notes": "Please bring extra supplies",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "customerName": "John Doe",
  "status": "pending",
  "totalCost": "500.00",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Update Booking
**Endpoint:** `PATCH /api/customer/bookings/:id`

**Description:** Update a booking

**Request Body:**
```json
{
  "status": "confirmed",
  "assignedCleanerId": 1
}
```

---

## Expenses

### 1. Get All Expenses
**Endpoint:** `GET /api/expenses`

**Description:** Get all expenses

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "description": "Office supplies",
    "amount": "150.00",
    "category": "supplies",
    "date": "2024-01-01",
    "receipt": "Receipt #12345",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Create Expense
**Endpoint:** `POST /api/expenses`

**Description:** Create a new expense

**Request Body:**
```json
{
  "description": "Office supplies",
  "amount": "150.00",
  "category": "supplies",
  "date": "2024-01-01",
  "receipt": "Receipt #12345"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "description": "Office supplies",
  "amount": "150.00",
  "category": "supplies",
  "userId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Location Tracking

### 1. Get User Location
**Endpoint:** `GET /api/locations/user/:userId`

**Description:** Get a specific user's location

**Response (200 OK):**
```json
{
  "id": 1,
  "userId": 1,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "isWorking": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Update Location
**Endpoint:** `POST /api/locations`

**Description:** Update current user's location

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "isWorking": true
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "userId": 1,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "isWorking": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Dashboard Statistics

### 1. Get Dashboard Stats
**Endpoint:** `GET /api/dashboard/stats`

**Description:** Get dashboard statistics (user-specific)

**Response (200 OK):**
```json
{
  "totalRevenue": 5000.00,
  "totalExpenses": 1500.00,
  "monthlyExpenses": 1500.00,
  "jobsCompleted": 25,
  "activeCleaners": 5,
  "workingNow": 2,
  "totalDebt": 500.00,
  "totalEmployeeSalary": 2000.00,
  "averageRating": 4.8
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found |
| 409  | Conflict - Resource already exists |
| 500  | Internal Server Error |

---

## Common Request Headers

All requests should include:
```
Content-Type: application/json
```

For authenticated requests, ensure cookies are enabled as the API uses session-based authentication.

---

## Notes

1. **Session-based Authentication**: The API uses session cookies. Make sure your HTTP client supports cookies.
2. **CORS**: Cross-origin requests may be restricted. Contact the backend administrator for CORS configuration.
3. **Rate Limiting**: The API implements rate limiting. Excessive requests may result in temporary IP blocking.
4. **Data Validation**: All input is validated. Ensure data types and formats match the schema.
5. **WebSocket Support**: Real-time updates are available via WebSocket for location tracking.

---

## Example: Creating an Invoice from Mobile App

```javascript
// 1. Login first
const loginResponse = await fetch('https://your-domain.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    username: 'john_doe',
    password: 'password123'
  })
});

const { user } = await loginResponse.json();

// 2. Create an invoice
const invoiceResponse = await fetch('https://your-domain.com/api/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for session cookies
  body: JSON.stringify({
    type: 'daily',
    customerName: 'ABC Company',
    employeeName: user.name,
    address: '123 Main St',
    numberOfCustomers: '5',
    date: '2024-01-01',
    startingTime: '09:00',
    finishingTime: '17:00',
    dailySalary: '100.00',
    services: [
      {
        id: 1,
        name: 'Deep Cleaning',
        price: '500.00',
        quantity: 1
      }
    ],
    totalAmount: '500.00',
    remainingAmount: '390.00',
    materials: [],
    cleaningMaterialsOrdered: false,
    taxiFare: '10.00'
  })
});

const invoice = await invoiceResponse.json();
console.log('Invoice created:', invoice);
```

---

## Rating & Reviews

### Overview
The Rating & Reviews system allows customers to provide feedback after a service is completed. Reviews include:
- Overall Service Rating (1-5 stars)
- Cleaner Performance Rating (1-5 stars)
- Text Feedback (Comment)
- Media Upload (Photos)

### Data Model

```typescript
interface Review {
  id: number;
  bookingId: number;      // Link to the specific job
  customerId: number;     // Who wrote the review
  cleanerId?: number;     // Who is being rated (optional)
  serviceRating: number;  // 1-5 (Overall Service)
  cleanerRating: number;  // 1-5 (Cleaner Performance)
  comment: string;        // Text feedback
  photos: string[];       // Array of image URLs or Base64 strings
  createdAt: string;      // ISO 8601 timestamp
  updatedAt?: string;     // ISO 8601 timestamp
}
```

---

### 1. Submit a Review
**Endpoint:** `POST /api/reviews`

**Description:** Creates a new review for a completed booking

**Request Body:**
```json
{
  "bookingId": 105,
  "cleanerId": 42,
  "serviceRating": 5,
  "cleanerRating": 4,
  "comment": "The service was excellent, but they arrived 5 minutes late.",
  "photos": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

**Request Validation:**
- `bookingId` (required): Must be a valid booking ID
- `serviceRating` (required): Integer between 1-5
- `cleanerRating` (required): Integer between 1-5
- `comment` (optional): String, max 1000 characters
- `photos` (optional): Array of Base64 encoded images or URLs
- `cleanerId` (optional): Integer, auto-assigned from booking if not provided

**Response (201 Created):**
```json
{
  "success": true,
  "reviewId": 88,
  "message": "Review submitted successfully",
  "review": {
    "id": 88,
    "bookingId": 105,
    "customerId": 12,
    "cleanerId": 42,
    "serviceRating": 5,
    "cleanerRating": 4,
    "comment": "The service was excellent, but they arrived 5 minutes late.",
    "photos": [
      "/uploads/reviews/88_photo1.jpg",
      "/uploads/reviews/88_photo2.jpg"
    ],
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid data
  ```json
  {
    "success": false,
    "error": "serviceRating and cleanerRating are required and must be between 1-5"
  }
  ```
- `401`: Unauthorized - User not authenticated
- `404`: Booking not found
  ```json
  {
    "success": false,
    "error": "Booking with ID 105 not found"
  }
  ```
- `409`: Conflict - Review already exists for this booking
  ```json
  {
    "success": false,
    "error": "A review has already been submitted for this booking"
  }
  ```
- `500`: Server error

---

### 2. Get Reviews by Cleaner
**Endpoint:** `GET /api/reviews?cleanerId={cleanerId}`

**Description:** Fetches all reviews for a specific cleaner

**Query Parameters:**
- `cleanerId` (required): The ID of the cleaner
- `limit` (optional): Number of reviews to return (default: 20, max: 100)
- `offset` (optional): Number of reviews to skip for pagination (default: 0)
- `sortBy` (optional): Sort field - `createdAt`, `serviceRating`, `cleanerRating` (default: `createdAt`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

**Example Request:**
```
GET /api/reviews?cleanerId=42&limit=10&sortBy=createdAt&order=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "total": 45,
  "limit": 10,
  "offset": 0,
  "reviews": [
    {
      "id": 88,
      "bookingId": 105,
      "customerId": 12,
      "customerName": "John Doe",
      "cleanerId": 42,
      "serviceRating": 5,
      "cleanerRating": 4,
      "comment": "The service was excellent, but they arrived 5 minutes late.",
      "photos": [
        "/uploads/reviews/88_photo1.jpg",
        "/uploads/reviews/88_photo2.jpg"
      ],
      "createdAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "averageServiceRating": 4.7,
  "averageCleanerRating": 4.5
}
```

---

### 3. Get Reviews by Booking
**Endpoint:** `GET /api/reviews?bookingId={bookingId}`

**Description:** Fetches the review for a specific booking

**Query Parameters:**
- `bookingId` (required): The ID of the booking

**Response (200 OK):**
```json
{
  "success": true,
  "review": {
    "id": 88,
    "bookingId": 105,
    "customerId": 12,
    "cleanerId": 42,
    "serviceRating": 5,
    "cleanerRating": 4,
    "comment": "The service was excellent, but they arrived 5 minutes late.",
    "photos": [
      "/uploads/reviews/88_photo1.jpg"
    ],
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "No review found for this booking"
}
```

---

### 4. Get All Reviews
**Endpoint:** `GET /api/reviews`

**Description:** Fetches all reviews (Admin/Supervisor only)

**Query Parameters:**
- `limit` (optional): Number of reviews to return (default: 20, max: 100)
- `offset` (optional): Number of reviews to skip for pagination (default: 0)
- `minRating` (optional): Filter by minimum rating (1-5)
- `startDate` (optional): Filter reviews created after this date (ISO 8601)
- `endDate` (optional): Filter reviews created before this date (ISO 8601)

**Response (200 OK):**
```json
{
  "success": true,
  "total": 234,
  "limit": 20,
  "offset": 0,
  "reviews": [
    {
      "id": 88,
      "bookingId": 105,
      "customerId": 12,
      "customerName": "John Doe",
      "cleanerId": 42,
      "cleanerName": "Sarah Smith",
      "serviceRating": 5,
      "cleanerRating": 4,
      "comment": "The service was excellent, but they arrived 5 minutes late.",
      "photos": ["/uploads/reviews/88_photo1.jpg"],
      "createdAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "statistics": {
    "averageServiceRating": 4.6,
    "averageCleanerRating": 4.4,
    "totalReviews": 234
  }
}
```

---

### 5. Update a Review
**Endpoint:** `PATCH /api/reviews/:id`

**Description:** Update an existing review (only by the customer who created it, within 24 hours)

**Request Body:**
```json
{
  "serviceRating": 5,
  "cleanerRating": 5,
  "comment": "Updated: The service was perfect!",
  "photos": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "review": {
    "id": 88,
    "bookingId": 105,
    "serviceRating": 5,
    "cleanerRating": 5,
    "comment": "Updated: The service was perfect!",
    "photos": ["/uploads/reviews/88_photo1.jpg"],
    "updatedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

**Error Responses:**
- `403`: Forbidden - User is not the review owner or 24 hours have passed
- `404`: Review not found

---

### 6. Delete a Review
**Endpoint:** `DELETE /api/reviews/:id`

**Description:** Delete a review (Admin only, or customer within 1 hour of creation)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Error Responses:**
- `403`: Forbidden - User does not have permission to delete
- `404`: Review not found

---

### 7. Get Cleaner Statistics
**Endpoint:** `GET /api/reviews/stats/:cleanerId`

**Description:** Get detailed review statistics for a cleaner

**Response (200 OK):**
```json
{
  "success": true,
  "cleanerId": 42,
  "statistics": {
    "totalReviews": 45,
    "averageServiceRating": 4.7,
    "averageCleanerRating": 4.5,
    "ratingDistribution": {
      "1": 2,
      "2": 3,
      "3": 5,
      "4": 15,
      "5": 20
    },
    "recentReviews": 5,
    "withPhotos": 12,
    "withComments": 40
  }
}
```

---

## Frontend Integration Guide

### Step 1: Add Review Interface

```typescript
// types.ts
export interface ReviewPayload {
  bookingId: number;
  cleanerId?: number;
  serviceRating: number;
  cleanerRating: number;
  comment: string;
  photos: string[];
}

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
```

### Step 2: Update API Service

```typescript
// services/api.ts

const api = {
  // ... existing methods ...

  // Submit a new review
  async submitReview(payload: ReviewPayload): Promise<{ success: boolean; reviewId?: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit review' };
      }

      return { success: true, reviewId: data.reviewId };
    } catch (error) {
      console.error('Submit review error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Get reviews for a cleaner
  async getCleanerReviews(cleanerId: number, limit = 20, offset = 0): Promise<Review[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews?cleanerId=${cleanerId}&limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Get reviews error:', error);
      return [];
    }
  },

  // Get review for a specific booking
  async getBookingReview(bookingId: number): Promise<Review | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews?bookingId=${bookingId}`,
        { credentials: 'include' }
      );

      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch review');

      const data = await response.json();
      return data.review || null;
    } catch (error) {
      console.error('Get booking review error:', error);
      return null;
    }
  }
};
```

### Step 3: Implement in RateView Component

```tsx
// RateView.tsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ReviewPayload } from '../types';

interface RateViewProps {
  bookingId: number;
  cleanerId: number;
  onClose: () => void;
}

export default function RateView({ bookingId, cleanerId, onClose }: RateViewProps) {
  const [serviceRating, setServiceRating] = useState(0);
  const [cleanerRating, setCleanerRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image selection and convert to Base64
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const base64Images: string[] = [];
    
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      base64Images.push(base64);
    }

    setPhotos([...photos, ...base64Images]);
  };

  // Submit review
  const handleSubmit = async () => {
    // Validation
    if (serviceRating === 0 || cleanerRating === 0) {
      setError("Please provide both service and cleaner ratings");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: ReviewPayload = {
      bookingId,
      cleanerId,
      serviceRating,
      cleanerRating,
      comment,
      photos
    };

    const result = await api.submitReview(payload);

    setIsSubmitting(false);

    if (result.success) {
      // Show success message
      alert("Thank you for your review!");
      onClose();
    } else {
      setError(result.error || "Failed to submit review. Please try again.");
    }
  };

  return (
    <div className="rate-view">
      {/* Service Rating */}
      <div className="rating-section">
        <h3>Overall Service</h3>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star} 
              onClick={() => setServiceRating(star)}
              disabled={isSubmitting}
            >
              <span className={`material-symbols-outlined ${
                star <= serviceRating ? 'filled active' : ''
              }`}>
                star
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cleaner Rating */}
      <div className="rating-section">
        <h3>Cleaner Performance</h3>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star} 
              onClick={() => setCleanerRating(star)}
              disabled={isSubmitting}
            >
              <span className={`material-symbols-outlined ${
                star <= cleanerRating ? 'filled active' : ''
              }`}>
                star
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="comment-section">
        <h3>Your Feedback</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          maxLength={1000}
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      {/* Photo Upload */}
      <div className="photo-section">
        <h3>Add Photos (Optional)</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          disabled={isSubmitting}
        />
        <div className="photo-preview">
          {photos.map((photo, index) => (
            <img key={index} src={photo} alt={`Preview ${index + 1}`} />
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || serviceRating === 0 || cleanerRating === 0}
        className="submit-btn"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}
```

---

## Mock Server Implementation

Add the following to your `server.ts` file for local testing:

```typescript
// server.ts

// ============================================
// REVIEWS STORAGE
// ============================================
interface Review {
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

let REVIEWS: Review[] = [];
let reviewIdCounter = 1;

// ============================================
// POST /api/reviews - Submit a review
// ============================================
app.post('/api/reviews', requireAuth, (req, res) => {
  const { bookingId, cleanerId, serviceRating, cleanerRating, comment, photos } = req.body;

  // Validation
  if (!bookingId || !serviceRating || !cleanerRating) {
    return res.status(400).json({
      success: false,
      error: 'bookingId, serviceRating, and cleanerRating are required'
    });
  }

  if (serviceRating < 1 || serviceRating > 5 || cleanerRating < 1 || cleanerRating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Ratings must be between 1 and 5'
    });
  }

  // Check if review already exists for this booking
  const existingReview = REVIEWS.find(r => r.bookingId === bookingId);
  if (existingReview) {
    return res.status(409).json({
      success: false,
      error: 'A review has already been submitted for this booking'
    });
  }

  // Process photos (in real app, save to disk and return URLs)
  const photoUrls = photos?.map((photo: string, index: number) => {
    // In production, save Base64 to file and return URL
    return `/uploads/reviews/${reviewIdCounter}_photo${index + 1}.jpg`;
  }) || [];

  const newReview: Review = {
    id: reviewIdCounter++,
    bookingId,
    customerId: req.user!.id,
    cleanerId: cleanerId || undefined,
    serviceRating,
    cleanerRating,
    comment: comment || '',
    photos: photoUrls,
    createdAt: new Date().toISOString()
  };

  REVIEWS.push(newReview);

  console.log('New Review Submitted:', newReview);

  res.status(201).json({
    success: true,
    reviewId: newReview.id,
    message: 'Review submitted successfully',
    review: newReview
  });
});

// ============================================
// GET /api/reviews - Get reviews
// ============================================
app.get('/api/reviews', (req, res) => {
  const { cleanerId, bookingId, limit = 20, offset = 0 } = req.query;

  let filteredReviews = [...REVIEWS];

  // Filter by cleaner
  if (cleanerId) {
    filteredReviews = filteredReviews.filter(r => r.cleanerId === Number(cleanerId));
  }

  // Filter by booking
  if (bookingId) {
    const review = filteredReviews.find(r => r.bookingId === Number(bookingId));
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'No review found for this booking'
      });
    }
    return res.json({ success: true, review });
  }

  // Calculate statistics
  const avgServiceRating = filteredReviews.length > 0
    ? filteredReviews.reduce((sum, r) => sum + r.serviceRating, 0) / filteredReviews.length
    : 0;

  const avgCleanerRating = filteredReviews.length > 0
    ? filteredReviews.reduce((sum, r) => sum + r.cleanerRating, 0) / filteredReviews.length
    : 0;

  // Pagination
  const paginatedReviews = filteredReviews
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    total: filteredReviews.length,
    limit: Number(limit),
    offset: Number(offset),
    reviews: paginatedReviews,
    averageServiceRating: Math.round(avgServiceRating * 10) / 10,
    averageCleanerRating: Math.round(avgCleanerRating * 10) / 10
  });
});

// ============================================
// GET /api/reviews/stats/:cleanerId - Get cleaner statistics
// ============================================
app.get('/api/reviews/stats/:cleanerId', (req, res) => {
  const { cleanerId } = req.params;
  const cleanerReviews = REVIEWS.filter(r => r.cleanerId === Number(cleanerId));

  if (cleanerReviews.length === 0) {
    return res.json({
      success: true,
      cleanerId: Number(cleanerId),
      statistics: {
        totalReviews: 0,
        averageServiceRating: 0,
        averageCleanerRating: 0,
        ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        recentReviews: 0,
        withPhotos: 0,
        withComments: 0
      }
    });
  }

  const avgServiceRating = cleanerReviews.reduce((sum, r) => sum + r.serviceRating, 0) / cleanerReviews.length;
  const avgCleanerRating = cleanerReviews.reduce((sum, r) => sum + r.cleanerRating, 0) / cleanerReviews.length;

  const ratingDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  cleanerReviews.forEach(r => {
    ratingDistribution[r.cleanerRating.toString() as keyof typeof ratingDistribution]++;
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentReviews = cleanerReviews.filter(r => new Date(r.createdAt) > thirtyDaysAgo).length;

  res.json({
    success: true,
    cleanerId: Number(cleanerId),
    statistics: {
      totalReviews: cleanerReviews.length,
      averageServiceRating: Math.round(avgServiceRating * 10) / 10,
      averageCleanerRating: Math.round(avgCleanerRating * 10) / 10,
      ratingDistribution,
      recentReviews,
      withPhotos: cleanerReviews.filter(r => r.photos.length > 0).length,
      withComments: cleanerReviews.filter(r => r.comment.length > 0).length
    }
  });
});

// ============================================
// PATCH /api/reviews/:id - Update a review
// ============================================
app.patch('/api/reviews/:id', requireAuth, (req, res) => {
  const reviewId = Number(req.params.id);
  const review = REVIEWS.find(r => r.id === reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  // Check if user owns the review
  if (review.customerId !== req.user!.id) {
    return res.status(403).json({
      success: false,
      error: 'You can only edit your own reviews'
    });
  }

  // Check if review is less than 24 hours old
  const reviewAge = Date.now() - new Date(review.createdAt).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  if (reviewAge > twentyFourHours) {
    return res.status(403).json({
      success: false,
      error: 'Reviews can only be edited within 24 hours of creation'
    });
  }

  // Update review
  const { serviceRating, cleanerRating, comment, photos } = req.body;

  if (serviceRating !== undefined) review.serviceRating = serviceRating;
  if (cleanerRating !== undefined) review.cleanerRating = cleanerRating;
  if (comment !== undefined) review.comment = comment;
  if (photos !== undefined) {
    review.photos = photos.map((photo: string, index: number) => 
      `/uploads/reviews/${reviewId}_photo${index + 1}.jpg`
    );
  }

  review.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Review updated successfully',
    review
  });
});

// ============================================
// DELETE /api/reviews/:id - Delete a review
// ============================================
app.delete('/api/reviews/:id', requireAuth, (req, res) => {
  const reviewId = Number(req.params.id);
  const reviewIndex = REVIEWS.findIndex(r => r.id === reviewId);

  if (reviewIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  const review = REVIEWS[reviewIndex];

  // Check permissions (admin or owner within 1 hour)
  const isAdmin = req.user!.role === 'admin' || req.user!.role === 'supervisor';
  const isOwner = review.customerId === req.user!.id;
  const reviewAge = Date.now() - new Date(review.createdAt).getTime();
  const oneHour = 60 * 60 * 1000;

  if (!isAdmin && (!isOwner || reviewAge > oneHour)) {
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to delete this review'
    });
  }

  REVIEWS.splice(reviewIndex, 1);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});
```

---

## Testing the Reviews API

### Example: Submit a Review

```javascript
const response = await fetch('https://your-domain.com/api/reviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    bookingId: 105,
    cleanerId: 42,
    serviceRating: 5,
    cleanerRating: 4,
    comment: "Excellent service!",
    photos: []
  })
});

const result = await response.json();
console.log('Review submitted:', result);
```

### Example: Get Cleaner Reviews

```javascript
const response = await fetch('https://your-domain.com/api/reviews?cleanerId=42&limit=10', {
  credentials: 'include'
});

const data = await response.json();
console.log('Cleaner reviews:', data.reviews);
console.log('Average rating:', data.averageCleanerRating);
```

---

## Support

For API issues or questions, contact the backend administrator.
