// Gera a seção "Projects" do README a partir do GitHub.
// Lê projects.json, busca nome, descrição, tópicos e linguagens de cada repositório
// e reescreve o trecho entre <!-- PROJECTS:START --> e <!-- PROJECTS:END -->.
//
// Uso local:   GITHUB_TOKEN=xxx node scripts/update-projects.mjs
// Teste offline: PROJECTS_FIXTURE=fixture.json node scripts/update-projects.mjs

import { readFile, writeFile } from "node:fs/promises";

const README = "README.md";
const CONFIG = "projects.json";
const START = "<!-- PROJECTS:START -->";
const END = "<!-- PROJECTS:END -->";

const token = process.env.GITHUB_TOKEN;
const config = JSON.parse(await readFile(CONFIG, "utf8"));
const user = config.user ?? process.env.GITHUB_REPOSITORY_OWNER ?? "aqu1no1";
const limit = config.limit ?? 4;

// linguagem do GitHub -> ícone do skillicons.dev
const LANG_ICONS = {
  TypeScript: "ts", JavaScript: "js", Python: "py", Java: "java", C: "c", "C++": "cpp",
  "C#": "cs", HTML: "html", CSS: "css", SCSS: "sass", Rust: "rust", Go: "go", Kotlin: "kotlin",
  Dart: "dart", PHP: "php", Vue: "vue", Svelte: "svelte", Dockerfile: "docker", Shell: "bash",
  Lua: "lua", Ruby: "ruby", Swift: "swift",
};
// tópicos que também viram ícone (o resto vira tag)
const TOPIC_ICONS = new Set([
  "react", "nextjs", "nodejs", "nestjs", "express", "prisma", "postgres", "postgresql", "mysql",
  "mongodb", "redis", "docker", "tailwind", "tailwindcss", "azure", "aws", "githubactions",
  "graphql", "vite", "jest", "angular", "flutter", "firebase", "supabase", "vercel", "linux",
]);
const TOPIC_ALIAS = { postgresql: "postgres", tailwindcss: "tailwind", "github-actions": "githubactions", "react-native": "react" };

async function gh(path) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function loadRepo(fullName) {
  const [repo, langs] = await Promise.all([gh(`repos/${fullName}`), gh(`repos/${fullName}/languages`)]);
  return { ...repo, languages: Object.keys(langs) };
}

async function collect() {
  if (process.env.PROJECTS_FIXTURE) {
    return JSON.parse(await readFile(process.env.PROJECTS_FIXTURE, "utf8"));
  }
  const listed = (config.repos ?? []).map((r) => (typeof r === "string" ? { repo: r } : r));
  let entries = listed;
  if (!entries.length) {
    // modo automático: repositórios com push mais recente
    const repos = await gh(`users/${user}/repos?sort=pushed&per_page=30&type=owner`);
    entries = repos
      .filter((r) => !r.fork && !r.archived && r.name !== user)
      .slice(0, limit)
      .map((r) => ({ repo: r.full_name }));
  }
  const out = [];
  for (const entry of entries) {
    try {
      const data = await loadRepo(entry.repo);
      out.push({ ...data, override: entry });
    } catch (err) {
      console.warn(`Pulando ${entry.repo}: ${err.message}`);
    }
  }
  return out;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const badge = (label) =>
  `<img src="https://img.shields.io/badge/${encodeURIComponent(label.replace(/-/g, "--").replace(/_/g, "__"))}-1E40AF?style=flat-square" alt="${esc(label)}" />`;

function relative(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function card(p) {
  const o = p.override ?? {};
  const name = o.name ?? p.name;
  const url = o.url ?? (p.private ? null : p.html_url);
  const description = o.description ?? p.description ?? "No description yet.";
  const topics = [...(p.topics ?? []), ...(o.tags ?? [])];

  const icons = [];
  for (const l of p.languages ?? []) if (LANG_ICONS[l]) icons.push(LANG_ICONS[l]);
  const tags = [];
  for (const t of topics) {
    const id = TOPIC_ALIAS[t] ?? t;
    if (TOPIC_ICONS.has(id) || TOPIC_ICONS.has(t)) icons.push(id);
    else tags.push(t);
  }
  for (const t of o.tech ?? []) icons.push(t);
  const uniqueIcons = [...new Set(icons)].slice(0, 8);

  const title = url ? `<a href="${url}">${esc(name)}</a>` : esc(name);
  const meta = [
    o.role ? esc(o.role) : null,
    p.private ? "🔒 private" : null,
    p.pushed_at ? `updated ${relative(p.pushed_at)}` : null,
  ].filter(Boolean).join(" · ");

  return `<td width="50%" align="center" valign="top">
<h4>${title}</h4>
<p>${esc(description)}</p>
${tags.length ? `<p>${tags.map(badge).join(" ")}</p>` : ""}
${uniqueIcons.length ? `<img src="https://skillicons.dev/icons?i=${uniqueIcons.join(",")}&theme=dark" height="32" />` : ""}
${meta ? `<p><sub>${meta}</sub></p>` : ""}
</td>`;
}

function render(projects) {
  if (!projects.length) return "<p align=\"center\"><i>No projects to show right now.</i></p>";
  const rows = [];
  for (let i = 0; i < projects.length; i += 2) {
    rows.push(`<tr>\n${card(projects[i])}\n${projects[i + 1] ? card(projects[i + 1]) : '<td width="50%"></td>'}\n</tr>`);
  }
  return `<table>\n${rows.join("\n")}\n</table>`;
}

const projects = await collect();
const readme = await readFile(README, "utf8");
const a = readme.indexOf(START);
const b = readme.indexOf(END);
if (a === -1 || b === -1) throw new Error(`Marcadores ${START} / ${END} não encontrados no README`);
const next = `${readme.slice(0, a + START.length)}\n${render(projects)}\n${readme.slice(b)}`;
if (next !== readme) {
  await writeFile(README, next);
  console.log(`README atualizado com ${projects.length} projeto(s).`);
} else {
  console.log("Nada mudou.");
}
