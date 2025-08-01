export interface Founder {
  id: number;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  linkedin_url: string;
  twitter_url?: string;
  github_url?: string;
  profile_image_url?: string;
  profile_visible?: boolean;
  auth0_user_id?: string;
  created_at: string;
  updated_at: string;
  skills: Skill[];
  help_requests: HelpRequest[];
  startup?: Startup;
  hobbies: Hobby[];
}

export interface FounderCreate {
  name: string;
  email: string;
  bio?: string;
  location?: string;
  linkedin_url: string;
  twitter_url?: string;
  github_url?: string;
  profile_image_url?: string;
  profile_visible?: boolean;
  auth0_user_id?: string;
  skill_ids?: number[];
  startup_id?: number;
  hobby_ids?: number[];
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

export interface Hobby {
  id: number;
  name: string;
  category?: string;
  description?: string;
  created_at: string;
}

export interface HobbyCreate {
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
  target_market?: string;
  revenue_arr?: string;
  created_at: string;
  updated_at: string;
}

export interface StartupCreate {
  name: string;
  description?: string;
  industry?: string;
  stage?: string;
  website_url?: string;
  target_market?: string;
  revenue_arr?: string;
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

export interface Event {
  id: number;
  title: string;
  description?: string;
  date_time: string;
  location?: string;
  attendees?: string;
  theme?: string;
  link?: string;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  description?: string;
  date_time: string;
  location?: string;
  attendees?: string;
  theme?: string;
  link?: string;
}