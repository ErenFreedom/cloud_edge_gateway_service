import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

interface HierarchyOverviewTabProps {
  siteId: string;
  siteStatus: string;
}

const HierarchyOverviewTab = ({
  siteStatus,
}: HierarchyOverviewTabProps) => {
  const { hierarchy, sensorAssignments, loading, sensorLoading } =
    useSelector((state: RootState) => state.siteHierarchy);

  const buildingCount = hierarchy.length;

  const floorCount = hierarchy.reduce(
    (sum, building) => sum + building.floors.length,
    0
  );

  const roomCount = hierarchy.reduce(
    (sum, building) =>
      sum +
      building.floors.reduce(
        (floorSum, floor) => floorSum + floor.rooms.length,
        0
      ),
    0
  );

  const componentCount = hierarchy.reduce(
    (sum, building) =>
      sum +
      building.floors.reduce(
        (floorSum, floor) =>
          floorSum +
          floor.rooms.reduce(
            (roomSum, room) => roomSum + room.components.length,
            0
          ),
        0
      ),
    0
  );

  const assignedSensors = sensorAssignments.filter(
    (sensor) =>
      sensor.building_id ||
      sensor.floor_id ||
      sensor.room_id ||
      sensor.component_id
  ).length;

  const totalSensors = sensorAssignments.length;
  const unassignedSensors = totalSensors - assignedSensors;

  if (loading || sensorLoading) {
    return <div className="hierarchy-empty">Loading hierarchy overview...</div>;
  }

  return (
    <div className="hierarchy-overview">
      <div className="hierarchy-overview-header">
        <div>
          <h3>Hierarchy Overview</h3>
          <p>
            Visual summary of site structure and sensor placement.
          </p>
        </div>

        <span
          className={`hierarchy-status ${
            siteStatus === "active" ? "active" : "inactive"
          }`}
        >
          {siteStatus === "active" ? "Active" : "View Only"}
        </span>
      </div>

      <div className="hierarchy-stats-grid">
        <div className="hierarchy-stat-card">
          <span>Buildings</span>
          <strong>{buildingCount}</strong>
        </div>

        <div className="hierarchy-stat-card">
          <span>Floors</span>
          <strong>{floorCount}</strong>
        </div>

        <div className="hierarchy-stat-card">
          <span>Rooms</span>
          <strong>{roomCount}</strong>
        </div>

        <div className="hierarchy-stat-card">
          <span>Components</span>
          <strong>{componentCount}</strong>
        </div>

        <div className="hierarchy-stat-card success">
          <span>Assigned Sensors</span>
          <strong>{assignedSensors}</strong>
        </div>

        <div className="hierarchy-stat-card warning">
          <span>Unassigned Sensors</span>
          <strong>{unassignedSensors}</strong>
        </div>
      </div>

      {hierarchy.length === 0 ? (
        <div className="hierarchy-empty">
          <h3>No hierarchy created yet</h3>
          <p>
            Start from Tree Builder by adding a building, then floors, rooms and components.
          </p>
        </div>
      ) : (
        <div className="hierarchy-overview-tree">
          {hierarchy.map((building) => (
            <div key={building.id} className="overview-building">
              <h4>🏢 {building.building_name}</h4>

              {building.floors.map((floor) => (
                <div key={floor.id} className="overview-floor">
                  <p>↳ {floor.floor_name}</p>

                  {floor.rooms.map((room) => (
                    <div key={room.id} className="overview-room">
                      <p>↳ {room.room_name}</p>

                      {room.components.map((component) => (
                        <span key={component.id} className="overview-component">
                          {component.component_name}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HierarchyOverviewTab;