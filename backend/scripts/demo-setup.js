#!/usr/bin/env node

/**
 * Demo Setup Script
 * Creates sample users, patients, providers, and orders for demonstration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authTokens = {};

// Demo users data
const demoUsers = [
  {
    email: 'admin@aipc.com',
    password: 'Admin123!',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin'
  },
  {
    email: 'dr.smith@aipc.com',
    password: 'Doctor123!',
    firstName: 'John',
    lastName: 'Smith',
    role: 'doctor'
  },
  {
    email: 'patient1@example.com',
    password: 'Patient123!',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'patient'
  },
  {
    email: 'patient2@example.com',
    password: 'Patient123!',
    firstName: 'Bob',
    lastName: 'Wilson',
    role: 'patient'
  },
  {
    email: 'pharmacy@citycare.com',
    password: 'Pharmacy123!',
    firstName: 'Sarah',
    lastName: 'Davis',
    role: 'pharmacy_staff'
  },
  {
    email: 'lab@quicklab.com',
    password: 'Lab123!',
    firstName: 'Mike',
    lastName: 'Chen',
    role: 'lab_staff'
  }
];

// Demo patient profiles
const demoPatients = [
  {
    dateOfBirth: '1985-03-15',
    gender: 'female',
    phone: '+1-555-0101',
    address: '123 Main St, Boston, MA 02101',
    emergencyContact: 'John Johnson (Husband)',
    emergencyPhone: '+1-555-0102',
    allergies: ['Penicillin', 'Shellfish'],
    currentMedications: ['Lisinopril 10mg', 'Metformin 500mg'],
    preferredLanguage: 'en',
    medicalHistory: {
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      surgeries: ['Appendectomy (2010)'],
      familyHistory: ['Heart Disease (Father)', 'Diabetes (Mother)']
    },
    insuranceInfo: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BC123456789',
      groupNumber: 'GRP001'
    }
  },
  {
    dateOfBirth: '1978-11-22',
    gender: 'male',
    phone: '+1-555-0201',
    address: '456 Oak Ave, Cambridge, MA 02139',
    emergencyContact: 'Mary Wilson (Wife)',
    emergencyPhone: '+1-555-0202',
    allergies: ['Aspirin'],
    currentMedications: ['Atorvastatin 20mg'],
    preferredLanguage: 'en',
    medicalHistory: {
      conditions: ['High Cholesterol'],
      surgeries: [],
      familyHistory: ['Heart Disease (Father)']
    },
    insuranceInfo: {
      provider: 'Aetna',
      policyNumber: 'AET987654321',
      groupNumber: 'GRP002'
    }
  }
];

// Demo providers
const demoProviders = [
  {
    name: 'City Care Pharmacy',
    type: 'pharmacy',
    address: '789 Health Blvd, Boston, MA 02101',
    phone: '+1-555-0301',
    email: 'info@citycare.com',
    licenseNumber: 'PH-MA-001234',
    servicesOffered: ['Prescription Dispensing', 'Delivery', 'Consultation'],
    operatingHours: {
      monday: '8:00-20:00',
      tuesday: '8:00-20:00',
      wednesday: '8:00-20:00',
      thursday: '8:00-20:00',
      friday: '8:00-20:00',
      saturday: '9:00-18:00',
      sunday: '10:00-16:00'
    },
    acceptingNewOrders: true,
    averageRating: 4.7,
    totalOrders: 1250,
    completedOrders: 1198
  },
  {
    name: 'QuickLab Diagnostics',
    type: 'lab',
    address: '321 Science Dr, Cambridge, MA 02139',
    phone: '+1-555-0401',
    email: 'info@quicklab.com',
    licenseNumber: 'LAB-MA-005678',
    testsOffered: ['Blood Work', 'Urinalysis', 'Lipid Panel', 'HbA1c', 'CBC'],
    operatingHours: {
      monday: '7:00-17:00',
      tuesday: '7:00-17:00',
      wednesday: '7:00-17:00',
      thursday: '7:00-17:00',
      friday: '7:00-17:00',
      saturday: '8:00-14:00',
      sunday: 'Closed'
    },
    acceptingNewOrders: true,
    averageRating: 4.5,
    avgTurnaroundTimeHours: 24,
    totalOrders: 890,
    completedOrders: 867
  }
];

async function createUser(userData) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    console.log(`✅ Created user: ${userData.email}`);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  User already exists: ${userData.email}`);
      // Try to login instead
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      return loginResponse.data.data;
    }
    throw error;
  }
}

async function createPatientProfile(patientData, userToken) {
  try {
    const response = await axios.post(`${BASE_URL}/patients`, patientData, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log(`✅ Created patient profile for user`);
    return response.data.data;
  } catch (error) {
    console.log(`⚠️  Patient profile may already exist`);
    return null;
  }
}

async function setupDemo() {
  console.log('🚀 Setting up AI-Powered Care Demo Environment...\n');

  try {
    // Create users and get tokens
    console.log('👥 Creating demo users...');
    for (let i = 0; i < demoUsers.length; i++) {
      const userData = demoUsers[i];
      const result = await createUser(userData);
      authTokens[userData.role] = result.token;
      
      // Create patient profiles for patient users
      if (userData.role === 'patient' && i < demoPatients.length) {
        await createPatientProfile(demoPatients[i], result.token);
      }
    }

    console.log('\n📊 Demo Environment Setup Complete!');
    console.log('\n🔑 Demo User Accounts:');
    console.log('Admin: admin@aipc.com / Admin123!');
    console.log('Doctor: dr.smith@aipc.com / Doctor123!');
    console.log('Patient 1: patient1@example.com / Patient123!');
    console.log('Patient 2: patient2@example.com / Patient123!');
    console.log('Pharmacy: pharmacy@citycare.com / Pharmacy123!');
    console.log('Lab: lab@quicklab.com / Lab123!');

    console.log('\n🎯 Ready for Demo! Use the following endpoints:');
    console.log('Health Check: GET http://localhost:5000/health');
    console.log('API Docs: GET http://localhost:5000/api');
    console.log('Login: POST http://localhost:5000/api/auth/login');

  } catch (error) {
    console.error('❌ Demo setup failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDemo();
}

module.exports = { setupDemo, demoUsers, authTokens };
