import { Box, Button, Typography, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import { Trans } from "react-i18next";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import {
  SchemaManagementService,
  CustomSchema,
  CustomSchemaField,
} from "../../services/schema-management";
import { triggerToast } from "../../utils/toast";
import { AppInput } from "../AppInput";
import "./DynamicCredentialForm.scss";

interface DynamicCredentialFormProps {
  schemaId: string;
  recipientAid: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FieldValidationError {
  field: string;
  message: string;
}

const DynamicCredentialForm = ({
  schemaId,
  recipientAid,
  onSuccess,
  onCancel,
}: DynamicCredentialFormProps) => {
  const [schema, setSchema] = useState<CustomSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<
    FieldValidationError[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(true);

  // Load schema on component mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        setSchemaLoading(true);
        const response =
          await SchemaManagementService.getCustomSchemaById(schemaId);
        if (response.data.success) {
          setSchema(response.data.data);
          // Initialize form data with default values
          const initialData: Record<string, any> = {};
          response.data.data.fields.forEach((field: CustomSchemaField) => {
            if (field.defaultValue !== undefined) {
              initialData[field.name] = field.defaultValue;
            }
          });
          setFormData(initialData);
        } else {
          triggerToast(
            i18n.t("components.dynamicCredentialForm.errors.schemaLoadFailed"),
            "error"
          );
        }
      } catch (error) {
        console.error("Failed to load schema:", error);
        triggerToast(
          i18n.t("components.dynamicCredentialForm.errors.schemaLoadFailed"),
          "error"
        );
      } finally {
        setSchemaLoading(false);
      }
    };

    if (schemaId) {
      loadSchema();
    }
  }, [schemaId]);

  // Validate a single field
  const validateField = (
    field: CustomSchemaField,
    value: any
  ): string | null => {
    // Check required fields
    if (
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      return i18n.t("components.dynamicCredentialForm.validation.required", {
        field: field.displayName || field.name,
      });
    }

    // Skip validation for empty optional fields
    if (
      !field.required &&
      (value === undefined || value === null || value === "")
    ) {
      return null;
    }

    // Type validation
    switch (field.type) {
      case "number":
        if (isNaN(Number(value))) {
          return i18n.t(
            "components.dynamicCredentialForm.validation.invalidNumber",
            {
              field: field.displayName || field.name,
            }
          );
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return i18n.t(
            "components.dynamicCredentialForm.validation.invalidEmail",
            {
              field: field.displayName || field.name,
            }
          );
        }
        break;
      case "url":
        try {
          new URL(value);
        } catch {
          return i18n.t(
            "components.dynamicCredentialForm.validation.invalidUrl",
            {
              field: field.displayName || field.name,
            }
          );
        }
        break;
      case "date":
        if (isNaN(Date.parse(value))) {
          return i18n.t(
            "components.dynamicCredentialForm.validation.invalidDate",
            {
              field: field.displayName || field.name,
            }
          );
        }
        break;
    }

    return null;
  };

  // Validate all form fields
  const validateForm = (): boolean => {
    if (!schema) return false;

    const errors: FieldValidationError[] = [];

    schema.fields.forEach((field) => {
      const value = formData[field.name];
      const error = validateField(field, value);
      if (error) {
        errors.push({ field: field.name, message: error });
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle form field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear validation error for this field
    setValidationErrors((prev) =>
      prev.filter((error) => error.field !== fieldName)
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !schema) {
      return;
    }

    try {
      setLoading(true);

      // Prepare credential data
      const credentialData = {
        schemaSaid: schemaId,
        aid: recipientAid,
        ...Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [
            key,
            typeof value === "string" ? value : String(value),
          ])
        ),
      };

      // Issue the credential
      await CredentialService.issue(credentialData);

      triggerToast(
        i18n.t("components.dynamicCredentialForm.messages.success"),
        "success"
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to issue credential:", error);
      triggerToast(
        i18n.t("components.dynamicCredentialForm.messages.error"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get validation error for a specific field
  const getFieldError = (fieldName: string): string | undefined => {
    const error = validationErrors.find((err) => err.field === fieldName);
    return error?.message;
  };

  // Render form field based on field type
  const renderField = (field: CustomSchemaField) => {
    const fieldError = getFieldError(field.name);
    const value = formData[field.name] || "";

    switch (field.type) {
      case "boolean":
        return (
          <Box
            key={field.name}
            className="form-field"
          >
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) =>
                  handleFieldChange(field.name, e.target.checked)
                }
              />
              {field.displayName || field.name}
              {field.required && <span className="required-indicator">*</span>}
            </label>
            {field.description && (
              <Typography
                variant="caption"
                className="field-description"
              >
                {field.description}
              </Typography>
            )}
            {fieldError && (
              <Typography
                variant="caption"
                color="error"
                className="field-error"
              >
                {fieldError}
              </Typography>
            )}
          </Box>
        );

      case "date":
        return (
          <AppInput
            key={field.name}
            fullWidth
            label={field.displayName || field.name}
            type="string"
            optional={!field.required}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={!!fieldError}
            errorMessage={fieldError || field.description}
            placeholder={i18n.t(
              "components.dynamicCredentialForm.placeholders.date"
            )}
          />
        );

      case "number":
        return (
          <AppInput
            key={field.name}
            fullWidth
            label={field.displayName || field.name}
            type="integer"
            optional={!field.required}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={!!fieldError}
            errorMessage={fieldError || field.description}
            placeholder={i18n.t(
              "components.dynamicCredentialForm.placeholders.number"
            )}
          />
        );

      default: // string, email, url
        return (
          <AppInput
            key={field.name}
            fullWidth
            label={field.displayName || field.name}
            type="string"
            optional={!field.required}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={!!fieldError}
            errorMessage={fieldError || field.description}
            placeholder={i18n.t(
              `components.dynamicCredentialForm.placeholders.${field.type}`
            )}
          />
        );
    }
  };

  if (schemaLoading) {
    return (
      <Box className="dynamic-credential-form loading">
        <Typography>
          {i18n.t("components.dynamicCredentialForm.loading")}
        </Typography>
      </Box>
    );
  }

  if (!schema) {
    return (
      <Box className="dynamic-credential-form error">
        <Alert severity="error">
          {i18n.t("components.dynamicCredentialForm.errors.schemaNotFound")}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="dynamic-credential-form">
      <Box className="form-header">
        <Typography
          variant="h6"
          className="form-title"
        >
          <Trans
            i18nKey="components.dynamicCredentialForm.title"
            values={{ schemaName: schema.name }}
            components={{ bold: <strong /> }}
          />
        </Typography>
        {schema.description && (
          <Typography
            variant="body2"
            className="form-description"
          >
            {schema.description}
          </Typography>
        )}
      </Box>

      <Box className="form-fields">
        {schema.fields.map((field) => renderField(field))}
      </Box>

      {validationErrors.length > 0 && (
        <Alert
          severity="error"
          className="form-validation-summary"
        >
          <Typography variant="body2">
            {i18n.t("components.dynamicCredentialForm.validation.summary")}
          </Typography>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Box className="form-actions">
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
            className="cancel-button"
          >
            {i18n.t("components.dynamicCredentialForm.actions.cancel")}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || validationErrors.length > 0}
          className="submit-button"
        >
          {loading
            ? i18n.t("components.dynamicCredentialForm.actions.submitting")
            : i18n.t("components.dynamicCredentialForm.actions.submit")}
        </Button>
      </Box>
    </Box>
  );
};

export { DynamicCredentialForm };
