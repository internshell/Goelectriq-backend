# 🎯 Final 5 APIs Testing Format - Copy & Paste Ready

**Target:** Complete remaining 5 APIs to reach 22/22 (100%)

---

## 📋 Step 1: Setup (Do This First)

### MongoDB - Make User Admin
```bash
mongosh "mongodb://localhost:27017"
use GoElectriQ

# Make user admin
db.users.updateOne(
  { email: "raushan@test.com" },
  { $set: { role: "admin" } }
)

# Verify - should show modified: 1
```

### Login to Get Admin Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "raushan@test.com",
    "password": "Test@1234"
  }'
```

**Copy the token from response** - you'll need it below

---

## 🧪 API 1: Confirm Booking (Admin)

**Status:** ❌ UNTESTED → Ready to Test  
**Method:** PUT  
**Endpoint:** `/api/bookings/:id/confirm`  
**Role Required:** Admin ⚠️

### Copy & Paste Command:
```bash
curl -X PUT http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/confirm \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Replace This:
```
ADMIN_TOKEN_HERE = Your admin token from login response above
69e4e5d28845bb25a9bea2ce = Booking ID (or use existing from bookings list)
```

### Expected Success Response (200 OK):
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "data": {
    "_id": "69e4e5d28845bb25a9bea2ce",
    "status": "confirmed",
    "confirmedAt": "2026-04-19T..."
  }
}
```

### If Error 401 - Unauthorized:
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```
**Fix:** Make sure you:
1. Made user admin in MongoDB
2. Logged in again to get new token with admin role
3. Using correct admin token

---

## 🧪 API 2: Complete Booking (Admin)

**Status:** ❌ UNTESTED → Ready to Test  
**Method:** PUT  
**Endpoint:** `/api/bookings/:id/complete`  
**Role Required:** Admin ⚠️

### Copy & Paste Command:
```bash
curl -X PUT http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/complete \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Replace This:
```
ADMIN_TOKEN_HERE = Your admin token
69e4e5d28845bb25a9bea2ce = Booking ID
```

### Expected Success Response (200 OK):
```json
{
  "success": true,
  "message": "Booking completed successfully",
  "data": {
    "_id": "69e4e5d28845bb25a9bea2ce",
    "status": "completed",
    "completedAt": "2026-04-19T..."
  }
}
```

---

## 🧪 API 3: Collect Payment (Admin)

**Status:** ❌ UNTESTED → Ready to Test  
**Method:** POST  
**Endpoint:** `/api/bookings/:id/collect-payment`  
**Role Required:** Admin ⚠️

### Copy & Paste Command:
```bash
curl -X POST http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/collect-payment \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 305
  }'
```

### Replace This:
```
ADMIN_TOKEN_HERE = Your admin token
69e4e5d28845bb25a9bea2ce = Booking ID
305 = Payment amount (or remaining 20%)
```

### Expected Success Response (200 OK):
```json
{
  "success": true,
  "message": "Payment collected successfully",
  "data": {
    "bookingId": "69e4e5d28845bb25a9bea2ce",
    "amount": 305,
    "paymentMethod": "cash",
    "status": "completed",
    "collectedAt": "2026-04-19T..."
  }
}
```

---

## 🧪 API 4: Charging Bookings (User)

**Status:** ❌ UNTESTED → Ready to Test  
**Method:** POST  
**Endpoint:** `/api/charging-bookings`  
**Role Required:** User ✅

### Step 1: Get Station ID from MongoDB
```bash
mongosh "mongodb://localhost:27017"
use GoElectriQ
db.chargingstations.findOne({}, {_id: 1, name: 1, slots: 1})
```

**Output Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439016"),
  "name": "Metro Charging Hub",
  "slots": [
    { "_id": ObjectId("507f1f77bcf86cd799439017") }
  ]
}
```

**Copy these:**
- `stationId` = `507f1f77bcf86cd799439016`
- `slotId` = `507f1f77bcf86cd799439017`

### Copy & Paste Command:
```bash
curl -X POST http://localhost:5000/api/charging-bookings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTRiZjcwMjU1ZDVjZjdjZmNjYWU3MiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2NTk4OTYxLCJleHAiOjE3NzkxOTA5NjF9.OlUkpmGU2aZoopReccR9nI3qjEwCFPYuhes4oqetm6c" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "507f1f77bcf86cd799439016",
    "slotId": "507f1f77bcf86cd799439017",
    "bookingDate": "2026-04-25",
    "bookingTime": "14:00"
  }'
```

### Replace This:
```
Token = User token (from login)
stationId = From MongoDB output above
slotId = From MongoDB output above
bookingDate = Any future date
bookingTime = Time in HH:mm format
```

### Expected Success Response (201 Created):
```json
{
  "success": true,
  "message": "Charging booking created successfully",
  "data": {
    "_id": "generated_id",
    "userId": "69e4bf70255d5cf7cfccae72",
    "stationId": "507f1f77bcf86cd799439016",
    "slotId": "507f1f77bcf86cd799439017",
    "bookingDate": "2026-04-25",
    "bookingTime": "14:00",
    "status": "pending",
    "createdAt": "2026-04-19T..."
  }
}
```

---

## 🧪 API 5: Tour Bookings (User)

**Status:** ❌ UNTESTED → Ready to Test  
**Method:** POST  
**Endpoint:** `/api/tour-bookings`  
**Role Required:** User ✅

### Step 1: Get Package ID from MongoDB
```bash
mongosh "mongodb://localhost:27017"
use GoElectriQ
db.packages.findOne({}, {_id: 1, packageName: 1, basePrice: 1})
```

**Output Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "packageName": "City Tour",
  "basePrice": 5000
}
```

**Copy this:**
- `packageId` = `507f1f77bcf86cd799439015`

### Copy & Paste Command:
```bash
curl -X POST http://localhost:5000/api/tour-bookings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTRiZjcwMjU1ZDVjZjdjZmNjYWU3MiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2NTk4OTYxLCJleHAiOjE3NzkxOTA5NjF9.OlUkpmGU2aZoopReccR9nI3qjEwCFPYuhes4oqetm6c" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "507f1f77bcf86cd799439015",
    "pickupLocation": {
      "latitude": 19.0760,
      "longitude": 72.8777,
      "address": "Mumbai Central Station"
    },
    "scheduledDate": "2026-05-01",
    "scheduledTime": "09:00",
    "numberOfPeople": 2
  }'
```

### Replace This:
```
Token = User token (from login)
packageId = From MongoDB output above
pickupLocation = Your pickup address
scheduledDate = Any future date (YYYY-MM-DD)
scheduledTime = Time in HH:mm format
numberOfPeople = Number of people
```

### Expected Success Response (201 Created):
```json
{
  "success": true,
  "message": "Tour booking created successfully",
  "data": {
    "_id": "generated_id",
    "userId": "69e4bf70255d5cf7cfccae72",
    "packageId": "507f1f77bcf86cd799439015",
    "numberOfPeople": 2,
    "pickupLocation": {
      "latitude": 19.0760,
      "longitude": 72.8777,
      "address": "Mumbai Central Station"
    },
    "status": "pending",
    "totalPrice": 10000,
    "createdAt": "2026-04-19T..."
  }
}
```

---

## ✅ Testing Checklist

### Preparation:
- [ ] MongoDB user set to admin role
- [ ] Admin login done - got admin token
- [ ] Charging Station ID copied from MongoDB
- [ ] Package ID copied from MongoDB
- [ ] Booking ID ready (69e4e5d28845bb25a9bea2ce or get new one)

### Admin APIs (3):
- [ ] **API 1:** Confirm Booking - tested - **Result:** ___________
- [ ] **API 2:** Complete Booking - tested - **Result:** ___________
- [ ] **API 3:** Collect Payment - tested - **Result:** ___________

### User APIs (2):
- [ ] **API 4:** Charging Bookings - tested - **Result:** ___________
- [ ] **API 5:** Tour Bookings - tested - **Result:** ___________

---

## 🚀 Testing Order (Recommended)

1. **Setup Admin** (2 mins)
   - MongoDB: Make user admin
   - Login: Get admin token
   - Copy token

2. **Test Admin APIs** (5 mins)
   - Confirm Booking
   - Complete Booking
   - Collect Payment

3. **Get MongoDB IDs** (2 mins)
   - Station ID + Slot ID
   - Package ID

4. **Test User APIs** (3 mins)
   - Charging Booking
   - Tour Booking

**Total Time: ~12 minutes to reach 22/22 (100%)** ✅

---

## 📝 Results Template

When you get responses, paste here:

### ✅ Admin APIs Results:

**API 1 - Confirm Booking:**
```
Status: _____ (200, 400, 401, etc.)
Success: YES / NO
Response: [paste response here]
```

**API 2 - Complete Booking:**
```
Status: _____ (200, 400, 401, etc.)
Success: YES / NO
Response: [paste response here]
```

**API 3 - Collect Payment:**
```
Status: _____ (200, 400, 401, etc.)
Success: YES / NO
Response: [paste response here]
```

### ✅ User APIs Results:

**API 4 - Charging Booking:**
```
MongoDB IDs Used:
- stationId: _________________
- slotId: _________________

Status: _____ (201, 400, 401, etc.)
Success: YES / NO
Response: [paste response here]
```

**API 5 - Tour Booking:**
```
MongoDB IDs Used:
- packageId: _________________

Status: _____ (201, 400, 401, etc.)
Success: YES / NO
Response: [paste response here]
```

---

## 🎯 Next Steps

1. **Copy each command** above
2. **Replace placeholders** with actual values
3. **Test in terminal** one by one
4. **Send results** - I'll update to 22/22 (100%) ✅

Let's finish strong! Ready? 🚀
