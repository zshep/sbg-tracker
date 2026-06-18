# Standards-Based Grading Tracker (SBG Tracker)

A teacher-focused web application for tracking student mastery using a Standards-Based Grading (SBG) model.

This system allows teachers to manage multiple classes, define learning standards, record evidence, score students, and calculate mastery using a “most recent evidence wins” philosophy.

This is Version 1 (MVP) and focuses on clean data modeling, scalable architecture, and secure teacher-only access.

## Live Demo

https://sbg.sheperdigian.com

## Project Goals

The goal of this project is to:

- Build a production-ready SBG tracking system

- Model educational data in a scalable way

- Implement secure Firestore rules with strict ownership validation

- Demonstrate mastery-based calculation logic

- Practice professional frontend architecture using React + Firebase

This version intentionally focuses on core functionality before adding advanced features like weighting, CSV import, or grade conversion.

## Features (MVP Scope)
### Teacher Authentication

- Firebase Authentication

- Secure access to teacher-owned data

- Firestore rules enforcing ownership

### Multiple Classes

- Teachers can create and manage multiple classes

- Each class stores:

    - className

    - classPeriod

    - createdAt

### Students

- Add and remove students per class

- Students scoped to a specific class

- Clean data separation per teacher

### Standards

- Define learning standards per class

- Ordered standard list

- Standards linked to evidence and scores

### Evidence

- Create evidence items tied to a specific standard

- Store assessment date

- Track performance over time

### Scoring

- Record student performance levels (1–4)

- Timestamped entries

- Designed for mastery recalculation

### Mastery Model

- "Most recent evidence wins"

- Mastery grid view

- Real-time updates using Firestore listeners

## Tech Stack
### Frontend

- React

- React Router

- Vite

### Backend

- Firebase Authentication

- Cloud Firestore

### Security

- Firestore rules with:

    - request.auth.uid ownership checks

    - Strict key validation

    - Type enforcement

    - Document shape validation

## Data Model (Simplified)
```
teachers/{uid}
  classes/{classId}
    className
    classPeriod
    createdAt

    students/{studentId}
      name
      createdAt

    standards/{standardId}
      title
      description
      order
      createdAt

    evidence/{evidenceId}
      standardId
      title
      date
      createdAt

    scores/{scoreId}
      studentId
      standardId
      evidenceId
      level (1–4)
      timestamp
```
All data is scoped under `teachers/{uid}` to ensure complete isolation between users.

## Mastery Philosophy

This app implements a mastery-based grading model:

1 = Emerging

2 = Approaching

3 = Meeting

4 = Exceeding

Instead of averaging scores, mastery is determined by the most recent evidence for each standard.

This supports:

- Retakes

- Growth over time

- Reduced penalty for early struggle

- Clear student progress tracking

## Architecture Highlights

- Real-time Firestore listeners (onSnapshot)

- Component-driven structure

- Secure nested collection modeling

- Strict Firestore rule validation

- Clean separation between:

    - Classes

    - Students

    - Standards

    - Evidence

    - Scores

- Nested sub-collection data modeling to take advantage of automatic cascading data scoping and clean, intuitive Firestore document paths

## Future Enhancements

Planned improvements include:

- Weighted standards

- Grade conversion system

- CSV import/export

- Student login access

- Analytics dashboard

- Visual mastery trend graphs

- Reporting and PDF export

Local Development

Clone the repository:
```
git clone https://github.com/zshep/sbg-tracker.git
```
Install dependencies:
```
npm install
```
Run locally:
```
npm run dev
```
Set up your Firebase environment variables in a .env file.

## Why This Project Matters

Standards-Based Grading is widely discussed in education, but many schools lack a clean, teacher-centered digital implementation.

This project demonstrates:

Strong frontend architecture

Secure backend modeling

Thoughtful educational design

Real-world problem solving

Product thinking beyond tutorial-level code