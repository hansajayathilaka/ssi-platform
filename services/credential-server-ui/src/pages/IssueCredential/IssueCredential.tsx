import { Box, Typography, Alert, Button } from "@mui/material";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { i18n } from "../../i18n";
import { DynamicCredentialForm } from "../../components/DynamicCredentialForm";
import {
  SchemaManagementService,
  CustomSchema,
} from "../../services/schema-management";
import { useAppSelector } from "../../store/hooks";
import { PageHeader } from "../../components/PageHeader";
import { triggerToast } from "../../utils/toast";
import "./IssueCredential.scss";

const IssueCredential = () => {
  const { schemaId } = useParams<{ schemaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const recipientAid = searchParams.get("recipient");
  const connections = useAppSelector((state) => state.connections.contacts);

  const [schema, setSchema] = useState<CustomSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find recipient connection details
  const recipientConnection = connections.find(
    (conn) => conn.id === recipientAid
  );

  useEffect(() => {
    const loadSchema = async () => {
      if (!schemaId) {
        setError("Schema ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response =
          await SchemaManagementService.getCustomSchemaById(schemaId);
        if (response.data.success) {
          setSchema(response.data.data);
        } else {
          setError("Failed to load schema");
        }
      } catch (error) {
        console.error("Failed to load schema:", error);
        setError("Failed to load schema");
      } finally {
        setLoading(false);
      }
    };

    loadSchema();
  }, [schemaId]);

  const handleSuccess = () => {
    triggerToast(i18n.t("pages.issueCredential.messages.success"), "success");
    // Navigate back to connections or credentials page
    if (recipientAid) {
      navigate(`/connections/${recipientAid}`);
    } else {
      navigate("/credentials");
    }
  };

  const handleCancel = () => {
    // Navigate back to previous page
    if (recipientAid) {
      navigate(`/connections/${recipientAid}`);
    } else {
      navigate("/credentials");
    }
  };

  if (loading) {
    return (
      <Box className="issue-credential-page loading">
        <PageHeader title={i18n.t("pages.issueCredential.title")} />
        <Box className="loading-content">
          <Typography>{i18n.t("pages.issueCredential.loading")}</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !schema || !schemaId) {
    return (
      <Box className="issue-credential-page error">
        <PageHeader title={i18n.t("pages.issueCredential.title")} />
        <Box className="error-content">
          <Alert severity="error">
            {error || i18n.t("pages.issueCredential.errors.schemaNotFound")}
          </Alert>
          <Button
            variant="contained"
            onClick={handleCancel}
            className="back-button"
          >
            {i18n.t("pages.issueCredential.actions.back")}
          </Button>
        </Box>
      </Box>
    );
  }

  if (!recipientAid) {
    return (
      <Box className="issue-credential-page error">
        <PageHeader title={i18n.t("pages.issueCredential.title")} />
        <Box className="error-content">
          <Alert severity="error">
            {i18n.t("pages.issueCredential.errors.recipientRequired")}
          </Alert>
          <Button
            variant="contained"
            onClick={handleCancel}
            className="back-button"
          >
            {i18n.t("pages.issueCredential.actions.back")}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="issue-credential-page">
      <PageHeader title={i18n.t("pages.issueCredential.title")} />

      <Box className="page-content">
        <Box className="credential-info">
          <Typography
            variant="h6"
            className="schema-name"
          >
            {schema.name}
          </Typography>
          {schema.description && (
            <Typography
              variant="body2"
              className="schema-description"
            >
              {schema.description}
            </Typography>
          )}

          {recipientConnection && (
            <Box className="recipient-info">
              <Typography
                variant="body2"
                className="recipient-label"
              >
                {i18n.t("pages.issueCredential.recipientLabel")}:
              </Typography>
              <Typography
                variant="body1"
                className="recipient-name"
              >
                {recipientConnection.alias}
              </Typography>
              <Typography
                variant="caption"
                className="recipient-id"
              >
                {recipientConnection.id.substring(0, 8)}...
                {recipientConnection.id.slice(-8)}
              </Typography>
            </Box>
          )}
        </Box>

        <DynamicCredentialForm
          schemaId={schemaId}
          recipientAid={recipientAid}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Box>
    </Box>
  );
};

export { IssueCredential };
