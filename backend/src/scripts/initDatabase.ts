#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes the AIPC database with:
 * - All required tables and relationships
 * - Default configuration data
 * - Sample data for development and testing
 */

import { config } from '../config';
import { 
  initializeDatabase, 
  createDefaultData, 
  checkDatabaseHealth,
  User,
  Patient,
  MarketplaceApplication,
  Provider,
  Order,
  Bid,
  AlgorithmConfiguration,
  UserRole,
  BusinessType,
  ApplicationStatus,
  ProviderType,
  OrderType,
  OrderStatus,
  BidStatus
} from '../models';

// Command line arguments
const args = process.argv.slice(2);
const shouldForce = args.includes('--force');
const shouldSeed = args.includes('--seed');
const shouldCheck = args.includes('--check');

async function main() {
  try {
    console.log('🚀 AIPC Database Initialization');
    console.log('================================');
    
    if (shouldCheck) {
      console.log('🔍 Checking database health...');
      const health = await checkDatabaseHealth();
      console.log('Database Health Report:');
      console.log(`  Connected: ${health.connected ? '✅' : '❌'}`);
      console.log(`  Tables Exist: ${health.tablesExist ? '✅' : '❌'}`);
      console.log('  Record Counts:');
      Object.entries(health.recordCounts).forEach(([table, count]) => {
        console.log(`    ${table}: ${count}`);
      });
      return;
    }

    // Initialize database
    console.log(`🔄 Initializing database${shouldForce ? ' (FORCE MODE - will drop existing tables)' : ''}...`);
    await initializeDatabase(shouldForce);

    // Create default data
    console.log('🔄 Creating default configuration...');
    await createDefaultData();

    // Create sample data if requested
    if (shouldSeed) {
      console.log('🌱 Creating sample data for development...');
      await createSampleData();
    }

    // Final health check
    console.log('🔍 Final health check...');
    const health = await checkDatabaseHealth();
    console.log('✅ Database initialization completed successfully!');
    console.log('\n📊 Database Summary:');
    Object.entries(health.recordCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('  1. Start the backend server: npm run dev');
    console.log('  2. Test API endpoints with the provided examples');
    console.log('  3. Access admin panel with: admin@aipc.com / admin123!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function createSampleData() {
  try {
    // Create sample patients
    const patientUser1 = await User.create({
      email: 'patient1@example.com',
      password: 'patient123!',
      role: UserRole.PATIENT,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0101',
      isActive: true,
      isEmailVerified: true,
    });

    const patient1 = await Patient.create({
      userId: patientUser1.id,
      dateOfBirth: new Date('1985-06-15'),
      gender: 'male',
      address: '123 Main St, Anytown, ST 12345',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+1-555-0102',
      allergies: ['penicillin', 'shellfish'],
      currentMedications: ['lisinopril 10mg'],
      preferredLanguage: 'en',
    });

    const patientUser2 = await User.create({
      email: 'patient2@example.com',
      password: 'patient123!',
      role: UserRole.PATIENT,
      firstName: 'Sarah',
      lastName: 'Smith',
      phone: '+1-555-0201',
      isActive: true,
      isEmailVerified: true,
    });

    const patient2 = await Patient.create({
      userId: patientUser2.id,
      dateOfBirth: new Date('1992-03-22'),
      gender: 'female',
      address: '456 Oak Ave, Somewhere, ST 67890',
      emergencyContactName: 'Mike Smith',
      emergencyContactPhone: '+1-555-0202',
      allergies: ['latex'],
      currentMedications: [],
      preferredLanguage: 'en',
    });

    // Create sample marketplace applications
    const pharmacyApp = await MarketplaceApplication.create({
      businessType: BusinessType.PHARMACY,
      businessName: 'HealthPlus Pharmacy',
      address: '789 Health Blvd, Medical District, ST 11111',
      contactEmail: 'contact@healthplus.com',
      contactPhone: '+1-555-0301',
      website: 'https://healthplus.com',
      pharmacyServices: 'Prescription dispensing, vaccinations, health screenings',
      prescriptionDelivery: true,
      regulatoryComplianceNotes: 'Licensed pharmacy with DEA registration',
      attestedCompliance: true,
      serviceRegion: 'Metro Area',
      status: ApplicationStatus.APPROVED,
    });

    const labApp = await MarketplaceApplication.create({
      businessType: BusinessType.LAB,
      businessName: 'QuickLab Diagnostics',
      address: '321 Science Park, Research City, ST 22222',
      contactEmail: 'info@quicklab.com',
      contactPhone: '+1-555-0401',
      website: 'https://quicklab.com',
      labTestTypes: 'Blood work, urinalysis, imaging, molecular diagnostics',
      labCertifications: 'CLIA certified, CAP accredited',
      regulatoryComplianceNotes: 'Full CLIA compliance with CAP accreditation',
      attestedCompliance: true,
      serviceRegion: 'Statewide',
      status: ApplicationStatus.APPROVED,
    });

    // Create providers from approved applications
    const pharmacyProvider = await Provider.create({
      applicationId: pharmacyApp.id,
      type: ProviderType.PHARMACY,
      name: pharmacyApp.businessName,
      address: pharmacyApp.address,
      serviceRegion: pharmacyApp.serviceRegion!,
      contactEmail: pharmacyApp.contactEmail,
      contactPhone: pharmacyApp.contactPhone,
      website: pharmacyApp.website,
      servicesOffered: ['Prescription Dispensing', 'Vaccinations', 'Health Screenings'],
      offersDelivery: true,
      deliveryRadius: 25,
      averageRating: 4.5,
      totalRatings: 127,
      slaCompliance: 95.2,
      qualityScore: 'A+',
      isActive: true,
      acceptingNewOrders: true,
      currentCapacity: 15,
      maxCapacity: 50,
    });

    const labProvider = await Provider.create({
      applicationId: labApp.id,
      type: ProviderType.LAB,
      name: labApp.businessName,
      address: labApp.address,
      serviceRegion: labApp.serviceRegion!,
      contactEmail: labApp.contactEmail,
      contactPhone: labApp.contactPhone,
      website: labApp.website,
      servicesOffered: ['Blood Work', 'Urinalysis', 'Imaging', 'Molecular Diagnostics'],
      testsOffered: ['CBC', 'CMP', 'Lipid Panel', 'HbA1c', 'TSH', 'Urinalysis'],
      avgTurnaroundTimeHours: 24,
      averageRating: 4.8,
      totalRatings: 89,
      slaCompliance: 98.1,
      qualityScore: 'A+',
      isActive: true,
      acceptingNewOrders: true,
      currentCapacity: 8,
      maxCapacity: 25,
    });

    // Create sample orders
    const pharmacyOrder = await Order.create({
      patientId: patient1.id,
      type: OrderType.PHARMACY,
      status: OrderStatus.COMPLETED,
      requestingDoctorName: 'Dr. Emily Johnson',
      clinicAddress: '555 Medical Center Dr, Healthcare City, ST 33333',
      clinicLicense: 'MD-12345',
      prescriptionData: {
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            instructions: 'Take twice daily with food',
            quantity: 20,
          },
          {
            name: 'Ibuprofen',
            dosage: '200mg',
            instructions: 'Take as needed for pain',
            quantity: 30,
          }
        ]
      },
      assignedProviderId: pharmacyProvider.id,
      totalAmount: 45.99,
      currency: 'USD',
      paymentStatus: 'completed',
      completedAt: new Date(),
    });

    const labOrder = await Order.create({
      patientId: patient2.id,
      type: OrderType.LAB,
      status: OrderStatus.IN_PROGRESS,
      requestingDoctorName: 'Dr. Michael Chen',
      clinicAddress: '777 Wellness Way, Health Town, ST 44444',
      clinicLicense: 'MD-67890',
      testData: {
        tests: [
          {
            name: 'Complete Blood Count (CBC)',
            reason: 'Routine health screening',
          },
          {
            name: 'Comprehensive Metabolic Panel (CMP)',
            reason: 'Monitor kidney and liver function',
          }
        ]
      },
      assignedProviderId: labProvider.id,
      totalAmount: 125.00,
      currency: 'USD',
      paymentStatus: 'pending',
      preTestInstructions: 'Fast for 12 hours before blood draw',
    });

    // Create sample bids
    await Bid.create({
      orderId: pharmacyOrder.id,
      providerId: pharmacyProvider.id,
      bidAmount: 45.99,
      currency: 'USD',
      estimatedDeliveryTime: 'Same day',
      notes: 'All medications in stock, can deliver within 4 hours',
      status: BidStatus.ACCEPTED,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    await Bid.create({
      orderId: labOrder.id,
      providerId: labProvider.id,
      bidAmount: 125.00,
      currency: 'USD',
      estimatedTurnaroundTime: '24 hours',
      notes: 'Standard processing time, results available online',
      status: BidStatus.ACCEPTED,
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    });

    console.log('✅ Sample data created successfully!');
    console.log('📧 Sample patient accounts:');
    console.log('  - patient1@example.com / patient123!');
    console.log('  - patient2@example.com / patient123!');

  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { main as initializeDatabase };
