import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";


import {
  FaSearch,
  FaTags,
  FaMapMarkerAlt,
  FaPlus,
  FaTimes,
} from "react-icons/fa";


import type { RootState, AppDispatch } from "../../store/store";

import {
  bulkAssignSensorLocationThunk,
  clearSensorLocationThunk,
  fetchSensorAssignmentsThunk,
  fetchSiteHierarchyThunk,
  addSensorTagThunk,
  removeSensorTagThunk,
} from "../../features/siteHierarchy/siteHierarchySlice";


import Button from "../ui/Button";

interface SensorAssignmentTabProps {
  siteId: string;
  siteStatus: string;
}

type FilterMode = "all" | "assigned" | "unassigned";

const SensorAssignmentTab = ({
  siteId,
  siteStatus,
}: SensorAssignmentTabProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const { hierarchy, sensorAssignments, sensorLoading, actionLoading, error } =
    useSelector((state: RootState) => state.siteHierarchy);

  const canManage = siteStatus === "active";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);

  const [assignModal, setAssignModal] = useState(false);

  const [tagModal, setTagModal] = useState(false);
  const [tagSensorId, setTagSensorId] = useState<string | null>(null);

  const [tagForm, setTagForm] = useState({
    tag_key: "category",
    tag_value: "",
    tag_type: "manual" as "manual" | "analytics" | "compliance",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    building_id: "",
    floor_id: "",
    room_id: "",
    component_id: "",
    manual_tags: "",
  });

  const selectedBuilding = hierarchy.find(
    (b) => b.id === assignmentForm.building_id
  );

  const availableFloors = selectedBuilding?.floors || [];

  const selectedFloor = availableFloors.find(
    (f) => f.id === assignmentForm.floor_id
  );

  const availableRooms = selectedFloor?.rooms || [];

  const selectedRoom = availableRooms.find(
    (r) => r.id === assignmentForm.room_id
  );

  const availableComponents = selectedRoom?.components || [];

  const filteredSensors = useMemo(() => {
    return sensorAssignments.filter((sensor) => {
      const isAssigned =
        !!sensor.building_id ||
        !!sensor.floor_id ||
        !!sensor.room_id ||
        !!sensor.component_id;

      if (filter === "assigned" && !isAssigned) return false;
      if (filter === "unassigned" && isAssigned) return false;

      const q = search.trim().toLowerCase();

      if (!q) return true;

      return (
        sensor.sensor_name?.toLowerCase().includes(q) ||
        sensor.sensor_type?.toLowerCase().includes(q) ||
        sensor.unit?.toLowerCase().includes(q) ||
        sensor.building_name?.toLowerCase().includes(q) ||
        sensor.floor_name?.toLowerCase().includes(q) ||
        sensor.room_name?.toLowerCase().includes(q) ||
        sensor.component_name?.toLowerCase().includes(q)
      );
    });
  }, [sensorAssignments, search, filter]);

  const allFilteredSelected =
    filteredSensors.length > 0 &&
    filteredSensors.every((sensor) =>
      selectedSensorIds.includes(sensor.sensor_id)
    );

  const toggleSensor = (sensorId: string) => {
    setSelectedSensorIds((prev) =>
      prev.includes(sensorId)
        ? prev.filter((id) => id !== sensorId)
        : [...prev, sensorId]
    );
  };

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredIds = filteredSensors.map((s) => s.sensor_id);

      setSelectedSensorIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );

      return;
    }

    setSelectedSensorIds((prev) => {
      const ids = new Set(prev);

      filteredSensors.forEach((sensor) => {
        ids.add(sensor.sensor_id);
      });

      return Array.from(ids);
    });
  };

  const openAssignModal = () => {
    if (selectedSensorIds.length === 0) return;
    setAssignModal(true);
  };

  const closeAssignModal = () => {
    setAssignModal(false);
    setAssignmentForm({
      building_id: "",
      floor_id: "",
      room_id: "",
      component_id: "",
      manual_tags: "",
    });
  };

  const refresh = () => {
    dispatch(fetchSensorAssignmentsThunk(siteId));
    dispatch(fetchSiteHierarchyThunk(siteId));
  };

  const assignSensors = async () => {
    if (!assignmentForm.building_id || selectedSensorIds.length === 0) return;

    const manualTags = assignmentForm.manual_tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const result = await dispatch(
      bulkAssignSensorLocationThunk({
        siteId,
        data: {
          sensor_ids: selectedSensorIds,
          building_id: assignmentForm.building_id,
          floor_id: assignmentForm.floor_id || null,
          room_id: assignmentForm.room_id || null,
          component_id: assignmentForm.component_id || null,
          manual_tags: manualTags,
        },
      })
    );

    if (result.type.endsWith("/rejected")) {
      toast.error((result.payload as string) || "Failed to assign sensors");
      return;
    }

    toast.success("Sensors assigned successfully");
    setSelectedSensorIds([]);
    closeAssignModal();
    refresh();
  };

  const clearSelectedLocations = async () => {
    if (selectedSensorIds.length === 0) return;

    const ok = window.confirm(
      "Clear hierarchy location for selected sensors? Manual tags will remain, but system location tags will be removed."
    );

    if (!ok) return;

    const result = await dispatch(
      clearSensorLocationThunk({
        siteId,
        data: {
          sensor_ids: selectedSensorIds,
        },
      })
    );

    if (result.type.endsWith("/rejected")) {
      toast.error((result.payload as string) || "Failed to clear locations");
      return;
    }

    toast.success("Sensor locations cleared");
    setSelectedSensorIds([]);
    refresh();
  };

  if (sensorLoading) {
    return (
      <div className="hierarchy-empty">
        Loading sensor assignments...
      </div>
    );
  }


  const openTagModal = (sensorId: string) => {
    setTagSensorId(sensorId);
    setTagModal(true);
    setTagForm({
      tag_key: "category",
      tag_value: "",
      tag_type: "manual",
    });
  };

  const closeTagModal = () => {
    setTagModal(false);
    setTagSensorId(null);
    setTagForm({
      tag_key: "category",
      tag_value: "",
      tag_type: "manual",
    });
  };

  const addTag = async () => {
    if (!tagSensorId || !tagForm.tag_key.trim() || !tagForm.tag_value.trim()) {
      return;
    }

    const result = await dispatch(
      addSensorTagThunk({
        siteId,
        sensorId: tagSensorId,
        data: {
          tag_key: tagForm.tag_key.trim(),
          tag_value: tagForm.tag_value.trim(),
          tag_type: tagForm.tag_type,
        },
      })
    );

    if (result.type.endsWith("/rejected")) {
      toast.error((result.payload as string) || "Failed to add tag");
      return;
    }

    toast.success("Tag added");
    closeTagModal();
    refresh();
  };

  const removeTag = async (
    sensorId: string,
    tagId: string,
    tagType: string
  ) => {
    if (tagType === "system") {
      toast.error("System location tags cannot be removed manually");
      return;
    }

    const ok = window.confirm("Remove this tag?");
    if (!ok) return;

    const result = await dispatch(
      removeSensorTagThunk({
        siteId,
        sensorId,
        tagId,
      })
    );

    if (result.type.endsWith("/rejected")) {
      toast.error((result.payload as string) || "Failed to remove tag");
      return;
    }

    toast.success("Tag removed");
    refresh();
  };

  return (
    <div className="sensor-assignment">
      <div className="sensor-assignment-header">
        <div>
          <h3>Sensor Assignment</h3>
          <p>
            Assign one or multiple sensors to a building, floor, room or
            component.
          </p>
        </div>

        <div className="sensor-assignment-actions">
          <Button
            size="medium"
            disabled={!canManage || selectedSensorIds.length === 0}
            onClick={openAssignModal}
          >
            Assign Selected
          </Button>

          <Button
            size="medium"
            disabled={!canManage || selectedSensorIds.length === 0}
            onClick={clearSelectedLocations}
          >
            Clear Location
          </Button>
        </div>
      </div>

      {!canManage && (
        <div className="hierarchy-warning-banner">
          This site is not active. Sensor assignment is currently view-only.
        </div>
      )}

      {error && (
        <div className="hierarchy-error-banner">
          {error}
        </div>
      )}

      <div className="sensor-toolbar">
        <div className="sensor-search">
          <FaSearch />
          <input
            placeholder="Search sensors, rooms, components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sensor-filter-group">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={filter === "assigned" ? "active" : ""}
            onClick={() => setFilter("assigned")}
          >
            Assigned
          </button>

          <button
            className={filter === "unassigned" ? "active" : ""}
            onClick={() => setFilter("unassigned")}
          >
            Unassigned
          </button>
        </div>

        <div className="selected-count">
          Selected: {selectedSensorIds.length}
        </div>
      </div>

      <div className="sensor-table-wrapper">
        <table className="sensor-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                />
              </th>
              <th>Sensor</th>
              <th>Type</th>
              <th>Unit</th>
              <th>Location</th>
              <th>Component</th>
              <th>Tags</th>
            </tr>
          </thead>

          <tbody>
            {filteredSensors.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="sensor-empty-row">
                    No sensors found.
                  </div>
                </td>
              </tr>
            ) : (
              filteredSensors.map((sensor) => {
                const isSelected = selectedSensorIds.includes(
                  sensor.sensor_id
                );

                const locationText = [
                  sensor.building_name,
                  sensor.floor_name,
                  sensor.room_name,
                ]
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <tr
                    key={sensor.sensor_id}
                    className={isSelected ? "selected" : ""}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSensor(sensor.sensor_id)}
                      />
                    </td>

                    <td>
                      <strong>{sensor.sensor_name}</strong>
                    </td>

                    <td>{sensor.sensor_type || "-"}</td>

                    <td>{sensor.unit || "-"}</td>

                    <td>
                      {locationText ? (
                        <span className="sensor-location-chip">
                          <FaMapMarkerAlt />
                          {locationText}
                        </span>
                      ) : (
                        <span className="sensor-unassigned">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td>
                      {sensor.component_name || "-"}
                    </td>

                    <td>
                      <div className="sensor-tags-cell">
                        <div className="sensor-tags">
                          {sensor.tags?.length ? (
                            sensor.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className={`sensor-tag ${tag.tag_type}`}
                                title={`${tag.tag_key}: ${tag.tag_value}`}
                              >
                                <FaTags />
                                {tag.tag_value}

                                {canManage && tag.tag_type !== "system" && (
                                  <button
                                    type="button"
                                    className="sensor-tag-remove"
                                    onClick={() =>
                                      removeTag(
                                        sensor.sensor_id,
                                        tag.id,
                                        tag.tag_type
                                      )
                                    }
                                  >
                                    <FaTimes />
                                  </button>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="sensor-no-tags">No tags</span>
                          )}
                        </div>

                        {canManage && (
                          <button
                            type="button"
                            className="sensor-add-tag-btn"
                            onClick={() => openTagModal(sensor.sensor_id)}
                          >
                            <FaPlus />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {assignModal && (
        <div className="hierarchy-inner-modal-overlay">
          <div className="hierarchy-inner-modal sensor-assign-modal">
            <h3>Assign Sensors</h3>

            <p className="sensor-assign-helper">
              Assigning {selectedSensorIds.length} selected sensor(s)
            </p>

            <select
              value={assignmentForm.building_id}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  building_id: e.target.value,
                  floor_id: "",
                  room_id: "",
                  component_id: "",
                })
              }
            >
              <option value="">Select Building</option>
              {hierarchy.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.building_name}
                </option>
              ))}
            </select>

            <select
              value={assignmentForm.floor_id}
              disabled={!assignmentForm.building_id}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  floor_id: e.target.value,
                  room_id: "",
                  component_id: "",
                })
              }
            >
              <option value="">Select Floor optional</option>
              {availableFloors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.floor_name}
                </option>
              ))}
            </select>

            <select
              value={assignmentForm.room_id}
              disabled={!assignmentForm.floor_id}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  room_id: e.target.value,
                  component_id: "",
                })
              }
            >
              <option value="">Select Room optional</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_name}
                </option>
              ))}
            </select>

            <select
              value={assignmentForm.component_id}
              disabled={!assignmentForm.room_id}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  component_id: e.target.value,
                })
              }
            >
              <option value="">Select Component optional</option>
              {availableComponents.map((component) => (
                <option key={component.id} value={component.id}>
                  {component.component_name}
                </option>
              ))}
            </select>

            <input
              placeholder="Manual tags comma separated e.g. griha, critical-load"
              value={assignmentForm.manual_tags}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  manual_tags: e.target.value,
                })
              }
            />

            <div className="hierarchy-inner-modal-actions">
              <Button
                size="medium"
                disabled={actionLoading || !assignmentForm.building_id}
                onClick={assignSensors}
              >
                {actionLoading ? "Assigning..." : "Assign"}
              </Button>

              <Button size="medium" onClick={closeAssignModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {tagModal && (
        <div className="hierarchy-inner-modal-overlay">
          <div className="hierarchy-inner-modal sensor-tag-modal">
            <h3>Add Sensor Tag</h3>

            <p className="sensor-assign-helper">
              Add a manual, analytics or compliance tag to this sensor.
            </p>

            <input
              placeholder="Tag key e.g. category, report, priority"
              value={tagForm.tag_key}
              onChange={(e) =>
                setTagForm({
                  ...tagForm,
                  tag_key: e.target.value,
                })
              }
            />

            <input
              placeholder="Tag value e.g. griha-report, critical-load"
              value={tagForm.tag_value}
              onChange={(e) =>
                setTagForm({
                  ...tagForm,
                  tag_value: e.target.value,
                })
              }
            />

            <select
              value={tagForm.tag_type}
              onChange={(e) =>
                setTagForm({
                  ...tagForm,
                  tag_type: e.target.value as
                    | "manual"
                    | "analytics"
                    | "compliance",
                })
              }
            >
              <option value="manual">Manual</option>
              <option value="analytics">Analytics</option>
              <option value="compliance">Compliance</option>
            </select>

            <div className="hierarchy-inner-modal-actions">
              <Button
                size="medium"
                disabled={
                  actionLoading ||
                  !tagForm.tag_key.trim() ||
                  !tagForm.tag_value.trim()
                }
                onClick={addTag}
              >
                {actionLoading ? "Saving..." : "Add Tag"}
              </Button>

              <Button size="medium" onClick={closeTagModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorAssignmentTab;