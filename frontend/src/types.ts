export interface Founder {
  id: number;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
  skills: Skill[];
  help_requests: HelpRequest[];
  startups: Startup[];
}

export interface FounderCreate {
  name: string;
  email: string;
  bio?: string;
  location?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  skill_ids?: number[];
  startup_ids?: number[];
}

export interface Skill {
  id: number;
  name: string;
  category?: string;
  description?: string;
  created_at: string;
}

export interface SkillCreate {
  name: string;
  category?: string;
  description?: string;
}

export interface Startup {
  id: number;
  name: string;
  description?: string;
  industry?: string;
  stage?: string;
  website_url?: string;
  team_size?: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface StartupCreate {
  name: string;
  description?: string;
  industry?: string;
  stage?: string;
  website_url?: string;
  team_size?: number;
  location?: string;
}

export interface HelpRequest {
  id: number;
  founder_id: number;
  title: string;
  description: string;
  category?: string;
  urgency?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface HelpRequestCreate {
  founder_id: number;
  title: string;
  description: string;
  category?: string;
  urgency?: string;
  status?: string;
}