// Gera as seções de projetos do README a partir do GitHub.
//
//   <!-- PROJECTS:START --> ... <!-- PROJECTS:END -->   → projetos em andamento ("current")
//   <!-- FINISHED:START --> ... <!-- FINISHED:END -->   → projetos finalizados  ("finished")
//
// Lê projects.json, busca nome, descrição, tópicos e linguagens de cada repositório
// e reescreve só o trecho entre os marcadores.
//
// Uso local:     GITHUB_TOKEN=xxx node scripts/update-projects.mjs
// Teste offline: PROJECTS_FIXTURE=fixture.json node scripts/update-projects.mjs
//                (fixture = { "current": [...], "finished": [...] })

import { readFile, writeFile } from "node:fs/promises";

const README = "README.md";
const CONFIG = "projects.json";

const token = process.env.GITHUB_TOKEN;
const config = JSON.parse(await readFile(CONFIG, "utf8"));
const user = config.user ?? process.env.GITHUB_REPOSITORY_OWNER ?? "aqu1no1";
const currentCfg = config.current ?? { repos: config.repos ?? [], limit: config.limit ?? 4 };
const finishedCfg = config.finished ?? { repos: [], limit: 4 };
// tópicos que marcam um repositório como finalizado no modo automático
const FINISHED_TOPICS = new Set(["finished", "completed", "done", "finalizado", "concluido"]);

// linguagem do GitHub -> ícone do skillicons.dev
const LANG_ICONS = {
  TypeScript: "ts", JavaScript: "js", Python: "py", Java: "java", C: "c", "C++": "cpp",
  "C#": "cs", HTML: "html", CSS: "css", SCSS: "sass", Rust: "rust", Go: "go", Kotlin: "kotlin",
  Dart: "dart", PHP: "php", Vue: "vue", Svelte: "svelte", Dockerfile: "docker", Shell: "bash",
  Lua: "lua", Ruby: "ruby", Swift: "swift",
};
// tópicos que também viram ícone (o resto vira tag)
const TOPIC_ICONS = new Set([
  "react", "nextjs", "nodejs", "nestjs", "express", "prisma", "postgres", "mysql", "mongodb",
  "redis", "docker", "tailwind", "azure", "aws", "githubactions", "graphql", "vite", "vitest",
  "jest", "angular", "flutter", "firebase", "supabase", "vercel", "linux", "rust", "tauri",
  "dotnet", "cs", "ts", "js", "py", "java", "kotlin", "go", "sass", "html", "css",
]);
const TOPIC_ALIAS = {
  postgresql: "postgres", tailwindcss: "tailwind", "github-actions": "githubactions",
  "react-native": "react", typescript: "ts", javascript: "js", python: "py", csharp: "cs",
  "aspnet-core": "dotnet", "asp-net-core": "dotnet", aspnetcore: "dotnet", "entity-framework-core": "dotnet",
  node: "nodejs", "node-js": "nodejs", next: "nextjs", golang: "go", scss: "sass", html5: "html", css3: "css",
};
// máximo de tags (badges) por card; os tópicos que viram ícone não contam
const MAX_TAGS = config.maxTags ?? 3;
const MAX_ICONS = config.maxIcons ?? 8;

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

const normalize = (list) => (list ?? []).map((r) => (typeof r === "string" ? { repo: r } : r));
const isFinished = (r) => r.archived || (r.topics ?? []).some((t) => FINISHED_TOPICS.has(t));

async function load(entries) {
  const out = [];
  for (const entry of entries) {
    try {
      out.push({ ...(await loadRepo(entry.repo)), override: entry });
    } catch (err) {
      console.warn(`Pulando ${entry.repo}: ${err.message}`);
    }
  }
  return out;
}

async function collect() {
  if (process.env.PROJECTS_FIXTURE) {
    return JSON.parse(await readFile(process.env.PROJECTS_FIXTURE, "utf8"));
  }
  let current = normalize(currentCfg.repos);
  let finished = normalize(finishedCfg.repos);

  // modo automático para a lista que estiver vazia
  if (!current.length || !finished.length) {
    const mine = (await gh(`users/${user}/repos?sort=pushed&per_page=100&type=owner`))
      .filter((r) => !r.fork && r.name !== user);
    const listed = new Set([...current, ...finished].map((e) => e.repo.toLowerCase()));
    const free = mine.filter((r) => !listed.has(r.full_name.toLowerCase()));
    if (!finished.length) {
      finished = free.filter(isFinished).slice(0, finishedCfg.limit ?? 4).map((r) => ({ repo: r.full_name }));
    }
    if (!current.length) {
      const taken = new Set(finished.map((e) => e.repo.toLowerCase()));
      current = free
        .filter((r) => !isFinished(r) && !taken.has(r.full_name.toLowerCase()))
        .slice(0, currentCfg.limit ?? 4)
        .map((r) => ({ repo: r.full_name }));
    }
  }
  return { current: await load(current), finished: await load(finished) };
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const badge = (label, color = "1E40AF") =>
  `<img src="https://img.shields.io/badge/${encodeURIComponent(label.replace(/-/g, "--").replace(/_/g, "__"))}-${color}?style=flat-square" alt="${esc(label)}" />`;

function relative(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function card(p, kind) {
  const o = p.override ?? {};
  const name = o.name ?? p.name;
  const url = o.url ?? (p.private ? null : p.html_url);
  const description = o.description ?? p.description ?? "No description yet.";
  const topics = [...(p.topics ?? []), ...(o.tags ?? [])].filter((t) => !FINISHED_TOPICS.has(t));

  const icons = [];
  for (const l of p.languages ?? []) if (LANG_ICONS[l]) icons.push(LANG_ICONS[l]);
  const tags = [];
  for (const t of topics) {
    const id = TOPIC_ALIAS[t] ?? t;
    if (TOPIC_ICONS.has(id)) icons.push(id);
    else tags.push(t);
  }
  for (const t of o.tech ?? []) icons.push(t);
  const uniqueIcons = [...new Set(icons)].slice(0, MAX_ICONS);
  // tags escolhidas no projects.json vêm primeiro e sempre aparecem
  const shownTags = [...new Set([...(o.tags ?? []), ...tags])].slice(0, Math.max(MAX_TAGS, (o.tags ?? []).length));

  const title = url ? `<a href="${url}">${esc(name)}</a>` : esc(name);
  const when =
    kind === "finished"
      ? o.finished ? `✅ finished ${esc(o.finished)}` : "✅ finished"
      : p.pushed_at ? `updated ${relative(p.pushed_at)}` : null;
  const meta = [o.role ? esc(o.role) : null, p.private ? "🔒 private" : null, when].filter(Boolean).join(" · ");
  const extraLink = o.demo ? ` · <a href="${esc(o.demo)}">demo</a>` : "";

  return `<td width="50%" align="center" valign="top">
<h4>${title}</h4>
<p>${esc(description)}</p>
${shownTags.length ? `<p>${shownTags.map((t) => badge(t)).join(" ")}</p>` : ""}
${uniqueIcons.length ? `<img src="https://skillicons.dev/icons?i=${uniqueIcons.join(",")}&theme=dark" height="32" />` : ""}
${meta ? `<p><sub>${meta}${extraLink}</sub></p>` : ""}
</td>`;
}

function render(projects, kind) {
  if (!projects.length) {
    const msg = kind === "finished" ? "Finished projects will show up here soon." : "No projects to show right now.";
    return `<p align="center"><i>${msg}</i></p>`;
  }
  const rows = [];
  for (let i = 0; i < projects.length; i += 2) {
    rows.push(`<tr>\n${card(projects[i], kind)}\n${projects[i + 1] ? card(projects[i + 1], kind) : '<td width="50%"></td>'}\n</tr>`);
  }
  return `<table>\n${rows.join("\n")}\n</table>`;
}

function replaceBlock(readme, name, html) {
  const start = `<!-- ${name}:START -->`;
  const end = `<!-- ${name}:END -->`;
  const a = readme.indexOf(start);
  const b = readme.indexOf(end);
  if (a === -1 || b === -1) {
    console.warn(`Marcadores ${start} / ${end} não encontrados no README — seção ignorada.`);
    return readme;
  }
  return `${readme.slice(0, a + start.length)}\n${html}\n${readme.slice(b)}`;
}

const { current = [], finished = [] } = await collect();
const readme = await readFile(README, "utf8");
let next = replaceBlock(readme, "PROJECTS", render(current, "current"));
next = replaceBlock(next, "FINISHED", render(finished, "finished"));
if (next !== readme) {
  await writeFile(README, next);
  console.log(`README atualizado: ${current.length} em andamento, ${finished.length} finalizado(s).`);
} else {
  console.log("Nada mudou.");
}
