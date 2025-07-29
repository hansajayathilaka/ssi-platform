import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  IconButton,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import { triggerToast } from "../../utils/toast";

interface AttributeConfig {
  name: string;
  description: string;
  type: string;
  format?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

interface AttributeValue {
  description: string;
  type: string;
  format?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

interface AcdcSchemaConfig {
  title: string;
  description: string;
  credentialType: string;
  version: string;
  attributes: Record<string, AttributeValue>;
}

interface CreateAcdcSchemaModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (schema: any) => void;
}

const CreateAcdcSchemaModal: React.FC<CreateAcdcSchemaModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    credentialType: "",
    version: "1.0.0",
  });
  const [attributes, setAttributes] = useState<AttributeConfig[]>([
    {
      name: "firstName",
      description: "First name of the credential holder",
      type: "string",
      required: true,
    },
    {
      name: "lastName",
      description: "Last name of the credential holder",
      type: "string",
      required: true,
    },
  ]);

  const handleAddAttribute = () => {
    setAttributes([
      ...attributes,
      {
        name: "",
        description: "",
        type: "string",
        required: false,
      },
    ]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (
    index: number,
    field: keyof AttributeConfig,
    value: any
  ) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setAttributes(newAttributes);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.title || !formData.description || !formData.credentialType) {
      triggerToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      // Convert attributes array to object
      const attributesObject: Record<string, AttributeValue> = {};
      attributes.forEach((attr) => {
        if (attr.name) {
          attributesObject[attr.name] = {
            description: attr.description,
            type: attr.type,
            format: attr.format,
            required: attr.required,
            minLength: attr.minLength,
            maxLength: attr.maxLength,
            pattern: attr.pattern,
            minimum: attr.minimum,
            maximum: attr.maximum,
          };
        }
      });

      const schemaConfig: AcdcSchemaConfig = {
        title: formData.title,
        description: formData.description,
        credentialType: formData.credentialType,
        version: formData.version,
        attributes: attributesObject,
      };

      const response = await fetch("/api/schemas/acdc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schemaConfig),
      });

      const result = await response.json();

      if (result.success) {
        triggerToast("ACDC schema created successfully!", "success");
        onSuccess(result.data);
        // Reset form
        setFormData({
          title: "",
          description: "",
          credentialType: "",
          version: "1.0.0",
        });
        setAttributes([
          {
            name: "firstName",
            description: "First name of the credential holder",
            type: "string",
            required: true,
          },
          {
            name: "lastName",
            description: "Last name of the credential holder",
            type: "string",
            required: true,
          },
        ]);
      } else {
        triggerToast(
          `Failed to create schema: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating ACDC schema:", error);
      triggerToast("Failed to create schema. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={visible}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
        >
          <InfoIcon />
          <span>Create ACDC Schema</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 3 }}
        >
          Create a properly formatted ACDC (Attributed Credential Data
          Container) schema that is compatible with KERIA agents. The schema
          will be automatically SAIDified and saved to both built-in and custom
          schema directories.
        </Typography>

        <Box
          component="form"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Schema Title"
            placeholder="e.g., Employee Credential"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            fullWidth
          />

          <TextField
            label="Description"
            placeholder="Describe what this credential represents..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            multiline
            rows={3}
            required
            fullWidth
          />

          <TextField
            label="Credential Type"
            placeholder="e.g., EmployeeCredential"
            value={formData.credentialType}
            onChange={(e) =>
              setFormData({ ...formData, credentialType: e.target.value })
            }
            required
            fullWidth
          />

          <TextField
            label="Version"
            placeholder="1.0.0"
            value={formData.version}
            onChange={(e) =>
              setFormData({ ...formData, version: e.target.value })
            }
            required
            fullWidth
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6">Attributes</Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 2 }}
          >
            Define the attributes that will be included in credentials using
            this schema.
          </Typography>

          {attributes.map((attribute, index) => (
            <Card
              key={index}
              sx={{ mb: 2 }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="subtitle1">
                    Attribute {index + 1}
                  </Typography>
                  {attributes.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveAttribute(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Box
                  display="grid"
                  gridTemplateColumns="1fr 1fr"
                  gap={2}
                  mb={2}
                >
                  <TextField
                    placeholder="Attribute name (e.g., firstName)"
                    value={attribute.name}
                    onChange={(e) =>
                      handleAttributeChange(index, "name", e.target.value)
                    }
                    size="small"
                  />
                  <TextField
                    placeholder="Description"
                    value={attribute.description}
                    onChange={(e) =>
                      handleAttributeChange(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    size="small"
                  />
                  <FormControl size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={attribute.type}
                      onChange={(e) =>
                        handleAttributeChange(index, "type", e.target.value)
                      }
                      label="Type"
                    >
                      <MenuItem value="string">String</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="integer">Integer</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    placeholder="Format (optional, e.g., email, date)"
                    value={attribute.format || ""}
                    onChange={(e) =>
                      handleAttributeChange(index, "format", e.target.value)
                    }
                    size="small"
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={attribute.required}
                      onChange={(e) =>
                        handleAttributeChange(
                          index,
                          "required",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Required field"
                />
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outlined"
            onClick={handleAddAttribute}
            startIcon={<AddIcon />}
            fullWidth
            sx={{ mb: 3 }}
          >
            Add Attribute
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create ACDC Schema"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAcdcSchemaModal;
