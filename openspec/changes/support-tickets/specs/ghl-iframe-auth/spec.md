# GHL Iframe Auth Specification

## Purpose

Secure authentication for GHL Custom Menu iframes. Issues a `support-session` cookie scoped to the iframe context, separate from the staff `pp-session`.

## Requirements

### Requirement: Issue Support Session

The system MUST authenticate GHL iframe requests and issue a support-session cookie.

**API:** GET /api/auth/ghl-iframe?locationId={}&contactId={}

#### Scenario: Valid location with contact

- GIVEN locationId belongs to an agency with active PatronPro subscription
- WHEN GET /api/auth/ghl-iframe?locationId=abc&contactId=xyz
- THEN sets `support-session` cookie (JWT, 8h TTL, SameSite=None, Secure, Partitioned, HttpOnly)
- AND JWT payload contains { ghl_location_id, ghl_contact_id, contact_name, contact_email }
- AND redirects to /ghl/support/new

#### Scenario: Valid location without contact

- GIVEN locationId is valid
- WHEN GET /api/auth/ghl-iframe?locationId=abc (no contactId)
- THEN issues session with ghl_contact_id=null
- AND redirects to /ghl/support/new

#### Scenario: Invalid location

- GIVEN locationId does not belong to any agency in PatronPro
- WHEN GET /api/auth/ghl-iframe?locationId=invalid
- THEN response is 403 with "Location not authorized"

#### Scenario: Missing locationId

- WHEN GET /api/auth/ghl-iframe (no params)
- THEN response is 400

### Requirement: Cookie Security

The support-session cookie MUST use: `SameSite=None; Secure; HttpOnly; Partitioned; Path=/; Max-Age=28800`.

#### Scenario: Third-party cookie context

- GIVEN the page loads inside a GHL iframe (cross-origin)
- WHEN the cookie is set
- THEN it MUST include Partitioned attribute for Chrome CHIPS compliance

### Requirement: Location Verification

The system MUST verify locationId belongs to an agency with a valid PatronPro account by checking `ghl_locations` table joined to `companies`.

#### Scenario: Location exists but agency inactive

- GIVEN locationId exists in ghl_locations but company has no active subscription
- WHEN GET /api/auth/ghl-iframe?locationId=abc
- THEN response is 403
