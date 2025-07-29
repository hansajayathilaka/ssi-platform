import { Add, Delete, Save, ArrowBack } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { RoutePath } from "../../const/route";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createCustomSchema,
  updateCustomSchema,
  fetchCustomSchemaById,
  clearCurrentSchema,
  clearError,
  resetCreateStatus,
  resetUpdateStatus,
} from "../../store/reducers/customSchemasSlice";
import {
  CustomSchema,
  CustomSchemaField,
  CustomSchemaMetadata,
} from "../../services/schema-management";
import { enqueueSnackbar } from "notistack";

const FIELD_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
];

interface SchemaFormData {
  id: string;
  name: string;
  version: string;
  description: string;
  fields: CustomSchemaField[];
  metadata: CustomSchemaMetadata;
}

const initialFormData: SchemaFormData = {
  id: "",
  name: "",
  version: "1.0.0",
  description: "",
  fields: [],
  metadata: {
    author: "",
    organization: "",
    category: "",
    tags: [],
    isActive: true,
    isPublic: false,
  },
};

const initialField: CustomSchemaField = {
  name: "",
  type: "string",
  required: false,
  displayName: "",
  description: "",
  defaultValue: "",
};

export const SchemaForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { currentSchema, status, error, createStatus, updateStatus } =
    useAppSelector((state) => state.customSchemas);

  const [formData, setFormData] = useState<SchemaFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchCustomSchemaById(id));
    }
    return () => {
      dispatch(clearCurrentSchema());
      dispatch(resetCreateStatus());
      dispatch(resetUpdateStatus());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (currentSchema && isEditMode) {
      setFormData({
        id: currentSchema.id,
        name: currentSchema.name,
        version: currentSchema.version,
        description: currentSchema.description || "",
        fields: currentSchema.fields,
        metadata: currentSchema.metadata,
      });
    }
  }, [currentSchema, isEditMode]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (createStatus === "succeeded") {
      enqueueSnackbar("Schema created successfully", { variant: "success" });
      navigate(RoutePath.SchemaManagement);
    }
  }, [createStatus, navigate]);

  useEffect(() => {
    if (updateStatus === "succeeded") {
      enqueueSnackbar("Schema updated successfully", { variant: "success" });
      navigate(RoutePath.SchemaManagement);
    }
  }, [updateStatus, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = "Schema ID is required";
    } else if (!/^[a-zA-Z0-9-_]+$/.test(formData.id)) {
      newErrors.id =
        "Schema ID can only contain letters, numbers, hyphens, and underscores";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Schema name is required";
    }

    if (!formData.version.trim()) {
      newErrors.version = "Version is required";
    }

    if (formData.fields.length === 0) {
      newErrors.fields = "At least one field is required";
    }

    // Validate fields
    formData.fields.forEach((field, index) => {
      if (!field.name.trim()) {
        newErrors[`field_${index}_name`] = "Field name is required";
      }
      if (!field.displayName.trim()) {
        newErrors[`field_${index}_displayName`] = "Display name is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const schemaData: Omit<CustomSchema, "createdAt" | "updatedAt"> = {
      id: formData.id,
      name: formData.name,
      version: formData.version,
      description: formData.description,
      fields: formData.fields,
      metadata: formData.metadata,
    };

    if (isEditMode && currentSchema) {
      dispatch(
        updateCustomSchema({
          id: formData.id,
          schema: {
            ...schemaData,
            createdAt: currentSchema.createdAt,
            updatedAt: new Date(),
          },
        })
      );
    } else {
      dispatch(createCustomSchema(schemaData));
    }
  };

  const handleFieldChange = (
    index: number,
    field: Partial<CustomSchemaField>
  ) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFormData({ ...formData, fields: updatedFields });
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { ...initialField }],
    });
  };

  const removeField = (index: number) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: updatedFields });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.metadata.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata,
          tags: [...(formData.metadata.tags || []), tagInput.trim()],
        },
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        tags:
          formData.metadata.tags?.filter((tag) => tag !== tagToRemove) || [],
      },
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    }
  };

  const isLoading = createStatus === "loading" || updateStatus === "loading";

  return (
    <Box
      className="schema-form-page"
      sx={{ padding: "0 2.5rem 2.5rem" }}
    >
      <PageHeader
        title={isEditMode ? "Edit Schema" : "Create New Schema"}
        sx={{ margin: "1.5rem 0" }}
      />

      <Box sx={{ marginBottom: "1rem" }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(RoutePath.SchemaManagement)}
          variant="outlined"
          sx={{ borderRadius: "0.5rem" }}
        >
          Back to Schema Management
        </Button>
      </Box>

      <Paper sx={{ padding: "2rem", borderRadius: "1rem" }}>
        {/* Basic Information */}
        <Typography
          variant="h6"
          sx={{ marginBottom: "1rem" }}
        >
          Basic Information
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <TextField
            label="Schema ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            error={Boolean(errors.id)}
            helperText={errors.id || "Unique identifier for the schema"}
            disabled={isEditMode}
            required
          />
          <TextField
            label="Schema Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
          />
          <TextField
            label="Version"
            value={formData.version}
            onChange={(e) =>
              setFormData({ ...formData, version: e.target.value })
            }
            error={Boolean(errors.version)}
            helperText={errors.version}
            required
          />
          <TextField
            label="Category"
            value={formData.metadata.category || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                metadata: { ...formData.metadata, category: e.target.value },
              })
            }
          />
        </Box>

        <TextField
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          multiline
          rows={3}
          fullWidth
          sx={{ marginBottom: "2rem" }}
        />

        {/* Metadata */}
        <Typography
          variant="h6"
          sx={{ marginBottom: "1rem" }}
        >
          Metadata
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <TextField
            label="Author"
            value={formData.metadata.author || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                metadata: { ...formData.metadata, author: e.target.value },
              })
            }
          />
          <TextField
            label="Organization"
            value={formData.metadata.organization || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                metadata: {
                  ...formData.metadata,
                  organization: e.target.value,
                },
              })
            }
          />
        </Box>

        {/* Tags */}
        <Box sx={{ marginBottom: "1rem" }}>
          <TextField
            label="Add Tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            helperText="Press Enter to add a tag"
            InputProps={{
              endAdornment: (
                <Button
                  onClick={addTag}
                  size="small"
                >
                  Add
                </Button>
              ),
            }}
          />
          <Box
            sx={{
              marginTop: "0.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {formData.metadata.tags?.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => removeTag(tag)}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Settings */}
        <Box sx={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.metadata.isActive}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      isActive: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Active"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.metadata.isPublic}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      isPublic: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Public"
          />
        </Box>

        <Divider sx={{ margin: "2rem 0" }} />

        {/* Fields */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <Typography variant="h6">Schema Fields</Typography>
          <Button
            startIcon={<Add />}
            onClick={addField}
            variant="outlined"
            sx={{ borderRadius: "0.5rem" }}
          >
            Add Field
          </Button>
        </Box>

        {errors.fields && (
          <Typography
            color="error"
            variant="body2"
            sx={{ marginBottom: "1rem" }}
          >
            {errors.fields}
          </Typography>
        )}

        {formData.fields.map((field, index) => (
          <Card
            key={index}
            sx={{ marginBottom: "1rem", border: "1px solid #e0e0e0" }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <Typography variant="subtitle1">Field {index + 1}</Typography>
                <IconButton
                  onClick={() => removeField(index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <TextField
                  label="Field Name"
                  value={field.name}
                  onChange={(e) =>
                    handleFieldChange(index, { name: e.target.value })
                  }
                  error={Boolean(errors[`field_${index}_name`])}
                  helperText={errors[`field_${index}_name`]}
                  required
                />
                <TextField
                  label="Display Name"
                  value={field.displayName}
                  onChange={(e) =>
                    handleFieldChange(index, { displayName: e.target.value })
                  }
                  error={Boolean(errors[`field_${index}_displayName`])}
                  helperText={errors[`field_${index}_displayName`]}
                  required
                />
                <FormControl>
                  <InputLabel>Field Type</InputLabel>
                  <Select
                    value={field.type}
                    onChange={(e) =>
                      handleFieldChange(index, { type: e.target.value as any })
                    }
                    label="Field Type"
                  >
                    {FIELD_TYPES.map((type) => (
                      <MenuItem
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Description"
                value={field.description || ""}
                onChange={(e) =>
                  handleFieldChange(index, { description: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                sx={{ marginBottom: "1rem" }}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.required}
                      onChange={(e) =>
                        handleFieldChange(index, { required: e.target.checked })
                      }
                    />
                  }
                  label="Required"
                />
                <TextField
                  label="Default Value"
                  value={field.defaultValue || ""}
                  onChange={(e) =>
                    handleFieldChange(index, { defaultValue: e.target.value })
                  }
                  sx={{ flex: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate(RoutePath.SchemaManagement)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={isLoading}
            sx={{ borderRadius: "0.5rem" }}
          >
            {isLoading
              ? "Saving..."
              : isEditMode
                ? "Update Schema"
                : "Create Schema"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
