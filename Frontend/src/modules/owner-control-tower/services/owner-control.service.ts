import { consultancies, importJobs, importScenarios, ownerProfile } from '../data/owner-control.mock-data';
import type {
  ConsultancyRecord,
  ImportJob,
  ImportScenario,
  OwnerSnapshot,
} from '../types/owner-control.types';
import { buildOwnerKpis, cloneData, flattenRisks } from '../utils/owner-control.utils';

export async function getOwnerSnapshot(): Promise<OwnerSnapshot> {
  const clonedConsultancies = cloneData(consultancies);
  const clonedImportJobs = cloneData(importJobs);

  return {
    ownerName: ownerProfile.name,
    ownerEmail: ownerProfile.email,
    notifications: ownerProfile.notifications,
    consultancies: clonedConsultancies,
    alerts: flattenRisks(clonedConsultancies),
    importJobs: clonedImportJobs,
    kpis: buildOwnerKpis(clonedConsultancies, clonedImportJobs),
    availableCountries: Array.from(new Set(clonedConsultancies.map((item) => item.country))).sort(),
    statuses: ['active', 'trial', 'onboarding', 'suspended'],
  };
}

export async function listConsultancies(): Promise<ConsultancyRecord[]> {
  return cloneData(consultancies);
}

export async function getConsultancyById(id: string): Promise<ConsultancyRecord | null> {
  const consultancy = consultancies.find((item) => item.id === id);
  return consultancy ? cloneData(consultancy) : null;
}

export async function listImportJobs(): Promise<ImportJob[]> {
  return cloneData(importJobs);
}

export async function listImportScenarios(): Promise<ImportScenario[]> {
  return cloneData(importScenarios);
}

export async function getImportScenario(id: string): Promise<ImportScenario | null> {
  const scenario = importScenarios.find((item) => item.id === id);
  return scenario ? cloneData(scenario) : null;
}
