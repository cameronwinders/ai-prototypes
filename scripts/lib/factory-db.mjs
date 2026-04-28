import fs from "node:fs";
import path from "node:path";

import pg from "pg";

import { sha256, sortMigrationNames } from "./factory-helpers.mjs";

const { Client } = pg;

async function ensureFactoryTables(client) {
  await client.query(`
    create table if not exists public.prototype_factory_migrations (
      app_slug text not null,
      filename text not null,
      checksum text not null,
      applied_at timestamptz not null default now(),
      primary key (app_slug, filename)
    );
  `);

  await client.query(`
    create table if not exists public.prototype_factory_apps (
      app_slug text primary key,
      display_name text not null,
      schema_name text not null,
      repo_path text not null,
      vercel_project_name text,
      site_url text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

async function upsertPrototypeAppRow(
  client,
  { appSlug, displayName, schemaName, repoPath, vercelProjectName, siteUrl }
) {
  await client.query(
    `
      insert into public.prototype_factory_apps (
        app_slug,
        display_name,
        schema_name,
        repo_path,
        vercel_project_name,
        site_url
      )
      values ($1, $2, $3, $4, $5, $6)
      on conflict (app_slug) do update
      set
        display_name = excluded.display_name,
        schema_name = excluded.schema_name,
        repo_path = excluded.repo_path,
        vercel_project_name = excluded.vercel_project_name,
        site_url = excluded.site_url,
        updated_at = now()
    `,
    [appSlug, displayName, schemaName, repoPath, vercelProjectName, siteUrl]
  );
}

async function syncPostgrestSchemas(client) {
  const result = await client.query(
    `
      select schema_name
        from public.prototype_factory_apps
       where schema_name is not null
         and schema_name <> ''
       order by schema_name
    `
  );

  const desiredSchemas = [
    "public",
    "storage",
    "graphql_public",
    ...new Set(result.rows.map((row) => row.schema_name))
  ];

  const serialized = desiredSchemas.join(",");
  const escaped = serialized.replaceAll("'", "''");

  await client.query(`alter role authenticator set pgrst.db_schemas = '${escaped}'`);
  await client.query(`notify pgrst, 'reload config'`);
  await client.query(`notify pgrst, 'reload schema'`);

  return desiredSchemas;
}

export async function reconcilePostgrestSchemas({ connectionString }) {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  await ensureFactoryTables(client);
  const desiredSchemas = await syncPostgrestSchemas(client);
  await client.end();

  return desiredSchemas;
}

export async function upsertPrototypeApp({
  connectionString,
  appSlug,
  displayName,
  schemaName,
  repoPath,
  vercelProjectName,
  siteUrl
}) {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  await ensureFactoryTables(client);
  await upsertPrototypeAppRow(client, {
    appSlug,
    displayName,
    schemaName,
    repoPath,
    vercelProjectName,
    siteUrl
  });
  const desiredSchemas = await syncPostgrestSchemas(client);
  await client.end();

  return desiredSchemas;
}

export async function applyAppMigrations({
  connectionString,
  appDir,
  appSlug,
  displayName,
  schemaName,
  vercelProjectName,
  siteUrl
}) {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  await ensureFactoryTables(client);

  const migrationDir = path.join(appDir, "supabase", "migrations");
  const migrationFiles = sortMigrationNames(
    fs
      .readdirSync(migrationDir)
      .filter((file) => file.endsWith(".sql"))
  );

  for (const fileName of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationDir, fileName), "utf8");
    const checksum = sha256(sql);

    const existing = await client.query(
      `
        select checksum
          from public.prototype_factory_migrations
         where app_slug = $1
           and filename = $2
      `,
      [appSlug, fileName]
    );

    if (existing.rowCount > 0) {
      const appliedChecksum = existing.rows[0].checksum;

      if (appliedChecksum !== checksum) {
        throw new Error(
          `Migration ${fileName} for ${appSlug} has changed since it was applied. Create a new migration instead of editing the old one.`
        );
      }

      continue;
    }

    await client.query("begin");

    try {
      await client.query(sql);
      await client.query(
        `
          insert into public.prototype_factory_migrations (app_slug, filename, checksum)
          values ($1, $2, $3)
        `,
        [appSlug, fileName, checksum]
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  await upsertPrototypeAppRow(client, {
    appSlug,
    displayName,
    schemaName,
    repoPath: `apps/${appSlug}`,
    vercelProjectName,
    siteUrl
  });
  await syncPostgrestSchemas(client);

  await client.end();
}
