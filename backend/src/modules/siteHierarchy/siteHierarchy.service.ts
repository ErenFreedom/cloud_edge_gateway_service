import {
  AuthUser,
  CreateBuildingPayload,
  CreateComponentPayload,
  CreateFloorPayload,
  CreateRoomPayload,
  UpdateBuildingPayload,
  UpdateComponentPayload,
  UpdateFloorPayload,
  UpdateRoomPayload,
  AddSensorTagPayload,
  BulkAssignSensorLocationPayload,
  ClearSensorLocationPayload,
} from "./siteHierarchy.types";

import {
  withTransaction,
  getSiteByIdRepo,
  verifyManagerSiteAccessRepo,
  verifySiteAdminAccessRepo,
  verifySiteMonitorAccessRepo,

  getHierarchyRepo,

  createBuildingRepo,
  createFloorRepo,
  createRoomRepo,
  createComponentRepo,

  getBuildingByIdRepo,
  getFloorByIdRepo,
  getRoomByIdRepo,
  getComponentByIdRepo,

  updateBuildingRepo,
  updateFloorRepo,
  updateRoomRepo,
  updateComponentRepo,

  getBuildingDeleteBlockersRepo,
  getFloorDeleteBlockersRepo,
  getRoomDeleteBlockersRepo,
  getComponentDeleteBlockersRepo,

  deleteBuildingRepo,
  deleteFloorRepo,
  deleteRoomRepo,
  deleteComponentRepo,

  getSensorAssignmentsRepo,
  verifySensorsBelongToSiteRepo,
  getLocationChainRepo,
  updateSensorsLocationRepo,
  clearSensorsLocationRepo,
  deleteSystemLocationTagsRepo,
  bulkInsertSensorTagsRepo,
  addSensorTagRepo,
  removeSensorTagRepo,
} from "./siteHierarchy.repository";

/* ---------------- PERMISSIONS ---------------- */

const getOrganizationId = (user: AuthUser): string => {
  if (!user.organizationId) {
    throw new Error("Organization context missing");
  }

  return user.organizationId;
};

const assertSiteBelongsToOrg = async (
  client: any,
  siteId: string,
  organizationId: string
) => {
  const site = await getSiteByIdRepo(client, siteId);

  if (!site) {
    throw new Error("Site not found");
  }

  if (site.organization_id !== organizationId) {
    throw new Error("Site does not belong to organization");
  }

  return site;
};

const assertCanViewHierarchy = async (
  client: any,
  user: AuthUser,
  siteId: string
) => {
  const organizationId = getOrganizationId(user);

  const site = await assertSiteBelongsToOrg(
    client,
    siteId,
    organizationId
  );

  if (user.role === "super_admin") {
    return site;
  }

  if (user.role === "org_site_manager") {
    const hasAccess = await verifyManagerSiteAccessRepo(
      client,
      user.userId,
      siteId
    );

    if (!hasAccess) {
      throw new Error("Access denied for this site");
    }

    return site;
  }

  if (user.role === "site_admin") {
    const hasAccess = await verifySiteAdminAccessRepo(
      client,
      user.userId,
      siteId
    );

    if (!hasAccess) {
      throw new Error("Access denied for this site");
    }

    return site;
  }

  if (user.role === "site_monitor") {
    const hasAccess = await verifySiteMonitorAccessRepo(
      client,
      user.userId,
      siteId
    );

    if (!hasAccess) {
      throw new Error("Access denied for this site");
    }

    return site;
  }

  throw new Error("Unauthorized");
};

const assertCanManageHierarchy = async (
  client: any,
  user: AuthUser,
  siteId: string
) => {
  const organizationId = getOrganizationId(user);

  const site = await assertSiteBelongsToOrg(
    client,
    siteId,
    organizationId
  );

  if (user.role === "super_admin") {
    return site;
  }

  if (user.role === "org_site_manager") {
    const hasAccess = await verifyManagerSiteAccessRepo(
      client,
      user.userId,
      siteId
    );

    if (!hasAccess) {
      throw new Error("Access denied for this site");
    }

    return site;
  }

  throw new Error("Only super admin or org site manager can modify hierarchy");
};

/* ---------------- GET HIERARCHY ---------------- */

export const getSiteHierarchyService = async (
  user: AuthUser,
  siteId: string
) => {
  return await withTransaction(async (client) => {
    await assertCanViewHierarchy(client, user, siteId);

    return await getHierarchyRepo(client, siteId);
  });
};

/* ---------------- CREATE NODES ---------------- */

export const createBuildingService = async (
  user: AuthUser,
  siteId: string,
  payload: CreateBuildingPayload
) => {
  return await withTransaction(async (client) => {
    const site = await assertCanManageHierarchy(
      client,
      user,
      siteId
    );

    const building = await createBuildingRepo(
      client,
      site,
      payload
    );

    return {
      message: "Building created successfully",
      building,
    };
  });
};

export const createFloorService = async (
  user: AuthUser,
  siteId: string,
  buildingId: string,
  payload: CreateFloorPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const building = await getBuildingByIdRepo(
      client,
      siteId,
      buildingId
    );

    if (!building) {
      throw new Error("Building not found");
    }

    const floor = await createFloorRepo(
      client,
      building,
      payload
    );

    return {
      message: "Floor created successfully",
      floor,
    };
  });
};

export const createRoomService = async (
  user: AuthUser,
  siteId: string,
  floorId: string,
  payload: CreateRoomPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const floor = await getFloorByIdRepo(
      client,
      siteId,
      floorId
    );

    if (!floor) {
      throw new Error("Floor not found");
    }

    const room = await createRoomRepo(
      client,
      floor,
      payload
    );

    return {
      message: "Room created successfully",
      room,
    };
  });
};

export const createComponentService = async (
  user: AuthUser,
  siteId: string,
  roomId: string,
  payload: CreateComponentPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const room = await getRoomByIdRepo(
      client,
      siteId,
      roomId
    );

    if (!room) {
      throw new Error("Room not found");
    }

    const component = await createComponentRepo(
      client,
      room,
      payload
    );

    return {
      message: "Component created successfully",
      component,
    };
  });
};

/* ---------------- UPDATE NODES ---------------- */

export const updateBuildingService = async (
  user: AuthUser,
  siteId: string,
  buildingId: string,
  payload: UpdateBuildingPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const existing = await getBuildingByIdRepo(
      client,
      siteId,
      buildingId
    );

    if (!existing) {
      throw new Error("Building not found");
    }

    const building = await updateBuildingRepo(
      client,
      siteId,
      buildingId,
      payload
    );

    return {
      message: "Building updated successfully",
      building,
    };
  });
};

export const updateFloorService = async (
  user: AuthUser,
  siteId: string,
  floorId: string,
  payload: UpdateFloorPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const existing = await getFloorByIdRepo(
      client,
      siteId,
      floorId
    );

    if (!existing) {
      throw new Error("Floor not found");
    }

    const floor = await updateFloorRepo(
      client,
      siteId,
      floorId,
      payload
    );

    return {
      message: "Floor updated successfully",
      floor,
    };
  });
};

export const updateRoomService = async (
  user: AuthUser,
  siteId: string,
  roomId: string,
  payload: UpdateRoomPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const existing = await getRoomByIdRepo(
      client,
      siteId,
      roomId
    );

    if (!existing) {
      throw new Error("Room not found");
    }

    const room = await updateRoomRepo(
      client,
      siteId,
      roomId,
      payload
    );

    return {
      message: "Room updated successfully",
      room,
    };
  });
};

export const updateComponentService = async (
  user: AuthUser,
  siteId: string,
  componentId: string,
  payload: UpdateComponentPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const existing = await getComponentByIdRepo(
      client,
      siteId,
      componentId
    );

    if (!existing) {
      throw new Error("Component not found");
    }

    const component = await updateComponentRepo(
      client,
      siteId,
      componentId,
      payload
    );

    return {
      message: "Component updated successfully",
      component,
    };
  });
};

/* ---------------- SAFE DELETE ---------------- */

export const deleteBuildingService = async (
  user: AuthUser,
  siteId: string,
  buildingId: string
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const building = await getBuildingByIdRepo(
      client,
      siteId,
      buildingId
    );

    if (!building) {
      throw new Error("Building not found");
    }

    const blockers = await getBuildingDeleteBlockersRepo(
      client,
      siteId,
      buildingId
    );

    if (Number(blockers.floor_count) > 0) {
      throw new Error("Cannot delete building. Remove floors first.");
    }

    if (Number(blockers.sensor_count) > 0) {
      throw new Error("Cannot delete building. Unassign sensors first.");
    }

    await deleteBuildingRepo(client, siteId, buildingId);

    return {
      message: "Building deleted successfully",
    };
  });
};

export const deleteFloorService = async (
  user: AuthUser,
  siteId: string,
  floorId: string
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const floor = await getFloorByIdRepo(
      client,
      siteId,
      floorId
    );

    if (!floor) {
      throw new Error("Floor not found");
    }

    const blockers = await getFloorDeleteBlockersRepo(
      client,
      siteId,
      floorId
    );

    if (Number(blockers.room_count) > 0) {
      throw new Error("Cannot delete floor. Remove rooms first.");
    }

    if (Number(blockers.sensor_count) > 0) {
      throw new Error("Cannot delete floor. Unassign sensors first.");
    }

    await deleteFloorRepo(client, siteId, floorId);

    return {
      message: "Floor deleted successfully",
    };
  });
};

export const deleteRoomService = async (
  user: AuthUser,
  siteId: string,
  roomId: string
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const room = await getRoomByIdRepo(
      client,
      siteId,
      roomId
    );

    if (!room) {
      throw new Error("Room not found");
    }

    const blockers = await getRoomDeleteBlockersRepo(
      client,
      siteId,
      roomId
    );

    if (Number(blockers.component_count) > 0) {
      throw new Error("Cannot delete room. Remove components first.");
    }

    if (Number(blockers.sensor_count) > 0) {
      throw new Error("Cannot delete room. Unassign sensors first.");
    }

    await deleteRoomRepo(client, siteId, roomId);

    return {
      message: "Room deleted successfully",
    };
  });
};

export const deleteComponentService = async (
  user: AuthUser,
  siteId: string,
  componentId: string
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const component = await getComponentByIdRepo(
      client,
      siteId,
      componentId
    );

    if (!component) {
      throw new Error("Component not found");
    }

    const blockers = await getComponentDeleteBlockersRepo(
      client,
      siteId,
      componentId
    );

    if (Number(blockers.sensor_count) > 0) {
      throw new Error("Cannot delete component. Unassign sensors first.");
    }

    await deleteComponentRepo(
      client,
      siteId,
      componentId
    );

    return {
      message: "Component deleted successfully",
    };
  });
};




/* ---------------- SENSOR ASSIGNMENT TABLE ---------------- */

export const getSensorAssignmentsService = async (
  user: AuthUser,
  siteId: string
) => {
  return await withTransaction(async (client) => {
    await assertCanViewHierarchy(client, user, siteId);

    return await getSensorAssignmentsRepo(client, siteId);
  });
};

/* ---------------- VALIDATE LOCATION CHAIN ---------------- */

const validateLocationChain = async (
  client: any,
  siteId: string,
  payload: BulkAssignSensorLocationPayload
) => {
  const {
    building,
    floor,
    room,
    component,
  } = await getLocationChainRepo(client, siteId, payload);

  if (!building) {
    throw new Error("Building not found");
  }

  if (payload.floor_id && !floor) {
    throw new Error("Floor not found");
  }

  if (payload.room_id && !room) {
    throw new Error("Room not found");
  }

  if (payload.component_id && !component) {
    throw new Error("Component not found");
  }

  if (floor && floor.building_id !== building.id) {
    throw new Error("Floor does not belong to selected building");
  }

  if (room) {
    if (!floor) {
      throw new Error("Floor is required when assigning room");
    }

    if (room.floor_id !== floor.id) {
      throw new Error("Room does not belong to selected floor");
    }

    if (room.building_id !== building.id) {
      throw new Error("Room does not belong to selected building");
    }
  }

  if (component) {
    if (!room) {
      throw new Error("Room is required when assigning component");
    }

    if (component.room_id !== room.id) {
      throw new Error("Component does not belong to selected room");
    }

    if (component.floor_id !== floor?.id) {
      throw new Error("Component does not belong to selected floor");
    }

    if (component.building_id !== building.id) {
      throw new Error("Component does not belong to selected building");
    }
  }

  return {
    building,
    floor,
    room,
    component,
  };
};

/* ---------------- BULK ASSIGN SENSOR LOCATION ---------------- */

export const bulkAssignSensorLocationService = async (
  user: AuthUser,
  siteId: string,
  payload: BulkAssignSensorLocationPayload
) => {
  return await withTransaction(async (client) => {
    const site = await assertCanManageHierarchy(
      client,
      user,
      siteId
    );

    const sensorsBelongToSite =
      await verifySensorsBelongToSiteRepo(
        client,
        siteId,
        payload.sensor_ids
      );

    if (!sensorsBelongToSite) {
      throw new Error("One or more sensors do not belong to this site");
    }

    const location = await validateLocationChain(
      client,
      siteId,
      payload
    );

    const updatedSensors = await updateSensorsLocationRepo(
      client,
      siteId,
      payload
    );

    await deleteSystemLocationTagsRepo(
      client,
      payload.sensor_ids
    );

    const systemTags: {
      tagKey: string;
      tagValue: string;
      tagType: "system";
    }[] = [
      {
        tagKey: "building",
        tagValue: location.building.building_name,
        tagType: "system",
      },
    ];

    if (location.floor) {
      systemTags.push({
        tagKey: "floor",
        tagValue: location.floor.floor_name,
        tagType: "system",
      });
    }

    if (location.room) {
      systemTags.push({
        tagKey: "room",
        tagValue: location.room.room_name,
        tagType: "system",
      });
    }

    if (location.component) {
      systemTags.push({
        tagKey: "component",
        tagValue: location.component.component_name,
        tagType: "system",
      });
    }

    const manualTags =
      payload.manual_tags?.map((tag) => ({
        tagKey: "category",
        tagValue: tag,
        tagType: "manual" as const,
      })) || [];

    await bulkInsertSensorTagsRepo(client, {
      organizationId: site.organization_id,
      siteId: site.id,
      sensorIds: payload.sensor_ids,
      tags: [...systemTags, ...manualTags],
      createdBy: user.userId,
    });

    return {
      message: "Sensors assigned successfully",
      assigned_count: updatedSensors.length,
    };
  });
};

/* ---------------- CLEAR SENSOR LOCATION ---------------- */

export const clearSensorLocationService = async (
  user: AuthUser,
  siteId: string,
  payload: ClearSensorLocationPayload
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const sensorsBelongToSite =
      await verifySensorsBelongToSiteRepo(
        client,
        siteId,
        payload.sensor_ids
      );

    if (!sensorsBelongToSite) {
      throw new Error("One or more sensors do not belong to this site");
    }

    const clearedSensors = await clearSensorsLocationRepo(
      client,
      siteId,
      payload.sensor_ids
    );

    await deleteSystemLocationTagsRepo(
      client,
      payload.sensor_ids
    );

    return {
      message: "Sensor locations cleared successfully",
      cleared_count: clearedSensors.length,
    };
  });
};

/* ---------------- ADD SENSOR TAG ---------------- */

export const addSensorTagService = async (
  user: AuthUser,
  siteId: string,
  sensorId: string,
  payload: AddSensorTagPayload
) => {
  return await withTransaction(async (client) => {
    const site = await assertCanManageHierarchy(
      client,
      user,
      siteId
    );

    const sensorsBelongToSite =
      await verifySensorsBelongToSiteRepo(
        client,
        siteId,
        [sensorId]
      );

    if (!sensorsBelongToSite) {
      throw new Error("Sensor does not belong to this site");
    }

    if (payload.tag_type === "system") {
      throw new Error("System tags cannot be added manually");
    }

    const tag = await addSensorTagRepo(
      client,
      site,
      sensorId,
      {
        ...payload,
        tag_type: payload.tag_type ?? "manual",
      },
      user.userId
    );

    return {
      message: "Sensor tag added successfully",
      tag,
    };
  });
};

/* ---------------- REMOVE SENSOR TAG ---------------- */

export const removeSensorTagService = async (
  user: AuthUser,
  siteId: string,
  sensorId: string,
  tagId: string
) => {
  return await withTransaction(async (client) => {
    await assertCanManageHierarchy(client, user, siteId);

    const sensorsBelongToSite =
      await verifySensorsBelongToSiteRepo(
        client,
        siteId,
        [sensorId]
      );

    if (!sensorsBelongToSite) {
      throw new Error("Sensor does not belong to this site");
    }

    const removed = await removeSensorTagRepo(
      client,
      siteId,
      sensorId,
      tagId
    );

    if (!removed) {
      throw new Error("Tag not found or cannot remove system tag");
    }

    return {
      message: "Sensor tag removed successfully",
    };
  });
};