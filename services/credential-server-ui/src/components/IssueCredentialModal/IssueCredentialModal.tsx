import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Box, Button } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { IGNORE_ATTRIBUTES } from "../../const";
import { useSchemaDetail } from "../../hooks/SchemaDetail";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchContactCredentials } from "../../store/reducers/connectionsSlice";
import { triggerToast } from "../../utils/toast";
import { PopupModal } from "../PopupModal";
import { calcInitStage, getBackStage, getNextStage } from "./helper";
import { InputAttribute } from "./InputAttribute";
import "./IssueCredentialModal.scss";
import {
  IssueCredentialModalProps,
  IssueCredentialStage,
  IssueCredListData,
} from "./IssueCredentialModal.types";
import { IssueCredListTemplate } from "./IssueCredListTemplate";
import { Review } from "./Review";

const IssueCredentialModal = ({
  open,
  onClose,
  credentialTypeId,
  connectionId,
}: IssueCredentialModalProps) => {
  const RESET_TIMEOUT = 1000;
  const connections = useAppSelector((state) => state.connections.contacts);
  const schemas = useAppSelector((state) => state.schemasCache.schemas);
  const dispatch = useAppDispatch();
  const [currentStage, setCurrentStage] = useState(
    calcInitStage(credentialTypeId, connectionId)
  );
  const [selectedConnection, setSelectedConnection] = useState(connectionId);
  const [selectedCredTemplate, setSelectedCredTemplate] =
    useState(credentialTypeId);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const schema = useSchemaDetail(selectedCredTemplate);

  // Recursively find all form fields in the JSON schema
  const extractFormFields = (
    schemaObj: any,
    path: string[] = []
  ): {
    properties: Record<string, any>;
    required: string[];
    fieldPaths: Record<string, string[]>;
  } => {
    const result = {
      properties: {} as Record<string, any>,
      required: [] as string[],
      fieldPaths: {} as Record<string, string[]>,
    };

    if (!schemaObj || typeof schemaObj !== "object") {
      return result;
    }

    // Check if this level has properties
    if (schemaObj.properties && typeof schemaObj.properties === "object") {
      const properties = schemaObj.properties;
      const required = schemaObj.required || [];

      // Process each property
      Object.keys(properties).forEach((key) => {
        const property = properties[key];
        const currentPath = [...path, key];
        const fieldKey = currentPath.join(".");

        // If this property has its own properties (nested object), recurse
        if (property.properties && typeof property.properties === "object") {
          const nested = extractFormFields(property, currentPath);
          Object.assign(result.properties, nested.properties);
          result.required.push(...nested.required);
          Object.assign(result.fieldPaths, nested.fieldPaths);
        } else {
          // This is a leaf property (actual form field)
          result.properties[fieldKey] = property;
          result.fieldPaths[fieldKey] = currentPath;

          // Check if this field is required
          if (required.includes(key)) {
            result.required.push(fieldKey);
          }
        }
      });
    }

    // Handle oneOf structures (for backward compatibility)
    if (schemaObj.oneOf && Array.isArray(schemaObj.oneOf)) {
      schemaObj.oneOf.forEach((option: any) => {
        const nested = extractFormFields(option, path);
        Object.assign(result.properties, nested.properties);
        result.required.push(...nested.required);
        Object.assign(result.fieldPaths, nested.fieldPaths);
      });
    }

    return result;
  };

  // Extract form fields from schema
  const getSchemaProperties = () => {
    if (!schema) {
      return {
        properties: {},
        required: [],
        fieldPaths: {},
      };
    }

    // Start extraction from the root schema
    return extractFormFields(schema);
  };

  const {
    properties,
    required: requiredList,
    fieldPaths,
  } = getSchemaProperties();
  const attributeKeys = Object.keys(properties).filter(
    (key) => !IGNORE_ATTRIBUTES.includes(key)
  );
  const renderedRequiredList = requiredList.filter((key) =>
    attributeKeys.includes(key)
  );
  const allRequiredAttributesFilled =
    currentStage !== IssueCredentialStage.InputAttribute
      ? true
      : renderedRequiredList.every((key) => {
          const value = attributes[key];
          if (value === undefined || value === null) return false;
          if (typeof value === "string" && value.trim() === "") return false;
          if (typeof value === "boolean") return true; // booleans are always valid
          return true;
        });

  useEffect(() => {
    if (!open) return;
    const stage = calcInitStage(credentialTypeId, connectionId);
    setCurrentStage(stage);
    if (connectionId) setSelectedConnection(connectionId);
    if (credentialTypeId) setSelectedCredTemplate(credentialTypeId);
  }, [connectionId, credentialTypeId, open]);

  const resetModal = () => {
    onClose();
    setSelectedConnection(undefined);
    setSelectedCredTemplate(undefined);
    setAttributes({});
    setTimeout(() => {
      setCurrentStage(calcInitStage(credentialTypeId, connectionId));
    }, RESET_TIMEOUT);
  };

  const description = useMemo(() => {
    switch (currentStage) {
      case IssueCredentialStage.InputAttribute:
        return "pages.credentialDetails.issueCredential.inputAttribute.description";
      case IssueCredentialStage.Review:
        return "pages.credentialDetails.issueCredential.review.description";
      case IssueCredentialStage.SelectCredentialType:
        return "pages.credentialDetails.issueCredential.selectCredential.description";
      case IssueCredentialStage.SelectConnection:
      default:
        return "pages.credentialDetails.issueCredential.selectConnection.description";
    }
  }, [currentStage]);

  const primaryButton = useMemo(() => {
    switch (currentStage) {
      case IssueCredentialStage.InputAttribute:
        return "pages.credentialDetails.issueCredential.inputAttribute.button.continue";
      case IssueCredentialStage.Review:
        return "pages.credentialDetails.issueCredential.review.button.issue";
      case IssueCredentialStage.SelectConnection:
      default:
        return "pages.credentialDetails.issueCredential.selectConnection.button.continue";
    }
  }, [currentStage]);

  const disablePrimaryButton = useMemo(() => {
    return (
      (currentStage === IssueCredentialStage.SelectCredentialType &&
        !selectedCredTemplate) ||
      (currentStage === IssueCredentialStage.SelectConnection &&
        !selectedConnection) ||
      (currentStage === IssueCredentialStage.InputAttribute &&
        !allRequiredAttributesFilled) ||
      loading
    );
  }, [
    currentStage,
    selectedCredTemplate,
    selectedConnection,
    loading,
    allRequiredAttributesFilled,
  ]);

  const issueCred = async () => {
    if (!selectedCredTemplate || !selectedConnection) {
      return;
    }

    const schemaSaid = selectedCredTemplate;

    // Filter out empty values
    const filteredAttributes = Object.fromEntries(
      Object.entries(attributes).filter(
        ([_, v]) =>
          v !== undefined &&
          v !== null &&
          !(typeof v === "string" && v.trim() === "")
      )
    );

    // Reconstruct nested object structure based on field paths
    const reconstructNestedObject = (
      flatData: Record<string, any>,
      paths: Record<string, string[]>
    ) => {
      const result: any = {};

      Object.entries(flatData).forEach(([flatKey, value]) => {
        const path = paths[flatKey];
        if (!path) return;

        // Create nested structure
        let current = result;
        for (let i = 0; i < path.length - 1; i++) {
          const segment = path[i];
          if (!current[segment]) {
            current[segment] = {};
          }
          current = current[segment];
        }

        // Set the final value
        const finalKey = path[path.length - 1];
        current[finalKey] = value;
      });

      return result;
    };

    let objAttributes = {};
    if (Object.keys(filteredAttributes).length) {
      const { fieldPaths } = getSchemaProperties();
      const nestedAttributes = reconstructNestedObject(
        filteredAttributes,
        fieldPaths
      );

      objAttributes = {
        attribute: nestedAttributes,
      };
    }

    const data = {
      schemaSaid: schemaSaid,
      aid: selectedConnection,
      ...objAttributes,
    };

    try {
      setLoading(true);
      await CredentialService.issue(data);
      triggerToast(
        i18n.t("pages.credentialDetails.issueCredential.messages.success"),
        "success"
      );
      dispatch(fetchContactCredentials(selectedConnection));
      resetModal();
    } catch (e) {
      triggerToast(
        i18n.t("pages.credentialDetails.issueCredential.messages.success"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    return (
      <Box className="footer">
        {[
          IssueCredentialStage.InputAttribute,
          IssueCredentialStage.Review,
        ].includes(currentStage) && (
          <Button
            variant="contained"
            className="neutral-button"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => {
              if (currentStage !== IssueCredentialStage.Review) {
                setAttributes({});
              }
              setCurrentStage(
                getBackStage(currentStage, !credentialTypeId) ||
                  IssueCredentialStage.SelectConnection
              );
            }}
          >
            {i18n.t("pages.credentialDetails.issueCredential.back")}
          </Button>
        )}
        <Button
          variant="contained"
          className="primary-button"
          disabled={disablePrimaryButton}
          onClick={() => {
            const nextStage = getNextStage(currentStage);
            if (nextStage) {
              setCurrentStage(nextStage);
              return;
            }

            issueCred();
          }}
        >
          {i18n.t(primaryButton)}
        </Button>
      </Box>
    );
  };

  const updateAttributes = (key: string, value: any) => {
    setAttributes((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  };

  const renderStage = (currentStage: IssueCredentialStage) => {
    switch (currentStage) {
      case IssueCredentialStage.SelectConnection: {
        const data: IssueCredListData[] = connections.map((connection) => ({
          id: connection.id,
          text: connection.alias,
          subText: `${connection.id.substring(0, 4)}...${connection.id.slice(-4)}`,
        }));

        return (
          <IssueCredListTemplate
            onChange={setSelectedConnection}
            data={data}
            value={selectedConnection}
          />
        );
      }
      case IssueCredentialStage.SelectCredentialType: {
        const data: IssueCredListData[] = schemas.map((schema) => ({
          id: schema.id,
          text: schema.name,
        }));

        return (
          <IssueCredListTemplate
            onChange={setSelectedCredTemplate}
            data={data}
            value={selectedCredTemplate}
          />
        );
      }
      case IssueCredentialStage.InputAttribute: {
        return (
          <InputAttribute
            value={attributes}
            setValue={updateAttributes}
            attributes={attributeKeys}
            required={renderedRequiredList}
            properties={properties}
          />
        );
      }
      case IssueCredentialStage.Review: {
        const nonEmptyAttributes = Object.fromEntries(
          Object.entries(attributes).filter(
            ([_, v]) => v !== undefined && v !== null && String(v).trim() !== ""
          )
        );
        return (
          <Review
            credentialType={schema?.title}
            attribute={nonEmptyAttributes}
            connectionId={selectedConnection}
            connections={connections}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <PopupModal
      open={open}
      onClose={resetModal}
      title={i18n.t("pages.credentialDetails.issueCredential.title")}
      customClass={`issue-cred-modal stage-${currentStage}`}
      description={
        <Trans
          i18nKey={description}
          components={{ bold: <strong /> }}
        />
      }
      footer={renderButton()}
    >
      {renderStage(currentStage)}
    </PopupModal>
  );
};

export { IssueCredentialModal };
