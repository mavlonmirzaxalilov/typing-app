# Security Specification - ValiTeach Typing

## Data Invariants
1. A result cannot exist without a valid textId and userId.
2. Only Admins can create/edit texts.
3. Users can only register once (per UID).
4. Results must have a positive WPM and accuracy between 0 and 100.
5. Users cannot change their role to 'admin' once registered as 'user'.

## Collections and Roles
- `/users/{userId}`
  - Create: Any authenticated user.
  - Update: Owner (cannot change role).
  - Read: Authenticated.
- `/texts/{textId}`
  - Create/Update/Delete: Admin only.
  - Read: Authenticated.
- `/results/{resultId}`
  - Create: Authenticated user (setting their own userId).
  - Update: Forbidden.
  - Delete: Admin only.
  - Read: Authenticated.
