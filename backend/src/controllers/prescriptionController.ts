import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import * as aiService from '../services/geminiService';
import { PrescriptionKeywordsRequest } from '../types';

export const handleGeneratePrescriptionKeywords = async (
  req: Request<ParamsDictionary, string[] | { error: string }, PrescriptionKeywordsRequest, Query>,
  res: Response<string[] | { error: string }>
): Promise<void> => {
    try {
        const { provisionalDiagnosis, currentDoctorSummary } = req.body;
        if (!provisionalDiagnosis || !currentDoctorSummary) {
            res.status(400).json({ error: "Provisional diagnosis and current doctor summary are required." });
            return;
        }
        const keywords = await aiService.generatePrescriptionKeywords(provisionalDiagnosis, currentDoctorSummary);
        if (keywords) {
            res.status(200).json(keywords);
        } else {
            // Return empty array as per frontend service fallback
            res.status(200).json([]);
        }
    } catch (error) {
        console.error("Error in handleGeneratePrescriptionKeywords:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};
