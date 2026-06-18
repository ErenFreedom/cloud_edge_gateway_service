export type HierarchyRole =
  | "super_admin"
  | "org_site_manager"
  | "site_admin"
  | "site_monitor";

export interface AuthUser {
  userId: string;
  role: string;
  organizationId: string | null;
}

/* CREATE */

export interface CreateBuildingPayload {
  building_name: string;
  building_code?: string;
  description?: string;
  display_order?: number;
}

export interface CreateFloorPayload {
  floor_name: string;
  floor_number?: number | string;
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

/* UPDATE */

export interface UpdateBuildingPayload {
  building_name?: string;
  building_code?: string;
  description?: string | null;
  display_order?: number;
}

export interface UpdateFloorPayload {
  floor_name?: string;
  floor_number?: number | string | null;
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

/* SENSOR ASSIGNMENT */

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
  tag_type?: "manual" | "system" | "analytics" | "compliance";
}

export interface RemoveSensorTagPayload {
  tag_id: string;
}

/* RESPONSE SHAPES */

export interface HierarchyBuilding {
  id: string;
  organization_id: string;
  site_id: string;
  building_name: string;
  building_code: string | null;
  description: string | null;
  display_order: number;
  floors: HierarchyFloor[];
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
  rooms: HierarchyRoom[];
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
  components: HierarchyComponent[];
}

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
}

export interface SensorAssignmentRow {
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

  tags: {
    id: string;
    tag_key: string;
    tag_value: string;
    tag_type: string;
  }[];
}