# AI-Powered Care Backend API Reference

## Overview

The AI-Powered Care Backend provides a comprehensive RESTful API for healthcare marketplace operations, patient management, and AI-powered medical assistance features.

**Base URL**: `https://api.aipc.com/api/v1`  
**Authentication**: Bearer JWT tokens  
**Content-Type**: `application/json`

## Authentication

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient",
  "phone": "+1-555-0123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/login
Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "patient",
      "lastLogin": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/refresh-token
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET /auth/profile
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "phone": "+1-555-0123",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

## Patient Management

### GET /patients/me
Get current patient's profile and medical information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "dateOfBirth": "1985-03-15",
    "gender": "female",
    "phone": "+1-555-0123",
    "address": "123 Main St, Boston, MA 02101",
    "emergencyContact": "John Doe (Husband)",
    "emergencyPhone": "+1-555-0124",
    "allergies": ["Penicillin", "Shellfish"],
    "currentMedications": ["Lisinopril 10mg", "Metformin 500mg"],
    "medicalHistory": {
      "conditions": ["Hypertension", "Type 2 Diabetes"],
      "surgeries": ["Appendectomy (2010)"],
      "familyHistory": ["Heart Disease (Father)"]
    },
    "insuranceInfo": {
      "provider": "Blue Cross Blue Shield",
      "policyNumber": "BC123456789"
    }
  }
}
```

### PUT /patients/me
Update current patient's profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "phone": "+1-555-0199",
  "address": "456 Oak Ave, Boston, MA 02101",
  "emergencyContact": "Jane Doe (Sister)",
  "allergies": ["Penicillin", "Shellfish", "Latex"]
}
```

### GET /patients/:id (Doctor/Admin only)
Get specific patient's information.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (string): Patient UUID

## AI-Powered Features

### POST /symptom-checker
Analyze symptoms and provide AI-powered recommendations.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "symptoms": ["headache", "fever", "fatigue"],
  "duration": "2 days",
  "severity": "moderate",
  "patientAge": 35,
  "patientGender": "female",
  "medicalHistory": ["hypertension"],
  "currentMedications": ["lisinopril"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "possibleConditions": [
      {
        "condition": "Viral Upper Respiratory Infection",
        "probability": 0.75,
        "severity": "mild",
        "description": "Common cold or flu-like illness"
      },
      {
        "condition": "Bacterial Sinusitis",
        "probability": 0.45,
        "severity": "moderate",
        "description": "Bacterial infection of the sinuses"
      }
    ],
    "recommendations": [
      "Rest and increase fluid intake",
      "Monitor temperature regularly",
      "Consider over-the-counter pain relievers",
      "Seek medical attention if symptoms worsen"
    ],
    "urgencyLevel": "low",
    "suggestedActions": [
      "Self-care at home",
      "Schedule routine appointment if no improvement in 3-5 days"
    ],
    "redFlags": [
      "Difficulty breathing",
      "Severe headache",
      "High fever (>101.5°F)"
    ]
  }
}
```

### POST /treatment-plans
Generate comprehensive treatment plans (Doctor only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "patientId": "uuid",
  "diagnosis": "Hypertension",
  "symptoms": ["elevated blood pressure", "headaches"],
  "patientProfile": {
    "age": 45,
    "gender": "male",
    "weight": 180,
    "allergies": ["ACE inhibitors"],
    "currentMedications": ["Metformin"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "treatmentPlanId": "uuid",
    "diagnosis": "Hypertension",
    "medications": [
      {
        "name": "Amlodipine",
        "dosage": "5mg",
        "frequency": "once daily",
        "duration": "ongoing",
        "instructions": "Take with or without food"
      }
    ],
    "lifestyle": [
      "Reduce sodium intake to <2300mg daily",
      "Regular exercise 30 minutes, 5 days per week",
      "Weight management if BMI >25"
    ],
    "monitoring": [
      "Blood pressure checks twice weekly",
      "Follow-up appointment in 4 weeks",
      "Lab work in 3 months"
    ],
    "patientEducation": [
      "Understanding hypertension and its risks",
      "Proper blood pressure monitoring technique",
      "Medication adherence importance"
    ]
  }
}
```

### POST /doctor-assist
AI assistance for healthcare providers.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "requestType": "differential_diagnosis",
  "patientSymptoms": "chest pain, shortness of breath",
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 95,
    "temperature": 98.6,
    "oxygenSaturation": 97
  },
  "patientHistory": {
    "age": 55,
    "gender": "male",
    "medicalHistory": ["diabetes", "smoking history"]
  }
}
```

## Order Management

### POST /orders
Create a new healthcare service order.

**Headers:** `Authorization: Bearer <token>`

**Request Body (Pharmacy Order):**
```json
{
  "type": "pharmacy",
  "prescriptionData": {
    "medications": [
      {
        "name": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "3 times daily",
        "duration": "7 days",
        "quantity": 21
      }
    ],
    "prescribingDoctor": "Dr. John Smith",
    "prescriptionDate": "2024-01-15",
    "notes": "Take with food to reduce stomach upset"
  },
  "deliveryAddress": "123 Main St, Boston, MA 02101",
  "deliveryInstructions": "Leave at front door",
  "urgency": "standard",
  "insuranceInfo": {
    "provider": "Blue Cross Blue Shield",
    "policyNumber": "BC123456789"
  }
}
```

**Request Body (Lab Order):**
```json
{
  "type": "lab",
  "testData": {
    "tests": [
      {
        "name": "Complete Blood Count",
        "code": "CBC",
        "urgency": "routine"
      },
      {
        "name": "Comprehensive Metabolic Panel",
        "code": "CMP",
        "urgency": "routine"
      }
    ],
    "requestingDoctor": "Dr. Jane Smith",
    "clinicInfo": {
      "name": "Boston Medical Center",
      "address": "1 Boston Medical Center Pl, Boston, MA 02118",
      "phone": "+1-617-638-8000"
    },
    "orderDate": "2024-01-15"
  },
  "patientInstructions": "Fasting required - no food or drink except water for 12 hours",
  "urgency": "routine"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "type": "pharmacy",
    "status": "pending_broadcast",
    "patientId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "estimatedCompletion": "2024-01-16T14:00:00Z",
    "trackingNumber": "AIPC-2024-001234"
  }
}
```

### GET /orders
Get list of orders for current user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string): Filter by order status
- `type` (string): Filter by order type (pharmacy/lab)
- `limit` (number): Number of results (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "uuid",
        "type": "pharmacy",
        "status": "in_progress",
        "createdAt": "2024-01-15T10:30:00Z",
        "assignedProvider": {
          "name": "City Care Pharmacy",
          "address": "789 Health Blvd, Boston, MA 02101"
        },
        "estimatedCompletion": "2024-01-16T14:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### GET /orders/:id
Get detailed information about a specific order.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (string): Order UUID

### PUT /orders/:id/status
Update order status (Provider only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "ready_for_pickup",
  "notes": "Prescription ready for pickup at pharmacy counter",
  "estimatedCompletion": "2024-01-16T16:00:00Z"
}
```

## Provider Management

### GET /providers
Get list of healthcare providers.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (string): Provider type (pharmacy/lab)
- `location` (string): Geographic filter
- `services` (string): Service filter
- `rating` (number): Minimum rating filter

### POST /providers/match
Find matching providers for an order (Algorithm-based).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderType": "pharmacy",
  "location": {
    "latitude": 42.3601,
    "longitude": -71.0589,
    "radius": 10
  },
  "requirements": {
    "deliveryRequired": true,
    "urgency": "standard",
    "specialServices": ["compounding"]
  },
  "preferences": {
    "priceWeight": 0.4,
    "speedWeight": 0.3,
    "qualityWeight": 0.3
  }
}
```

## Error Responses

All API endpoints return standardized error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **AI-powered endpoints**: 20 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

List endpoints support pagination with the following parameters:
- `limit`: Number of items per page (max 100, default 20)
- `offset`: Number of items to skip (default 0)

Pagination information is included in the response metadata.
