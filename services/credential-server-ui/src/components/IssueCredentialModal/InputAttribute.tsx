import { Box, Grid } from "@mui/material";
import { i18n } from "../../i18n";
import { AppInput } from "../AppInput";
import { InputAttributeProps } from "./IssueCredentialModal.types";

interface AttributeSchema {
  type: string;
  title?: string;
  description?: string;
  format?: string;
  enum?: string[];
  [key: string]: unknown;
}

const InputAttribute = ({
  attributes,
  value,
  setValue,
  required,
  properties,
}: InputAttributeProps & {
  properties: Record<string, AttributeSchema>;
  required: string[];
}) => {
  const renderField = (attribute: string) => {
    const fieldSchema = properties?.[attribute] || {};
    const schemaType = fieldSchema.type;
    const fieldTitle = fieldSchema.title as string;
    const fieldDescription = fieldSchema.description as string;
    const fieldFormat = fieldSchema.format as string;
    const fieldEnum = fieldSchema.enum as string[];
    const isRequired = required.includes(attribute);

    // Determine input label - use title from schema if available, otherwise format the attribute name
    const getDisplayLabel = (key: string, title?: string) => {
      if (title) return title;

      // Handle nested keys like "credentialSubject.firstName"
      const parts = key.split(".");
      const lastPart = parts[parts.length - 1];

      // Convert camelCase to Title Case
      return lastPart
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (str) => str.toUpperCase());
    };

    const displayLabel = getDisplayLabel(attribute, fieldTitle);

    // Determine input type based on schema type and format
    let inputType = "text";
    if (schemaType === "integer" || schemaType === "number") {
      inputType = "number";
    } else if (fieldFormat === "email") {
      inputType = "email";
    } else if (fieldFormat === "date") {
      inputType = "date";
    } else if (fieldFormat === "date-time") {
      inputType = "datetime-local";
    } else if (fieldFormat === "uri" || fieldFormat === "url") {
      inputType = "url";
    }

    const inputValue: string =
      value[attribute] !== undefined && value[attribute] !== null
        ? String(value[attribute])
        : "";

    // Handle enum fields (dropdown)
    if (fieldEnum && fieldEnum.length > 0) {
      return (
        <Box
          key={attribute}
          className="form-field"
        >
          <label
            htmlFor={attribute}
            className="field-label"
          >
            {displayLabel}
            {isRequired && <span className="required-indicator">*</span>}
          </label>
          <select
            id={attribute}
            value={inputValue}
            onChange={(e) => setValue(attribute, e.target.value)}
            className="enum-select"
            required={isRequired}
          >
            <option value="">Select {displayLabel}</option>
            {fieldEnum.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          {fieldDescription && (
            <small className="field-description">{fieldDescription}</small>
          )}
        </Box>
      );
    }

    // Handle boolean fields (checkbox)
    if (schemaType === "boolean") {
      return (
        <Box
          key={attribute}
          className="form-field"
        >
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value[attribute] === true || value[attribute] === "true"}
              onChange={(e) => setValue(attribute, e.target.checked)}
            />
            {displayLabel}
            {isRequired && <span className="required-indicator">*</span>}
          </label>
          {fieldDescription && (
            <small className="field-description">{fieldDescription}</small>
          )}
        </Box>
      );
    }

    // Handle regular input fields
    return (
      <AppInput
        key={attribute}
        fullWidth
        label={displayLabel}
        type={inputType === "number" ? "integer" : "string"}
        optional={!isRequired}
        value={inputValue}
        onChange={
          inputType === "number"
            ? (val) => setValue(attribute, val == null ? "" : val)
            : (e) => setValue(attribute, e.target.value)
        }
        placeholder={
          fieldDescription ||
          i18n.t(
            "pages.credentialDetails.issueCredential.inputAttribute.placeholder"
          )
        }
        errorMessage={fieldDescription}
      />
    );
  };

  return (
    <Box className="input-attribute">
      <Grid
        container
        spacing={2}
      >
        {attributes.map((attribute, index) => (
          <Grid
            item
            xs={12}
            md={6}
            key={attribute}
          >
            {renderField(attribute)}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export { InputAttribute };
