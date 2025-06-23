import React, { useState } from 'react';
import { BusinessType, MarketplaceApplication } from '../types';

interface MarketplaceOnboardingFormStageProps {
  businessType: BusinessType;
  onSubmit: (application: MarketplaceApplication) => void;
  onBack: () => void;
}

const MarketplaceOnboardingFormStage: React.FC<MarketplaceOnboardingFormStageProps> = ({ businessType, onSubmit, onBack }) => {
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [regulatoryComplianceNotes, setRegulatoryComplianceNotes] = useState('');
  const [serviceRegion, setServiceRegion] = useState('');
  const [attestedCompliance, setAttestedCompliance] = useState(false);

  // Business type specific fields
  const [clinicSpecialties, setClinicSpecialties] = useState('');
  const [doctorCount, setDoctorCount] = useState('');
  const [labTestTypes, setLabTestTypes] = useState('');
  const [labCertifications, setLabCertifications] = useState('');
  const [pharmacyServices, setPharmacyServices] = useState('');
  const [prescriptionDelivery, setPrescriptionDelivery] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!businessName || !address || !contactEmail || !contactPhone || !regulatoryComplianceNotes || !serviceRegion) {
      setFormError('Please fill in all required common fields.');
      return;
    }
    if (!attestedCompliance) {
        setFormError('You must attest to regulatory compliance.');
        return;
    }
    
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(contactEmail)) {
        setFormError('Please enter a valid contact email address.');
        return;
    }

    const applicationData: MarketplaceApplication = {
      businessType,
      businessName,
      address,
      contactEmail,
      contactPhone,
      website,
      regulatoryComplianceNotes,
      serviceRegion,
      attestedCompliance,
      ...(businessType === BusinessType.CLINIC && { clinicSpecialties, doctorCount }),
      ...(businessType === BusinessType.LAB && { labTestTypes, labCertifications }),
      ...(businessType === BusinessType.PHARMACY && { pharmacyServices, prescriptionDelivery }),
    };
    onSubmit(applicationData);
  };

  const commonFields = (
    <>
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-1">Business Name*</label>
        <input type="text" id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Full Address*</label>
        <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} required rows={3} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 custom-scrollbar" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 mb-1">Contact Email*</label>
          <input type="email" id="contactEmail" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-700 mb-1">Contact Phone*</label>
          <input type="tel" id="contactPhone" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-1">Website (Optional)</label>
        <input type="url" id="website" value={website} onChange={e => setWebsite(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="serviceRegion" className="block text-sm font-medium text-slate-700 mb-1">Primary Service Region(s)*</label>
        <input type="text" id="serviceRegion" value={serviceRegion} onChange={e => setServiceRegion(e.target.value)} placeholder="e.g., Anytown, Downtown Area" required className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
      </div>
    </>
  );

  const regulatoryFields = (
     <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
        <h3 className="text-md font-semibold text-slate-700 mb-2">Regulatory Compliance</h3>
        <div>
          <label htmlFor="regulatoryComplianceNotes" className="block text-sm font-medium text-slate-600 mb-1">
            Relevant Licenses & Certifications*
          </label>
          <textarea 
            id="regulatoryComplianceNotes" 
            value={regulatoryComplianceNotes} 
            onChange={e => setRegulatoryComplianceNotes(e.target.value)} 
            required 
            rows={3} 
            placeholder="e.g., State Medical License XYZ123, CLIA ID ABC456, Pharmacy License PHARM789. Specify for your operating region."
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 custom-scrollbar" 
          />
        </div>
        <div className="mt-3">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={attestedCompliance} 
              onChange={e => setAttestedCompliance(e.target.checked)} 
              required 
              className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-slate-700">I attest that all information provided is accurate and our facility meets all local and national regulatory requirements for operating as a {businessType}.*</span>
          </label>
        </div>
      </div>
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-auto">
      <div className="flex justify-start mb-6">
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Select Type
        </button>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1 text-center">Onboarding Application</h2>
      <p className="text-center text-slate-600 mb-6">You are applying as a: <strong className="text-blue-600">{businessType}</strong></p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {commonFields}

        {businessType === BusinessType.CLINIC && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h3 className="text-md font-semibold text-slate-700">Clinic Specifics</h3>
            <div>
              <label htmlFor="clinicSpecialties" className="block text-sm font-medium text-slate-700 mb-1">Main Specialties Offered</label>
              <input type="text" id="clinicSpecialties" value={clinicSpecialties} onChange={e => setClinicSpecialties(e.target.value)} placeholder="e.g., General Practice, Pediatrics, Cardiology" className="w-full p-2 border border-slate-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="doctorCount" className="block text-sm font-medium text-slate-700 mb-1">Approximate Number of Doctors</label>
              <input type="number" id="doctorCount" value={doctorCount} onChange={e => setDoctorCount(e.target.value)} placeholder="e.g., 5" className="w-full p-2 border border-slate-300 rounded-md" />
            </div>
          </div>
        )}

        {businessType === BusinessType.LAB && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h3 className="text-md font-semibold text-slate-700">Laboratory Specifics</h3>
            <div>
              <label htmlFor="labTestTypes" className="block text-sm font-medium text-slate-700 mb-1">Main Types of Tests Offered</label>
              <textarea id="labTestTypes" value={labTestTypes} onChange={e => setLabTestTypes(e.target.value)} rows={3} placeholder="e.g., Blood tests (CBC, Chemistry Panel), Urinalysis, Basic Pathology" className="w-full p-2 border border-slate-300 rounded-md custom-scrollbar" />
            </div>
             <div>
              <label htmlFor="labCertifications" className="block text-sm font-medium text-slate-700 mb-1">Key Certifications (if applicable)</label>
              <input type="text" id="labCertifications" value={labCertifications} onChange={e => setLabCertifications(e.target.value)} placeholder="e.g., CLIA, CAP" className="w-full p-2 border border-slate-300 rounded-md" />
            </div>
          </div>
        )}

        {businessType === BusinessType.PHARMACY && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h3 className="text-md font-semibold text-slate-700">Pharmacy Specifics</h3>
            <div>
              <label htmlFor="pharmacyServices" className="block text-sm font-medium text-slate-700 mb-1">Key Services Offered</label>
              <textarea id="pharmacyServices" value={pharmacyServices} onChange={e => setPharmacyServices(e.target.value)} rows={3} placeholder="e.g., Prescription dispensing, OTC medications, Vaccinations, MTM services" className="w-full p-2 border border-slate-300 rounded-md custom-scrollbar" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="prescriptionDelivery" checked={prescriptionDelivery} onChange={e => setPrescriptionDelivery(e.target.checked)} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              <label htmlFor="prescriptionDelivery" className="ml-2 block text-sm text-slate-700">Offers Prescription Delivery</label>
            </div>
          </div>
        )}
        
        {regulatoryFields}
        
        {formError && <p className="text-red-500 text-sm text-center mt-2">{formError}</p>}

        <div className="pt-6">
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow hover:shadow-md">
            Submit Application for Review
          </button>
        </div>
      </form>
      <p className="text-xs text-slate-500 text-center mt-6">
        Submitting this form begins a simulated review process.
      </p>
    </div>
  );
};

export default MarketplaceOnboardingFormStage;