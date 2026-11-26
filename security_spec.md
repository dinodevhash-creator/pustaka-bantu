# Security Specification — Pustaka Bantu Mahasiswa (Firestore)

## 1. Data Invariants

1. **Strict Owner Isolation (PII Protection)**: A `UserWorkspace` document at `/users/{userId}` contains `email` (PII). Only the authenticated, email-verified user whose `request.auth.uid == userId` may read, create, update, or delete their own document. Listing `/users` is strictly denied (`allow list: if false`).
2. **Master Gate Relational Sync**: Every document in `/users/{userId}/notes/{guideId}` and `/users/{userId}/history/{entryId}` requires the parent `/users/{userId}` document to exist on create/update/delete, and requires `ownerId == request.auth.uid == userId`.
3. **Immutable Ownership & Timestamps**: `uid`, `ownerId`, `guideId`, and `createdAt` can never be mutated after creation. `createdAt` must equal `request.time` on creation and `updatedAt` must equal `request.time` on creation and update.
4. **Strict Volumetric & Schema Bounds**: Every string and array enforces explicit max lengths matching `firebase-blueprint.json`, with `hasAll` + `hasOnly` on create and `affectedKeys().hasOnly(...)` on update to block shadow fields.
5. **Secure List Queries**: `allow list` on `notes` and `history` explicitly evaluates `resource.data.ownerId == request.auth.uid` without calling `get()`/`exists()` inside list rules.

## 2. The "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)

1. **Unauthenticated Read** (`GET /users/userA` with `auth = null`) -> DENIED.
2. **Cross-User PII Read** (`GET /users/userA` as `userB`) -> DENIED.
3. **Collection Scrape** (`LIST /users` as `userA`) -> DENIED.
4. **Unverified Email Write** (`CREATE /users/userA` with `email_verified: false`) -> DENIED.
5. **Identity Spoofing on Create** (`CREATE /users/userA` with `{ uid: "userB", ... }`) -> DENIED.
6. **Shadow Field Injection** (`CREATE /users/userA` with extra `{ isAdmin: true }`) -> DENIED.
7. **ID Poisoning** (`CREATE /users/userA/notes/../../bad$id` or 200-char ID) -> DENIED.
8. **Client-Forged Timestamp** (`CREATE /users/userA/history/h1` with `createdAt: "2020-01-01"`) -> DENIED.
9. **Immutable Timestamp Tampering** (`UPDATE /users/userA` modifying `createdAt`) -> DENIED.
10. **Array Exhaustion Attack** (`UPDATE /users/userA` with 500 items in `savedGuideIds`) -> DENIED.
11. **Value Poisoning on Whitelisted Field** (`UPDATE /users/userA/notes/g1` with `content: 12345` or 5000-char string) -> DENIED.
12. **Orphan Subcollection Write** (`CREATE /users/userA/history/h1` when `/users/userA` does not exist) -> DENIED.
