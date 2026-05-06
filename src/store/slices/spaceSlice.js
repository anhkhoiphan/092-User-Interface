import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { spaceService } from "../../services/space.service";
import { roomService } from "../../services/room.service";
import { logout } from "./authSlice";
import { preloadRoomMessages, setRoomMessagesPreloaded } from "./messageSlice";
import { preloadAllData } from "./dmSlice";
import { getCachedSpaces, getCachedMembers, hasSpacesCache, hasMembersCache } from "../messageCache";

// ==================== Async Thunks ====================

export const fetchSpaces = createAsyncThunk(
  "space/fetchSpaces",
  async (_, { rejectWithValue }) => {
    console.log("[fetchSpaces] Starting request to /spaces/with-rooms...");
    try {
      const { data } = await spaceService.getAllWithRooms();
      console.log("[fetchSpaces] Raw API response:", JSON.stringify(data, null, 2));
      const spaces = data.data || data.spaces || data || [];
      console.log("[fetchSpaces] Parsed spaces count:", spaces.length);
      // Extract rooms from each space and populate roomsMap
      const roomsMap = {};
      spaces.forEach((space) => {
        if (space.rooms && Array.isArray(space.rooms)) {
          roomsMap[space.id] = space.rooms;
          console.log(`[fetchSpaces] Space "${space.name}" has ${space.rooms.length} rooms`);
        }
      });
      console.log("[fetchSpaces] Rooms map keys:", Object.keys(roomsMap));
      return { spaces, roomsMap };
    } catch (err) {
      console.error("[fetchSpaces] Error:", err.message, err.response?.status, err.response?.data);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách spaces",
      );
    }
  },
);

export const fetchRooms = createAsyncThunk(
  "space/fetchRooms",
  async (spaceId, { rejectWithValue }) => {
    try {
      const { data } = await spaceService.getRooms(spaceId);
      return {
        spaceId,
        rooms: data.data || data.rooms || data || [],
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách rooms",
      );
    }
  },
);

export const createSpace = createAsyncThunk(
  "space/createSpace",
  async (payload, { rejectWithValue }) => {
    try {
      // Try camelCase first (as per API doc)
      console.log("[createSpace] Request payload:", payload);
      const { data } = await spaceService.create(payload);
      console.log("[createSpace] Response:", data);
      return data.data || data;
    } catch (err) {
      console.error("[createSpace] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        payload,
      });
      // If 409, try with snake_case as fallback (some NestJS servers use snake_case)
      if (err.response?.status === 409) {
        try {
          const snakePayload = {
            name: payload.name,
            description: payload.description,
            is_private: payload.isPrivate ?? false,
          };
          console.log("[createSpace] Retry with snake_case:", snakePayload);
          const { data } = await spaceService.create(snakePayload);
          console.log("[createSpace] Retry success:", data);
          return data.data || data;
        } catch (retryErr) {
          console.error("[createSpace] Retry also failed:", retryErr.response?.data);
        }
      }
      return rejectWithValue(
        err.response?.data?.message || err.response?.data?.error || "Không thể tạo space",
      );
    }
  },
);

export const createRoom = createAsyncThunk(
  "space/createRoom",
  async ({ spaceId, data: roomData }, { rejectWithValue }) => {
    console.log("[createRoom] Starting request - spaceId:", spaceId, "data:", roomData);
    try {
      const { data } = await roomService.create(spaceId, roomData);
      console.log("[createRoom] API response:", JSON.stringify(data, null, 2));
      const room = data.data || data;
      console.log("[createRoom] Parsed room:", room);
      return room;
    } catch (err) {
      console.error("[createRoom] Error:", err.response?.status, err.response?.data || err.message);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tạo room",
      );
    }
  },
);

export const deleteSpace = createAsyncThunk(
  "space/deleteSpace",
  async (spaceId, { rejectWithValue }) => {
    try {
      await spaceService.delete(spaceId);
      return spaceId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể xóa space",
      );
    }
  },
);

export const deleteRoom = createAsyncThunk(
  "space/deleteRoom",
  async (roomId, { rejectWithValue }) => {
    try {
      await roomService.delete(roomId);
      return roomId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể xóa room",
      );
    }
  },
);

export const joinSpaceByInvite = createAsyncThunk(
  "space/joinSpaceByInvite",
  async (code, { rejectWithValue }) => {
    try {
      const { data } = await spaceService.joinByInviteCode(code);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Mã mờ không hợp lệ",
      );
    }
  },
);

export const fetchSpaceMembers = createAsyncThunk(
  "space/fetchSpaceMembers",
  async (spaceId, { rejectWithValue }) => {
    try {
      console.log("[fetchSpaceMembers] Fetching members for space:", spaceId);
      const { data } = await spaceService.getMembers(spaceId);
      const members = data.data || data.members || data || [];
      console.log("[fetchSpaceMembers] API raw response:", data);
      console.log("[fetchSpaceMembers] Extracted members:", members);
      console.log("[fetchSpaceMembers] Member colors:", members.map((m) => ({ id: m.id, name: m.displayName || m.display_name || m.username, color: m.color, profileColor: m.profile?.color, keys: Object.keys(m) })));
      return {
        spaceId,
        members,
      };
    } catch (err) {
      console.error("[fetchSpaceMembers] Error:", err.response?.data || err.message);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách thành viên",
      );
    }
  },
);

// ==================== Slice ====================

const initialState = {
  spaces: [],
  roomsMap: {}, // { [spaceId]: Room[] }
  membersMap: {}, // { [spaceId]: Member[] }
  activeSpace: null,
  loading: false,
  roomsLoading: false,
  membersLoading: false,
  error: null,
  roomsError: null,
  membersError: null,
  spacesFetched: false,
  fetchedRooms: {}, // { [spaceId]: boolean }
  fetchedMembers: {}, // { [spaceId]: boolean }
};

const spaceSlice = createSlice({
  name: "space",
  initialState,
  reducers: {
    setActiveSpace: (state, action) => {
      state.activeSpace = action.payload;
    },

    clearSpaceError: (state) => {
      state.error = null;
      state.roomsError = null;
      state.membersError = null;
    },

    addRoomToSpace: (state, action) => {
      const { spaceId, room } = action.payload;
      if (!state.roomsMap[spaceId]) {
        state.roomsMap[spaceId] = [];
      }
      const exists = state.roomsMap[spaceId].some((r) => r.id === room.id);
      if (!exists) {
        state.roomsMap[spaceId].push(room);
      }
    },

    removeRoomFromSpace: (state, action) => {
      const { spaceId, roomId } = action.payload;
      if (state.roomsMap[spaceId]) {
        state.roomsMap[spaceId] = state.roomsMap[spaceId].filter(
          (r) => r.id !== roomId,
        );
      }
    },

    addSpace: (state, action) => {
      const space = action.payload;
      const exists = state.spaces.some((s) => s.id === space.id);
      if (!exists) {
        state.spaces.push(space);
      }
    },

    updateSpaceInList: (state, action) => {
      const space = action.payload;
      const idx = state.spaces.findIndex((s) => s.id === space.id);
      if (idx !== -1) {
        state.spaces[idx] = { ...state.spaces[idx], ...space };
      }
    },

    updateRoomInList: (state, action) => {
      const room = action.payload;
      const spaceId = room.space_id;
      if (spaceId && state.roomsMap[spaceId]) {
        const idx = state.roomsMap[spaceId].findIndex((r) => r.id === room.id);
        if (idx !== -1) {
          state.roomsMap[spaceId][idx] = {
            ...state.roomsMap[spaceId][idx],
            ...room,
          };
        }
      }
    },

    resetSpaceState: () => initialState,

    // Load spaces and rooms from localStorage cache
    loadSpacesFromCache: (state) => {
      // Skip if already loaded in Redux
      if (state.spaces.length > 0 || state.spacesFetched) return;

      const cached = getCachedSpaces();
      if (cached && cached.spaces.length > 0) {
        state.spaces = cached.spaces;
        state.roomsMap = { ...state.roomsMap, ...cached.roomsMap };
        state.spacesFetched = true;
        // Mark all spaces as fetched rooms
        Object.keys(cached.roomsMap).forEach((spaceId) => {
          state.fetchedRooms[spaceId] = true;
        });
      }
    },

    // Load members from localStorage cache
    loadMembersFromCache: (state) => {
      // Skip if already have members loaded
      if (Object.keys(state.membersMap).length > 0) {
        console.log("[spaceSlice] loadMembersFromCache skipped - membersMap already has", Object.keys(state.membersMap).length, "spaces");
        return;
      }

      const cached = getCachedMembers();
      if (cached && Object.keys(cached.membersMap).length > 0) {
        console.log("[spaceSlice] loadMembersFromCache loaded", Object.keys(cached.membersMap).length, "spaces from cache");
        state.membersMap = { ...state.membersMap, ...cached.membersMap };
        Object.keys(cached.membersMap).forEach((spaceId) => {
          state.fetchedMembers[spaceId] = true;
        });
      } else {
        console.log("[spaceSlice] loadMembersFromCache - no cache found");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSpaces
      .addCase(fetchSpaces.pending, (state) => {
        // Skip loading skeleton if we have cached spaces
        const hasCachedSpaces = hasSpacesCache();
        state.loading = !hasCachedSpaces;
        state.error = null;
      })
      .addCase(fetchSpaces.fulfilled, (state, action) => {
        state.loading = false;
        state.spaces = action.payload.spaces;
        state.roomsMap = { ...state.roomsMap, ...action.payload.roomsMap };
        // Mark all spaces as fetched rooms
        Object.keys(action.payload.roomsMap).forEach((spaceId) => {
          state.fetchedRooms[spaceId] = true;
        });
        state.spacesFetched = true;
        console.log("[spaceSlice] fetchSpaces.fulfilled - spaces:", state.spaces.length, "roomsMap keys:", Object.keys(state.roomsMap));
      })
      .addCase(fetchSpaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("[spaceSlice] fetchSpaces.rejected - error:", action.payload);
      })
      // fetchRooms
      .addCase(fetchRooms.pending, (state) => {
        state.roomsLoading = true;
        state.roomsError = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.roomsLoading = false;
        const { spaceId, rooms } = action.payload;
        state.roomsMap[spaceId] = rooms;
        state.fetchedRooms[spaceId] = true;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.roomsLoading = false;
        state.roomsError = action.payload;
      })
      // createSpace
      .addCase(createSpace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSpace.fulfilled, (state, action) => {
        state.loading = false;
        const space = action.payload;
        const exists = state.spaces.some((s) => s.id === space.id);
        if (!exists) {
          state.spaces.unshift(space);
        }
        state.activeSpace = space.id;
      })
      .addCase(createSpace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createRoom
      .addCase(createRoom.pending, (state) => {
        state.roomsLoading = true;
        state.roomsError = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.roomsLoading = false;
        const room = action.payload;
        const spaceId = room.space_id;
        if (spaceId) {
          if (!state.roomsMap[spaceId]) {
            state.roomsMap[spaceId] = [];
          }
          const exists = state.roomsMap[spaceId].some((r) => r.id === room.id);
          if (!exists) {
            state.roomsMap[spaceId].push(room);
          }
        }
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.roomsLoading = false;
        state.roomsError = action.payload;
      })
      // deleteSpace
      .addCase(deleteSpace.fulfilled, (state, action) => {
        const spaceId = action.payload;
        state.spaces = state.spaces.filter((s) => s.id !== spaceId);
        delete state.roomsMap[spaceId];
        delete state.membersMap[spaceId];
        delete state.fetchedRooms[spaceId];
        delete state.fetchedMembers[spaceId];
        if (state.activeSpace === spaceId) {
          state.activeSpace = null;
        }
      })
      // deleteRoom
      .addCase(deleteRoom.fulfilled, (state, action) => {
        const roomId = action.payload;
        Object.keys(state.roomsMap).forEach((spaceId) => {
          state.roomsMap[spaceId] = state.roomsMap[spaceId].filter(
            (r) => r.id !== roomId,
          );
        });
      })
      // joinSpaceByInvite
      .addCase(joinSpaceByInvite.fulfilled, (state, action) => {
        const space = action.payload;
        const exists = state.spaces.some((s) => s.id === space.id);
        if (!exists) {
          state.spaces.unshift(space);
        }
        state.activeSpace = space.id;
      })
      // fetchSpaceMembers
      .addCase(fetchSpaceMembers.pending, (state, action) => {
        const { spaceId } = action.meta.arg || {};
        // Always show loading skeleton when fetching members
        state.membersLoading = true;
        state.membersError = null;
      })
      .addCase(fetchSpaceMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        const { spaceId, members } = action.payload;
        state.membersMap[spaceId] = members;
        state.fetchedMembers[spaceId] = true;
      })
      .addCase(fetchSpaceMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.membersError = action.payload;
      })
      // 🆕 preloadAllData
      .addCase(preloadAllData.fulfilled, (state, action) => {
        const { spaces, roomsMap } = action.payload;
        state.spaces = spaces;
        state.roomsMap = roomsMap;
        state.spacesFetched = true;
        // Mark all spaces as fetched rooms
        Object.keys(roomsMap).forEach((spaceId) => {
          state.fetchedRooms[spaceId] = true;
        });
      })
      // Reset on logout
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const {
  setActiveSpace,
  clearSpaceError,
  addRoomToSpace,
  removeRoomFromSpace,
  addSpace,
  updateSpaceInList,
  updateRoomInList,
  resetSpaceState,
  loadSpacesFromCache,
  loadMembersFromCache,
} = spaceSlice.actions;

export default spaceSlice.reducer;
