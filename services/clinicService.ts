
import { Clinic } from '../types';

const mockClinics: Clinic[] = [
  {
    id: 'clinic1',
    name: 'City Central Clinic',
    address: '123 Main St, Anytown',
    specialty: 'General Practice',
    distance: '1.2 km',
    waitTime: '10 min',
    rating: 4.7,
    acceptsProvisionalCondition: (condition) => condition ? !condition.toLowerCase().includes("rare") : true,
  },
  {
    id: 'clinic2',
    name: 'Wellness Grove Hospital',
    address: '456 Oak Ave, Anytown',
    specialty: 'Internal Medicine',
    distance: '3.5 km',
    waitTime: '25 min',
    rating: 4.9,
    acceptsProvisionalCondition: () => true,
  },
  {
    id: 'clinic3',
    name: 'QuickCare Urgent Care',
    address: '789 Pine Ln, Anytown',
    specialty: 'Urgent Care',
    distance: '0.8 km',
    waitTime: '5 min',
    rating: 4.3,
    acceptsProvisionalCondition: (condition) => condition ? !condition.toLowerCase().includes("complex chronic") : true,
  },
  {
    id: 'clinic4',
    name: 'Suburban Family Health',
    address: '101 Maple Dr, Suburbia',
    specialty: 'Family Medicine',
    distance: '5.1 km',
    waitTime: '20 min',
    rating: 4.5,
    acceptsProvisionalCondition: () => true,
  },
  {
    id: 'clinic5',
    name: 'Advanced Diagnostics Center',
    address: '202 Birch Rd, Anytown',
    specialty: 'Diagnostics & Specialists',
    distance: '2.0 km',
    waitTime: '30 min',
    rating: 4.6,
    acceptsProvisionalCondition: (condition) => condition ? condition.toLowerCase().includes("specific") || condition.toLowerCase().includes("referral") : true,
  }
];

export const fetchClinics = async (provisionalCondition: string | null): Promise<Clinic[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter clinics that might be suitable for the condition (simplified logic)
  return mockClinics.filter(clinic => clinic.acceptsProvisionalCondition(provisionalCondition));
};
