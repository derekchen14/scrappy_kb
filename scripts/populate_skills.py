#!/usr/bin/env python3
"""
Script to populate the database with initial skill data
"""

import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

from sqlalchemy.orm import Session
from database import SessionLocal
import models

def populate_skills(db=None):
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    skills_data = [
        # Technical Skills
        {"name": "Python", "category": "Technical", "description": "Programming language for backend development, data science, and automation"},
        {"name": "Full-Stack Development", "category": "Technical", "description": "Experience building end-to-end web applications with frontend and backend technologies"},
        {"name": "Data Science", "category": "Technical", "description": "Proficiency in data analysis, machine learning, and business intelligence"},
        {"name": "Cloud Infrastructure", "category": "Technical", "description": "AWS, Google Cloud, and Azure deployment and management"},
        {"name": "Mobile App Development", "category": "Technical", "description": "Native and cross-platform mobile application development"},
        {"name": "Machine Learning", "category": "Technical", "description": "AI, machine learning, and deep learning with LLMs and neural networks"},
        {"name": "JavaScript", "category": "Technical", "description": "Frontend and backend development with JavaScript and Node.js"},
        {"name": "React", "category": "Technical", "description": "Modern frontend framework for building user interfaces"},
        {"name": "DevOps", "category": "Technical", "description": "CI/CD, containerization, and infrastructure automation"},
        {"name": "Database Design", "category": "Technical", "description": "SQL and NoSQL database architecture and optimization"},
        {"name": "API Development", "category": "Technical", "description": "REST and GraphQL API design and implementation"},
        {"name": "Cybersecurity", "category": "Technical", "description": "Application security, penetration testing, and security architecture"},
        
        # Design Skills
        {"name": "UI/UX Design", "category": "Design", "description": "User interface and experience design for web and mobile applications"},
        {"name": "Interaction Design (HCI)", "category": "Design", "description": "How people interact with your app"},
        {"name": "Graphic Design", "category": "Design", "description": "Visual design, branding, and marketing materials"},
        {"name": "Product Design", "category": "Design", "description": "End-to-end product design from concept to launch"},
        {"name": "Figma", "category": "Design", "description": "Design tool for prototyping and collaboration"},
        {"name": "Brand Design", "category": "Design", "description": "Brand identity, logo design, and visual guidelines"},
        
        # Product Skills
        {"name": "Product Management", "category": "Product", "description": "Expertise in product strategy, roadmap planning, and user experience design"},
        {"name": "Product Strategy", "category": "Product", "description": "Market analysis, competitive positioning, and product-market fit"},
        {"name": "User Research", "category": "Product", "description": "Customer interviews, surveys, and usability testing"},
        {"name": "Analytics", "category": "Product", "description": "Product metrics, KPI tracking, and data-driven decision making"},
        {"name": "A/B Testing", "category": "Product", "description": "Experiment design and statistical analysis for product optimization"},
        
        # Marketing Skills
        {"name": "Digital Marketing", "category": "Marketing", "description": "SEO, social media marketing, content marketing, and online advertising"},
        {"name": "Content Creation & Copywriting", "category": "Marketing", "description": "Blog writing, social media content, and marketing copy creation"},
        {"name": "Growth Marketing", "category": "Marketing", "description": "Customer acquisition, retention, and viral growth strategies"},
        {"name": "SEO", "category": "Marketing", "description": "Search engine optimization and organic traffic growth"},
        {"name": "Social Media Marketing", "category": "Marketing", "description": "Instagram, Twitter, LinkedIn, and TikTok marketing strategies"},
        {"name": "Email Marketing", "category": "Marketing", "description": "Newsletter campaigns, drip sequences, and automation"},
        {"name": "Paid Advertising", "category": "Marketing", "description": "Google Ads, Facebook Ads, and performance marketing"},
        {"name": "Influencer Marketing", "category": "Marketing", "description": "Partnership strategies and influencer campaign management"},
        
        # Sales Skills
        {"name": "Founder led sales", "category": "Sales", "description": "Lead generation, customer acquisition, and partnership development"},
        {"name": "B2B Sales", "category": "Sales", "description": "Enterprise sales, account management, and relationship building"},
        {"name": "B2C Sales", "category": "Sales", "description": "Consumer sales, conversion optimization, and customer success"},
        {"name": "Sales Operations", "category": "Sales", "description": "CRM management, sales process optimization, and forecasting"},
        {"name": "Partnership Development", "category": "Sales", "description": "Strategic partnerships, channel sales, and business development"},
        
        # Business Skills
        {"name": "Financial Planning & Analysis", "category": "Business", "description": "Financial modeling, budgeting, fundraising, and investor relations"},
        {"name": "Strategy", "category": "Business", "description": "Business strategy, competitive analysis, and market positioning"},
        {"name": "Operations", "category": "Business", "description": "Process optimization, supply chain, and operational efficiency"},
        {"name": "Legal", "category": "Business", "description": "Contract negotiation, intellectual property, and regulatory compliance"},
        {"name": "HR & Recruiting", "category": "Business", "description": "Talent acquisition, team building, and culture development"},
        {"name": "Project Management", "category": "Business", "description": "Agile, Scrum, and project delivery methodologies"},
        {"name": "Fundraising", "category": "Business", "description": "Investor relations, pitch deck creation, and funding strategies"},
        {"name": "Public Speaking", "category": "Business", "description": "Presentations, pitching, and thought leadership"},
        
        # Industry Specific
        {"name": "Fintech", "category": "Industry", "description": "Financial services, payments, and regulatory knowledge"},
        {"name": "Healthtech", "category": "Industry", "description": "Healthcare technology, HIPAA compliance, and medical workflows"},
        {"name": "Edtech", "category": "Industry", "description": "Educational technology, learning management, and pedagogy"},
        {"name": "E-commerce", "category": "Industry", "description": "Online retail, marketplaces, and customer acquisition"},
        {"name": "SaaS", "category": "Industry", "description": "Software as a Service business models and metrics"},
        {"name": "AI/ML", "category": "Industry", "description": "Artificial intelligence and machine learning applications"},
    ]
    
    skills_added = 0
    try:
        for skill_data in skills_data:
            # Check if skill already exists
            existing_skill = db.query(models.Skill).filter(models.Skill.name == skill_data["name"]).first()
            if not existing_skill:
                skill = models.Skill(**skill_data)
                db.add(skill)
                skills_added += 1
        
        if should_close:
            db.commit()
            print(f"Successfully populated {skills_added} skills!")
            
            # Print all skills by category
            all_skills = db.query(models.Skill).order_by(models.Skill.category, models.Skill.name).all()
            current_category = None
            for skill in all_skills:
                if skill.category != current_category:
                    current_category = skill.category
                    print(f"\n{current_category}:")
                print(f"  - {skill.name}")
                
    except Exception as e:
        if should_close:
            db.rollback()
            print(f"Error populating skills: {e}")
        else:
            raise e
    finally:
        if should_close:
            db.close()
    
    return skills_added

if __name__ == "__main__":
    populate_skills()