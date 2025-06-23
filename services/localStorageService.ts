
import { PatientProfile, Episode } from '../types';

const PROFILE_KEY = 'primaryCareAssistantProfile';
const EPISODES_KEY = 'primaryCareAssistantEpisodes';

// Patient Profile
export const savePatientProfile = (profile: PatientProfile): void => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving patient profile to local storage:", error);
  }
};

export const loadPatientProfile = (): PatientProfile | null => {
  try {
    const profileJson = localStorage.getItem(PROFILE_KEY);
    return profileJson ? JSON.parse(profileJson) : null;
  } catch (error) {
    console.error("Error loading patient profile from local storage:", error);
    return null;
  }
};

export const clearPatientProfile = (): void => {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error("Error clearing patient profile from local storage:", error);
  }
};

// Interaction Episodes
export const saveEpisode = (episode: Episode | null, clearAll: boolean = false): Episode[] => {
  let episodes = loadEpisodes();
  if (clearAll) {
    episodes = [];
  } else if (episode) {
    // Add new episode to the beginning of the list
    episodes = [episode, ...episodes];
    // Optional: Limit the number of stored episodes
    const MAX_EPISODES = 20;
    if (episodes.length > MAX_EPISODES) {
      episodes = episodes.slice(0, MAX_EPISODES);
    }
  }
  
  try {
    localStorage.setItem(EPISODES_KEY, JSON.stringify(episodes));
  } catch (error) {
    console.error("Error saving episodes to local storage:", error);
  }
  return episodes;
};

export const loadEpisodes = (): Episode[] => {
  try {
    const episodesJson = localStorage.getItem(EPISODES_KEY);
    return episodesJson ? JSON.parse(episodesJson) : [];
  } catch (error) {
    console.error("Error loading episodes from local storage:", error);
    // Return empty array on error to prevent app crash
    return [];
  }
};