import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaBroadcastTower,
  FaDownload,
  FaPlus,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import type { RootState, AppDispatch } from "../../store/store";

import {
  addDashboardSensorThunk,
  clearSiteMonitorDashboardError,
  downloadDashboardExportCsvThunk,
  fetchAvailableDashboardSensorsThunk,
  fetchDashboardCurrentLoadThunk,
  fetchDashboardLiveLoadThunk,
  fetchSelectedDashboardSensorsThunk,
  fetchSiteMonitorDashboardSiteDetailsThunk,
  removeDashboardSensorThunk,
} from "../../features/siteMonitorDashboard/siteMonitorDashboardSlice";

import type {
  ExportInterval,
  LoadRange,
  SiteMonitorDashboardSensor,
} from "../../services/siteMonitorDashboard.service";

import "./SiteMonitorDashboardPanel.css";

/* ========================= */
/* TYPES */
/* ========================= */

type DashboardPanelMode = "admin" | "monitor";
type DashboardTab = "load" | "export" | "live" | "sensors";

interface SiteMonitorDashboardPanelProps {
  siteId: string;
  siteName?: string;
  mode: DashboardPanelMode;
  embedded?: boolean;
  onClose?: () => void;
}

/* ========================= */
/* CONSTANTS */
/* ========================= */

const LOAD_RANGES: { value: LoadRange; label: string; helper: string }[] = [
  {
    value: "10m",
    label: "Last 10 Minutes",
    helper: "Latest reading minus reading around 10 minutes ago",
  },
  {
    value: "1h",
    label: "Last 1 Hour",
    helper: "Latest reading minus reading around 1 hour ago",
  },
  {
    value: "6h",
    label: "Last 6 Hours",
    helper: "Latest reading minus reading around 6 hours ago",
  },
  {
    value: "today",
    label: "Today",
    helper: "Latest reading today minus first reading of today",
  },
  {
    value: "currentWeek",
    label: "Current Week",
    helper: "Latest reading this week minus first reading of this week",
  },
  {
    value: "lastWeek",
    label: "Last Week",
    helper: "Last reading of previous week minus first reading of previous week",
  },
  {
    value: "1month",
    label: "Current Month",
    helper: "Latest reading this month minus first reading of this month",
  },
  {
    value: "lastMonth",
    label: "Last Month",
    helper: "Last reading of previous month minus first reading of previous month",
  },
];

const EXPORT_INTERVALS: { value: ExportInterval; label: string }[] = [
  { value: "10m", label: "10 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "6h", label: "6 Hours" },
  { value: "24h", label: "24 Hours" },
  { value: "1w", label: "1 Week" },
  { value: "1month", label: "1 Month" },
  { value: "lastMonth", label: "Last Month" },
];

/* ========================= */
/* HELPERS */
/* ========================= */

const getDateInput = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const getTodayDateInput = (): string => {
  return getDateInput(new Date());
};

const getDefaultFromDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return getDateInput(date);
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return "-";

  return numberValue.toLocaleString("en-IN", {
    maximumFractionDigits: Math.abs(numberValue) >= 1000 ? 3 : 6,
  });
};

const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusClass = (status?: string | null): string => {
  if (status === "HEALTHY") return "good";
  if (status === "NO_CHANGE") return "info";
  if (status === "NO_DATA") return "warning";
  return "bad";
};

const getRangeHelper = (range: LoadRange): string => {
  return LOAD_RANGES.find((item) => item.value === range)?.helper || "";
};

/* ========================= */
/* COMPONENT */
/* ========================= */

const SiteMonitorDashboardPanel = ({
  siteId,
  siteName,
  mode,
  embedded = false,
  onClose,
}: SiteMonitorDashboardPanelProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    selectedSite,
    availableSensors,
    selectedSensors,
    currentLoad,
    liveLoad,

    error,

    siteDetailsLoading,
    availableSensorsLoading,
    selectedSensorsLoading,
    addSensorLoading,
    removeSensorLoading,
    currentLoadLoading,
    liveLoadLoading,
    csvDownloading,
  } = useSelector((state: RootState) => state.siteMonitorDashboard);

  const [activeTab, setActiveTab] = useState<DashboardTab>("load");
  const [range, setRange] = useState<LoadRange>("today");

  const [sensorSearch, setSensorSearch] = useState("");

  const [exportFrom, setExportFrom] = useState(getDefaultFromDate());
  const [exportTo, setExportTo] = useState(getTodayDateInput());
  const [exportInterval, setExportInterval] = useState<ExportInterval>("1h");

  const canManageSensors = mode === "admin";

  const dashboardTitle =
    siteName || selectedSite?.site_name || "Site Monitor Dashboard";

  const selectedSensorRows = useMemo(() => {
    return selectedSensors?.sensors || [];
  }, [selectedSensors]);

  const availableSensorRows = useMemo(() => {
    return availableSensors?.sensors || [];
  }, [availableSensors]);

  const loadRows = currentLoad?.sensors || [];
  const liveRows = liveLoad?.sensors || [];

  const selectedSensorCount = selectedSensors?.total_sensors || 0;

  /* ========================= */
  /* INITIAL LOAD */
  /* ========================= */

  useEffect(() => {
    if (!siteId) return;

    dispatch(fetchSiteMonitorDashboardSiteDetailsThunk(siteId));
    dispatch(fetchSelectedDashboardSensorsThunk(siteId));
    dispatch(fetchDashboardCurrentLoadThunk({ siteId, range }));
  }, [dispatch, siteId]);

  /* ========================= */
  /* LOAD TAB */
  /* ========================= */

  useEffect(() => {
    if (!siteId) return;
    if (activeTab !== "load") return;

    dispatch(fetchDashboardCurrentLoadThunk({ siteId, range }));
  }, [dispatch, siteId, activeTab, range]);

  /* ========================= */
  /* SENSOR TAB */
  /* ========================= */

  useEffect(() => {
    if (!siteId) return;
    if (activeTab !== "sensors") return;

    dispatch(fetchSelectedDashboardSensorsThunk(siteId));

    if (canManageSensors) {
      dispatch(
        fetchAvailableDashboardSensorsThunk({
          siteId,
          search: sensorSearch,
          limit: 200,
          offset: 0,
        })
      );
    }
  }, [dispatch, siteId, activeTab, canManageSensors]);

  useEffect(() => {
    if (!siteId) return;
    if (activeTab !== "sensors") return;
    if (!canManageSensors) return;

    const timer = window.setTimeout(() => {
      dispatch(
        fetchAvailableDashboardSensorsThunk({
          siteId,
          search: sensorSearch,
          limit: 200,
          offset: 0,
        })
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [dispatch, siteId, activeTab, canManageSensors, sensorSearch]);

  /* ========================= */
  /* LIVE TAB */
  /* ========================= */

  useEffect(() => {
    if (!siteId) return;
    if (activeTab !== "live") return;

    dispatch(fetchDashboardLiveLoadThunk(siteId));

    const timer = window.setInterval(() => {
      dispatch(fetchDashboardLiveLoadThunk(siteId));
    }, 30000);

    return () => window.clearInterval(timer);
  }, [dispatch, siteId, activeTab]);

  /* ========================= */
  /* ACTIONS */
  /* ========================= */

  const refreshCurrentTab = () => {
    if (!siteId) return;

    if (activeTab === "load") {
      dispatch(fetchDashboardCurrentLoadThunk({ siteId, range }));
      return;
    }

    if (activeTab === "live") {
      dispatch(fetchDashboardLiveLoadThunk(siteId));
      return;
    }

    if (activeTab === "sensors") {
      dispatch(fetchSelectedDashboardSensorsThunk(siteId));

      if (canManageSensors) {
        dispatch(
          fetchAvailableDashboardSensorsThunk({
            siteId,
            search: sensorSearch,
            limit: 200,
            offset: 0,
          })
        );
      }
    }
  };

  const refreshAfterSensorMutation = () => {
    dispatch(fetchSelectedDashboardSensorsThunk(siteId));

    if (canManageSensors) {
      dispatch(
        fetchAvailableDashboardSensorsThunk({
          siteId,
          search: sensorSearch,
          limit: 200,
          offset: 0,
        })
      );
    }

    dispatch(fetchDashboardCurrentLoadThunk({ siteId, range }));
  };

  const handleAddSensor = async (sensor: SiteMonitorDashboardSensor) => {
    if (!canManageSensors) return;

    const result = await dispatch(
      addDashboardSensorThunk({
        siteId,
        sensor_id: sensor.id,
      })
    );

    if (addDashboardSensorThunk.fulfilled.match(result)) {
      refreshAfterSensorMutation();
    }
  };

  const handleRemoveSensor = async (sensorId: string) => {
    if (!canManageSensors) return;

    const result = await dispatch(
      removeDashboardSensorThunk({
        siteId,
        sensorId,
      })
    );

    if (removeDashboardSensorThunk.fulfilled.match(result)) {
      refreshAfterSensorMutation();
    }
  };

  const handleCsvDownload = () => {
    if (!exportFrom || !exportTo || !exportInterval) {
      alert("Select from, to and interval");
      return;
    }

    dispatch(
      downloadDashboardExportCsvThunk({
        siteId,
        from: exportFrom,
        to: exportTo,
        interval: exportInterval,
      })
    );
  };

  /* ========================= */
  /* RENDER HELPERS */
  /* ========================= */

  const renderLoadTab = () => {
    return (
      <div className="smd-tab-panel">
        <div className="smd-toolbar">
          <div>
            <h3>Load Overview</h3>
            <p>{getRangeHelper(range)}</p>
          </div>

          <div className="smd-field">
            <label>Load Range</label>

            <select
              value={range}
              onChange={(event) => setRange(event.target.value as LoadRange)}
            >
              {LOAD_RANGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentLoadLoading && (
          <p className="smd-muted">Loading load overview...</p>
        )}

        <div className="smd-table-wrapper">
          <table className="smd-table">
            <thead>
              <tr>
                <th>Sensor Name</th>
                <th>API</th>
                <th>Current Reading</th>
                <th>Previous / Opening Reading</th>
                <th>Load</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {!currentLoadLoading && loadRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="smd-empty-cell">
                    {selectedSensorCount === 0 ? (
                      <>
                        No sensors configured yet.{" "}
                        {canManageSensors
                          ? "Open the Sensors tab and add sensors."
                          : "Please contact your administrator."}
                      </>
                    ) : (
                      <>
                        No telemetry found for this range. Try another range or check if the
                        edge gateway is currently publishing data.
                      </>
                    )}
                  </td>
                </tr>
              )}

              {loadRows.map((sensor) => (
                <tr key={sensor.logical_sensor_key}>
                  <td>
                    <strong>{sensor.sensor_name || "-"}</strong>
                    <small>{sensor.current_timestamp ? formatTimestamp(sensor.current_timestamp) : ""}</small>
                  </td>

                  <td className="smd-api-cell">{sensor.api_endpoint || "-"}</td>

                  <td>{formatNumber(sensor.current_reading)}</td>

                  <td>
                    <div>{formatNumber(sensor.previous_reading)}</div>
                    <small>{formatTimestamp(sensor.previous_timestamp)}</small>
                  </td>

                  <td>
                    <strong>{formatNumber(sensor.load)}</strong>
                  </td>

                  <td>
                    <span
                      className={`smd-status ${getStatusClass(
                        sensor.load_status
                      )}`}
                    >
                      {sensor.load_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExportTab = () => {
    return (
      <div className="smd-tab-panel">
        <div className="smd-export-card">
          <div>
            <h3>Download CSV Report</h3>
            <p>
              Export only the sensors configured for this dashboard. Site
              monitors can download reports but cannot modify the sensor list.
            </p>
          </div>

          <div className="smd-export-grid">
            <div className="smd-field">
              <label>From</label>
              <input
                type="date"
                value={exportFrom}
                onChange={(event) => setExportFrom(event.target.value)}
              />
            </div>

            <div className="smd-field">
              <label>To</label>
              <input
                type="date"
                value={exportTo}
                onChange={(event) => setExportTo(event.target.value)}
              />
            </div>

            <div className="smd-field">
              <label>Interval</label>

              <select
                value={exportInterval}
                onChange={(event) =>
                  setExportInterval(event.target.value as ExportInterval)
                }
              >
                {EXPORT_INTERVALS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="smd-primary-btn"
              type="button"
              disabled={csvDownloading || selectedSensorCount === 0}
              onClick={handleCsvDownload}
            >
              <FaDownload />
              {csvDownloading ? "Downloading..." : "Download CSV"}
            </button>
          </div>
        </div>

        {selectedSensorCount === 0 && (
          <div className="smd-info-box">
            No sensors are configured yet, so CSV export is disabled.
          </div>
        )}
      </div>
    );
  };

  const renderLiveTab = () => {
    return (
      <div className="smd-tab-panel">
        <div className="smd-live-header">
          <div>
            <h3>Live Monitoring</h3>
            <p>Auto-refreshes every 30 seconds while this tab is open.</p>
          </div>

          <button
            className="smd-refresh-btn"
            type="button"
            disabled={liveLoadLoading}
            onClick={() => dispatch(fetchDashboardLiveLoadThunk(siteId))}
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>

        {liveLoadLoading && <p className="smd-muted">Loading live data...</p>}

        <div className="smd-table-wrapper">
          <table className="smd-table">
            <thead>
              <tr>
                <th>Live</th>
                <th>Sensor Name</th>
                <th>API</th>
                <th>Live Value</th>
                <th>Last Value</th>
                <th>Change</th>
                <th>Quality</th>
                <th>Updated</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {!liveLoadLoading && liveRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="smd-empty-cell">
                    No configured sensors available for live monitoring.
                  </td>
                </tr>
              )}

              {liveRows.map((sensor) => (
                <tr key={sensor.logical_sensor_key}>
                  <td>
                    <span
                      className={`smd-live-indicator ${sensor.live_status === "HEALTHY" ? "" : "issue"
                        }`}
                    >
                      <span className="smd-live-dot" />
                    </span>
                  </td>

                  <td>
                    <strong>{sensor.sensor_name || "-"}</strong>
                  </td>

                  <td className="smd-api-cell">{sensor.api_endpoint || "-"}</td>

                  <td>{formatNumber(sensor.live_value)}</td>
                  <td>{formatNumber(sensor.last_value)}</td>
                  <td>{formatNumber(sensor.change_value)}</td>
                  <td>{sensor.quality_good === false ? "Bad" : "Good"}</td>
                  <td>{formatTimestamp(sensor.last_updated_on)}</td>

                  <td>
                    <span
                      className={`smd-status ${getStatusClass(
                        sensor.live_status
                      )}`}
                    >
                      {sensor.live_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSensorsTab = () => {
    return (
      <div className="smd-tab-panel">
        <div className="smd-sensors-header">
          <div>
            <h3>{canManageSensors ? "Manage Dashboard Sensors" : "Sensors"}</h3>

            <p>
              {canManageSensors
                ? "Add or remove sensors that should appear on the site monitor dashboard."
                : "These sensors are configured by your administrator."}
            </p>
          </div>

          {canManageSensors && (
            <div className="smd-field smd-search-field">
              <label>Search Sensors</label>

              <input
                value={sensorSearch}
                placeholder="Search by name, location, API..."
                onChange={(event) => setSensorSearch(event.target.value)}
              />
            </div>
          )}
        </div>

        {selectedSensorsLoading && (
          <p className="smd-muted">Loading selected sensors...</p>
        )}

        {canManageSensors ? (
          <div className="smd-table-wrapper">
            <table className="smd-table">
              <thead>
                <tr>
                  <th>Sensor Name</th>
                  <th>Location</th>
                  <th>External ID</th>
                  <th>API</th>
                  <th>Status</th>
                  <th>Dashboard</th>
                </tr>
              </thead>

              <tbody>
                {availableSensorsLoading && (
                  <tr>
                    <td colSpan={6} className="smd-empty-cell">
                      Loading sensors...
                    </td>
                  </tr>
                )}

                {!availableSensorsLoading && availableSensorRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="smd-empty-cell">
                      No sensors found.
                    </td>
                  </tr>
                )}

                {availableSensorRows.map((sensor) => (
                  <tr key={sensor.id}>
                    <td>
                      <strong>{sensor.sensor_name || "-"}</strong>
                    </td>

                    <td>{sensor.location || "-"}</td>
                    <td>{sensor.external_sensor_id || "-"}</td>

                    <td className="smd-api-cell">{sensor.api_endpoint || "-"}</td>

                    <td>{sensor.operational_status || "-"}</td>

                    <td>
                      {sensor.added_to_dashboard ? (
                        <button
                          className="smd-danger-btn"
                          type="button"
                          disabled={removeSensorLoading}
                          onClick={() => handleRemoveSensor(sensor.id)}
                        >
                          <FaTrash />
                          Remove
                        </button>
                      ) : (
                        <button
                          className="smd-add-btn"
                          type="button"
                          disabled={addSensorLoading}
                          onClick={() => handleAddSensor(sensor)}
                        >
                          <FaPlus />
                          Add
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="smd-table-wrapper">
            <table className="smd-table">
              <thead>
                <tr>
                  <th>Sensor Name</th>
                  <th>Location</th>
                  <th>External ID</th>
                  <th>API</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {selectedSensorRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="smd-empty-cell">
                      No sensors configured yet.
                    </td>
                  </tr>
                )}

                {selectedSensorRows.map((sensor) => (
                  <tr key={sensor.id}>
                    <td>
                      <strong>{sensor.sensor_name || "-"}</strong>
                    </td>

                    <td>{sensor.location || "-"}</td>
                    <td>{sensor.external_sensor_id || "-"}</td>

                    <td className="smd-api-cell">{sensor.api_endpoint || "-"}</td>

                    <td>{sensor.operational_status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const panelContent = (
    <div
      className={`smd-panel ${embedded ? "smd-panel-embedded" : "smd-panel-modal"
        }`}
    >
      <div className="smd-header">
        <div>
          <p className="smd-kicker">
            {mode === "admin" ? "Dashboard Configuration" : "Site Monitoring"}
          </p>

          <h2>{dashboardTitle}</h2>

          <p className="smd-subtitle">
            {selectedSensorCount} configured sensor
            {selectedSensorCount === 1 ? "" : "s"} monitored on this dashboard.
          </p>
        </div>

        <div className="smd-header-actions">
          <button
            className="smd-icon-btn"
            type="button"
            title="Refresh"
            onClick={refreshCurrentTab}
          >
            <FaSyncAlt />
          </button>

          {onClose && (
            <button className="smd-close-btn" type="button" onClick={onClose}>
              <FaTimes />
              Close
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="smd-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => dispatch(clearSiteMonitorDashboardError())}
          >
            ×
          </button>
        </div>
      )}

      <div className="smd-site-card">
        <div>
          <span>Phone</span>
          <strong>{selectedSite?.phone || "-"}</strong>
        </div>

        <div>
          <span>GST</span>
          <strong>{selectedSite?.gst_number || "-"}</strong>
        </div>

        <div>
          <span>Address</span>
          <strong>
            {selectedSite?.address ||
              `${selectedSite?.address_line1 || ""} ${selectedSite?.address_line2 || ""
                }`.trim() ||
              "-"}
          </strong>
        </div>

        <div>
          <span>Status</span>
          <strong className="smd-active-status">
            {selectedSite?.status || "active"}
          </strong>
        </div>
      </div>

      {siteDetailsLoading && <p className="smd-muted">Loading site details...</p>}

      <div className="smd-tabs">
        <button
          className={activeTab === "load" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("load")}
        >
          Load Overview
        </button>

        <button
          className={activeTab === "export" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("export")}
        >
          Data Export
        </button>

        <button
          className={activeTab === "live" ? "active live" : ""}
          type="button"
          onClick={() => setActiveTab("live")}
        >
          <span className="smd-live-label">
            <FaBroadcastTower />
            <span className="smd-live-dot" />
            Live Monitoring
          </span>
        </button>

        <button
          className={activeTab === "sensors" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("sensors")}
        >
          Sensors
        </button>
      </div>

      {activeTab === "load" && renderLoadTab()}
      {activeTab === "export" && renderExportTab()}
      {activeTab === "live" && renderLiveTab()}
      {activeTab === "sensors" && renderSensorsTab()}
    </div>
  );

  if (embedded) {
    return panelContent;
  }

  return <div className="smd-modal-backdrop">{panelContent}</div>;
};

export default SiteMonitorDashboardPanel;