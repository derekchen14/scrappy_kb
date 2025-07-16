import axios from 'axios';
import { Founder, FounderCreate, Skill, SkillCreate, Startup, StartupCreate, HelpRequest, HelpRequestCreate } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Founder API
export const founderAPI = {
  getAll: () => api.get<Founder[]>('/founders/'),
  getById: (id: number) => api.get<Founder>(`/founders/${id}`),
  create: (founder: FounderCreate) => api.post<Founder>('/founders/', founder),
  update: (id: number, founder: FounderCreate) => api.put<Founder>(`/founders/${id}`, founder),
  delete: (id: number) => api.delete(`/founders/${id}`),
};

// Skill API
export const skillAPI = {
  getAll: () => api.get<Skill[]>('/skills/'),
  getById: (id: number) => api.get<Skill>(`/skills/${id}`),
  create: (skill: SkillCreate) => api.post<Skill>('/skills/', skill),
  update: (id: number, skill: SkillCreate) => api.put<Skill>(`/skills/${id}`, skill),
  delete: (id: number) => api.delete(`/skills/${id}`),
};

// Startup API
export const startupAPI = {
  getAll: () => api.get<Startup[]>('/startups/'),
  getById: (id: number) => api.get<Startup>(`/startups/${id}`),
  create: (startup: StartupCreate) => api.post<Startup>('/startups/', startup),
  update: (id: number, startup: StartupCreate) => api.put<Startup>(`/startups/${id}`, startup),
  delete: (id: number) => api.delete(`/startups/${id}`),
};

// Help Request API
export const helpRequestAPI = {
  getAll: () => api.get<HelpRequest[]>('/help-requests/'),
  getById: (id: number) => api.get<HelpRequest>(`/help-requests/${id}`),
  create: (helpRequest: HelpRequestCreate) => api.post<HelpRequest>('/help-requests/', helpRequest),
  update: (id: number, helpRequest: HelpRequestCreate) => api.put<HelpRequest>(`/help-requests/${id}`, helpRequest),
  delete: (id: number) => api.delete(`/help-requests/${id}`),
};