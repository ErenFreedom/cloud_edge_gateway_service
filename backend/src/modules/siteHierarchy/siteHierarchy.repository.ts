// src/modules/siteHierarchy/siteHierarchy.repository.ts

import { PoolClient } from "pg";
import { pool } from "../../config/database";

import {
  AddSensorTagPayload,
  BulkAssignSensorLocationPayload,
  CreateBuildingPayload,
  CreateComponentPayload,
  CreateFloorPayload,
  CreateRoomPayload,
  UpdateBuildingPayload,
  UpdateComponentPayload,
  UpdateFloorPayload,
  UpdateRoomPayload,
} from "./siteHierarchy.types";

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ---------------- ACCESS HELPERS ---------------- */

export const getSiteByIdRepo = async (
  client: PoolClient,
  siteId: string
) => {
  const { rows } = await client.query(
    `
    SELECT id, organization_id, site_name, status
    FROM sites
    WHERE id = $1
    LIMIT 1
    `,
    [siteId]
  );

  return rows[0];
};

export const verifyManagerSiteAccessRepo = async (
  client: PoolClient,
  managerId: string,
  siteId: string
): Promise<boolean> => {
  const { rowCount } = await client.query(
    `
    SELECT 1
    FROM site_manager_sites
    WHERE manager_id = $1
      AND site_id = $2
    LIMIT 1
    `,
    [managerId, siteId]
  );

  return (rowCount ?? 0) > 0;
};

export const verifySiteAdminAccessRepo = async (
  client: PoolClient,
  userId: string,
  siteId: string
): Promise<boolean> => {
  const { rowCount } = await client.query(
    `
    SELECT 1
    FROM site_user_roles
    WHERE user_id = $1
      AND site_id = $2
      AND role = 'site_admin'
    LIMIT 1
    `,
    [userId, siteId]
  );

  return (rowCount ?? 0) > 0;
};

export const verifySiteMonitorAccessRepo = async (
  client: PoolClient,
  userId: string,
  siteId: string
): Promise<boolean> => {
  const { rowCount } = await client.query(
    `
    SELECT 1
    FROM site_user_roles
    WHERE user_id = $1
      AND site_id = $2
      AND role = 'site_monitor'
    LIMIT 1
    `,
    [userId, siteId]
  );

  return (rowCount ?? 0) > 0;
};

/* ---------------- CODE GENERATION ---------------- */

const generateNextCodeRepo = async (
  client: PoolClient,
  tableName: "buildings" | "rooms",
  codeColumn: "building_code" | "room_code",
  siteId: string,
  prefix: "BLD" | "RM"
): Promise<string> => {
  const { rows } = await client.query(
    `
    SELECT ${codeColumn} AS code
    FROM ${tableName}
    WHERE site_id = $1
      AND ${codeColumn} ~ $2
    ORDER BY
      CAST(regexp_replace(${codeColumn}, '[^0-9]', '', 'g') AS integer) DESC
    LIMIT 1
    `,
    [siteId, `^${prefix}-[0-9]+$`]
  );

  const lastCode = rows[0]?.code as string | undefined;

  if (!lastCode) {
    return `${prefix}-001`;
  }

  const lastNumber = Number(lastCode.replace(`${prefix}-`, ""));
  const nextNumber = lastNumber + 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
};

/*
  floors table does not have floor_code in your schema.
  floor_number remains user-provided.
*/

/* ---------------- HIERARCHY GET ---------------- */

export const getHierarchyRepo = async (
  client: PoolClient,
  siteId: string
) => {
  const buildingsResult = await client.query(
    `
    SELECT
      id,
      organization_id,
      site_id,
      building_name,
      building_code,
      description,
      display_order,
      created_at,
      updated_at
    FROM buildings
    WHERE site_id = $1
    ORDER BY display_order ASC, building_name ASC
    `,
    [siteId]
  );

  const floorsResult = await client.query(
    `
    SELECT
      id,
      organization_id,
      site_id,
      building_id,
      floor_name,
      floor_number,
      description,
      display_order,
      created_at,
      updated_at
    FROM floors
    WHERE site_id = $1
    ORDER BY display_order ASC, floor_number ASC NULLS LAST, floor_name ASC
    `,
    [siteId]
  );

  const roomsResult = await client.query(
    `
    SELECT
      id,
      organization_id,
      site_id,
      building_id,
      floor_id,
      room_name,
      room_code,
      description,
      display_order,
      created_at,
      updated_at
    FROM rooms
    WHERE site_id = $1
    ORDER BY display_order ASC, room_name ASC
    `,
    [siteId]
  );

  const componentsResult = await client.query(
    `
    SELECT
      id,
      organization_id,
      site_id,
      building_id,
      floor_id,
      room_id,
      component_name,
      component_type,
      description,
      display_order,
      created_at,
      updated_at
    FROM components
    WHERE site_id = $1
    ORDER BY display_order ASC, component_name ASC
    `,
    [siteId]
  );

  const components = componentsResult.rows;
  const rooms = roomsResult.rows.map((room) => ({
    ...room,
    components: components.filter(
      (component) => component.room_id === room.id
    ),
  }));

  const floors = floorsResult.rows.map((floor) => ({
    ...floor,
    rooms: rooms.filter((room) => room.floor_id === floor.id),
  }));

  const buildings = buildingsResult.rows.map((building) => ({
    ...building,
    floors: floors.filter(
      (floor) => floor.building_id === building.id
    ),
  }));

  return buildings;
};

/* ---------------- CREATE ---------------- */

export const createBuildingRepo = async (
  client: PoolClient,
  site: { id: string; organization_id: string },
  payload: CreateBuildingPayload
) => {
  const buildingCode =
    payload.building_code ||
    (await generateNextCodeRepo(
      client,
      "buildings",
      "building_code",
      site.id,
      "BLD"
    ));

  const { rows } = await client.query(
    `
    INSERT INTO buildings (
      organization_id,
      site_id,
      building_name,
      building_code,
      description,
      display_order
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, 1))
    RETURNING *
    `,
    [
      site.organization_id,
      site.id,
      payload.building_name,
      buildingCode,
      payload.description ?? null,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

export const createFloorRepo = async (
  client: PoolClient,
  building: {
    id: string;
    organization_id: string;
    site_id: string;
  },
  payload: CreateFloorPayload
) => {
  const { rows } = await client.query(
    `
    INSERT INTO floors (
      organization_id,
      site_id,
      building_id,
      floor_name,
      floor_number,
      description,
      display_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 1))
    RETURNING *
    `,
    [
      building.organization_id,
      building.site_id,
      building.id,
      payload.floor_name,
      payload.floor_number ?? null,
      payload.description ?? null,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

export const createRoomRepo = async (
  client: PoolClient,
  floor: {
    id: string;
    organization_id: string;
    site_id: string;
    building_id: string;
  },
  payload: CreateRoomPayload
) => {
  const roomCode =
    payload.room_code ||
    (await generateNextCodeRepo(
      client,
      "rooms",
      "room_code",
      floor.site_id,
      "RM"
    ));

  const { rows } = await client.query(
    `
    INSERT INTO rooms (
      organization_id,
      site_id,
      building_id,
      floor_id,
      room_name,
      room_code,
      description,
      display_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 1))
    RETURNING *
    `,
    [
      floor.organization_id,
      floor.site_id,
      floor.building_id,
      floor.id,
      payload.room_name,
      roomCode,
      payload.description ?? null,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

export const createComponentRepo = async (
  client: PoolClient,
  room: {
    id: string;
    organization_id: string;
    site_id: string;
    building_id: string;
    floor_id: string;
  },
  payload: CreateComponentPayload
) => {
  const { rows } = await client.query(
    `
    INSERT INTO components (
      organization_id,
      site_id,
      building_id,
      floor_id,
      room_id,
      component_name,
      component_type,
      description,
      display_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 1))
    RETURNING *
    `,
    [
      room.organization_id,
      room.site_id,
      room.building_id,
      room.floor_id,
      room.id,
      payload.component_name,
      payload.component_type ?? null,
      payload.description ?? null,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

/* ---------------- FIND NODE ---------------- */

export const getBuildingByIdRepo = async (
  client: PoolClient,
  siteId: string,
  buildingId: string
) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM buildings
    WHERE id = $1
      AND site_id = $2
    LIMIT 1
    `,
    [buildingId, siteId]
  );

  return rows[0];
};

export const getFloorByIdRepo = async (
  client: PoolClient,
  siteId: string,
  floorId: string
) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM floors
    WHERE id = $1
      AND site_id = $2
    LIMIT 1
    `,
    [floorId, siteId]
  );

  return rows[0];
};

export const getRoomByIdRepo = async (
  client: PoolClient,
  siteId: string,
  roomId: string
) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM rooms
    WHERE id = $1
      AND site_id = $2
    LIMIT 1
    `,
    [roomId, siteId]
  );

  return rows[0];
};

export const getComponentByIdRepo = async (
  client: PoolClient,
  siteId: string,
  componentId: string
) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM components
    WHERE id = $1
      AND site_id = $2
    LIMIT 1
    `,
    [componentId, siteId]
  );

  return rows[0];
};

/* ---------------- UPDATE ---------------- */

export const updateBuildingRepo = async (
  client: PoolClient,
  siteId: string,
  buildingId: string,
  payload: UpdateBuildingPayload
) => {
  const { rows } = await client.query(
    `
    UPDATE buildings
    SET
      building_name = COALESCE($3, building_name),
      building_code = COALESCE($4, building_code),
      description = CASE
        WHEN $5::text IS NULL THEN description
        ELSE $5
      END,
      display_order = COALESCE($6, display_order),
      updated_at = now()
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [
      buildingId,
      siteId,
      payload.building_name ?? null,
      payload.building_code ?? null,
      payload.description === undefined ? null : payload.description,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

export const updateFloorRepo = async (
  client: PoolClient,
  siteId: string,
  floorId: string,
  payload: UpdateFloorPayload
) => {
  const { rows } = await client.query(
    `
    UPDATE floors
    SET
      floor_name = COALESCE($3, floor_name),
      floor_number = CASE
        WHEN $4::text IS NULL THEN floor_number
        ELSE $4
      END,
      description = CASE
        WHEN $5::text IS NULL THEN description
        ELSE $5
      END,
      display_order = COALESCE($6, display_order),
      updated_at = now()
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [
      floorId,
      siteId,
      payload.floor_name ?? null,
      payload.floor_number === undefined ? null : payload.floor_number,
      payload.description === undefined ? null : payload.description,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

export const updateRoomRepo = async (
  client: PoolClient,
  siteId: string,
  roomId: string,
  payload: UpdateRoomPayload
) => {
  const { rows } = await client.query(
    `
    UPDATE rooms
    SET
      room_name = COALESCE($3, room_name),
      room_code = COALESCE($4, room_code),
      description = CASE
        WHEN $5::text IS NULL THEN description
        ELSE $5
      END,
      display_order = COALESCE($6, display_order),
      updated_at = now()
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [
      roomId,
      siteId,
      payload.room_name ?? null,
      payload.room_code ?? null,
      payload.description === undefined ? null : payload.description,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

export const updateComponentRepo = async (
  client: PoolClient,
  siteId: string,
  componentId: string,
  payload: UpdateComponentPayload
) => {
  const { rows } = await client.query(
    `
    UPDATE components
    SET
      component_name = COALESCE($3, component_name),
      component_type = CASE
        WHEN $4::text IS NULL THEN component_type
        ELSE $4
      END,
      description = CASE
        WHEN $5::text IS NULL THEN description
        ELSE $5
      END,
      display_order = COALESCE($6, display_order),
      updated_at = now()
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [
      componentId,
      siteId,
      payload.component_name ?? null,
      payload.component_type === undefined
        ? null
        : payload.component_type,
      payload.description === undefined ? null : payload.description,
      payload.display_order ?? null,
    ]
  );

  return rows[0];
};

/* ---------------- SAFE DELETE CHECKS ---------------- */

export const getBuildingDeleteBlockersRepo = async (
  client: PoolClient,
  siteId: string,
  buildingId: string
) => {
  const { rows } = await client.query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM floors WHERE building_id = $1 AND site_id = $2) AS floor_count,
      (SELECT COUNT(*)::int FROM sensors WHERE building_id = $1 AND site_id = $2) AS sensor_count
    `,
    [buildingId, siteId]
  );

  return rows[0];
};

export const getFloorDeleteBlockersRepo = async (
  client: PoolClient,
  siteId: string,
  floorId: string
) => {
  const { rows } = await client.query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM rooms WHERE floor_id = $1 AND site_id = $2) AS room_count,
      (SELECT COUNT(*)::int FROM sensors WHERE floor_id = $1 AND site_id = $2) AS sensor_count
    `,
    [floorId, siteId]
  );

  return rows[0];
};

export const getRoomDeleteBlockersRepo = async (
  client: PoolClient,
  siteId: string,
  roomId: string
) => {
  const { rows } = await client.query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM components WHERE room_id = $1 AND site_id = $2) AS component_count,
      (SELECT COUNT(*)::int FROM sensors WHERE room_id = $1 AND site_id = $2) AS sensor_count
    `,
    [roomId, siteId]
  );

  return rows[0];
};

export const getComponentDeleteBlockersRepo = async (
  client: PoolClient,
  siteId: string,
  componentId: string
) => {
  const { rows } = await client.query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM sensors WHERE component_id = $1 AND site_id = $2) AS sensor_count
    `,
    [componentId, siteId]
  );

  return rows[0];
};

/* ---------------- DELETE ---------------- */

export const deleteBuildingRepo = async (
  client: PoolClient,
  siteId: string,
  buildingId: string
) => {
  const { rows } = await client.query(
    `
    DELETE FROM buildings
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [buildingId, siteId]
  );

  return rows[0];
};

export const deleteFloorRepo = async (
  client: PoolClient,
  siteId: string,
  floorId: string
) => {
  const { rows } = await client.query(
    `
    DELETE FROM floors
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [floorId, siteId]
  );

  return rows[0];
};

export const deleteRoomRepo = async (
  client: PoolClient,
  siteId: string,
  roomId: string
) => {
  const { rows } = await client.query(
    `
    DELETE FROM rooms
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [roomId, siteId]
  );

  return rows[0];
};

export const deleteComponentRepo = async (
  client: PoolClient,
  siteId: string,
  componentId: string
) => {
  const { rows } = await client.query(
    `
    DELETE FROM components
    WHERE id = $1
      AND site_id = $2
    RETURNING *
    `,
    [componentId, siteId]
  );

  return rows[0];
};

/* ---------------- SENSOR ASSIGNMENT TABLE ---------------- */

export const getSensorAssignmentsRepo = async (
  client: PoolClient,
  siteId: string
) => {
  const { rows } = await client.query(
    `
    SELECT
      s.id AS sensor_id,
      s.sensor_name,
      s.external_sensor_id AS external_id,
      s.sensor_type,
      s.unit,
      CASE
        WHEN s.active = true THEN 'active'
        ELSE 'inactive'
      END AS status,

      s.building_id,
      b.building_name,

      s.floor_id,
      f.floor_name,

      s.room_id,
      r.room_name,

      s.component_id,
      c.component_name,

      COALESCE(
        json_agg(
          json_build_object(
            'id', st.id,
            'tag_key', st.tag_key,
            'tag_value', st.tag_value,
            'tag_type', st.tag_type
          )
          ORDER BY st.tag_key, st.tag_value
        ) FILTER (WHERE st.id IS NOT NULL),
        '[]'
      ) AS tags

    FROM sensors s
    LEFT JOIN buildings b ON b.id = s.building_id
    LEFT JOIN floors f ON f.id = s.floor_id
    LEFT JOIN rooms r ON r.id = s.room_id
    LEFT JOIN components c ON c.id = s.component_id
    LEFT JOIN sensor_tags st ON st.sensor_id = s.id

    WHERE s.site_id = $1

    GROUP BY
      s.id,
      s.sensor_name,
      s.external_sensor_id,
      s.sensor_type,
      s.unit,
      s.active,
      s.building_id,
      b.building_name,
      s.floor_id,
      f.floor_name,
      s.room_id,
      r.room_name,
      s.component_id,
      c.component_name

    ORDER BY s.sensor_name ASC
    `,
    [siteId]
  );

  return rows;
};

/* ---------------- SENSOR VALIDATION ---------------- */

export const verifySensorsBelongToSiteRepo = async (
  client: PoolClient,
  siteId: string,
  sensorIds: string[]
): Promise<boolean> => {
  const { rows } = await client.query(
    `
    SELECT COUNT(*)::int AS count
    FROM sensors
    WHERE site_id = $1
      AND id = ANY($2::uuid[])
    `,
    [siteId, sensorIds]
  );

  return Number(rows[0]?.count || 0) === sensorIds.length;
};

export const getLocationChainRepo = async (
  client: PoolClient,
  siteId: string,
  payload: {
    building_id?: string | null;
    floor_id?: string | null;
    room_id?: string | null;
    component_id?: string | null;
  }
) => {
  const building = payload.building_id
    ? await getBuildingByIdRepo(client, siteId, payload.building_id)
    : null;

  const floor = payload.floor_id
    ? await getFloorByIdRepo(client, siteId, payload.floor_id)
    : null;

  const room = payload.room_id
    ? await getRoomByIdRepo(client, siteId, payload.room_id)
    : null;

  const component = payload.component_id
    ? await getComponentByIdRepo(client, siteId, payload.component_id)
    : null;

  return {
    building,
    floor,
    room,
    component,
  };
};

export const updateSensorsLocationRepo = async (
  client: PoolClient,
  siteId: string,
  payload: BulkAssignSensorLocationPayload
) => {
  const { rows } = await client.query(
    `
    UPDATE sensors
    SET
      building_id = $3,
      floor_id = $4,
      room_id = $5,
      component_id = $6
    WHERE site_id = $1
      AND id = ANY($2::uuid[])
    RETURNING id
    `,
    [
      siteId,
      payload.sensor_ids,
      payload.building_id,
      payload.floor_id ?? null,
      payload.room_id ?? null,
      payload.component_id ?? null,
    ]
  );

  return rows;
};


export const clearSensorsLocationRepo = async (
  client: PoolClient,
  siteId: string,
  sensorIds: string[]
) => {
  const { rows } = await client.query(
    `
    UPDATE sensors
    SET
      building_id = NULL,
      floor_id = NULL,
      room_id = NULL,
      component_id = NULL
    WHERE site_id = $1
      AND id = ANY($2::uuid[])
    RETURNING id
    `,
    [siteId, sensorIds]
  );

  return rows;
};

/* ---------------- TAGS ---------------- */

export const deleteSystemLocationTagsRepo = async (
  client: PoolClient,
  sensorIds: string[]
) => {
  await client.query(
    `
    DELETE FROM sensor_tags
    WHERE sensor_id = ANY($1::uuid[])
      AND tag_type = 'system'
      AND tag_key IN ('building', 'floor', 'room', 'component')
    `,
    [sensorIds]
  );
};

export const insertSensorTagRepo = async (
  client: PoolClient,
  payload: {
    organizationId: string;
    siteId: string;
    sensorId: string;
    tagKey: string;
    tagValue: string;
    tagType: "manual" | "system" | "analytics" | "compliance";
    createdBy?: string;
  }
) => {
  const { rows } = await client.query(
    `
    INSERT INTO sensor_tags (
      organization_id,
      site_id,
      sensor_id,
      tag_key,
      tag_value,
      tag_type,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (sensor_id, tag_key, tag_value)
    DO UPDATE SET tag_type = EXCLUDED.tag_type
    RETURNING *
    `,
    [
      payload.organizationId,
      payload.siteId,
      payload.sensorId,
      payload.tagKey,
      payload.tagValue,
      payload.tagType,
      payload.createdBy ?? null,
    ]
  );

  return rows[0];
};

export const bulkInsertSensorTagsRepo = async (
  client: PoolClient,
  payload: {
    organizationId: string;
    siteId: string;
    sensorIds: string[];
    tags: {
      tagKey: string;
      tagValue: string;
      tagType: "manual" | "system" | "analytics" | "compliance";
    }[];
    createdBy?: string;
  }
) => {
  for (const sensorId of payload.sensorIds) {
    for (const tag of payload.tags) {
      await insertSensorTagRepo(client, {
        organizationId: payload.organizationId,
        siteId: payload.siteId,
        sensorId,
        tagKey: tag.tagKey,
        tagValue: tag.tagValue,
        tagType: tag.tagType,
        createdBy: payload.createdBy,
      });
    }
  }
};

export const addSensorTagRepo = async (
  client: PoolClient,
  site: { id: string; organization_id: string },
  sensorId: string,
  payload: AddSensorTagPayload,
  createdBy: string
) => {
  return await insertSensorTagRepo(client, {
    organizationId: site.organization_id,
    siteId: site.id,
    sensorId,
    tagKey: payload.tag_key,
    tagValue: payload.tag_value,
    tagType: payload.tag_type ?? "manual",
    createdBy,
  });
};

export const removeSensorTagRepo = async (
  client: PoolClient,
  siteId: string,
  sensorId: string,
  tagId: string
) => {
  const { rows } = await client.query(
    `
    DELETE FROM sensor_tags
    WHERE id = $1
      AND site_id = $2
      AND sensor_id = $3
      AND tag_type != 'system'
    RETURNING *
    `,
    [tagId, siteId, sensorId]
  );

  return rows[0];
};