interface CredentialIssueRequest {
  schemaSaid: string;
  aid: string;
  attribute?: Record<string, any>;
  attributes?: string[]; // For request presentation
  [key: string]: any; // For backward compatibility
}

export type { CredentialIssueRequest };
