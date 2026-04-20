===================regtsred api ========================================

http://localhost:5000/api/auth/registerd
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": "69e4bf70255d5cf7cfccae72",
            "firstName": "Raushan",
            "lastName": "Kumar",
            "email": "raushan@test.com",
            "phone": "9876543216",
            "role": "user",
            "profileImage": ""
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTRiZjcwMjU1ZDVjZjdjZmNjYWU3MiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2NTk4ODk2LCJleHAiOjE3NzkxOTA4OTZ9.lRKuVQ6hF_wBSBEmhBuGEvUirZ5Wt22_HNElWFlEHK0"
    }
}


============================login api =======================================
http://localhost:5000/api/auth/login

{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "69e4bf70255d5cf7cfccae72",
            "firstName": "Raushan",
            "lastName": "Kumar",
            "name": "Raushan Kumar",
            "email": "raushan@test.com",
            "phone": "9876543216",
            "role": "user",
            "profileImage": "",
            "isEmailVerified": false,
            "isPhoneVerified": false
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTRiZjcwMjU1ZDVjZjdjZmNjYWU3MiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2NTk4OTYxLCJleHAiOjE3NzkxOTA5NjF9.OlUkpmGU2aZoopReccR9nI3qjEwCFPYuhes4oqetm6c"
    }
}



============================auth me ==========================================
http://localhost:5000/api/auth/me

{
    "success": true,
    "data": {
        "notificationSettings": {
            "emailNotifications": true,
            "smsNotifications": true,
            "bookingUpdates": true,
            "promotionalEmails": false,
            "reviewRequests": true
        },
        "_id": "69e4bf70255d5cf7cfccae72",
        "firstName": "Raushan",
        "lastName": "Kumar",
        "email": "raushan@test.com",
        "phone": "9876543216",
        "role": "user",
        "profileImage": "",
        "isEmailVerified": false,
        "isPhoneVerified": false,
        "isActive": true,
        "savedAddresses": [],
        "createdAt": "2026-04-19T11:41:36.205Z",
        "updatedAt": "2026-04-19T11:41:36.205Z",
        "__v": 0,
        "name": "Raushan Kumar",
        "id": "69e4bf70255d5cf7cfccae72"
    }
}



==========================users profile==================================

GET http://localhost:5000/api/users/profile

{
    "success": true,
    "data": {
        "notificationSettings": {
            "emailNotifications": true,
            "smsNotifications": true,
            "bookingUpdates": true,
            "promotionalEmails": false,
            "reviewRequests": true
        },
        "_id": "69e4bf70255d5cf7cfccae72",
        "firstName": "Raushan",
        "lastName": "Kumar",
        "email": "raushan@test.com",
        "phone": "9876543216",
        "role": "user",
        "profileImage": "",
        "isEmailVerified": false,
        "isPhoneVerified": false,
        "isActive": true,
        "savedAddresses": [],
        "createdAt": "2026-04-19T11:41:36.205Z",
        "updatedAt": "2026-04-19T11:41:36.205Z",
        "__v": 0,
        "name": "Raushan Kumar",
        "id": "69e4bf70255d5cf7cfccae72"
    }
}

==========================address updated========================================

http://localhost:5000/api/users/addresses

{
    "success": true,
    "message": "Address added successfully",
    "data": {
        "_id": 1776599312877,
        "label": "Home",
        "address": "Street 1",
        "city": "Delhi",
        "state": "Delhi",
        "zipCode": "110001",
        "type": "home",
        "createdAt": "2026-04-19T11:48:32.877Z"
    }
}


==============================bookings=========================================

http://localhost:5000/api/bookings

{
    "success": false,
    "message": "Pickup location, drop location, and car type are required",
    "received": {
        "pickupLocation": {
            "latitude": 28.6139,
            "longitude": 77.209,
            "address": "Delhi"
        }
    }
}



///=================GET===================

http://localhost:5000/api/bookings

{
    "success": true,
    "data": {
        "bookings": [],
        "pagination": {
            "total": 0,
            "page": 1,
            "pages": 0,
            "limit": 10
        }
    }
}

===============POST /payments/create-order===============
METHOD: POST
URL: http://localhost:5000/api/bookings

{
    "success": true,
    "message": "Booking created successfully",
    "data": {
        "bookingId": "BK1776608722489",
        "user": {
            "_id": "69e4bf70255d5cf7cfccae72",
            "email": "raushan@test.com",
            "phone": "9876543216",
            "name": "undefined undefined",
            "id": "69e4bf70255d5cf7cfccae72"
        },
        "driver": null,
        "pickupLocation": {
            "address": "Delhi Central"
        },
        "dropLocation": {
            "address": "Delhi Airport Terminal 3"
        },
        "distance": 25.5,
        "duration": 0,
        "cabType": "economy",
        "rideType": "local",
        "airportType": null,
        "scheduledDate": "2026-04-20T00:00:00.000Z",
        "scheduledTime": "10:30",
        "pricing": {
            "baseFare": 50,
            "perKmRate": 10,
            "distanceCharge": 255,
            "nightCharge": 0,
            "waitingCharge": 0,
            "surgeCharge": 0,
            "gst": 0,
            "discount": 0,
            "totalFare": 305,
            "fixedCharge": 0,
            "parkingCharge": 0
        },
        "status": "pending",
        "paymentStatus": "pending",
        "paidAmount": 0,
        "paymentSchedule": "advance_20_on_booking",
        "paymentMethod": "online",
        "rideDetails": {
            "route": []
        },
        "passengerDetails": {
            "name": "Raushan Kumar",
            "phone": "9876543216"
        },
        "notifications": {
            "emailSent": false,
            "whatsappSent": false,
            "smsSent": false
        },
        "adminApproval": {
            "status": "pending",
            "approvedBy": null
        },
        "rideCompletion": {
            "completedBy": null
        },
        "_id": "69e4e5d28845bb25a9bea2ce",
        "createdAt": "2026-04-19T14:25:22.498Z",
        "updatedAt": "2026-04-19T14:25:22.498Z",
        "__v": 0
    }
}


==========================booking verfy=============================

{
    "success": true,
    "data": {
        "bookings": [],
        "pagination": {
            "total": 0,
            "page": 1,
            "pages": 0,
            "limit": 10
        }
    }
}


===============================http://localhost:5000/api/payments/create-order==================================


{
    "success": true,
    "data": {
        "orderId": "order_SfNwc7dchkU3yv",
        "amount": 30500,
        "currency": "INR",
        "keyId": "rzp_live_SBehtLlmBcVwrN"
    }
}


======================

{
    "success": true,
    "data": {
        "pickupLocation": {
            "address": "Delhi Central"
        },
        "dropLocation": {
            "address": "Delhi Airport Terminal 3"
        },
        "pricing": {
            "baseFare": 50,
            "perKmRate": 10,
            "distanceCharge": 255,
            "nightCharge": 0,
            "waitingCharge": 0,
            "surgeCharge": 0,
            "gst": 0,
            "discount": 0,
            "totalFare": 305,
            "fixedCharge": 0,
            "parkingCharge": 0
        },
        "rideDetails": {
            "route": []
        },
        "passengerDetails": {
            "name": "Raushan Kumar",
            "phone": "9876543216"
        },
        "notifications": {
            "emailSent": false,
            "whatsappSent": false,
            "smsSent": false
        },
        "adminApproval": {
            "status": "pending",
            "approvedBy": null
        },
        "rideCompletion": {
            "completedBy": null
        },
        "_id": "69e4e5d28845bb25a9bea2ce",
        "bookingId": "BK1776608722489",
        "user": {
            "_id": "69e4bf70255d5cf7cfccae72",
            "email": "raushan@test.com",
            "phone": "9876543216",
            "name": "undefined undefined",
            "id": "69e4bf70255d5cf7cfccae72"
        },
        "driver": null,
        "distance": 25.5,
        "duration": 0,
        "cabType": "economy",
        "rideType": "local",
        "airportType": null,
        "scheduledDate": "2026-04-20T00:00:00.000Z",
        "scheduledTime": "10:30",
        "status": "pending",
        "paymentStatus": "pending",
        "paidAmount": 0,
        "paymentSchedule": "advance_20_on_booking",
        "paymentMethod": "online",
        "createdAt": "2026-04-19T14:25:22.498Z",
        "updatedAt": "2026-04-19T14:25:22.498Z",
        "__v": 0
    }
}


========================cancellation======================================

{
    "success": true,
    "message": "Booking cancelled successfully",
    "data": {
        "booking": {
            "pickupLocation": {
                "address": "Delhi Central"
            },
            "dropLocation": {
                "address": "Delhi Airport Terminal 3"
            },
            "pricing": {
                "baseFare": 50,
                "perKmRate": 10,
                "distanceCharge": 255,
                "nightCharge": 0,
                "waitingCharge": 0,
                "surgeCharge": 0,
                "gst": 0,
                "discount": 0,
                "totalFare": 305,
                "fixedCharge": 0,
                "parkingCharge": 0
            },
            "rideDetails": {
                "route": []
            },
            "passengerDetails": {
                "name": "Raushan Kumar",
                "phone": "9876543216"
            },
            "cancellation": {
                "cancelledBy": "user",
                "reason": "No reason provided",
                "cancelledAt": "2026-04-19T14:36:24.345Z",
                "refundAmount": 305,
                "refundStatus": "pending"
            },
            "notifications": {
                "emailSent": false,
                "whatsappSent": false,
                "smsSent": false
            },
            "adminApproval": {
                "status": "pending",
                "approvedBy": null
            },
            "rideCompletion": {
                "completedBy": null
            },
            "_id": "69e4e5d28845bb25a9bea2ce",
            "bookingId": "BK1776608722489",
            "user": {
                "_id": "69e4bf70255d5cf7cfccae72",
                "email": "raushan@test.com",
                "phone": "9876543216",
                "name": "undefined undefined",
                "id": "69e4bf70255d5cf7cfccae72"
            },
            "driver": null,
            "distance": 25.5,
            "duration": 0,
            "cabType": "economy",
            "rideType": "local",
            "airportType": null,
            "scheduledDate": "2026-04-20T00:00:00.000Z",
            "scheduledTime": "10:30",
            "status": "cancelled",
            "paymentStatus": "pending",
            "paidAmount": 0,
            "paymentSchedule": "advance_20_on_booking",
            "paymentMethod": "online",
            "createdAt": "2026-04-19T14:25:22.498Z",
            "updatedAt": "2026-04-19T14:36:24.348Z",
            "__v": 0
        },
        "cancellationCharges": 0,
        "refundAmount": 305
    }
}


======================notification updated=====================
{
    "success": true,
    "message": "Notification settings updated successfully",
    "data": {
        "emailNotifications": false,
        "smsNotifications": true,
        "bookingUpdates": true,
        "promotionalEmails": false,
        "reviewRequests": true
    }
}


==================================forget password===========================

http://localhost:5000/api/users/change-password

{
  "currentPassword": "Test@1234",
  "newPassword": "NewPassword@5678"
}


{
    "success": true,
    "message": "Password changed successfully"
}


==============================adress upadte=============================

{
    "success": true,
    "message": "Address updated successfully",
    "data": {
        "_id": 1776599312877,
        "label": "Home",
        "address": "Street 1",
        "city": "Delhi",
        "state": "Delhi",
        "zipCode": "110001",
        "type": "home",
        "createdAt": "2026-04-19T11:48:32.877Z",
        "updatedAt": "2026-04-19T14:57:16.772Z",
        "id": "1776599312877"
    }
}


=====================feedback============================================


{
    "success": true,
    "message": "Feedback submitted successfully",
    "data": {
        "_id": "69e4ee1c35fe72ae17d4e72c"
    }
}


================booking testing======================================

{
    "success": true,
    "message": "Booking created successfully",
    "data": {
        "bookingId": "BK1776612613836",
        "user": {
            "_id": "69e4bf70255d5cf7cfccae72",
            "email": "raushan@test.com",
            "phone": "9876543216",
            "name": "undefined undefined",
            "id": "69e4bf70255d5cf7cfccae72"
        },
        "driver": null,
        "pickupLocation": {
            "address": "Delhi Central Station"
        },
        "dropLocation": {
            "address": "Delhi Airport Terminal 3"
        },
        "distance": 25.5,
        "duration": 0,
        "cabType": "economy",
        "rideType": "local",
        "airportType": null,
        "scheduledDate": "2026-04-20T00:00:00.000Z",
        "scheduledTime": "10:30",
        "pricing": {
            "baseFare": 50,
            "perKmRate": 10,
            "distanceCharge": 255,
            "nightCharge": 0,
            "waitingCharge": 0,
            "surgeCharge": 0,
            "gst": 0,
            "discount": 0,
            "totalFare": 305,
            "fixedCharge": 0,
            "parkingCharge": 0
        },
        "status": "pending",
        "paymentStatus": "pending",
        "paidAmount": 0,
        "paymentSchedule": "advance_20_on_booking",
        "paymentMethod": "online",
        "rideDetails": {
            "route": []
        },
        "passengerDetails": {
            "name": "Raushan Kumar",
            "phone": "9876543216"
        },
        "notifications": {
            "emailSent": false,
            "whatsappSent": false,
            "smsSent": false
        },
        "adminApproval": {
            "status": "pending",
            "approvedBy": null
        },
        "rideCompletion": {
            "completedBy": null
        },
        "_id": "69e4f50535fe72ae17d4e746",
        "createdAt": "2026-04-19T15:30:13.841Z",
        "updatedAt": "2026-04-19T15:30:13.841Z",
        "__v": 0
    }
}