# ToonProof Vault

Build a responsive web MVP for:

TOONPROOF IP & ROYALTY VAULT

IMPORTANT:
This is an MVP/prototype. Do not overengineer it.

Strictly follow the functionality described below.
Do not add any features that are not requested.
Do not create any admin panel or admin functionality.

==================================================
1. PROJECT PURPOSE
==================================================

ToonProof IP & Royalty Vault is a creator-rights platform designed primarily for animators, illustrators, rig artists, animation students and small animation studios.

The MVP should demonstrate how a creator can:

1. Create an account and log in.
2. View their creator dashboard.
3. Register an animation/creative asset.
4. See a simulated technical fingerprint and timestamped provenance record.
5. Define how that asset may be used, including AI-related permissions.
6. Share the asset with controlled access.
7. View the asset's provenance/activity history.
8. Generate/view a provenance certificate.

The core concept is:

A creative file should be represented as a registered, permission-controlled and traceable IP asset.

The MVP should NOT be presented as:
- a generic file-storage system
- an AI image generator
- an NFT platform
- a legal copyright authority
- a marketplace

==================================================
2. DEVELOPMENT APPROACH
==================================================

Build this as a frontend-focused MVP.

Use:
- React
- TypeScript
- Tailwind CSS
- clean reusable components
- responsive design
- Firebase Firestore as the ONLY database/backend service

IMPORTANT FIREBASE RULE:

Firebase must be used ONLY for user account data required for signup, login, profile update and account deletion.

DO NOT use:
- Firebase Authentication
- Firebase Storage
- Firebase Cloud Functions
- Firebase Realtime Database
- any Firebase authentication provider
- Google login
- social login
- OTP authentication
- email verification
- password reset services

Use Firestore only as a normal database using CRUD operations.

All ToonProof product data such as:
- assets
- fingerprints
- permissions
- sharing records
- provenance history
- certificates

must remain mock frontend data.

Do not store this product data in Firebase.

==================================================
3. FIREBASE AUTHENTICATION FLOW
==================================================

Do NOT use Firebase Authentication.

Create a Firestore collection called:

users

Suggested document structure:

{
  id: generated document ID,
  fullName: string,
  email: string,
  password: string,
  creatorType: string,
  createdAt: timestamp
}

This is only for demonstrating a prototype authentication workflow.

SIGNUP FLOW:

User enters:
- Full Name
- Email
- Password
- Creator Type

Creator Type options:

- Animator
- Rig Artist
- Illustrator
- Animation Student
- Small Animation Studio

When "Create Account" is clicked:

1. Check Firestore users collection to make sure the email is not already registered.
2. If it already exists, display:
   "An account with this email already exists."
3. If it does not exist, create a new user document in Firestore.
4. Show successful account creation.
5. Redirect to Login.

LOGIN FLOW:

User enters:
- Email
- Password

When "Sign In" is clicked:

1. Query the Firestore users collection.
2. Find a user where the email matches.
3. Compare the entered password directly with the password saved in Firestore.
4. If both match:
   - treat the user as logged in
   - save minimum session information locally
   - redirect to Dashboard
5. If they do not match:
   show:
   "Invalid email or password."

Do not use Firebase Authentication anywhere.

PROFILE UPDATE:

Allow the currently logged-in user to update:
- Full Name
- Creator Type

Update their Firestore document using normal CRUD.

DELETE ACCOUNT:

Provide a Delete Account option.

Show a confirmation modal before deletion.

When confirmed:
- delete the Firestore user document
- clear the local session
- redirect to the landing page

LOGOUT:

Logout should:
- clear local session information
- redirect to Login

==================================================
4. APPLICATION NAVIGATION
==================================================

For logged-in users use a simple sidebar/navigation:

ToonProof

- Dashboard
- My Assets
- Certificates
- Profile
- Logout

Do NOT add:
- Admin
- Analytics
- Marketplace
- Royalties
- Billing
- Team Management
- AI Detection
- Settings with complex functionality

Keep the navigation simple.

==================================================
5. PUBLIC LANDING PAGE
==================================================

Create a clean professional landing page.

Main hero:

TOONPROOF
IP & ROYALTY VAULT

Headline:

Protect Your Creative Work in the AI Era

Supporting message:

Register animation assets, establish provenance, control usage permissions and share your work with confidence.

Primary CTA:
Get Started

Secondary CTA:
Sign In

Add a simple "How ToonProof Works" section using five steps:

1. Register
Register animation and creative assets.

2. Protect
Create a technical fingerprint and timestamped provenance record.

3. Control
Set usage and AI permissions.

4. Share
Share assets under controlled access.

5. Certify
Generate a provenance certificate.

Do not make advanced AI engines, marketplace or royalty functionality appear to already be operational.

==================================================
6. SIGN UP PAGE
==================================================

Fields:

Full Name
Email Address
Password
Creator Type

Creator type dropdown:

Animator
Rig Artist
Illustrator
Animation Student
Small Animation Studio

Button:
Create Account

Also show:

Already have an account?
Sign In

Use Firestore CRUD according to the authentication instructions.

==================================================
7. LOGIN PAGE
==================================================

Fields:

Email Address
Password

Button:

Sign In

Link:

Don't have an account?
Create Account

Use Firestore lookup and direct credential matching.

Do not use Firebase Authentication.

==================================================
8. DASHBOARD
==================================================

After login, show the creator dashboard.

The dashboard should provide a quick overview of the creator's registered assets and activity.

Use MOCK DATA.

Top cards:

Registered Assets
12

Protected Assets
12

Active Shares
4

Certificates
7

Main CTA:

Register New Asset

Add a Recent Assets section.

Example mock data:

Luna Character
Character Design
Verified
10 Sep 2026

Luna Character Rig
2D Rig
Verified
8 Sep 2026

Luna Walk Cycle
Walk Cycle
Verified
6 Sep 2026

Night City Pack
Background Pack
Verified
3 Sep 2026

Clicking an asset should open its Asset Details page.

Do not add unnecessary charts or analytics.

==================================================
9. MY ASSETS PAGE
==================================================

Create a creator asset library using mock data.

Show:

Asset Name
Asset Type
Registration ID
Registration Date
Status

Example:

Luna Character
Character Design
TP-10021
10 Sep 2026
Verified

Luna Rig
2D Rig
TP-10022
8 Sep 2026
Verified

Luna Walk
Walk Cycle
TP-10023
6 Sep 2026
Verified

Night City
Background Pack
TP-10024
3 Sep 2026
Verified

Add simple filtering by asset type:

All
Character
Rig
Motion
Background
Other

Include:

Register New Asset

Do not create advanced search or complex filtering.

==================================================
10. REGISTER NEW ASSET PAGE
==================================================

This is one of the main MVP workflows.

Create a form containing:

Asset Name

Asset Type

Asset Type dropdown options:

- Character Design
- 2D Rig
- Expression Sheet
- Mouth-Shape Set
- Background Pack
- Prop
- Motion Loop
- Walk Cycle
- Storyboard
- Style Guide

Description

Project / Collection
(optional simple text field)

File Upload

IMPORTANT:

The file selector is FRONTEND ONLY.

Do not upload the file to Firebase or any external storage.

When a file is selected simply show:

File Name
File Size
Selected Successfully

Primary button:

Register & Protect Asset

==================================================
11. MOCK ASSET REGISTRATION PROCESS
==================================================

When the user clicks:

Register & Protect Asset

show a short simulated processing state.

Example:

Registering Asset...

✓ Asset classified
✓ Exact file fingerprint generated
✓ Perceptual fingerprint generated
✓ Timestamp recorded
✓ Provenance record created
✓ Permission token created

Then show:

Asset Successfully Registered

Asset ID:
TP-10025

Asset Type:
2D Rig

Status:
Verified

Registration Date:
current frontend date

Add button:

View Asset

This entire registration process must be simulated on the frontend.

Do not build real:
- hashing
- perceptual hashing
- AI processing
- file analysis
- backend asset registration

==================================================
12. ASSET DETAILS PAGE
==================================================

Create one central Asset Details page.

Example header:

Luna Character Rig

Status:
Verified

Asset ID:
TP-10025

Asset Type:
2D Rig

Creator:
Use the currently logged-in user's Firestore name

Registered:
13 September 2026

Create five tabs:

1. Overview
2. Permissions
3. Sharing
4. Provenance
5. Certificate

Do not create separate pages for every feature.

==================================================
13. OVERVIEW TAB
==================================================

Show:

Asset Name
Luna Character Rig

Asset Type
2D Rig

Registration ID
TP-10025

Creator
Logged-in user name

Registered
13 September 2026

Status
Verified

Add an:

Animation Asset DNA

section.

Only show the MVP-level information:

Exact File Fingerprint
Generated

Perceptual Fingerprint
Generated

Provenance Record
Created

AI Permission Token
Active

These are simulated statuses.

Do not display advanced Rig Graph, Motion DNA or Style-Imitation results.

==================================================
14. PERMISSIONS TAB
==================================================

Create simple toggle controls.

SECTION:
General Usage Permissions

Commercial Production
ON

Internal Studio Reuse
ON

Educational Use
ON

Derivative Creation
OFF

Marketplace Distribution
OFF

SECTION:
AI Usage Permissions

Private AI Fine-Tuning
OFF

Public AI Training
OFF

Royalty-Based AI Usage
ON

Button:

Save Permissions

Changing the toggles should update the frontend state and provide:

Permissions Updated Successfully

Do not save these permissions to Firebase.

==================================================
15. SHARING TAB
==================================================

Allow creators to simulate controlled asset sharing.

Button:

Share Asset

Open a simple form/modal.

Fields:

Recipient Name

Recipient Email

Access Level:

- View Only
- View & Download

Access Expiry:

- 7 Days
- 30 Days
- No Expiry

Button:

Generate Share Link

After submission show a simulated share URL such as:

toonproof.app/share/TP10025-X8K9

Add:

Copy Link

The link does not need to create a real external sharing system.

==================================================
16. SHARING HISTORY
==================================================

Below the sharing form show mock sharing history.

Example:

BrightFrame Studio
contact@brightframe.com
View & Download
10 Sep 2026
Active

Pixel Animation
studio@pixelanimation.com
View Only
7 Sep 2026
Revoked

Allow an Active share to have a:

Revoke Access

button.

Clicking it should change:

Active

to:

Revoked

using frontend state only.

Do not save sharing information to Firebase.

==================================================
17. PROVENANCE TAB
==================================================

Create a clean timeline showing the history of the asset.

Example:

13 Sep 2026
Asset registered

13 Sep 2026
Exact file fingerprint generated

13 Sep 2026
Perceptual fingerprint generated

13 Sep 2026
AI permissions configured

14 Sep 2026
Shared with BrightFrame Studio

14 Sep 2026
BrightFrame Studio accessed asset

17 Sep 2026
Sharing permission updated

The purpose is to visually demonstrate how ToonProof maintains a provenance/history record.

Use mock data.

Do not implement a real tracking backend.

==================================================
18. CERTIFICATE TAB
==================================================

Create a professional provenance certificate preview.

Title:

TOONPROOF
Provenance Certificate

Show:

Certificate ID
TPC-10025

Asset
Luna Character Rig

Creator
Current logged-in user

Asset Type
2D Rig

Registration ID
TP-10025

Registration Date
13 September 2026

Provenance Status
Registered

Commercial Production
Permitted

Derivative Creation
Not Permitted

AI Training
Not Permitted

Certificate Status
Valid

Buttons:

Generate Certificate

Download Certificate

Certificate generation may be simulated or implemented completely on the frontend.

Do not create a certificate backend.

==================================================
19. CERTIFICATES PAGE
==================================================

Create a simple list of certificates belonging to mock registered assets.

Example:

TPC-10025
Luna Character Rig
13 Sep 2026

TPC-10022
Luna Walk Cycle
9 Sep 2026

TPC-10018
Night City Pack
3 Sep 2026

Actions:

View
Download

Keep this page simple.

==================================================
20. PROFILE PAGE
==================================================

Read the current logged-in user's information from Firestore.

Show:

Full Name
Email
Creator Type
Account Created

Allow:

Edit Profile

Editable fields:

Full Name
Creator Type

Email can remain read-only.

Button:

Save Changes

Update the user's Firestore document.

Also include:

Delete Account

Show confirmation before deleting.

==================================================
21. MOCK DATA REQUIREMENTS
==================================================

All ToonProof product information must use frontend mock data.

This includes:

assets
asset registration IDs
asset statuses
fingerprints
permissions
sharing
activity
provenance
certificates

Use realistic animation-focused example data.

Do not create backend collections such as:

assets
permissions
shares
certificates
provenance
transactions

Only the:

users

collection should exist in Firebase.

==================================================
22. DO NOT BUILD THESE FEATURES
==================================================

Do NOT implement or simulate these as fully functional MVP systems:

Rig Graph Similarity Engine

Motion DNA Engine

Style-Imitation Risk Engine

Provenance-to-Royalty Engine

Royalty calculations

Royalty payments

Licensing marketplace

Asset marketplace

Buyer accounts

AI platform accounts

B2B dashboards

Complex team management

Subscription billing

Stripe integration

Payment processing

Real AI integrations

OpenAI integrations

Gemini integrations

Real machine-learning models

Real asset comparison

Real copyright infringement detection

Real style detection

Real motion detection

Real rig detection

Real file storage

Firebase Storage

Firebase Authentication

Admin dashboard

Admin login

Admin permissions

Advanced analytics

Notifications system

Messaging/chat

Social features

Anything else that is not required for the core Year 1 creator workflow.

==================================================
23. UI / UX STYLE
==================================================

The product deals with valuable creative intellectual property, so the design should communicate:

Trust
Security
Professionalism
Technology
Creative-industry relevance

Use a modern SaaS dashboard design.

Suggested visual direction:

- dark navy / deep blue primary branding
- clean white/light content surfaces
- subtle blue accents
- rounded cards
- clear status badges
- professional typography
- restrained use of gradients
- simple line icons

Avoid making it look:
- childish
- like a crypto/NFT product
- excessively futuristic
- overly animated
- cluttered

Use status badges such as:

Verified
Protected
Active
Revoked
Registered

Make the interface understandable to a non-technical animator.

==================================================
24. RESPONSIVE DESIGN
==================================================

The application must work properly on:

Desktop
Tablet
Mobile

On desktop:
use a sidebar.

On mobile:
use a compact navigation drawer/menu.

Tables should become cards or remain horizontally scrollable when appropriate.

==================================================
25. INTERACTION REQUIREMENTS
==================================================

Even though most data is mocked, the MVP should feel interactive.

Buttons should work.

Forms should validate required fields.

Tabs should switch properly.

Filters should work.

Permission toggles should change.

Mock asset registration should show progress.

Share links should be generated.

Copy link should work.

Revoke Access should update the state.

Certificates should open in preview.

Profile editing should update Firebase.

Signup/Login should use Firebase CRUD.

Logout should work.

Do not leave non-functional buttons unless they clearly represent mock functionality.

==================================================
26. FINAL REQUIRED USER FLOW
==================================================

The final application must clearly support this journey:

Landing Page

→ Create Account

→ User record saved to Firestore

→ Login

→ Email/password matched with Firestore user record

→ Dashboard

→ My Assets

→ Register New Asset

→ Select animation asset type and mock file

→ Simulated asset classification

→ Simulated fingerprint generation

→ Timestamped provenance record shown

→ Asset Details

→ Set usage and AI permissions

→ Share asset

→ View sharing history

→ View provenance timeline

→ Generate provenance certificate

→ Profile

→ Update user details through Firestore CRUD

→ Logout

==================================================
27. MOST IMPORTANT SCOPE RULE
==================================================

Keep the MVP focused on:

REGISTER
PROTECT
CONTROL
SHARE
CERTIFY

Do not expand the project beyond this.

The advanced ToonProof vision involving:
- structural rig similarity
- Motion DNA
- style-imitation detection
- marketplace licensing
- royalties
- B2B provenance

belongs to later development stages and must not be built into this MVP.

The main purpose of this MVP is to clearly demonstrate the Year 1 creator journey described in the ToonProof IP & Royalty Vault business plan.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d9bcaeb2-0418-4d7e-bd80-7bf2388d0417).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
