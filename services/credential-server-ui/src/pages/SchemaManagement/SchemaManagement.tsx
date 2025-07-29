import { Add, Delete, Edit, MoreVert, Send } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppTable, useTable } from "../../components/AppTable";
import { AppTableHeader } from "../../components/AppTable/AppTable.types";
import { DropdownMenu } from "../../components/DropdownMenu";
import { PageHeader } from "../../components/PageHeader";
import { PopupModal } from "../../components/PopupModal";
import { RoutePath } from "../../const/route";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchCustomSchemas,
  deleteCustomSchema,
  clearError,
} from "../../store/reducers/customSchemasSlice";
import { CustomSchema } from "../../services/schema-management";
import { formatDate } from "../../utils/dateFormatter";
import { enqueueSnackbar } from "notistack";

interface SchemaTableRow {
  id: string;
  name: string;
  version: string;
  description: string;
  fieldsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const headers: AppTableHeader<SchemaTableRow>[] = [
  {
    id: "name",
    label: "Schema Name",
  },
  {
    id: "version",
    label: "Version",
  },
  {
    id: "description",
    label: "Description",
  },
  {
    id: "fieldsCount",
    label: "Fields",
  },
  {
    id: "isActive",
    label: "Status",
  },
  {
    id: "updatedAt",
    label: "Last Updated",
  },
];

export const SchemaManagement = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { schemas, status, error, deleteStatus } = useAppSelector(
    (state) => state.customSchemas
  );

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<CustomSchema | null>(
    null
  );

  useEffect(() => {
    dispatch(fetchCustomSchemas());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (deleteStatus === "succeeded") {
      enqueueSnackbar("Schema deleted successfully", { variant: "success" });
      setDeleteModalOpen(false);
      setSchemaToDelete(null);
    }
  }, [deleteStatus]);

  const tableRows: SchemaTableRow[] = schemas.map((schema) => ({
    id: schema.id,
    name: schema.name,
    version: schema.version,
    description: schema.description || "No description",
    fieldsCount: schema.fields.length,
    isActive: schema.metadata.isActive,
    createdAt: new Date(schema.createdAt),
    updatedAt: new Date(schema.updatedAt),
  }));

  const {
    order,
    orderBy,
    page,
    rowsPerPage,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
    visibleRows,
  } = useTable(tableRows, "updatedAt");

  const handleCreateSchema = () => {
    navigate(RoutePath.SchemaCreate);
  };

  const handleEditSchema = (id: string) => {
    navigate(RoutePath.SchemaEdit.replace(":id", id));
  };

  const handleDeleteSchema = (schema: CustomSchema) => {
    setSchemaToDelete(schema);
    setDeleteModalOpen(true);
  };

  const handleIssueCredential = (schemaId: string) => {
    // Navigate to connections page to select recipient
    navigate(`/connections?issueSchema=${schemaId}`);
  };

  const confirmDeleteSchema = () => {
    if (schemaToDelete) {
      dispatch(deleteCustomSchema(schemaToDelete.id));
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSchemaToDelete(null);
  };

  if (status === "loading") {
    return (
      <Box sx={{ padding: "0 2.5rem 2.5rem" }}>
        <Typography>Loading schemas...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        className="schema-management-page"
        sx={{ padding: "0 2.5rem 2.5rem" }}
      >
        <PageHeader
          title={`Schema Management (${schemas.length})`}
          sx={{
            margin: "1.5rem 0",
          }}
        />

        <Box
          sx={{
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateSchema}
            sx={{ borderRadius: "0.5rem" }}
          >
            Create New Schema
          </Button>
        </Box>

        <Paper
          sx={{
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow:
              "0.25rem 0.25rem 1.25rem 0 rgba(var(--text-color-rgb), 0.16)",
            flex: 1,
          }}
          className="schema-management-table"
        >
          <AppTable
            order={order}
            rows={visibleRows}
            onRenderRow={(row) => {
              const schema = schemas.find((s) => s.id === row.id);
              return (
                <TableRow
                  hover
                  role="checkbox"
                  tabIndex={-1}
                  key={row.id}
                  className="table-row"
                >
                  <TableCell
                    component="th"
                    scope="row"
                  >
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                    >
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.version}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.fieldsCount}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.isActive ? "Active" : "Inactive"}
                      size="small"
                      color={row.isActive ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>{formatDate(row.updatedAt)}</TableCell>
                  <TableCell
                    width={50}
                    align="left"
                  >
                    <DropdownMenu
                      button={
                        <Tooltip
                          title="Actions"
                          placement="top"
                        >
                          <IconButton aria-label="actions">
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      }
                      menuItems={[
                        {
                          label: "Issue Credential",
                          action: () => handleIssueCredential(row.id),
                          icon: <Send />,
                          className: "icon-left",
                          disabled: !row.isActive,
                        },
                        {
                          className: "divider",
                        },
                        {
                          label: "Edit Schema",
                          action: () => handleEditSchema(row.id),
                          icon: <Edit />,
                          className: "icon-left",
                        },
                        {
                          className: "divider",
                        },
                        {
                          label: "Delete Schema",
                          action: () => schema && handleDeleteSchema(schema),
                          icon: <Delete />,
                          className: "icon-left text-danger",
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              );
            }}
            onRequestSort={handleRequestSort}
            orderBy={orderBy}
            headers={headers}
            pagination={{
              component: "div",
              count: tableRows.length,
              rowsPerPage: rowsPerPage,
              page: page,
              onPageChange: handleChangePage,
              onRowsPerPageChange: handleChangeRowsPerPage,
            }}
          />
        </Paper>
      </Box>

      <PopupModal
        open={deleteModalOpen}
        onClose={cancelDelete}
        title="Delete Schema"
        description={
          <Typography>
            Are you sure you want to delete the schema "{schemaToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        }
        footer={
          <Box
            sx={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            <Button
              variant="outlined"
              onClick={cancelDelete}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDeleteSchema}
              disabled={deleteStatus === "loading"}
            >
              {deleteStatus === "loading" ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        }
      />
    </>
  );
};
