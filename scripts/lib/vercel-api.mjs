function buildTeamQuery(teamSlug) {
  return teamSlug ? `?slug=${encodeURIComponent(teamSlug)}` : "";
}

async function vercelRequest({ token, teamSlug }, method, apiPath, body = undefined) {
  const teamQuery = buildTeamQuery(teamSlug);
  const separator = apiPath.includes("?") ? "&" : "";
  const response = await fetch(`https://api.vercel.com${apiPath}${teamQuery ? `${separator}${teamQuery.slice(1)}` : ""}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vercel API ${method} ${apiPath} failed: ${response.status} ${text}`);
  }

  return response.status === 204 ? null : response.json();
}

export async function getVercelProject(apiConfig, projectName) {
  return vercelRequest(apiConfig, "GET", `/v9/projects/${encodeURIComponent(projectName)}`);
}

export async function createVercelProject(apiConfig, projectConfig) {
  return vercelRequest(apiConfig, "POST", "/v10/projects", projectConfig);
}

export async function upsertProjectEnv(apiConfig, projectName, envVariables) {
  return vercelRequest(
    apiConfig,
    "POST",
    `/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true`,
    envVariables
  );
}
