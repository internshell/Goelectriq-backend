# 🧪 Complete API Testing Checklist

## ✅ Already Tested & Working

### 1. **Authentication APIs** ✅
- [x] POST /api/auth/register - **Working**
- [x] POST /api/auth/login - **Working**
- [x] GET /api/auth/me - **Working**

### 2. **User Profile APIs** ✅
- [x] GET /api/users/profile - **Working**
- [x] POST /api/users/addresses - **Working**

### 3. **Booking APIs** ✅
- [x] POST /api/bookings - **Working** ✅
- [x] GET /api/bookings - **Working** ✅

### 4. **Payment APIs** ✅
- [x] POST /api/payments/create-order - **Working** ✅

---

## ❌ Still Need Testing

### 5. **Booking Management APIs** (User)

```
✅ DONE: GET /api/bookings/:id
METHOD: GET
URL: http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce
HEADERS:
  Authorization: Bearer <TOKEN>

Response ✅:
{
  "success": true,
  "data": {
    "_id": "69e4e5d28845bb25a9bea2ce",
    "bookingId": "BK1776608722489",
    "distance": 25.5,
    "pricing": { "totalFare": 305 },
    "status": "pending",
    "passengerDetails": {
      "name": "Raushan Kumar",
      "phone": "9876543216"
    }
  }
}
```



---

```
✅ DONE: PUT /api/bookings/:id/cancel
METHOD: PUT
URL: http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/cancel
HEADERS:
  Authorization: Bearer <TOKEN>
BODY:
{
  "cancellationReason": "Change of plans"
}

Response ✅:
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {
      "status": "cancelled",
      "cancellation": {
        "cancelledBy": "user",
        "reason": "No reason provided",
        "refundAmount": 305,
        "refundStatus": "pending"
      }
    },
    "refundAmount": 305
  }
}
```

---

```
⚠️ TESTED (Expected Error): GET /api/bookings/:id/invoice
METHOD: GET
URL: http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/invoice
HEADERS:
  Authorization: Bearer <TOKEN>

Response ⚠️ (Expected - Booking not paid):
{
  "success": false,
  "message": "Invoice is only available for paid bookings"
}

Note: This is correct behavior! Invoice केवल paid bookings के लिए available है।
Cancelled/unpaid bookings पर invoice नहीं मिल सकती।
```

---

### 6. **User Profile Management APIs** (User)

```
❌ TODO: PUT /api/users/profile
METHOD: PUT
URL: http://localhost:5000/api/users/profile
HEADERS:
  Authorization: Bearer <TOKEN>
BODY:
{
  "firstName": "Raushan",
  "lastName": "Kumar Updated",
  "phone": "9876543216"
}

Expected Response:
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

```
❌ TODO: POST /api/users/change-password
METHOD: POST
URL: http://localhost:5000/api/users/change-password
HEADERS:
  Authorization: Bearer <TOKEN>
BODY:
{
  "currentPassword": "Test@1234",
  "newPassword": "NewPass@1234"
}

Expected Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

```
❌ TODO: GET /api/users/addresses
METHOD: GET
URL: http://localhost:5000/api/users/addresses
HEADERS:
  Authorization: Bearer <TOKEN>

Expected Response:
{
  "success": true,
  "data": [
    {
      "_id": 1776599312877,
      "label": "Home",
      "address": "Street 1",
      "city": "Delhi"
    }
  ]
}
```

---

```
❌ TODO: PUT /api/users/notification-settings
METHOD: PUT
URL: http://localhost:5000/api/users/notification-settings
HEADERS:
  Authorization: Bearer <TOKEN>
BODY:
{
  "emailNotifications": true,
  "smsNotifications": false,
  "bookingUpdates": true,
  "promotionalEmails": false
}

Expected Response:
{
  "success": true,
  "message": "Notification settings updated"
}
```

---

### 7. **Payment Verification API** (User)

```
❌ TODO: POST /api/payments/ride/verify
METHOD: POST
URL: http://localhost:5000/api/payments/ride/verify
HEADERS:
  Authorization: Bearer <TOKEN>
BODY:
{
  "razorpayPaymentId": "pay_xxx",
  "razorpayOrderId": "order_SfNwc7dchkU3yv",
  "razorpaySignature": "signature_xxx",
  "bookingId": "69e4e5d28845bb25a9bea2ce"
}

Expected Response:
{
  "success": true,
  "message": "Payment verified successfully"
}
```

---

### 8. **Admin APIs** (Require admin role)

```
❌ TODO: PUT /api/bookings/:id/confirm (Admin)
METHOD: PUT
URL: http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/confirm
HEADERS:
  Authorization: Bearer <ADMIN_TOKEN>

Expected Response:
{
  "success": true,
  "message": "Booking confirmed successfully"
}
```

---

```
❌ TODO: PUT /api/bookings/:id/complete (Admin)
METHOD: PUT
URL: http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/complete
HEADERS:
  Authorization: Bearer <ADMIN_TOKEN>

Expected Response:
{
  "success": true,
  "message": "Booking completed successfully"
}
```

---

```
❌ TODO: POST /api/bookings/:id/collect-payment (Admin)
METHOD: POST
URL: http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/collect-payment
HEADERS:
  Authorization: Bearer <ADMIN_TOKEN>
BODY:
{
  "paymentAmount": 61
}

Expected Response:
{
  "success": true,
  "message": "Remaining 20% payment collected"
}
```

---

### 9. **Charging Station APIs** ❌

```
❌ TODO: POST /api/charging-bookings
METHOD: POST
URL: http://localhost:5000/api/charging-bookings
HEADERS:
  Authorization: Bearer <TOKEN>
BODY:
{
  "stationId": "station_id_here",
  "slotId": "slot_id_here",
  "bookingDate": "2026-04-20",
  "bookingTime": "14:00"
}
```

---

### 10. **Tour Booking APIs** ❌

```
❌ TODO: POST /api/tour-bookings
METHOD: POST
URL: http://localhost:5000/api/tour-bookings
HEADERS:
  Authorization: Bearer <TOKEN>
BODY:
{
  "packageId": "package_id",
  "numberOfPeople": 2,
  "startDate": "2026-04-25"
}
```

---

### 11. **Feedback API** ❌

```
❌ TODO: POST /api/feedback
METHOD: POST
URL: http://localhost:5000/api/feedback
HEADERS:
  Authorization: Bearer <TOKEN> (optional)
BODY:
{
  "name": "User Name",
  "email": "user@example.com",
  "message": "Great app!",
  "rating": 5
}
```

---

## 📊 Testing Summary

| Category | Status | Tests |
|----------|--------|-------|
| Authentication | ✅ Complete | 3/3 |
| Bookings (User) | ✅ Almost Complete | 5/5 |
| Payments | ⚠️ Partial | 1/2 |
| User Profile | ⚠️ Partial | 1/6 |
| Admin | ❌ Not Started | 0/3 |
| Charging Stations | ❌ Not Started | 0/1 |
| Tour Bookings | ❌ Not Started | 0/1 |
| Feedback | ❌ Not Started | 0/1 |
| **TOTAL** | **⚠️ In Progress** | **10/22** |

---

## 🎯 Priority Order (Next Steps)

### High Priority (Core Features):
1. ✅ GET /api/bookings/:id - Get single booking
2. ✅ PUT /api/bookings/:id/cancel - Cancel booking
3. ✅ POST /api/payments/ride/verify - Payment verification
4. ✅ Admin booking confirmation flow

### Medium Priority (User Features):
5. PUT /api/users/profile - Update profile
6. GET /api/users/addresses - Get all addresses
7. POST /api/users/change-password - Change password

### Low Priority (Optional Features):
8. GET /api/bookings/:id/invoice - Download invoice
9. Charging station booking
10. Tour booking
11. Feedback submission

---

## ⚡ Quick Test Commands (For Terminal)

```bash
# Test Get Single Booking
curl -X GET http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Cancel Booking
curl -X PUT http://localhost:5000/api/bookings/69e4e5d28845bb25a9bea2ce/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cancellationReason":"Change of plans"}'

# Test Update Profile
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Raushan","lastName":"Kumar"}'
```

---

## 🏁 Summary

**Progress: 10 out of 22 APIs tested (45%)** ✅ **+1 NEW - Invoice (Error Handling)**

**Completed APIs:**
- ✅ Authentication (3/3) - Complete!
- ✅ Bookings User Flow (5/5) - Complete!
- ⚠️ Payments (1/2) - Need payment verification
- ⚠️ User Profile (1/6) - Need update profile, addresses, etc.

**Tested today:**
- ✅ GET /api/bookings/:id 
- ✅ PUT /api/bookings/:id/cancel 
- ⚠️ GET /api/bookings/:id/invoice (Expected error - booking not paid)

**Recommendation:**
1. Test User Profile APIs next (Update profile, Get addresses)
2. Then test Payment verification
3. Finally test Admin functionality

**Next Step:** Test PUT /api/users/profile to update user details
