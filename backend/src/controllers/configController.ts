import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { 
    AlgorithmFactorWeights, 
    GetAlgorithmFactorsResponse, 
    UpdateAlgorithmFactorsRequest,
    UpdateAlgorithmFactorsResponse,
    ErrorResponse 
} from '../types';
// import * as configService from '../services/configService'; // Future service for persisting config

// In-memory store for simulation. In production, use a database or persistent config store.
let mockPharmacyFactors: AlgorithmFactorWeights = {
    priceWeight: 0.6,
    speedWeight: 0.2,
    qualityWeight: 0.2,
};
let mockLabFactors: AlgorithmFactorWeights = {
    priceWeight: 0.5,
    speedWeight: 0.3,
    qualityWeight: 0.2,
};


export const handleGetAlgorithmFactors = async (
  req: Request<ParamsDictionary, GetAlgorithmFactorsResponse | ErrorResponse, any, Query>,
  res: Response<GetAlgorithmFactorsResponse | ErrorResponse>
): Promise<void> => {
  try {
    // TODO: In a real app, fetch these from configService or database
    console.log("Fetching current algorithm factors (mocked).");
    res.status(200).json({
        pharmacyFactors: mockPharmacyFactors,
        labFactors: mockLabFactors
    });
  } catch (error: any) {
    console.error("Error in handleGetAlgorithmFactors:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};

export const handleUpdateAlgorithmFactors = async (
  req: Request<ParamsDictionary, UpdateAlgorithmFactorsResponse | ErrorResponse, UpdateAlgorithmFactorsRequest, Query>,
  res: Response<UpdateAlgorithmFactorsResponse | ErrorResponse>
): Promise<void> => {
  try {
    const { type, factors } = req.body;
    console.log(`Received request to update algorithm factors for ${type}:`, factors);

    // Basic validation
    if (!type || !factors) {
        res.status(400).json({ error: "Validation Error", message: "Type and factors are required."});
        return;
    }
    const totalWeight = factors.priceWeight + factors.speedWeight + factors.qualityWeight + (factors.proximityWeight || 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) { // Allow for small floating point inaccuracies
        res.status(400).json({ error: "Validation Error", message: "Factor weights must sum to 1.0." });
        return;
    }

    // TODO: Call configService.updateFactors(type, factors)
    if (type === 'PHARMACY') {
        mockPharmacyFactors = factors;
        console.log("Updated pharmacy factors (mocked):", mockPharmacyFactors);
        res.status(200).json({ success: true, updatedFactors: mockPharmacyFactors });
    } else if (type === 'LAB') {
        mockLabFactors = factors;
        console.log("Updated lab factors (mocked):", mockLabFactors);
        res.status(200).json({ success: true, updatedFactors: mockLabFactors });
    } else {
        res.status(400).json({ error: "Validation Error", message: "Invalid type specified. Must be PHARMACY or LAB."});
        return;
    }

  } catch (error: any) {
    console.error("Error in handleUpdateAlgorithmFactors:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};
