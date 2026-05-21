# GHL Contact Notes Specification

## Purpose

Post notes to GHL contacts when ticket events occur, keeping CRM in sync with support activity.

## Requirements

### Requirement: Post Note on Ticket Open

The system SHOULD post a note to the GHL contact when a ticket is created, if ghl_contact_id is present.

#### Scenario: Ticket created with contact

- GIVEN a ticket is created with ghl_contact_id = "xyz"
- WHEN creation succeeds
- THEN a note is posted to GHL contact xyz: "Support ticket opened: {subject} (#{ticket_short_id})"

#### Scenario: Ticket created without contact

- GIVEN a ticket is created with ghl_contact_id = null
- WHEN creation succeeds
- THEN no GHL contact note is posted

#### Scenario: GHL API failure

- GIVEN a ticket is created with a valid contact
- WHEN GHL API call fails
- THEN ticket creation still succeeds (note posting is fire-and-forget)

### Requirement: Post Note on Ticket Resolve

The system SHOULD post a note to the GHL contact when a ticket is resolved or closed.

#### Scenario: Ticket resolved with contact

- GIVEN a ticket with ghl_contact_id is resolved
- WHEN status changes to resolved
- THEN a note is posted: "Support ticket resolved: {subject} (#{ticket_short_id})"
