#!/bin/bash

# AI-Powered Care Backend API Demo Script
# This script demonstrates all major API endpoints with sample data

BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN=""
PATIENT_TOKEN=""
DOCTOR_TOKEN=""

echo "🚀 AI-Powered Care Backend API Demo"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls and display results
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    echo -e "\n${BLUE}📡 $description${NC}"
    echo -e "${YELLOW}$method $BASE_URL$endpoint${NC}"
    
    if [ -n "$data" ] && [ -n "$token" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data")
    elif [ -n "$token" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token")
    elif [ -n "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint")
    fi
    
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo "----------------------------------------"
}

# Check if server is running
echo -e "\n${BLUE}🔍 Checking server status...${NC}"
health_response=$(curl -s "$BASE_URL/../health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server is running${NC}"
    echo "$health_response" | jq '.'
else
    echo -e "${RED}❌ Server is not running. Please start with 'npm run dev'${NC}"
    exit 1
fi

# 1. Authentication Demo
echo -e "\n${BLUE}🔐 AUTHENTICATION DEMO${NC}"
echo "========================"

# Admin Login
admin_login_data='{
    "email": "admin@aipc.com",
    "password": "Admin123!"
}'

api_call "POST" "/auth/login" "$admin_login_data" "" "Admin Login"
ADMIN_TOKEN=$(echo "$response" | jq -r '.data.token // empty')

# Patient Login
patient_login_data='{
    "email": "patient1@example.com",
    "password": "Patient123!"
}'

api_call "POST" "/auth/login" "$patient_login_data" "" "Patient Login"
PATIENT_TOKEN=$(echo "$response" | jq -r '.data.token // empty')

# Doctor Login
doctor_login_data='{
    "email": "dr.smith@aipc.com",
    "password": "Doctor123!"
}'

api_call "POST" "/auth/login" "$doctor_login_data" "" "Doctor Login"
DOCTOR_TOKEN=$(echo "$response" | jq -r '.data.token // empty')

# Get User Profile
api_call "GET" "/auth/profile" "" "$PATIENT_TOKEN" "Get Patient Profile"

# 2. Patient Management Demo
echo -e "\n${BLUE}👤 PATIENT MANAGEMENT DEMO${NC}"
echo "============================"

# Get Patient Details
api_call "GET" "/patients/me" "" "$PATIENT_TOKEN" "Get My Patient Details"

# Update Patient Profile
patient_update_data='{
    "phone": "+1-555-0199",
    "emergencyContact": "Updated Emergency Contact"
}'

api_call "PUT" "/patients/me" "$patient_update_data" "$PATIENT_TOKEN" "Update Patient Profile"

# 3. AI-Powered Features Demo
echo -e "\n${BLUE}🤖 AI-POWERED FEATURES DEMO${NC}"
echo "============================="

# Symptom Checker
symptom_data='{
    "symptoms": ["headache", "fever", "fatigue"],
    "duration": "2 days",
    "severity": "moderate",
    "patientAge": 35,
    "patientGender": "female",
    "medicalHistory": ["hypertension"]
}'

api_call "POST" "/symptom-checker" "$symptom_data" "$PATIENT_TOKEN" "AI Symptom Analysis"

# Treatment Plan Generation
treatment_data='{
    "symptoms": ["persistent cough", "shortness of breath"],
    "diagnosis": "possible respiratory infection",
    "patientProfile": {
        "age": 35,
        "gender": "female",
        "allergies": ["penicillin"],
        "currentMedications": ["lisinopril"]
    }
}'

api_call "POST" "/treatment-plans" "$treatment_data" "$DOCTOR_TOKEN" "Generate Treatment Plan"

# 4. Order Management Demo
echo -e "\n${BLUE}📋 ORDER MANAGEMENT DEMO${NC}"
echo "=========================="

# Create Pharmacy Order
pharmacy_order_data='{
    "type": "pharmacy",
    "patientId": "patient-id-here",
    "prescriptionData": {
        "medications": [
            {
                "name": "Amoxicillin",
                "dosage": "500mg",
                "frequency": "3 times daily",
                "duration": "7 days"
            }
        ],
        "prescribingDoctor": "Dr. John Smith",
        "notes": "Take with food"
    },
    "deliveryAddress": "123 Main St, Boston, MA 02101",
    "urgency": "standard"
}'

api_call "POST" "/orders" "$pharmacy_order_data" "$PATIENT_TOKEN" "Create Pharmacy Order"

# Create Lab Order
lab_order_data='{
    "type": "lab",
    "patientId": "patient-id-here",
    "testData": {
        "tests": [
            {
                "name": "Complete Blood Count",
                "code": "CBC",
                "urgency": "routine"
            },
            {
                "name": "Lipid Panel",
                "code": "LIPID",
                "urgency": "routine"
            }
        ],
        "requestingDoctor": "Dr. John Smith",
        "clinicInfo": {
            "name": "Boston Medical Center",
            "address": "1 Boston Medical Center Pl, Boston, MA 02118"
        }
    },
    "notes": "Fasting required for lipid panel"
}'

api_call "POST" "/orders" "$lab_order_data" "$PATIENT_TOKEN" "Create Lab Order"

# Get Orders List
api_call "GET" "/orders?limit=10" "" "$PATIENT_TOKEN" "Get Patient Orders"

# 5. Provider Management Demo (Admin)
echo -e "\n${BLUE}🏥 PROVIDER MANAGEMENT DEMO${NC}"
echo "============================="

# Get Providers List
api_call "GET" "/providers?type=pharmacy&limit=5" "" "$ADMIN_TOKEN" "Get Pharmacy Providers"

# Get Provider Details
api_call "GET" "/providers/search?query=City Care&type=pharmacy" "" "$ADMIN_TOKEN" "Search Providers"

# 6. Marketplace Demo
echo -e "\n${BLUE}🏪 MARKETPLACE DEMO${NC}"
echo "==================="

# Get Marketplace Applications
api_call "GET" "/marketplace/applications?status=pending" "" "$ADMIN_TOKEN" "Get Pending Applications"

# Provider Matching Demo
matching_data='{
    "orderType": "pharmacy",
    "location": {
        "latitude": 42.3601,
        "longitude": -71.0589
    },
    "requirements": {
        "deliveryRequired": true,
        "urgency": "standard"
    }
}'

api_call "POST" "/providers/match" "$matching_data" "$ADMIN_TOKEN" "Provider Matching Algorithm"

# 7. Configuration Demo (Admin)
echo -e "\n${BLUE}⚙️ CONFIGURATION DEMO${NC}"
echo "====================="

# Get Algorithm Configuration
api_call "GET" "/config/algorithm" "" "$ADMIN_TOKEN" "Get Algorithm Configuration"

# Update Algorithm Weights
algorithm_config='{
    "priceWeight": 0.4,
    "speedWeight": 0.3,
    "qualityWeight": 0.3,
    "serviceType": "pharmacy"
}'

api_call "PUT" "/config/algorithm" "$algorithm_config" "$ADMIN_TOKEN" "Update Algorithm Configuration"

# 8. Analytics Demo
echo -e "\n${BLUE}📊 ANALYTICS DEMO${NC}"
echo "=================="

# Get User Statistics
api_call "GET" "/analytics/users" "" "$ADMIN_TOKEN" "Get User Statistics"

# Get Order Statistics
api_call "GET" "/analytics/orders?period=30days" "" "$ADMIN_TOKEN" "Get Order Statistics"

# Get Provider Performance
api_call "GET" "/analytics/providers/performance" "" "$ADMIN_TOKEN" "Get Provider Performance"

echo -e "\n${GREEN}🎉 Demo Complete!${NC}"
echo "=================="
echo -e "${BLUE}Key Features Demonstrated:${NC}"
echo "✅ Multi-role Authentication (Admin, Doctor, Patient)"
echo "✅ Patient Profile Management"
echo "✅ AI-Powered Symptom Checking"
echo "✅ Treatment Plan Generation"
echo "✅ Order Management (Pharmacy & Lab)"
echo "✅ Provider Matching Algorithm"
echo "✅ Marketplace Operations"
echo "✅ Configuration Management"
echo "✅ Analytics and Reporting"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Explore the API documentation at http://localhost:5000/api"
echo "2. Test additional endpoints using Postman or curl"
echo "3. Review the comprehensive test suite with 'npm test'"
echo "4. Deploy to staging environment using Docker"
