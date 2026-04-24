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
    [appSlug, displayName, schemaName, `apps/${appSlug}`, vercelProjectName, siteUrl]
  );

  await client.end();
}
