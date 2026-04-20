# 🔧 Payment API - Complete Debugging Guide

## ❌ Error: "Booking not found"

यह error तब आता है जब:
1. Booking database में exist नहीं करता
2. Wrong booking ID use कर रहे हो
3. Booking create करते समय error आई थी

---

## ✅ सही तरीका - Complete Flow

### **Phase 1️⃣: User Registration & Login**

#### Step 1A: Register करो
```
METHOD: POST
URL: http://localhost:5000/api/auth/register

HEADERS:
Content-Type: application/json

BODY:
{
  "firstName": "Raushan",
  "lastName": "Kumar",
  "email": "raushan@test.com",
  "phone": "9876543216",
  "password": "Test@1234"
}

RESPONSE ✅:
{
  "success": true,
  "data": {
    "user": {
      "id": "69e4bf70255d5cf7cfccae72"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Step 1B: Token Copy करो
Copy करो यह token (यह दोबारा लगेगा):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTRiZjcwMjU1ZDVjZjdjZmNjYWU3MiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2NTk4OTYxLCJleHAiOjE3NzkxOTA5NjF9.OlUkpmGU2aZoopReccR9nI3qjEwCFPYuhes4oqetm6c
```

---

### **Phase 2️⃣: Booking Create करो**

#### Step 2A: Create Booking

```
METHOD: POST
URL: http://localhost:5000/api/bookings

HEADERS:
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTRiZjcwMjU1ZDVjZjdjZmNjYWU3MiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2NTk4OTYxLCJleHAiOjE3NzkxOTA5NjF9.OlUkpmGU2aZoopReccR9nI3qjEwCFPYuhes4oqetm6c

BODY:
{
  "pickupLocation": {
    "address": "Delhi Central",
    "latitude": 28.6139,
    "longitude": 77.209
  },
  "dropLocation": {
    "address": "Delhi Airport Terminal 3",
    "latitude": 28.5244,
    "longitude": 77.1855
  },
  "distance": 25.5,
  "cabType": "economy",
  "scheduledDate": "2026-04-20",
  "scheduledTime": "10:30",
  "rideType": "local"
}

RESPONSE ✅:
{
  "success": true,
  "data": {
    "_id": "69e4e5d28845bb25a9bea2ce",     ← ✅ **COPY YE! MongoDB ID (24 hex chars)**
    "bookingId": "BK1776608722489",        ← ❌ **मत copy करो - यह सिर्फ user-friendly है**
    "distance": 25.5,
    "pricing": {
      "totalFare": 305
    }
  }
}
```

#### Step 2B: ⚠️ **सही ID को Save करो** (IMPORTANT!)

```
❌ WRONG - bookingId use करना:
BOOKING_ID_VARIABLE = "BK1776608722489"

✅ RIGHT - _id use करना:
BOOKING_ID_VARIABLE = "69e4e5d28845bb25a9bea2ce"
```

**📌 Remember:**
- **_id** = MongoDB ObjectId (24 character hex string like `69e4e5d28845bb25a9bea2ce`)
- **bookingId** = User-friendly reference (like `BK1776608722489`)

**Payment API को _id चाहिए, bookingId नहीं!**

---

### **Phase 3️⃣: Verify Booking Created**

```
METHOD: GET
URL: http://localhost:5000/api/bookings

HEADERS:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

RESPONSE ✅:
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "69e4cf70255d5cf7cfccae99",
        "bookingId": "BK1776599500123",
        "distance": 25.5
      }
    ]
  }
}
```

---

### **Phase 4️⃣: Payment Create करो**

#### Step 4A: Create Payment Order

```
METHOD: POST
URL: http://localhost:5000/api/payments/create-order

HEADERS:
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTRiZjcwMjU1ZDVjZjdjZmNjYWU3MiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2NTk4OTYxLCJleHAiOjE3NzkxOTA5NjF9.OlUkpmGU2aZoopReccR9nI3qjEwCFPYuhes4oqetm6c

BODY:
{
  "bookingId": "69e4cf70255d5cf7cfccae99"
}

RESPONSE ✅:
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "amount": 50000,
    "currency": "INR",
    "keyId": "rzp_live_xxx"
  }
}
```

---

## 🚨 Common Errors & Solutions

### ❌ Error 0: "Invalid booking ID format - using bookingId instead of _id"
```json
{
  "success": false,
  "message": "Invalid booking ID format. Must be a valid MongoDB ObjectId (24 character hex string)",
  "received": "BK1776608722489"
}
```

**🔴 This is the MOST COMMON mistake!**

**Explanation:** आपने `bookingId` field use किया जो ऐसा दिखता है: `BK1776608722489` 

लेकिन Payment API को `_id` चाहिए जो ऐसा दिखता है: `69e4e5d28845bb25a9bea2ce`

**Solution:**
```json
❌ WRONG:
{
  "bookingId": "BK1776608722489"
}

✅ CORRECT:
{
  "bookingId": "69e4e5d28845bb25a9bea2ce"
}
```

**📌 Quick Reference:**
| Field | Example | Format | Use In |
|-------|---------|--------|--------|
| `_id` | `69e4e5d28845bb25a9bea2ce` | 24 hex chars | **Payment API ✅** |
| `bookingId` | `BK1776608722489` | BK + timestamp | Display only ✌️ |

---

### ❌ Error 1: "Invalid booking ID format"
```json
{
  "success": false,
  "message": "Invalid booking ID format. Must be a valid MongoDB ObjectId (24 character hex string)",
  "received": "BOOKING_ID"
}
```

**Solution:**
- ❌ Use करो: `"BOOKING_ID"`
- ✅ Use करो: `"69e4cf70255d5cf7cfccae99"`
- ID 24 characters की hex string होनी चाहिए

---

### ❌ Error 2: "Booking not found"
```json
{
  "success": false,
  "message": "Booking not found",
  "details": {
    "bookingId": "69e4cf70255d5cf7cfccae99",
    "suggestion": "Please ensure the booking ID is correct and the booking has been created"
  }
}
```

**Solution:**
1. ✅ पहले GET /api/bookings करके verify करो कि booking exist करता है
2. ✅ फिर सही booking ID use करो
3. ✅ Booking create करते समय error check करो

---

### ❌ Error 3: "Booking pricing not calculated properly"
```json
{
  "success": false,
  "message": "Booking pricing not calculated properly",
  "details": {
    "bookingId": "69e4cf70255d5cf7cfccae99",
    "pricing": null
  }
}
```

**Solution:**
- Booking create करते समय fare calculation fail हुई
- Booking creation request चेक करो सभी fields हैं:
  - pickupLocation ✅
  - dropLocation ✅
  - distance ✅
  - cabType ✅

---

## 📋 Postman Environment Variables

Postman में **Manage Environments** में एक environment बनाओ:

```json
{
  "name": "GoElectriQ Dev",
  "values": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:5000",
      "enabled": true
    },
    {
      "key": "TOKEN",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "enabled": true
    },
    {
      "key": "BOOKING_ID_MONGO",
      "value": "69e4e5d28845bb25a9bea2ce",
      "enabled": true,
      "description": "MongoDB _id field (USE THIS FOR PAYMENT API)"
    },
    {
      "key": "BOOKING_ID_USER_FRIENDLY",
      "value": "BK1776608722489",
      "enabled": true,
      "description": "User-friendly bookingId field (DISPLAY ONLY)"
    },
    {
      "key": "USER_ID",
      "value": "69e4bf70255d5cf7cfccae72",
      "enabled": true
    }
  ]
}
```

**फिर URLs में use करो:**
```
{{BASE_URL}}/api/bookings
Authorization: Bearer {{TOKEN}}
{
  "bookingId": "{{BOOKING_ID_MONGO}}"  ← ✅ Use MONGO ID
}
```

---

## ✅ Complete API Collection

### 1. Register
```
POST {{BASE_URL}}/api/auth/register
```

### 2. Login
```
POST {{BASE_URL}}/api/auth/login
```

### 3. Get Profile
```
GET {{BASE_URL}}/api/users/profile
Authorization: Bearer {{TOKEN}}
```

### 4. Add Address
```
POST {{BASE_URL}}/api/users/addresses
Authorization: Bearer {{TOKEN}}
```

### 5. Create Booking
```
POST {{BASE_URL}}/api/bookings
Authorization: Bearer {{TOKEN}}
```

### 6. Get All Bookings
```
GET {{BASE_URL}}/api/bookings
Authorization: Bearer {{TOKEN}}
```

### 7. Get Single Booking
```
GET {{BASE_URL}}/api/bookings/{{BOOKING_ID}}
Authorization: Bearer {{TOKEN}}
```

### 8. Create Payment
```
POST {{BASE_URL}}/api/payments/create-order
Authorization: Bearer {{TOKEN}}
Body: {"bookingId": "{{BOOKING_ID}}"}
```

---

## 🔍 Backend Console Logs

Terminal में server logs check करो - वहाँ detailed debug info होगी:

```
📥 Creating booking with payload: {...}
✅ Location validation passed
✅ Fare breakdown validated - Total: ₹500
✅ Booking created successfully: BK1776599500123
```

या

```
❌ Booking not found for ID: 69e4cf70255d5cf7cfccae99
Payment order creation error: Booking not found
```

---

## ⚡ Quick Checklist

✅ Server running: `npm run dev`  
✅ MongoDB connected  
✅ Register करो  
✅ Token copy करो  
✅ Booking create करो  
✅ Booking ID copy करो  
✅ Payment create करो  

**Ab everything काम करेगा! 🚀**
