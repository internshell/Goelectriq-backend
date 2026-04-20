# GoElectriQ Backend API Testing Guide

## 📚 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Base URL](#base-url)
4. [Authentication](#authentication)
5. [Core API Endpoints](#core-api-endpoints)
6. [Request & Response Examples](#request--response-examples)
7. [Headers Configuration](#headers-configuration)
8. [Step-by-Step Postman Guide](#step-by-step-postman-guide)
9. [Validation Checklist](#validation-checklist)
10. [Common Errors and Fixes](#common-errors-and-fixes)
11. [Best Practices](#best-practices)
12. [Postman Collection Usage](#postman-collection-usage)

---

## Overview

### What is API Testing?
API Testing is a type of software testing that validates the backend functionality of an application by testing the Application Programming Interfaces (APIs) directly. Instead of testing through the user interface, you test the server's business logic, data handling, and integration points.

### Why Test APIs?
- **Early Bug Detection**: Find issues before they reach production
- **Performance Validation**: Ensure endpoints respond within acceptable time
- **Security Verification**: Check authentication and authorization
- **Data Integrity**: Verify correct data flow and database operations
- **Integration Testing**: Ensure all services work together properly

### GoElectriQ Application
GoElectriQ is an electric vehicle (EV) booking and charging management platform with features including:
- User authentication and profile management
- Booking management (rides and charging stations)
- Payment processing
- Driver management
- Feedback and reviews system
- Offers and packages

---

## Prerequisites

### Required Software
1. **Postman** (Desktop or Web)
   - Download: https://www.postman.com/downloads/
   - Account: Create a free account at https://www.postman.com

2. **Node.js** (Backend running)
   - Version: 14+ recommended
   - Check: ```node --version```

3. **MongoDB**
   - Local instance or MongoDB Atlas cloud database
   - Connection URI configured in `.env`

4. **Environment Setup**
   - Backend server running (`npm start` or `npm run dev`)
   - Check logs for server startup confirmation

### Environment Configuration
Create a `.env` file in the backend directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/goelectriq
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=30d
```

### Verification Checklist
- [ ] Node.js installed and running version 14+
- [ ] MongoDB connection working
- [ ] Backend server running on http://localhost:5000
- [ ] Postman installed
- [ ] Network connectivity verified

---

## Base URL

### Development Environment
```
http://localhost:5000/api
```

### API Version
```
v1 (Currently used in the application)
```

### Full Endpoint Format
```
http://localhost:5000/api/[resource]/[action]
```

### Example URLs
| Endpoint | Full URL |
|----------|----------|
| User Registration | `http://localhost:5000/api/auth/register` |
| User Login | `http://localhost:5000/api/auth/login` |
| Get User Profile | `http://localhost:5000/api/user/profile` |

---

## Authentication

### JWT (JSON Web Token) Authentication

The GoElectriQ API uses JWT for secure authentication. JWTs are encrypted tokens sent with each request to verify user identity.

### How JWT Works
1. **User Login** → Server generates JWT token
2. **Client Stores Token** → Saved in local storage or session
3. **Send in Requests** → Token included in `Authorization` header
4. **Server Validates** → Verifies token signature and expiry
5. **Request Processed** → If valid, request proceeds; if invalid, returns 401

### Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjY0YjFkYjU0YzM4MmY0MDAxNjU0MzIxMCIsImlhdCI6MTY4OTU2NDc2MCwiZXhwIjoxNjkwMTY5NTYwfQ.
abc123xyz789...
```

Three parts:
- **Header**: Algorithm and token type
- **Payload**: User data (ID, issued at, expiry)
- **Signature**: Encrypted verification

### Token Expiry
- **Access Token**: 7 days (default)
- **Refresh Token**: 30 days (default)

### Using JWT in Requests

#### Option 1: Authorization Header (Recommended)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Option 2: Query Parameter
```
GET http://localhost:5000/api/user/profile?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Management in Postman

#### Step 1: Automatic Token Storage After Login
1. In Postman, go to the **Login** request
2. Click on **Tests** tab
3. Add this script:
```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
}
```

#### Step 2: Use Token in Protected Routes
1. Go to **Authorization** tab in any protected request
2. Select **Bearer Token** from dropdown
3. In **Token** field, enter: `{{token}}`

#### Example Protected Request Header
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## Core API Endpoints

### 1. Authentication Endpoints

#### 1.1 User Registration
```
POST /api/auth/register
```

**Purpose**: Create a new user account

**Access**: Public (no authentication required)

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "9876543210",
  "password": "SecurePass123"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210",
      "role": "user",
      "createdAt": "2024-04-19T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Email already exists",
  "error": "ValidationError"
}
```

---

#### 1.2 User Login
```
POST /api/auth/login
```

**Purpose**: Authenticate user and receive JWT token

**Access**: Public (no authentication required)

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210",
      "role": "user",
      "profileImage": "https://example.com/image.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": "UnauthorizedError"
}
```

---

#### 1.3 Get Current User (Protected)
```
GET /api/auth/me
```

**Purpose**: Retrieve authenticated user's information

**Access**: Protected (requires valid JWT token)

**Headers**:
```
Authorization: Bearer {{token}}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "role": "user",
    "profileImage": "https://example.com/image.jpg",
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "createdAt": "2024-04-19T10:30:00Z"
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "message": "Not authorized to access this route",
  "error": "UnauthorizedError"
}
```

---

#### 1.4 Update Password (Protected)
```
PUT /api/auth/update-password
```

**Purpose**: Change user's password

**Access**: Protected (requires valid JWT token)

**Request Body**:
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

### 2. User Profile Endpoints (Protected)

#### 2.1 Get User Profile
```
GET /api/user/profile
```

**Purpose**: Retrieve user's profile information

**Access**: Protected (requires valid JWT token)

**Headers**:
```
Authorization: Bearer {{token}}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "profileImage": "https://example.com/image.jpg",
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "role": "user",
    "createdAt": "2024-04-19T10:30:00Z"
  }
}
```

---

#### 2.2 Update User Profile
```
PUT /api/user/profile
```

**Purpose**: Update user's profile information

**Access**: Protected (requires valid JWT token)

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210",
  "address": {
    "street": "456 New Street",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "profileImage": "https://example.com/newimage.jpg"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "address": {
      "street": "456 New Street",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001"
    },
    "updatedAt": "2024-04-19T11:00:00Z"
  }
}
```

---

#### 2.3 Get Saved Addresses
```
GET /api/user/addresses
```

**Purpose**: Retrieve all saved addresses for the user

**Access**: Protected

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49c1234567890abcde",
      "label": "Home",
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "type": "home"
    },
    {
      "_id": "60d5ec49c1234567890abcdf",
      "label": "Office",
      "address": "456 Corporate Plaza",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400020",
      "type": "work"
    }
  ]
}
```

---

#### 2.4 Add Address
```
POST /api/user/addresses
```

**Purpose**: Add a new saved address

**Access**: Protected

**Request Body**:
```json
{
  "label": "Home",
  "address": "789 Residential Street",
  "city": "Pune",
  "state": "Maharashtra",
  "zipCode": "411001",
  "type": "home"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "_id": "60d5ec49c1234567890abce0",
    "label": "Home",
    "address": "789 Residential Street",
    "city": "Pune",
    "state": "Maharashtra",
    "zipCode": "411001",
    "type": "home"
  }
}
```

---

#### 2.5 Update Address
```
PUT /api/user/addresses/:addressId
```

**Purpose**: Update an existing saved address

**Access**: Protected

**URL Parameter**:
```
:addressId = 60d5ec49c1234567890abcde
```

**Request Body**:
```json
{
  "label": "Home Updated",
  "address": "789 New Residential Street",
  "city": "Pune",
  "type": "home"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Address updated successfully"
}
```

---

#### 2.6 Delete Address
```
DELETE /api/user/addresses/:addressId
```

**Purpose**: Delete a saved address

**Access**: Protected

**URL Parameter**:
```
:addressId = 60d5ec49c1234567890abcde
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

### 3. Booking Endpoints

#### 3.1 Create Booking
```
POST /api/bookings
```

**Purpose**: Create a new ride booking

**Access**: Protected

**Request Body**:
```json
{
  "pickupLocation": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "High Street, Mumbai"
  },
  "dropoffLocation": {
    "latitude": 19.0895,
    "longitude": 72.8656,
    "address": "South Mumbai, Mumbai"
  },
  "vehicleType": "economy",
  "estimatedDuration": 45,
  "estimatedDistance": 12.5
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "status": "pending",
    "pickupLocation": {
      "latitude": 19.0760,
      "longitude": 72.8777,
      "address": "High Street, Mumbai"
    },
    "dropoffLocation": {
      "latitude": 19.0895,
      "longitude": 72.8656,
      "address": "South Mumbai, Mumbai"
    },
    "fare": 250,
    "createdAt": "2024-04-19T10:30:00Z"
  }
}
```

---

#### 3.2 Get All Bookings
```
GET /api/bookings
```

**Purpose**: Retrieve all user's bookings

**Access**: Protected

**Query Parameters**:
```
?status=completed&limit=10&page=1
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "status": "completed",
      "fare": 250,
      "duration": 45,
      "distance": 12.5,
      "createdAt": "2024-04-19T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3
  }
}
```

---

#### 3.3 Get Single Booking
```
GET /api/bookings/:bookingId
```

**Purpose**: Retrieve details of a specific booking

**Access**: Protected

**URL Parameter**:
```
:bookingId = 507f1f77bcf86cd799439012
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "status": "completed",
    "pickupLocation": {
      "address": "High Street, Mumbai"
    },
    "dropoffLocation": {
      "address": "South Mumbai, Mumbai"
    },
    "fare": 250,
    "driverId": "507f1f77bcf86cd799439013",
    "createdAt": "2024-04-19T10:30:00Z",
    "completedAt": "2024-04-19T11:15:00Z"
  }
}
```

---

### 4. Payment Endpoints

#### 4.1 Create Payment Order
```
POST /api/payments/create-order
```

**Purpose**: Create a Razorpay payment order

**Access**: Protected

**Request Body**:
```json
{
  "bookingId": "507f1f77bcf86cd799439012",
  "amount": 25000,
  "description": "Ride Booking Payment"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_H5OvJWZu60gUtm",
    "amount": 25000,
    "currency": "INR",
    "keyId": "rzp_test_XXXXXXXXXXXXXXXX"
  }
}
```

---

#### 4.2 Verify Payment
```
POST /api/payments/verify
```

**Purpose**: Verify Razorpay payment and update transaction

**Access**: Protected

**Request Body**:
```json
{
  "razorpay_order_id": "order_H5OvJWZu60gUtm",
  "razorpay_payment_id": "pay_H5OvJWZu60gUtm",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "transactionId": "507f1f77bcf86cd799439014",
    "status": "success",
    "amount": 25000
  }
}
```

---

## Request & Response Examples

### General JSON Response Structure

All API responses follow this standard structure:

```json
{
  "success": true/false,
  "message": "Descriptive message",
  "data": {
    // Response payload
  },
  "error": "Optional error type",
  "timestamp": "2024-04-19T10:30:00Z"
}
```

### Standard Status Codes

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 200 | OK - Request successful | GET user profile |
| 201 | Created - Resource created | Register new user |
| 400 | Bad Request - Invalid data | Missing required fields |
| 401 | Unauthorized - Invalid auth | No/expired token |
| 403 | Forbidden - No permission | User trying to delete other's data |
| 404 | Not Found - Resource missing | Booking ID doesn't exist |
| 409 | Conflict - Duplicate data | Email already registered |
| 422 | Unprocessable Entity - Validation failed | Invalid email format |
| 429 | Too Many Requests - Rate limit | Too many login attempts |
| 500 | Server Error - Server issue | Database connection error |

---

## Headers Configuration

### Required Headers for All Requests

```
Content-Type: application/json
Accept: application/json
```

### Required Headers for Protected Routes

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Optional Headers

```
User-Agent: Postman/10.0
X-Request-ID: unique-request-id-12345
```

### Postman: Setting Headers

1. Open request in Postman
2. Click on **Headers** tab
3. Add headers:

| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer {{token}} |

---

## Step-by-Step Postman Guide

### Part 1: Setup

#### Step 1.1: Install Postman
1. Download from https://www.postman.com/downloads/
2. Create account or login
3. Open Postman

#### Step 1.2: Create Workspace
1. Click **Workspaces** → **Create Workspace**
2. Name: "GoElectriQ API Testing"
3. Visibility: Personal
4. Click **Create Workspace**

#### Step 1.3: Create Collection
1. Click **+ New** → **Collection**
2. Name: "GoElectriQ API Endpoints"
3. Description: "Complete API test suite for GoElectriQ"
4. Click **Create**

#### Step 1.4: Create Environment
1. Click **Environments** → **Create Environment**
2. Name: "GoElectriQ Dev"
3. Add variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| baseUrl | http://localhost:5000/api | http://localhost:5000/api |
| token | (empty) | (empty) |
| userId | (empty) | (empty) |
| bookingId | (empty) | (empty) |

4. Click **Save**

#### Step 1.5: Select Environment
1. Top-right dropdown (environment selector)
2. Choose "GoElectriQ Dev"

---

### Part 2: Test User Registration

#### Step 2.1: Create Registration Request
1. Right-click on collection → **Add Request**
2. Name: "User Registration"
3. Method: **POST**
4. URL: `{{baseUrl}}/auth/register`

#### Step 2.2: Add Request Body
1. Click **Body** tab
2. Select **raw** radio button
3. Select **JSON** from dropdown
4. Paste:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "TestPass123"
}
```

#### Step 2.3: Send Request
1. Click **Send** button
2. Check **Status**: Should see `201 Created`
3. View response in **Response** tab

#### Step 2.4: Verify Response
1. Confirm response contains:
   - `"success": true`
   - User data object
   - JWT token

---

### Part 3: Test User Login

#### Step 3.1: Create Login Request
1. Right-click on collection → **Add Request**
2. Name: "User Login"
3. Method: **POST**
4. URL: `{{baseUrl}}/auth/login`

#### Step 3.2: Add Request Body
```json
{
  "email": "john@example.com",
  "password": "TestPass123"
}
```

#### Step 3.3: Add Test Script
1. Click **Tests** tab
2. Paste this script:
```javascript
// Check status code
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Check response success
pm.test("Response is successful", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.success).to.be.true;
});

// Save token to environment
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
  pm.environment.set("userId", jsonData.data.user._id);
}
```

#### Step 3.4: Send Request
1. Click **Send**
2. Status should be **200 OK**
3. Check **Tests** tab - all tests should pass with green checkmarks

---

### Part 4: Test Protected Routes

#### Step 4.1: Create Get Profile Request
1. Right-click on collection → **Add Request**
2. Name: "Get User Profile"
3. Method: **GET**
4. URL: `{{baseUrl}}/user/profile`

#### Step 4.2: Add Authorization
1. Click **Authorization** tab
2. Type: Select **Bearer Token**
3. Token: `{{token}}`

#### Step 4.3: Send Request
1. Click **Send**
2. Status should be **200 OK**
3. Response shows current user data

#### Step 4.4: Add Test
Click **Tests** tab and add:
```javascript
pm.test("Response contains user ID", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data._id).to.be.a('string');
});

pm.test("Response contains email", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data.email).to.exist;
});
```

---

### Part 5: Test with Invalid Data

#### Step 5.1: Test Registration with Missing Field
1. Create new request: "Register - Missing Email"
2. Method: **POST**
3. URL: `{{baseUrl}}/auth/register`
4. Body (missing email):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210",
  "password": "TestPass123"
}
```

#### Step 5.2: Send and Check
- Status should be **400 Bad Request**
- Response should contain error message about missing email

#### Step 5.3: Test Invalid Email Format
1. Create new request: "Register - Invalid Email"
2. Body with invalid email:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "invalid-email",
  "phone": "9876543210",
  "password": "TestPass123"
}
```
- Status should be **400 Bad Request**

---

### Part 6: Run Full Test Suite

#### Step 6.1: Create Collection Run
1. Click on collection → **Run** (play icon)
2. Select all requests
3. Execution order: Registration → Login → Get Profile

#### Step 6.2: Configure Run Settings
- Iterations: 1
- Delay between requests: 1000ms (1 second)

#### Step 6.3: Start Run
1. Click **Run GoElectriQ API Endpoints**
2. Watch execution in real-time
3. View summary at end

---

## Validation Checklist

### For Every API Response

#### Status Code Validation
- [ ] Status code matches expected value (200, 201, 400, etc.)
- [ ] Not receiving 500 server errors
- [ ] Redirect responses (3xx) handled correctly

#### Response Structure Validation
- [ ] Response is valid JSON format
- [ ] Contains `success` field true or false
- [ ] Contains `message` field with description
- [ ] Contains `data` field with expected content

#### Data Validation
- [ ] All required fields present in response
- [ ] Data types are correct (string, number, boolean, array, object)
- [ ] No null values in critical fields
- [ ] Timestamps in valid format (ISO 8601)

#### Authentication Validation
- [ ] Token generated on registration
- [ ] Token generated on login
- [ ] Token can be used in protected routes
- [ ] Expired token returns 401 error
- [ ] Missing token returns 401 error

#### Authorization Validation
- [ ] User cannot access other user's data
- [ ] Admin routes require admin role
- [ ] Driver routes require driver role

#### Business Logic Validation
- [ ] Booking status transitions correctly
- [ ] Fare calculated correctly
- [ ] Address saved with correct type
- [ ] Payment verified with signature

#### Error Handling Validation
- [ ] Duplicate email returns conflict error
- [ ] Invalid password format rejected
- [ ] Phone number format validated
- [ ] Rate limiting works (too many requests)

---

### Using Postman Tests for Validation

Add these test scripts to validate automatically:

#### Test 1: Status Code
```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});
```

#### Test 2: Response Structure
```javascript
pm.test("Response has required fields", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('success');
  pm.expect(jsonData).to.have.property('message');
  pm.expect(jsonData).to.have.property('data');
});
```

#### Test 3: Data Type
```javascript
pm.test("User ID is string", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data._id).to.be.a('string');
});
```

#### Test 4: Email Format
```javascript
pm.test("Email is valid format", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});
```

#### Test 5: Array Length
```javascript
pm.test("Addresses array exists", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data).to.be.an('array');
});
```

---

## Common Errors and Fixes

### Error 1: 401 Unauthorized

**Message**: `"Not authorized to access this route"`

**Causes**:
- Missing JWT token in header
- Expired token
- Invalid token signature
- Wrong token format

**Fixes**:
1. Check Authorization header exists
2. Verify token format: `Bearer <token>`
3. Re-login to get fresh token
4. Verify token not expired:
   ```javascript
   // In Postman Tests
   var jsonData = pm.response.json();
   var token = jsonData.data.token;
   var decoded = jwt_decode(token); // Requires JWT decode library
   ```

**Test Request**:
```
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

---

### Error 2: 400 Bad Request

**Message**: `"validation error"` or `"Invalid data"`

**Causes**:
- Missing required fields
- Wrong data type
- Invalid format (email, phone)
- Malformed JSON

**Common Fixes**:

#### Fix 2a: Missing Fields
```json
// WRONG - Missing firstName
{
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "TestPass123"
}

// CORRECT
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "TestPass123"
}
```

#### Fix 2b: Invalid Email
```json
// WRONG
{ "email": "invalid-email" }

// CORRECT
{ "email": "john@example.com" }
```

#### Fix 2c: Invalid Phone
```json
// WRONG - Less than 10 digits
{ "phone": "123456" }

// CORRECT - 10 digits, starts with 6-9
{ "phone": "9876543210" }
```

#### Fix 2d: Malformed JSON
```json
// WRONG - Missing quotes on key
{ firstName: "John" }

// CORRECT
{ "firstName": "John" }
```

---

### Error 3: 404 Not Found

**Message**: `"Booking not found"` or `"User not found"`

**Causes**:
- Wrong endpoint URL
- Invalid resource ID
- Resource deleted
- Typo in route

**Fixes**:

#### Fix 3a: Verify Endpoint
```
// WRONG
GET {{baseUrl}}/user  // Missing /profile

// CORRECT
GET {{baseUrl}}/user/profile
```

#### Fix 3b: Verify Resource ID
```
// Get a booking - verify bookingId exists
GET {{baseUrl}}/bookings/{{bookingId}}

// Check if bookingId variable is set
pm.environment.get("bookingId");
```

#### Fix 3c: Check URL Parameters
```
// WRONG - Missing parameter
PUT {{baseUrl}}/user/addresses/

// CORRECT
PUT {{baseUrl}}/user/addresses/:addressId
```

---

### Error 4: 409 Conflict

**Message**: `"Email already exists"` or `"Phone already exists"`

**Causes**:
- Duplicate email in database
- Duplicate phone in database
- Unique constraint violation

**Fixes**:
```javascript
// Use unique test data
{
  "email": "john" + Date.now() + "@example.com",
  "phone": "987654" + Math.floor(Math.random() * 10000)
}

// Or test with different user
{
  "email": "jane@example.com",
  "phone": "9123456789"
}
```

---

### Error 5: 429 Too Many Requests

**Message**: `"Too many attempts, please try again later"`

**Causes**:
- Rate limiting triggered
- Too many login attempts
- Too many requests in short time

**Fixes**:
1. Wait before retrying (usually 5-15 minutes)
2. Reduce request frequency
3. Use environment variables to avoid duplicate requests

```javascript
// Delay between requests in collection runner
// Set Delay to 1000ms (1 second) between requests
```

---

### Error 6: 500 Internal Server Error

**Message**: `"Internal server error"` or `"Something went wrong"`

**Causes**:
- Database connection error
- Server crash
- Code exception
- Missing environment variable

**Fixes**:
1. Check server logs for detailed error:
   ```bash
   # Terminal where backend runs
   # Look for error stack trace
   ```

2. Verify MongoDB connection:
   ```bash
   # Check if MongoDB is running
   mongosh "mongodb://localhost:27017"
   ```

3. Verify environment variables:
   ```bash
   # In backend directory
   cat .env
   # Check MONGODB_URI, JWT_SECRET exist
   ```

4. Restart server:
   ```bash
   npm start
   ```

---

## Best Practices

### 1. Test Data Management

#### Use Test Users
Create dedicated test users that don't affect production:
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test" + Date.now() + "@example.com",
  "phone": "9876543210"
}
```

#### Use Environment Variables
Store sensitive data in Postman environments, not in request bodies:
```
baseUrl: http://localhost:5000/api
token: {{token}}
userId: {{userId}}
```

#### Cleanup After Tests
Delete test data to keep database clean:
```
// Add cleanup test
pm.test("Cleanup - Delete test user", function() {
  // Add delete requests
});
```

---

### 2. Request Organization

#### Logical Grouping
Organize requests in collections by feature:
```
Collection: GoElectriQ API
├── Auth
│   ├── Register
│   ├── Login
│   └── Get Me
├── User Profile
│   ├── Get Profile
│   ├── Update Profile
│   └── Addresses
├── Bookings
│   ├── Create Booking
│   ├── Get All Bookings
│   ├── Get Single Booking
│   └── Update Booking
└── Payments
    ├── Create Order
    └── Verify Payment
```

#### Naming Convention
Use clear, descriptive names:
```
✅ GOOD: "User Registration - Valid Email"
❌ BAD: "Register"

✅ GOOD: "Get User Profile - Protected Route"
❌ BAD: "Profile Get"
```

---

### 3. Response Validation

#### Always Add Tests
Add test script to every request:
```javascript
// ✅ Good - Tests added
pm.test("Status is 200", () => { ... });
pm.test("Response has data", () => { ... });

// ❌ Bad - No tests
```

#### Test Both Success and Error Cases
```
Requests to add:
✅ Login - Valid Credentials
✅ Login - Invalid Password
✅ Login - Non-existent Email
✅ Registration - Valid Data
✅ Registration - Duplicate Email
✅ Registration - Invalid Email Format
```

#### Validate Response Structure
```javascript
pm.test("Response structure is correct", () => {
  var data = pm.response.json();
  pm.expect(data).to.have.property('success');
  pm.expect(data).to.have.property('message');
  pm.expect(data).to.have.property('data');
});
```

---

### 4. Authentication Best Practices

#### Use Token Variables
```javascript
// After login, save token
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
}

// Use in protected routes
Authorization: Bearer {{token}}
```

#### Re-authenticate When Token Expires
```javascript
// Check if response is 401
if (pm.response.code === 401) {
  // Re-run login request to get new token
  pm.sendRequest({
    url: pm.environment.get("baseUrl") + "/auth/login",
    method: "POST",
    body: { ... }
  }, function(err, response) {
    pm.environment.set("token", response.json().data.token);
  });
}
```

#### Never Commit Tokens
```bash
# ❌ WRONG - Secrets in file
# .gitignore should exclude:
postman_environment_variables.json
*.env
```

---

### 5. Testing Workflow

#### Step 1: Happy Path Tests
Test with valid data first:
```
1. Register with valid data → Expect 201
2. Login with valid credentials → Expect 200
3. Get profile with valid token → Expect 200
```

#### Step 2: Edge Cases
Test boundary conditions:
```
1. Maximum name length (50 chars)
2. Minimum password length (6 chars)
3. Empty optional fields
4. Special characters in names
```

#### Step 3: Error Cases
Test expected failures:
```
1. Invalid email format
2. Password too short
3. Missing required fields
4. Invalid token
5. Non-existent resource
```

#### Step 4: Performance Testing
Test response time:
```javascript
pm.test("Response time is less than 2 second", () => {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

---

### 6. Documentation Practice

#### Document Each Endpoint
```
Endpoint: POST /auth/register
Purpose: Create new user account
Access: Public
Rate Limit: 5 requests per hour
Request: { firstName, lastName, email, phone, password }
Response: { user, token }
Errors: 400, 409
```

#### Keep README Updated
Create endpoint documentation in README.md or API_DOCS.md

#### Use Postman Documentation
Postman generates docs from requests:
1. Collection → **View documentation**
2. Customize with descriptions
3. Share link with team

---

### 7. Security Best Practices

#### Never Log Sensitive Data
```javascript
// ❌ WRONG
console.log("Token:", token);
console.log("Password:", password);

// ✅ CORRECT
console.log("Request sent to:", endpoint);
console.log("Status code:", statusCode);
```

#### Use HTTPS in Production
```
// Local testing
http://localhost:5000/api

// Production
https://api.goelectriq.com/api
```

#### Validate All Inputs
```javascript
// Validate email format
var email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
pm.expect(userData.email).to.match(email);
```

#### Implement CORS Properly
Server should specify allowed origins:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

---

### 8. Maintenance Tips

#### Keep Tests Updated
When API changes:
```
1. Update request body
2. Update expected responses
3. Update test scripts
4. Re-run entire collection
```

#### Monitor Performance
Track response times:
```javascript
pm.test("Performance - Response time", () => {
  console.log("Response time: " + pm.response.responseTime + "ms");
});
```

#### Log Issues
Document bugs found:
```markdown
## Bug #1: Register endpoint returns 500
- Steps: POST /auth/register with valid data
- Expected: 201 Created
- Actual: 500 Internal Server Error
- Status: Fixed in commit abc123
```

---

## Postman Collection Usage

### Export Collection

#### Step 1: Export
1. Right-click collection → **Export**
2. Format: Collection v2.1
3. Save location: Choose folder
4. File name: `GoElectriQ-API-Collection.json`

#### Step 2: Share with Team
1. File → **Export collection**
2. Email or commit to repository
3. Team imports in Postman

### Import Collection

#### Step 1: Import
1. Click **Import** button (top-left)
2. Choose **File** tab
3. Select `GoElectriQ-API-Collection.json`
4. Click **Import**

#### Step 2: Setup Environment
1. Import environment file or manually create
2. Set Base URL
3. Configure API keys/tokens

#### Step 3: Run Tests
1. Open collection
2. Click **Run** (play icon)
3. Execute all requests in sequence

### Collection with Pre-request Scripts

Use pre-request scripts to auto-setup:

```javascript
// Pre-request Script - Auto-generate unique email
var timestamp = new Date().getTime();
pm.environment.set("uniqueEmail", "test" + timestamp + "@example.com");

// Or generate random phone
var phone = "9" + Math.floor(Math.random() * 1000000000);
pm.environment.set("testPhone", phone);
```

Add to request body:
```json
{
  "email": "{{uniqueEmail}}",
  "phone": "{{testPhone}}"
}
```

---

## Summary Checklist

Before starting API testing, ensure:

- [ ] Backend server running
- [ ] MongoDB connection established
- [ ] Postman installed
- [ ] Postman environment configured
- [ ] Collection created with all endpoints
- [ ] Authorization/token handling setup
- [ ] Test data prepared
- [ ] First request (registration) tested
- [ ] Login and token generation verified
- [ ] Protected route tests passing
- [ ] Error scenarios tested
- [ ] Performance acceptable
- [ ] Documentation updated

---

## Additional Resources

### External Links
- **Postman Documentation**: https://learning.postman.com/
- **REST API Best Practices**: https://restfulapi.net/
- **HTTP Status Codes**: https://httpwg.org/specs/rfc7231.html#status.codes
- **JSON Standard**: https://www.json.org/

### Related Guides
- Backend API Reference Documentation
- Database Schema Documentation
- Authentication & Authorization Guide
- Error Handling Standards
- Rate Limiting & Security Policy

---

**Document Version**: 1.0  
**Last Updated**: April 19, 2026  
**Maintained By**: Development Team  
**Status**: Ready for Production Testing
