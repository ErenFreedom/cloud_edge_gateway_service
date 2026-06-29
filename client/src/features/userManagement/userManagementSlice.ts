import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
    deleteOrphanUser,
    fetchUserManagementUsers,
    updateUserManagementStatus,
} from "../../services/userManagement.service";

import type {
    DeleteOrphanUserPayload,
    UpdateUserStatusPayload,
    UserAssignmentStatus,
    UserManagementFilters,
    UserManagementRole,
    UserManagementStats,
    UserManagementStatus,
    UserManagementUser,
} from "../../services/userManagement.service";

/* ========================= */
/* STATE */
/* ========================= */

interface UserManagementState {
    users: UserManagementUser[];

    stats: UserManagementStats | null;

    selectedUser: UserManagementUser | null;

    filters: UserManagementFilters;

    loading: boolean;
    statusLoading: boolean;
    deleteLoading: boolean;

    error: string | null;

    statusUpdated: boolean;
    userDeleted: boolean;
}

const initialState: UserManagementState = {
    users: [],

    stats: null,

    selectedUser: null,

    filters: {
        search: "",
        role: "all",
        status: "all",
        assignment_status: "all",
        site_id: "",
    },

    loading: false,
    statusLoading: false,
    deleteLoading: false,

    error: null,

    statusUpdated: false,
    userDeleted: false,
};

/* ========================= */
/* THUNKS */
/* ========================= */

export const fetchUserManagementUsersThunk = createAsyncThunk(
    "userManagement/fetchUsers",
    async (
        filters: UserManagementFilters | undefined,
        thunkAPI
    ) => {
        try {
            const data = await fetchUserManagementUsers(filters);

            return data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message ||
                "Failed to fetch organization users"
            );
        }
    }
);

export const updateUserManagementStatusThunk = createAsyncThunk(
    "userManagement/updateStatus",
    async (
        payload: UpdateUserStatusPayload,
        thunkAPI
    ) => {
        try {
            const data = await updateUserManagementStatus(payload);

            return {
                ...data,
                request: payload,
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message ||
                "Failed to update user status"
            );
        }
    }
);

export const deleteOrphanUserThunk = createAsyncThunk(
    "userManagement/deleteOrphanUser",
    async (
        payload: DeleteOrphanUserPayload,
        thunkAPI
    ) => {
        try {
            const data = await deleteOrphanUser(payload);

            return {
                ...data,
                request: payload,
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message ||
                "Failed to delete orphan user"
            );
        }
    }
);

/* ========================= */
/* SLICE */
/* ========================= */

const userManagementSlice = createSlice({
    name: "userManagement",

    initialState,

    reducers: {
        setUserManagementFilters: (
            state,
            action: PayloadAction<Partial<UserManagementFilters>>
        ) => {
            state.filters = {
                ...state.filters,
                ...action.payload,
            };
        },

        resetUserManagementFilters: (state) => {
            state.filters = {
                search: "",
                role: "all",
                status: "all",
                assignment_status: "all",
                site_id: "",
            };
        },

        setSelectedUser: (
            state,
            action: PayloadAction<UserManagementUser | null>
        ) => {
            state.selectedUser = action.payload;
        },

        clearUserManagementError: (state) => {
            state.error = null;
        },

        resetUserManagementMutationState: (state) => {
            state.statusUpdated = false;
            state.userDeleted = false;
        },
    },

    extraReducers: (builder) => {
        builder

            /* ========================= */
            /* FETCH USERS */
            /* ========================= */

            .addCase(fetchUserManagementUsersThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(fetchUserManagementUsersThunk.fulfilled, (state, action) => {
                state.loading = false;

                state.users = action.payload.users;
                state.stats = action.payload.stats;
            })

            .addCase(fetchUserManagementUsersThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            /* ========================= */
            /* UPDATE STATUS */
            /* ========================= */

            .addCase(updateUserManagementStatusThunk.pending, (state) => {
                state.statusLoading = true;
                state.error = null;
                state.statusUpdated = false;
            })

            .addCase(updateUserManagementStatusThunk.fulfilled, (state, action) => {
                state.statusLoading = false;
                state.statusUpdated = true;

                const { userId, status } = action.payload.request;

                const user = state.users.find((item) => item.id === userId);

                if (user) {
                    user.status = status;
                    user.can_disable = status !== "disabled" && user.role !== "super_admin";
                    user.can_enable = status === "disabled" && user.role !== "super_admin";
                }

                const selectedUser = state.selectedUser;

                if (selectedUser && selectedUser.id === userId) {
                    selectedUser.status = status;
                    selectedUser.can_disable =
                        status !== "disabled" && selectedUser.role !== "super_admin";
                    selectedUser.can_enable =
                        status === "disabled" && selectedUser.role !== "super_admin";
                }

                if (state.stats) {
                    const disabledCount = state.users.filter(
                        (item) => item.status === "disabled"
                    ).length;

                    const pendingCount = state.users.filter(
                        (item) => item.status === "pending"
                    ).length;

                    state.stats.disabled_users = disabledCount;
                    state.stats.pending_users = pendingCount;
                }
            })

            .addCase(updateUserManagementStatusThunk.rejected, (state, action) => {
                state.statusLoading = false;
                state.error = action.payload as string;
            })

            /* ========================= */
            /* DELETE ORPHAN USER */
            /* ========================= */

            .addCase(deleteOrphanUserThunk.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
                state.userDeleted = false;
            })

            .addCase(deleteOrphanUserThunk.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.userDeleted = true;

                const { userId } = action.payload.request;

                state.users = state.users.filter((user) => user.id !== userId);

                if (state.selectedUser?.id === userId) {
                    state.selectedUser = null;
                }

                if (state.stats) {
                    state.stats.total_users = state.users.length;
                    state.stats.super_admins = state.users.filter(
                        (user) => user.role === "super_admin"
                    ).length;
                    state.stats.org_site_managers = state.users.filter(
                        (user) => user.role === "org_site_manager"
                    ).length;
                    state.stats.site_admins = state.users.filter(
                        (user) => user.role === "site_admin"
                    ).length;
                    state.stats.site_monitors = state.users.filter(
                        (user) => user.role === "site_monitor"
                    ).length;
                    state.stats.site_viewers = state.users.filter(
                        (user) => user.role === "site_viewer"
                    ).length;
                    state.stats.assigned_users = state.users.filter(
                        (user) => user.assignment_status === "assigned"
                    ).length;
                    state.stats.orphan_users = state.users.filter(
                        (user) => user.assignment_status === "orphan"
                    ).length;
                    state.stats.disabled_users = state.users.filter(
                        (user) => user.status === "disabled"
                    ).length;
                    state.stats.pending_users = state.users.filter(
                        (user) => user.status === "pending"
                    ).length;
                }
            })

            .addCase(deleteOrphanUserThunk.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setUserManagementFilters,
    resetUserManagementFilters,
    setSelectedUser,
    clearUserManagementError,
    resetUserManagementMutationState,
} = userManagementSlice.actions;

export default userManagementSlice.reducer;

/* ========================= */
/* OPTIONAL EXPORTS FOR UI */
/* ========================= */

export type {
    UserAssignmentStatus,
    UserManagementFilters,
    UserManagementRole,
    UserManagementStatus,
    UserManagementUser,
};