import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { DynamicCredentialForm } from "./DynamicCredentialForm";
import { SchemaManagementService } from "../../services/schema-management";
import { CredentialService } from "../../services";

// Mock the services
vi.mock("../../services/schema-management");
vi.mock("../../services");
vi.mock("../../utils/toast");

const mockSchema = {
  id: "test-schema-1",
  name: "Test Schema",
  version: "1.0.0",
  description: "A test schema for unit testing",
  fields: [
    {
      name: "firstName",
      type: "string" as const,
      required: true,
      displayName: "First Name",
      description: "Enter your first name",
    },
    {
      name: "email",
      type: "email" as const,
      required: true,
      displayName: "Email Address",
      description: "Enter your email address",
    },
    {
      name: "age",
      type: "number" as const,
      required: false,
      displayName: "Age",
      description: "Enter your age",
    },
  ],
  metadata: {
    author: "Test Author",
    organization: "Test Org",
    category: "Test",
    tags: ["test"],
    isActive: true,
    isPublic: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DynamicCredentialForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful schema loading
    (SchemaManagementService.getCustomSchemaById as any).mockResolvedValue({
      data: {
        success: true,
        data: mockSchema,
      },
    });

    // Mock successful credential issuance
    (CredentialService.issue as any).mockResolvedValue({
      success: true,
    });
  });

  it("renders loading state initially", () => {
    render(
      <DynamicCredentialForm
        schemaId="test-schema-1"
        recipientAid="test-recipient"
      />
    );

    expect(screen.getByText("Loading schema...")).toBeInTheDocument();
  });

  it("renders form fields after schema loads", async () => {
    render(
      <DynamicCredentialForm
        schemaId="test-schema-1"
        recipientAid="test-recipient"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Issue Test Schema Credential")
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Age")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    render(
      <DynamicCredentialForm
        schemaId="test-schema-1"
        recipientAid="test-recipient"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Issue Test Schema Credential")
      ).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByText("Issue Credential");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("First Name is required")).toBeInTheDocument();
      expect(screen.getByText("Email Address is required")).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    render(
      <DynamicCredentialForm
        schemaId="test-schema-1"
        recipientAid="test-recipient"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Issue Test Schema Credential")
      ).toBeInTheDocument();
    });

    // Fill in invalid email
    const emailInput = screen.getByLabelText("Email Address");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const firstNameInput = screen.getByLabelText("First Name");
    fireEvent.change(firstNameInput, { target: { value: "John" } });

    const submitButton = screen.getByText("Issue Credential");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Email Address must be a valid email address")
      ).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const onSuccess = vi.fn();

    render(
      <DynamicCredentialForm
        schemaId="test-schema-1"
        recipientAid="test-recipient"
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Issue Test Schema Credential")
      ).toBeInTheDocument();
    });

    // Fill in valid data
    const firstNameInput = screen.getByLabelText("First Name");
    fireEvent.change(firstNameInput, { target: { value: "John" } });

    const emailInput = screen.getByLabelText("Email Address");
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    const ageInput = screen.getByLabelText("Age");
    fireEvent.change(ageInput, { target: { value: "30" } });

    const submitButton = screen.getByText("Issue Credential");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(CredentialService.issue).toHaveBeenCalledWith({
        schemaSaid: "test-schema-1",
        aid: "test-recipient",
        attribute: {
          firstName: "John",
          email: "john@example.com",
          age: "30",
        },
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("handles schema loading error", async () => {
    (SchemaManagementService.getCustomSchemaById as any).mockRejectedValue(
      new Error("Schema not found")
    );

    render(
      <DynamicCredentialForm
        schemaId="test-schema-1"
        recipientAid="test-recipient"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Schema not found or could not be loaded")
      ).toBeInTheDocument();
    });
  });
});
