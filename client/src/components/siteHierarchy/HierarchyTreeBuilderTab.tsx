import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import {
  FaBuilding,
  FaLayerGroup,
  FaDoorOpen,
  FaCubes,
  FaPlus,
  FaTrash,
  FaEdit,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";

import type { RootState, AppDispatch } from "../../store/store";

import {
  createBuildingThunk,
  createFloorThunk,
  createRoomThunk,
  createComponentThunk,

  updateBuildingThunk,
  updateFloorThunk,
  updateRoomThunk,
  updateComponentThunk,

  deleteBuildingThunk,
  deleteFloorThunk,
  deleteRoomThunk,
  deleteComponentThunk,

  fetchSiteHierarchyThunk,
} from "../../features/siteHierarchy/siteHierarchySlice";

import Button from "../ui/Button";

interface HierarchyTreeBuilderTabProps {
  siteId: string;
  siteStatus: string;
}

type NodeType = "building" | "floor" | "room" | "component";
type ModalMode = "create" | "edit";

type ModalType = NodeType | null;

type ParentContext = {
  buildingId?: string;
  floorId?: string;
  roomId?: string;
};

type EditingNode = {
  id: string;
  type: NodeType;
} | null;

const HierarchyTreeBuilderTab = ({
  siteId,
  siteStatus,
}: HierarchyTreeBuilderTabProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const { hierarchy, loading, actionLoading, error } =
    useSelector((state: RootState) => state.siteHierarchy);

  const canManage = siteStatus === "active";

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingNode, setEditingNode] = useState<EditingNode>(null);

  const [parentContext, setParentContext] =
    useState<ParentContext>({});

  const [searchQuery, setSearchQuery] = useState("");

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  const [form, setForm] = useState({
    name: "",
    code: "",
    number: "",
    type: "",
    description: "",
    display_order: "1",
  });

  const resetModal = () => {
    setModalType(null);
    setModalMode("create");
    setEditingNode(null);
    setParentContext({});
    setForm({
      name: "",
      code: "",
      number: "",
      type: "",
      description: "",
      display_order: "1",
    });
  };

  const refreshHierarchy = () => {
    dispatch(fetchSiteHierarchyThunk(siteId));
  };

  const toggleExpanded = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const isExpanded = (id: string) => {
    return expandedNodes[id] ?? true;
  };

  const openCreateModal = (
    type: ModalType,
    context: ParentContext = {}
  ) => {
    setModalType(type);
    setModalMode("create");
    setEditingNode(null);
    setParentContext(context);
    setForm({
      name: "",
      code: "",
      number: "",
      type: "",
      description: "",
      display_order: "1",
    });
  };

  const openEditModal = (type: NodeType, node: any) => {
    setModalType(type);
    setModalMode("edit");
    setEditingNode({
      id: node.id,
      type,
    });

    setForm({
      name:
        type === "building"
          ? node.building_name
          : type === "floor"
          ? node.floor_name
          : type === "room"
          ? node.room_name
          : node.component_name,

      code:
        type === "building"
          ? node.building_code || ""
          : type === "room"
          ? node.room_code || ""
          : "",

      number:
        type === "floor"
          ? node.floor_number?.toString() || ""
          : "",

      type:
        type === "component"
          ? node.component_type || ""
          : "",

      description: node.description || "",
      display_order: node.display_order?.toString() || "1",
    });
  };

  const filteredHierarchy = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return hierarchy;

    return hierarchy
      .map((building) => {
        const buildingMatches =
          building.building_name.toLowerCase().includes(query) ||
          building.building_code?.toLowerCase().includes(query);

        const floors = building.floors
          .map((floor) => {
            const floorMatches =
              floor.floor_name.toLowerCase().includes(query) ||
              floor.floor_number?.toString().toLowerCase().includes(query);

            const rooms = floor.rooms
              .map((room) => {
                const roomMatches =
                  room.room_name.toLowerCase().includes(query) ||
                  room.room_code?.toLowerCase().includes(query);

                const components = room.components.filter((component) => {
                  return (
                    component.component_name
                      .toLowerCase()
                      .includes(query) ||
                    component.component_type
                      ?.toLowerCase()
                      .includes(query)
                  );
                });

                if (roomMatches || components.length > 0) {
                  return {
                    ...room,
                    components,
                  };
                }

                return null;
              })
              .filter(Boolean) as typeof floor.rooms;

            if (floorMatches || rooms.length > 0) {
              return {
                ...floor,
                rooms,
              };
            }

            return null;
          })
          .filter(Boolean) as typeof building.floors;

        if (buildingMatches || floors.length > 0) {
          return {
            ...building,
            floors,
          };
        }

        return null;
      })
      .filter(Boolean) as typeof hierarchy;
  }, [hierarchy, searchQuery]);

  const handleSave = async () => {
    if (!modalType || !form.name.trim()) return;

    const displayOrder = Number(form.display_order || 1);
    let result: any;

    if (modalMode === "create") {
      if (modalType === "building") {
        result = await dispatch(
          createBuildingThunk({
            siteId,
            data: {
              building_name: form.name.trim(),
              building_code: form.code.trim() || undefined,
              description: form.description.trim() || undefined,
              display_order: displayOrder,
            },
          })
        );
      }

      if (modalType === "floor") {
        if (!parentContext.buildingId) return;

        result = await dispatch(
          createFloorThunk({
            siteId,
            buildingId: parentContext.buildingId,
            data: {
              floor_name: form.name.trim(),
              floor_number: form.number.trim() || undefined,
              description: form.description.trim() || undefined,
              display_order: displayOrder,
            },
          })
        );
      }

      if (modalType === "room") {
        if (!parentContext.floorId) return;

        result = await dispatch(
          createRoomThunk({
            siteId,
            floorId: parentContext.floorId,
            data: {
              room_name: form.name.trim(),
              room_code: form.code.trim() || undefined,
              description: form.description.trim() || undefined,
              display_order: displayOrder,
            },
          })
        );
      }

      if (modalType === "component") {
        if (!parentContext.roomId) return;

        result = await dispatch(
          createComponentThunk({
            siteId,
            roomId: parentContext.roomId,
            data: {
              component_name: form.name.trim(),
              component_type: form.type.trim() || undefined,
              description: form.description.trim() || undefined,
              display_order: displayOrder,
            },
          })
        );
      }
    }

    if (modalMode === "edit") {
      if (!editingNode) return;

      if (modalType === "building") {
        result = await dispatch(
          updateBuildingThunk({
            siteId,
            buildingId: editingNode.id,
            data: {
              building_name: form.name.trim(),
              building_code: form.code.trim() || undefined,
              description: form.description.trim() || null,
              display_order: displayOrder,
            },
          })
        );
      }

      if (modalType === "floor") {
        result = await dispatch(
          updateFloorThunk({
            siteId,
            floorId: editingNode.id,
            data: {
              floor_name: form.name.trim(),
              floor_number: form.number.trim() || null,
              description: form.description.trim() || null,
              display_order: displayOrder,
            },
          })
        );
      }

      if (modalType === "room") {
        result = await dispatch(
          updateRoomThunk({
            siteId,
            roomId: editingNode.id,
            data: {
              room_name: form.name.trim(),
              room_code: form.code.trim() || undefined,
              description: form.description.trim() || null,
              display_order: displayOrder,
            },
          })
        );
      }

      if (modalType === "component") {
        result = await dispatch(
          updateComponentThunk({
            siteId,
            componentId: editingNode.id,
            data: {
              component_name: form.name.trim(),
              component_type: form.type.trim() || null,
              description: form.description.trim() || null,
              display_order: displayOrder,
            },
          })
        );
      }
    }

    if (result?.type.endsWith("/rejected")) {
      toast.error(result.payload || "Operation failed");
      return;
    }

    toast.success(
      modalMode === "create"
        ? "Hierarchy node created"
        : "Hierarchy node updated"
    );

    resetModal();
    refreshHierarchy();
  };

  const handleDelete = async (
    type: NodeType,
    id: string,
    label: string
  ) => {
    const ok = window.confirm(
      `Delete "${label}"?\n\nThis is allowed only if the node has no child nodes and no sensors.`
    );

    if (!ok) return;

    let result: any;

    if (type === "building") {
      result = await dispatch(
        deleteBuildingThunk({
          siteId,
          buildingId: id,
        })
      );
    }

    if (type === "floor") {
      result = await dispatch(
        deleteFloorThunk({
          siteId,
          floorId: id,
        })
      );
    }

    if (type === "room") {
      result = await dispatch(
        deleteRoomThunk({
          siteId,
          roomId: id,
        })
      );
    }

    if (type === "component") {
      result = await dispatch(
        deleteComponentThunk({
          siteId,
          componentId: id,
        })
      );
    }

    if (result?.type.endsWith("/rejected")) {
      toast.error(result.payload || "Delete failed");
      return;
    }

    toast.success("Hierarchy node deleted");
    refreshHierarchy();
  };

  const modalTitle =
    modalType === "building"
      ? modalMode === "create"
        ? "Add Building"
        : "Edit Building"
      : modalType === "floor"
      ? modalMode === "create"
        ? "Add Floor"
        : "Edit Floor"
      : modalType === "room"
      ? modalMode === "create"
        ? "Add Room"
        : "Edit Room"
      : modalType === "component"
      ? modalMode === "create"
        ? "Add Component"
        : "Edit Component"
      : "";

  if (loading) {
    return (
      <div className="hierarchy-empty">
        Loading hierarchy tree...
      </div>
    );
  }

  return (
    <div className="tree-builder">
      <div className="tree-builder-header">
        <div>
          <h3>Tree Builder</h3>
          <p>
            Create and manage physical hierarchy. Sensors are assigned from
            the Sensor Assignment tab.
          </p>
        </div>

        {canManage && (
          <Button
            size="medium"
            onClick={() => openCreateModal("building")}
          >
            Add Building
          </Button>
        )}
      </div>

      <div className="tree-toolbar">
        <div className="tree-search">
          <FaSearch />
          <input
            placeholder="Search building, floor, room, component..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!canManage && (
        <div className="hierarchy-warning-banner">
          This site is not active. Hierarchy is currently view-only.
        </div>
      )}

      {error && (
        <div className="hierarchy-error-banner">
          {error}
        </div>
      )}

      {filteredHierarchy.length === 0 ? (
        <div className="hierarchy-empty">
          <h3>No hierarchy found</h3>
          <p>
            {searchQuery
              ? "No matching hierarchy node found."
              : "Start by adding a building. Then add floors, rooms and components."}
          </p>
        </div>
      ) : (
        <div className="tree-list">
          {filteredHierarchy.map((building) => (
            <div key={building.id} className="tree-building-node">
              <div className="tree-node tree-node-building">
                <button
                  className="tree-expand-btn"
                  onClick={() => toggleExpanded(building.id)}
                  type="button"
                >
                  {isExpanded(building.id) ? (
                    <FaChevronDown />
                  ) : (
                    <FaChevronRight />
                  )}
                </button>

                <div className="tree-node-title">
                  <FaBuilding />
                  <div>
                    <strong>{building.building_name}</strong>
                    <span>{building.building_code || "No code"}</span>
                  </div>
                </div>

                {canManage && (
                  <div className="tree-node-actions">
                    <button
                      onClick={() =>
                        openCreateModal("floor", {
                          buildingId: building.id,
                        })
                      }
                    >
                      <FaPlus /> Floor
                    </button>

                    <button
                      onClick={() =>
                        openEditModal("building", building)
                      }
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          "building",
                          building.id,
                          building.building_name
                        )
                      }
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              {isExpanded(building.id) && (
                <div className="tree-children">
                  {building.floors.map((floor) => (
                    <div key={floor.id} className="tree-floor-group">
                      <div className="tree-node tree-node-floor">
                        <button
                          className="tree-expand-btn"
                          onClick={() => toggleExpanded(floor.id)}
                          type="button"
                        >
                          {isExpanded(floor.id) ? (
                            <FaChevronDown />
                          ) : (
                            <FaChevronRight />
                          )}
                        </button>

                        <div className="tree-node-title">
                          <FaLayerGroup />
                          <div>
                            <strong>{floor.floor_name}</strong>
                            <span>
                              Floor No: {floor.floor_number || "-"}
                            </span>
                          </div>
                        </div>

                        {canManage && (
                          <div className="tree-node-actions">
                            <button
                              onClick={() =>
                                openCreateModal("room", {
                                  floorId: floor.id,
                                })
                              }
                            >
                              <FaPlus /> Room
                            </button>

                            <button
                              onClick={() =>
                                openEditModal("floor", floor)
                              }
                            >
                              <FaEdit />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  "floor",
                                  floor.id,
                                  floor.floor_name
                                )
                              }
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>

                      {isExpanded(floor.id) && (
                        <div className="tree-children">
                          {floor.rooms.map((room) => (
                            <div key={room.id} className="tree-room-group">
                              <div className="tree-node tree-node-room">
                                <button
                                  className="tree-expand-btn"
                                  onClick={() => toggleExpanded(room.id)}
                                  type="button"
                                >
                                  {isExpanded(room.id) ? (
                                    <FaChevronDown />
                                  ) : (
                                    <FaChevronRight />
                                  )}
                                </button>

                                <div className="tree-node-title">
                                  <FaDoorOpen />
                                  <div>
                                    <strong>{room.room_name}</strong>
                                    <span>{room.room_code || "No code"}</span>
                                  </div>
                                </div>

                                {canManage && (
                                  <div className="tree-node-actions">
                                    <button
                                      onClick={() =>
                                        openCreateModal("component", {
                                          roomId: room.id,
                                        })
                                      }
                                    >
                                      <FaPlus /> Component
                                    </button>

                                    <button
                                      onClick={() =>
                                        openEditModal("room", room)
                                      }
                                    >
                                      <FaEdit />
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleDelete(
                                          "room",
                                          room.id,
                                          room.room_name
                                        )
                                      }
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {isExpanded(room.id) && (
                                <div className="tree-components">
                                  {room.components.map((component) => (
                                    <div
                                      key={component.id}
                                      className="tree-component-pill"
                                    >
                                      <FaCubes />

                                      <div>
                                        <strong>
                                          {component.component_name}
                                        </strong>
                                        <span>
                                          {component.component_type ||
                                            "Component"}
                                        </span>
                                      </div>

                                      {canManage && (
                                        <div className="tree-component-actions">
                                          <button
                                            onClick={() =>
                                              openEditModal(
                                                "component",
                                                component
                                              )
                                            }
                                          >
                                            <FaEdit />
                                          </button>

                                          <button
                                            onClick={() =>
                                              handleDelete(
                                                "component",
                                                component.id,
                                                component.component_name
                                              )
                                            }
                                          >
                                            <FaTrash />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalType && (
        <div className="hierarchy-inner-modal-overlay">
          <div className="hierarchy-inner-modal">
            <h3>{modalTitle}</h3>

            <input
              placeholder={
                modalType === "building"
                  ? "Building name"
                  : modalType === "floor"
                  ? "Floor name"
                  : modalType === "room"
                  ? "Room name"
                  : "Component name"
              }
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            {(modalType === "building" || modalType === "room") && (
              <input
                placeholder={
                  modalType === "building"
                    ? "Building code"
                    : "Room code"
                }
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value,
                  })
                }
              />
            )}

            {modalType === "floor" && (
              <input
                placeholder="Floor number e.g. 0, 1, 2, B1"
                value={form.number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    number: e.target.value,
                  })
                }
              />
            )}

            {modalType === "component" && (
              <input
                placeholder="Component type e.g. Panel, AHU, Pump"
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                  })
                }
              />
            )}

            <input
              placeholder="Description optional"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

            <input
              type="number"
              min={1}
              placeholder="Display order"
              value={form.display_order}
              onChange={(e) =>
                setForm({
                  ...form,
                  display_order: e.target.value,
                })
              }
            />

            <div className="hierarchy-inner-modal-actions">
              <Button
                size="medium"
                disabled={actionLoading || !form.name.trim()}
                onClick={handleSave}
              >
                {actionLoading
                  ? "Saving..."
                  : modalMode === "create"
                  ? "Create"
                  : "Update"}
              </Button>

              <Button
                size="medium"
                onClick={resetModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchyTreeBuilderTab;