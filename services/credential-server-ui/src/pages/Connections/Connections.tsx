import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Alert, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { i18n } from "../../i18n";
import { AppDispatch, RootState } from "../../store";
import { fetchContacts } from "../../store/reducers/connectionsSlice";
import {
  SchemaManagementService,
  CustomSchema,
} from "../../services/schema-management";
import { AddConnectionModal } from "./components/AddConnectionModal";
import { ConnectionsTable } from "./components/ConnectionsTable";
import "./Connections.scss";

const Connections = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const contacts = useSelector(
    (state: RootState) => state.connections.contacts
  );
  const [openModal, setOpenModal] = useState(false);
  const [issueSchemaId, setIssueSchemaId] = useState<string | null>(null);
  const [issueSchema, setIssueSchema] = useState<CustomSchema | null>(null);

  // Check if we're in credential issuance mode
  useEffect(() => {
    const schemaId = searchParams.get("issueSchema");
    if (schemaId) {
      setIssueSchemaId(schemaId);
      // Load schema details
      SchemaManagementService.getCustomSchemaById(schemaId)
        .then((response) => {
          if (response.data.success) {
            setIssueSchema(response.data.data);
          }
        })
        .catch((error) => {
          console.error("Failed to load schema:", error);
        });
    }
  }, [searchParams]);

  const handleClick = () => {
    setOpenModal(true);
  };

  const handleGetContacts = () => {
    dispatch(fetchContacts());
  };

  const handleCancelIssue = () => {
    navigate("/schema-management");
  };

  return (
    <Box
      className="connections-page"
      sx={{ padding: "0 2.5rem 2.5rem" }}
    >
      <PageHeader
        title={
          issueSchemaId
            ? i18n.t("pages.connections.issueCredential.title")
            : `${i18n.t("pages.connections.title", {
                number: contacts.length,
              })}`
        }
        sx={{
          margin: "1.5rem 0",
        }}
        action={
          !issueSchemaId ? (
            <Button
              className="add-connection-button primary-button"
              aria-haspopup="true"
              variant="contained"
              disableElevation
              disableRipple
              onClick={handleClick}
              startIcon={<AddIcon />}
            >
              {i18n.t("pages.connections.addConnection.title")}
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={handleCancelIssue}
            >
              {i18n.t("pages.connections.issueCredential.cancel")}
            </Button>
          )
        }
      />

      {issueSchemaId && issueSchema && (
        <Alert
          severity="info"
          sx={{ marginBottom: "1rem" }}
        >
          <Typography variant="body2">
            {i18n.t("pages.connections.issueCredential.description", {
              schemaName: issueSchema.name,
            })}
          </Typography>
        </Alert>
      )}

      <AddConnectionModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        handleGetContacts={handleGetContacts}
      />
      <ConnectionsTable issueSchemaId={issueSchemaId} />
    </Box>
  );
};

export { Connections };
