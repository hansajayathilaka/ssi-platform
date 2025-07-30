# Requirements Document

## Introduction

This feature creates a simplified credential server that combines both frontend and backend functionality using Express with a template engine. The system will provide a web interface for credential issuance with two main APIs: getting invitations and sending data to issue credentials to selected users. This is a streamlined version of the existing credential-server and credential-server-ui services.

## Requirements

### Requirement 1

**User Story:** As a credential issuer, I want a simple web interface to manage credential issuance, so that I can easily issue credentials without managing separate frontend and backend applications.

#### Acceptance Criteria

1. WHEN the server starts THEN the system SHALL serve a web interface using Express with a template engine
2. WHEN a user accesses the root URL THEN the system SHALL display a credential issuance dashboard
3. WHEN the application loads THEN the system SHALL initialize the necessary KERI/Signify clients for credential operations

### Requirement 2

**User Story:** As a credential issuer, I want to generate invitations for credential recipients, so that they can connect and receive credentials.

#### Acceptance Criteria

1. WHEN a user requests an invitation THEN the system SHALL generate a KERI OOBI (Out-of-Band Introduction) invitation
2. WHEN an invitation is generated THEN the system SHALL return the invitation data in a format suitable for QR code generation
3. WHEN the invitation API is called THEN the system SHALL respond with invitation details including connection information

### Requirement 3

**User Story:** As a credential issuer, I want to send credential data to selected users, so that I can issue verifiable credentials to them.

#### Acceptance Criteria

1. WHEN credential data is submitted THEN the system SHALL validate the data format and required fields
2. WHEN valid data is received THEN the system SHALL issue an ACDC credential to the specified recipient
3. WHEN a credential is issued THEN the system SHALL return confirmation of successful issuance
4. IF credential issuance fails THEN the system SHALL return appropriate error messages

### Requirement 4

**User Story:** As a credential issuer, I want a simple form-based interface for credential issuance, so that I can easily input and submit credential data.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display a form for entering credential recipient information
2. WHEN the form is submitted THEN the system SHALL process the data and initiate credential issuance
3. WHEN operations complete THEN the system SHALL display success or error messages to the user
4. WHEN invitations are generated THEN the system SHALL display them in a user-friendly format

### Requirement 5

**User Story:** As a system administrator, I want the server to be self-contained and easy to deploy, so that I can run it without complex setup procedures.

#### Acceptance Criteria

1. WHEN the server starts THEN the system SHALL serve both API endpoints and web interface from a single Express application
2. WHEN dependencies are installed THEN the system SHALL require minimal configuration to run
3. WHEN the application runs THEN the system SHALL use existing KERI infrastructure and configuration patterns
4. WHEN static assets are needed THEN the system SHALL serve them directly from the Express server