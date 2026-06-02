import { PoolClient } from "pg";
import {
  DEV_ORGS,
  DEV_PASSWORD,
  DEV_PLATFORM_ADMIN,
} from "./devSeed.config";
import {
  deterministicUuid,
  hashPassword,
  hashSecret,
  upsert,
} from "./devSeed.helpers";

const SENSOR_NAMES = [
  ["Main Incomer Energy", "kWh", "energy_meter"],
  ["DG-1 Energy", "kWh", "energy_meter"],
  ["DG-2 Energy", "kWh", "energy_meter"],
  ["DG-3 Energy", "kWh", "energy_meter"],
  ["Chiller Energy", "kWh", "energy_meter"],
  ["AHU Power", "kWh", "energy_meter"],
  ["Municipal Water", "kL", "water_meter"],
  ["STP Treated Water", "kL", "water_meter"],
  ["Solar Generation", "kWh", "renewable_meter"],
  ["UPS Energy", "kWh", "energy_meter"],
];

export const seedDevData = async (client: PoolClient) => {
  const passwordHash = await hashPassword(DEV_PASSWORD);

  console.log("🌱 Starting dev seed...");

  await upsert(
    client,
    "users",
    {
      id: DEV_PLATFORM_ADMIN.id,
      organization_id: null,
      full_name: DEV_PLATFORM_ADMIN.full_name,
      email: DEV_PLATFORM_ADMIN.email,
      phone: "9999999999",
      password_hash: passwordHash,
      aadhaar_pan_encrypted: null,
      birthdate: "1999-01-01",
      gender: "male",
      role: "platform_admin",
      status: "active",
      email_verified: true,
      platform_role: "owner",
    },
    ["email"]
  );

  for (const org of DEV_ORGS) {
    const clientId = deterministicUuid(`${org.id}:client`);
    const clientSecretHash = await hashSecret(`${org.org_name}:secret`);

    await upsert(
      client,
      "organizations",
      {
        id: org.id,
        org_name: org.org_name,
        org_phone: org.org_phone,
        org_address: org.org_address,
        pincode: org.pincode,
        gst_number: org.gst_number,
        registration_number: org.registration_number,
        status: "active",
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        activated_at: new Date(),
        deletion_requested_at: null,
        deletion_scheduled_at: null,
        suspension_reason: null,
        deletion_reason: null,
      },
      ["id"]
    );

    await upsert(
      client,
      "users",
      {
        id: org.superAdmin.id,
        organization_id: org.id,
        full_name: org.superAdmin.full_name,
        email: org.superAdmin.email,
        phone: org.superAdmin.phone,
        password_hash: passwordHash,
        aadhaar_pan_encrypted: null,
        birthdate: "1998-05-30",
        gender: "male",
        role: "super_admin",
        status: "active",
        email_verified: true,
        platform_role: null,
      },
      ["email"]
    );

    await upsert(
      client,
      "users",
      {
        id: org.siteAdmin.id,
        organization_id: org.id,
        full_name: org.siteAdmin.full_name,
        email: org.siteAdmin.email,
        phone: org.siteAdmin.phone,
        password_hash: passwordHash,
        aadhaar_pan_encrypted: null,
        birthdate: "1998-01-01",
        gender: "male",
        role: "site_admin",
        status: "active",
        email_verified: true,
        platform_role: null,
      },
      ["email"]
    );

    for (let siteIndex = 0; siteIndex < org.sites.length; siteIndex++) {
      const site = org.sites[siteIndex];

      const siteUuid = deterministicUuid(`${site.id}:site_uuid`);
      const siteSecretHash = await hashSecret(`${site.site_name}:secret`);

      await upsert(
        client,
        "sites",
        {
          id: site.id,
          organization_id: org.id,
          site_name: site.site_name,
          phone: site.phone,
          address_line1: site.address_line1,
          address_line2: site.address_line2,
          state: site.state,
          country: site.country,
          gst_number: site.gst_number,
          site_uuid: siteUuid,
          site_secret_hash: siteSecretHash,
          status: "active",
          machine_fingerprint: `DEV-MACHINE-${siteIndex + 1}-${org.id}`,
          activated_at: new Date(),
          site_admin_email_activation_pending: false,
          deletion_scheduled_at: null,
          latitude: site.latitude,
          longitude: site.longitude,
          device_secret: `dev-device-secret-${siteIndex + 1}`,
          project_code: site.id,
        },
        ["id"]
      );

      await upsert(
        client,
        "site_user_roles",
        {
          id: deterministicUuid(`${site.id}:site_admin_role`),
          site_id: site.id,
          user_id: org.siteAdmin.id,
          role: "site_admin",
        },
        ["site_id", "user_id"]
      );

      const buildingId = deterministicUuid(`${site.id}:building:main`);
      await upsert(
        client,
        "buildings",
        {
          id: buildingId,
          organization_id: org.id,
          site_id: site.id,
          building_name: "Main Building",
          building_code: `BLDG-${siteIndex + 1}`,
          description: "Seeded demo building",
        },
        ["site_id", "building_name"]
      );

      const floors = [
        {
          id: deterministicUuid(`${site.id}:floor:ground`),
          name: "Ground Floor",
          number: 0,
        },
        {
          id: deterministicUuid(`${site.id}:floor:first`),
          name: "First Floor",
          number: 1,
        },
      ];

      for (const floor of floors) {
        await upsert(
          client,
          "floors",
          {
            id: floor.id,
            organization_id: org.id,
            site_id: site.id,
            building_id: buildingId,
            floor_name: floor.name,
            floor_number: floor.number,
            description: "Seeded demo floor",
          },
          ["building_id", "floor_name"]
        );

        const rooms = [
          {
            id: deterministicUuid(`${floor.id}:room:electrical`),
            name: "Electrical Room",
            code: `ER-${floor.number}`,
          },
          {
            id: deterministicUuid(`${floor.id}:room:utility`),
            name: "Utility Room",
            code: `UR-${floor.number}`,
          },
        ];

        for (const room of rooms) {
          await upsert(
            client,
            "rooms",
            {
              id: room.id,
              organization_id: org.id,
              site_id: site.id,
              building_id: buildingId,
              floor_id: floor.id,
              room_name: room.name,
              room_code: room.code,
              description: "Seeded demo room",
            },
            ["floor_id", "room_name"]
          );

          const componentId = deterministicUuid(`${room.id}:component:panel`);

          await upsert(
            client,
            "components",
            {
              id: componentId,
              organization_id: org.id,
              site_id: site.id,
              building_id: buildingId,
              floor_id: floor.id,
              room_id: room.id,
              component_name:
                room.name === "Electrical Room"
                  ? "Main Electrical Panel"
                  : "Utility Meter Panel",
              component_type:
                room.name === "Electrical Room"
                  ? "electrical_panel"
                  : "utility_panel",
              description: "Seeded demo component",
            },
            ["room_id", "component_name"]
          );
        }
      }

      const roomRows = await client.query(
        `
        SELECT r.id AS room_id, r.floor_id, r.building_id, c.id AS component_id
        FROM rooms r
        JOIN components c ON c.room_id = r.id
        WHERE r.site_id = $1
        ORDER BY r.room_name ASC
        `,
        [site.id]
      );

      for (let i = 0; i < SENSOR_NAMES.length; i++) {
        const [name, unit, sensorType] = SENSOR_NAMES[i];

        const target = roomRows.rows[i % roomRows.rows.length];

        const sensorId = deterministicUuid(`${site.id}:sensor-row:${i + 1}`);
        const sensorUuid = deterministicUuid(`${site.id}:sensor-uuid:${i + 1}`);
        const externalSensorId = String(i + 1);

        await upsert(
          client,
          "sensors",
          {
            id: sensorId,
            organization_id: org.id,
            site_id: site.id,
            sensor_uuid: sensorUuid,
            external_sensor_id: externalSensorId,
            sensor_name: name,
            sensor_location:
              sensorType === "water_meter" ? "Utility Room" : "Electrical Room",
            api_endpoint: `https://demo.local/api/sensors/${site.id}/${externalSensorId}`,
            polling_interval: 60,
            active: true,
            sensor_type: sensorType,
            billing_day: 1,
            contract_load: sensorType === "energy_meter" ? 500 : null,
            notes: "Seeded fake dev sensor",
            upper_bound: null,
            meter_max_value: sensorType === "energy_meter" ? 99999999 : null,
            max_load_kw: sensorType === "energy_meter" ? 500 : null,
            building_id: target.building_id,
            floor_id: target.floor_id,
            room_id: target.room_id,
            component_id: target.component_id,
            unit,
            griha_type:
              name === "Main Incomer Energy"
                ? "utility_grid"
                : name === "Municipal Water"
                ? "municipal_water"
                : name === "STP Treated Water"
                ? "stp_treated_water"
                : null,
          },
          ["external_sensor_id", "site_id"]
        );
      }
    }
  }

  console.log("✅ Dev seed completed successfully");
};