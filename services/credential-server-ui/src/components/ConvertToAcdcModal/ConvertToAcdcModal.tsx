import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import TransformIcon from "@mui/icons-material/Transform";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { triggerToast } from "../../utils/toast";

interface ConvertToAcdcModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (schema: any) => void;
  customSchema: any;
}

const ConvertToAcdcModal: React.FC<ConvertToAcdcModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  customSchema,
}) => {
  const [loading, setLoading] = useState(false);
  const [convertedSchema, setConvertedSchema] = useState<any>(null);

  const handleConvert = async (save: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schemas/acdc/convert?save=${save}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customSchema),
      });

      const result = await response.json();

      if (result.success) {
        setConvertedSchema(result.data.acdcSchema);
        if (save) {
          triggerToast(
            "Schema converted to ACDC format and saved successfully!",
            "success"
          );
          onSuccess(result.data.acdcSchema);
        } else {
          triggerToast(
            "Schema converted to ACDC format successfully!",
            "success"
          );
        }
      } else {
        triggerToast(
          `Failed to convert schema: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error converting schema:", error);
      triggerToast("Failed to convert schema. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConverted = async () => {
    if (!convertedSchema) return;

    setLoading(true);
    try {
      const response = await fetch("/api/schemas/acdc/convert?save=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customSchema),
      });

      const result = await response.json();

      if (result.success) {
        triggerToast("ACDC schema saved successfully!", "success");
        onSuccess(result.data.acdcSchema);
      } else {
        triggerToast(
          `Failed to save schema: ${result.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving schema:", error);
      triggerToast("Failed to save schema. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={visible}
      onClose={onCancel}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
        >
          <TransformIcon />
          <span>Convert to ACDC Schema</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 3 }}
        >
          Convert your custom schema to the ACDC (Attributed Credential Data
          Container) format that is compatible with KERIA agents. This will
          create a properly SAIDified schema that follows the ACDC
          specification.
        </Typography>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
            >
              Original Custom Schema
            </Typography>
            <Box>
              <Typography>
                <strong>Name:</strong> {customSchema?.name}
              </Typography>
              <Typography>
                <strong>Description:</strong> {customSchema?.description}
              </Typography>
              <Typography>
                <strong>Version:</strong> {customSchema?.version}
              </Typography>
              <Typography>
                <strong>Fields:</strong> {customSchema?.fields?.length || 0}{" "}
                attributes
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {convertedSchema && (
          <>
            <Divider sx={{ my: 2 }} />
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={2}
                >
                  <CheckCircleIcon sx={{ color: "success.main" }} />
                  <Typography variant="h6">Converted ACDC Schema</Typography>
                </Box>
                <Box>
                  <Typography>
                    <strong>SAID:</strong> <code>{convertedSchema.$id}</code>
                  </Typography>
                  <Typography>
                    <strong>Title:</strong> {convertedSchema.title}
                  </Typography>
                  <Typography>
                    <strong>Credential Type:</strong>{" "}
                    {convertedSchema.credentialType}
                  </Typography>
                  <Typography>
                    <strong>Schema Type:</strong> ACDC Compatible
                  </Typography>
                  <Typography>
                    <strong>Attributes Block SAID:</strong>{" "}
                    <code>
                      {convertedSchema.properties?.a?.oneOf?.[1]?.$id}
                    </code>
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                >
                  Schema Details
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    padding: 1.5,
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    maxHeight: 300,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {JSON.stringify(convertedSchema, null, 2)}
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        {!convertedSchema ? (
          <>
            <Button
              onClick={() => handleConvert(false)}
              disabled={loading}
            >
              Preview Conversion
            </Button>
            <Button
              variant="contained"
              onClick={() => handleConvert(true)}
              disabled={loading}
            >
              {loading ? "Converting..." : "Convert & Save"}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={handleSaveConverted}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save ACDC Schema"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToAcdcModal;
