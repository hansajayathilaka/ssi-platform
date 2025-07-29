import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  SchemaManagementService,
  CustomSchema,
} from "../../services/schema-management";

interface CustomSchemaState {
  schemas: CustomSchema[];
  currentSchema: CustomSchema | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  createStatus: "idle" | "loading" | "succeeded" | "failed";
  updateStatus: "idle" | "loading" | "succeeded" | "failed";
  deleteStatus: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: CustomSchemaState = {
  schemas: [],
  currentSchema: null,
  status: "idle",
  error: null,
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
};

// Async thunks
export const fetchCustomSchemas = createAsyncThunk(
  "customSchemas/fetchCustomSchemas",
  async () => {
    const response = await SchemaManagementService.getCustomSchemas();
    return response.data.data;
  }
);

export const fetchCustomSchemaById = createAsyncThunk(
  "customSchemas/fetchCustomSchemaById",
  async (id: string) => {
    const response = await SchemaManagementService.getCustomSchemaById(id);
    return response.data.data;
  }
);

export const createCustomSchema = createAsyncThunk(
  "customSchemas/createCustomSchema",
  async (schema: Omit<CustomSchema, "id" | "createdAt" | "updatedAt">) => {
    const response = await SchemaManagementService.createCustomSchema(schema);
    return response.data.data;
  }
);

export const updateCustomSchema = createAsyncThunk(
  "customSchemas/updateCustomSchema",
  async ({ id, schema }: { id: string; schema: CustomSchema }) => {
    const response = await SchemaManagementService.updateCustomSchema(
      id,
      schema
    );
    return response.data.data;
  }
);

export const deleteCustomSchema = createAsyncThunk(
  "customSchemas/deleteCustomSchema",
  async (id: string) => {
    await SchemaManagementService.deleteCustomSchema(id);
    return id;
  }
);

const customSchemasSlice = createSlice({
  name: "customSchemas",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentSchema: (state) => {
      state.currentSchema = null;
    },
    resetCreateStatus: (state) => {
      state.createStatus = "idle";
    },
    resetUpdateStatus: (state) => {
      state.updateStatus = "idle";
    },
    resetDeleteStatus: (state) => {
      state.deleteStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    // Fetch all schemas
    builder
      .addCase(fetchCustomSchemas.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCustomSchemas.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.schemas = action.payload;
      })
      .addCase(fetchCustomSchemas.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch schemas";
      });

    // Fetch schema by ID
    builder
      .addCase(fetchCustomSchemaById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCustomSchemaById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentSchema = action.payload;
      })
      .addCase(fetchCustomSchemaById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch schema";
      });

    // Create schema
    builder
      .addCase(createCustomSchema.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createCustomSchema.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.schemas.push(action.payload);
      })
      .addCase(createCustomSchema.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.error.message || "Failed to create schema";
      });

    // Update schema
    builder
      .addCase(updateCustomSchema.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateCustomSchema.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const index = state.schemas.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.schemas[index] = action.payload;
        }
        if (state.currentSchema?.id === action.payload.id) {
          state.currentSchema = action.payload;
        }
      })
      .addCase(updateCustomSchema.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.error.message || "Failed to update schema";
      });

    // Delete schema
    builder
      .addCase(deleteCustomSchema.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteCustomSchema.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.schemas = state.schemas.filter((s) => s.id !== action.payload);
        if (state.currentSchema?.id === action.payload) {
          state.currentSchema = null;
        }
      })
      .addCase(deleteCustomSchema.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.error.message || "Failed to delete schema";
      });
  },
});

export const {
  clearError,
  clearCurrentSchema,
  resetCreateStatus,
  resetUpdateStatus,
  resetDeleteStatus,
} = customSchemasSlice.actions;

export default customSchemasSlice.reducer;
