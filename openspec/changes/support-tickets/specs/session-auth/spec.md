# Session Auth Specification

## Purpose

Staff authentication via pp-session JWT cookie. This spec covers the security fix: replacing unverified `jwtDecode` with proper JWT signature verification.

## Requirements

### Requirement: JWT Verification

The system MUST verify pp-session JWT signature using NEXTAUTH_SECRET, not just decode it.

#### Scenario: Valid pp-session

- GIVEN a request with pp-session cookie containing a valid, signed JWT
- WHEN the auth middleware verifies it using `jose.jwtVerify` with NEXTAUTH_SECRET
- THEN the session payload is extracted and request proceeds

#### Scenario: Tampered JWT

- GIVEN a request with pp-session cookie containing a JWT with invalid signature
- WHEN verification is attempted
- THEN response is 401 "Invalid session"

#### Scenario: Expired JWT

- GIVEN a request with an expired pp-session JWT
- WHEN verification is attempted
- THEN response is 401 "Session expired"

#### Scenario: Missing cookie

- GIVEN a request without pp-session cookie
- WHEN an authenticated route is accessed
- THEN response is 401 "Not authenticated"
