import { apiClient } from "../api/apiClient";

/* ---------------- TYPES ---------------- */

export interface HierarchyComponent {
  id: string;
  organization_id: string;
  site_id: string;
  building_id: string;
  floor_id: string;
  room_id: string;
  component_name: string;
  component_type: string | null;
  description: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface HierarchyRoom {
  id: string;
  organization_id: string;
  site_id: string;
  building_id: string;
  floor_id: string;
  room_name: string;
  room_code: string | null;
  description: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  components: HierarchyComponent[];
}

export interface HierarchyFloor {
  id: string;
  organization_id: string;
  site_id: string;
  building_id: string;
  floor_name: string;
  floor_number: string | number | null;
  description: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  rooms: HierarchyRoom[];
}

export interface HierarchyBuilding {
  id: string;
  organization_id: string;
  site_id: string;
  building_name: string;
  building_code: string | null;
  description: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  floors: HierarchyFloor[];
}

export interface SensorTag {
  id: string;
  tag_key: string;
  tag_value: string;
  tag_type: "manual" | "system" | "analytics" | "compliance";
}

export interface SensorAssignment {
  sensor_id: string;
  sensor_name: string;
  external_id: string | null;
  sensor_type: string | null;
  unit: string | null;
  status: string | null;

  building_id: string | null;
  building_name: string | null;

  floor_id: string | null;
  floor_name: string | null;

  room_id: string | null;
  room_name: string | null;

  component_id: string | null;
  component_name: string | null;

  tags: SensorTag[];
}

/* ---------------- PAYLOADS ---------------- */

export interface CreateBuildingPayload {
  building_name: string;
  building_code?: string;
  description?: string;
  display_order?: number;
}

export interface CreateFloorPayload {
  floor_name: string;
  floor_number?: string | number;
  description?: string;
  display_order?: number;
}

export interface CreateRoomPayload {
  room_name: string;
  room_code?: string;
  description?: string;
  display_order?: number;
}

export interface CreateComponentPayload {
  component_name: string;
  component_type?: string;
  description?: string;
  display_order?: number;
}

export interface UpdateBuildingPayload {
  building_name?: string;
  building_code?: string;
  description?: string | null;
  display_order?: number;
}

export interface UpdateFloorPayload {
  floor_name?: string;
  floor_number?: string | number | null;
  description?: string | null;
  display_order?: number;
}

export interface UpdateRoomPayload {
  room_name?: string;
  room_code?: string;
  description?: string | null;
  display_order?: number;
}

export interface UpdateComponentPayload {
  component_name?: string;
  component_type?: string | null;
  description?: string | null;
  display_order?: number;
}

export interface BulkAssignSensorLocationPayload {
  sensor_ids: string[];

  building_id: string;
  floor_id?: string | null;
  room_id?: string | null;
  component_id?: string | null;

  manual_tags?: string[];
}

export interface ClearSensorLocationPayload {
  sensor_ids: string[];
}

export interface AddSensorTagPayload {
  tag_key: string;
  tag_value: string;
  tag_type?: "manual" | "analytics" | "compliance";
}

/* ---------------- RESPONSES ---------------- */

export interface MessageResponse {
  message: string;
}

export interface CreateBuildingResponse extends MessageResponse {
  building: HierarchyBuilding;
}

export interface CreateFloorResponse extends MessageResponse {
  floor: HierarchyFloor;
}

export interface CreateRoomResponse extends MessageResponse {
  room: HierarchyRoom;
}

export interface CreateComponentResponse extends MessageResponse {
  component: HierarchyComponent;
}

export interface UpdateBuildingResponse extends MessageResponse {
  building: HierarchyBuilding;
}

export interface UpdateFloorResponse extends MessageResponse {
  floor: HierarchyFloor;
}

export interface UpdateRoomResponse extends MessageResponse {
  room: HierarchyRoom;
}

export interface UpdateComponentResponse extends MessageResponse {
  component: HierarchyComponent;
}

export interface BulkAssignSensorLocationResponse extends MessageResponse {
  assigned_count: number;
}

export interface ClearSensorLocationResponse extends MessageResponse {
  cleared_count: number;
}

export interface AddSensorTagResponse extends MessageResponse {
  tag: SensorTag;
}

/* ---------------- BASE ---------------- */

const BASE = "/site-hierarchy";

/* ---------------- HIERARCHY TREE ---------------- */

export const fetchSiteHierarchy = async (
  siteId: string
): Promise<HierarchyBuilding[]> => {
  const response = await apiClient.get(
    `${BASE}/sites/${siteId}`
  );

  return response.data;
};

/* ---------------- CREATE ---------------- */

export const createBuilding = async (
  siteId: string,
  payload: CreateBuildingPayload
): Promise<CreateBuildingResponse> => {
  const response = await apiClient.post(
    `${BASE}/sites/${siteId}/buildings`,
    payload
  );

  return response.data;
};

export const createFloor = async (
  siteId: string,
  buildingId: string,
  payload: CreateFloorPayload
): Promise<CreateFloorResponse> => {
  const response = await apiClient.post(
    `${BASE}/sites/${siteId}/buildings/${buildingId}/floors`,
    payload
  );

  return response.data;
};

export const createRoom = async (
  siteId: string,
  floorId: string,
  payload: CreateRoomPayload
): Promise<CreateRoomResponse> => {
  const response = await apiClient.post(
    `${BASE}/sites/${siteId}/floors/${floorId}/rooms`,
    payload
  );

  return response.data;
};

export const createComponent = async (
  siteId: string,
  roomId: string,
  payload: CreateComponentPayload
): Promise<CreateComponentResponse> => {
  const response = await apiClient.post(
    `${BASE}/sites/${siteId}/rooms/${roomId}/components`,
    payload
  );

  return response.data;
};

/* ---------------- UPDATE ---------------- */

export const updateBuilding = async (
  siteId: string,
  buildingId: string,
  payload: UpdateBuildingPayload
): Promise<UpdateBuildingResponse> => {
  const response = await apiClient.put(
    `${BASE}/sites/${siteId}/buildings/${buildingId}`,
    payload
  );

  return response.data;
};

export const updateFloor = async (
  siteId: string,
  floorId: string,
  payload: UpdateFloorPayload
): Promise<UpdateFloorResponse> => {
  const response = await apiClient.put(
    `${BASE}/sites/${siteId}/floors/${floorId}`,
    payload
  );

  return response.data;
};

export const updateRoom = async (
  siteId: string,
  roomId: string,
  payload: UpdateRoomPayload
): Promise<UpdateRoomResponse> => {
  const response = await apiClient.put(
    `${BASE}/sites/${siteId}/rooms/${roomId}`,
    payload
  );

  return response.data;
};

export const updateComponent = async (
  siteId: string,
  componentId: string,
  payload: UpdateComponentPayload
): Promise<UpdateComponentResponse> => {
  const response = await apiClient.put(
    `${BASE}/sites/${siteId}/components/${componentId}`,
    payload
  );

  return response.data;
};

/* ---------------- DELETE ---------------- */

export const deleteBuilding = async (
  siteId: string,
  buildingId: string
): Promise<MessageResponse> => {
  const response = await apiClient.delete(
    `${BASE}/sites/${siteId}/buildings/${buildingId}`
  );

  return response.data;
};

export const deleteFloor = async (
  siteId: string,
  floorId: string
): Promise<MessageResponse> => {
  const response = await apiClient.delete(
    `${BASE}/sites/${siteId}/floors/${floorId}`
  );

  return response.data;
};

export const deleteRoom = async (
  siteId: string,
  roomId: string
): Promise<MessageResponse> => {
  const response = await apiClient.delete(
    `${BASE}/sites/${siteId}/rooms/${roomId}`
  );

  return response.data;
};

export const deleteComponent = async (
  siteId: string,
  componentId: string
): Promise<MessageResponse> => {
  const response = await apiClient.delete(
    `${BASE}/sites/${siteId}/components/${componentId}`
  );

  return response.data;
};

/* ---------------- SENSOR ASSIGNMENTS ---------------- */

export const fetchSensorAssignments = async (
  siteId: string
): Promise<SensorAssignment[]> => {
  const response = await apiClient.get(
    `${BASE}/sites/${siteId}/sensor-assignments`
  );

  return response.data;
};

export const bulkAssignSensorLocation = async (
  siteId: string,
  payload: BulkAssignSensorLocationPayload
): Promise<BulkAssignSensorLocationResponse> => {
  const response = await apiClient.put(
    `${BASE}/sites/${siteId}/sensors/bulk-assign-location`,
    payload
  );

  return response.data;
};

export const clearSensorLocation = async (
  siteId: string,
  payload: ClearSensorLocationPayload
): Promise<ClearSensorLocationResponse> => {
  const response = await apiClient.put(
    `${BASE}/sites/${siteId}/sensors/clear-location`,
    payload
  );

  return response.data;
};

/* ---------------- TAGS ---------------- */

export const addSensorTag = async (
  siteId: string,
  sensorId: string,
  payload: AddSensorTagPayload
): Promise<AddSensorTagResponse> => {
  const response = await apiClient.post(
    `${BASE}/sites/${siteId}/sensors/${sensorId}/tags`,
    payload
  );

  return response.data;
};

export const removeSensorTag = async (
  siteId: string,
  sensorId: string,
  tagId: string
): Promise<MessageResponse> => {
  const response = await apiClient.delete(
    `${BASE}/sites/${siteId}/sensors/${sensorId}/tags/${tagId}`
  );

  return response.data;
};