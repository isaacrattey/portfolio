const tabList = document.getElementById("tab-list");
const tabPanelsRoot = document.getElementById("tab-panels");
const projectModal = document.getElementById("project-modal");
const projectModalDialog = document.querySelector(".project-modal__dialog");
const projectModalTitle = document.getElementById("project-modal-title");
const projectModalDescription = document.getElementById("project-modal-description");
const projectModalImage = document.getElementById("project-modal-image");
const projectImageCount = document.getElementById("project-image-count");
const prevImageButton = document.getElementById("project-prev-image");
const nextImageButton = document.getElementById("project-next-image");
const closeModalButtons = Array.from(document.querySelectorAll("[data-close-modal]"));
const projectModalCta = document.getElementById("project-modal-cta");

let tabButtons = [];
let tabPanels = [];
let activeProjectImages = [];
let activeImageIndex = 0;
let lastFocusedCard = null;

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(text) {
  let content = escapeHtml(text);
  content = content.replace(/`([^`]+)`/g, "<code>$1</code>");
  content = content.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  content = content.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  });
  return content;
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value === "") {
    return "";
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function parseFrontmatter(markdown) {
  const normalizedMarkdown = String(markdown).replace(/\r\n?/g, "\n");
  const match = normalizedMarkdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: normalizedMarkdown };
  }

  const meta = {};
  let currentListKey = null;
  const lines = match[1].split("\n");

  lines.forEach((line) => {
    if (!line.trim()) {
      return;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1];
      const rawValue = keyValueMatch[2];

      if (rawValue.trim() === "") {
        meta[key] = [];
        currentListKey = key;
      } else {
        meta[key] = parseScalar(rawValue);
        currentListKey = null;
      }
      return;
    }

    const listItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (listItemMatch && currentListKey && Array.isArray(meta[currentListKey])) {
      meta[currentListKey].push(parseScalar(listItemMatch[1]));
    }
  });

  return { meta, body: match[2].trim() };
}

function extractFirstSection(markdownBody) {
  if (!markdownBody.trim()) {
    return "";
  }

  const lines = markdownBody.split("\n");
  const collected = [];
  let started = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isH2 = /^##\s+/.test(line);

    if (!started && isH2) {
      started = true;
      continue;
    }

    if (!started && line.trim()) {
      started = true;
    }

    if (started && isH2) {
      break;
    }

    if (started) {
      collected.push(line);
    }
  }

  return collected.join("\n").trim();
}

function renderMarkdown(markdown) {
  if (!markdown.trim()) {
    return "";
  }

  const lines = markdown.split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        i += 1;
      }
      html += `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html += `<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`;
      i += 1;
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s+/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s+/, ""));
        i += 1;
      }
      html += `<blockquote><p>${renderInlineMarkdown(quoteLines.join(" "))}</p></blockquote>`;
      continue;
    }

    if (/^-\s+/.test(trimmed)) {
      html += "<ul>";
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        html += `<li>${renderInlineMarkdown(lines[i].replace(/^\s*-\s+/, "").trim())}</li>`;
        i += 1;
      }
      html += "</ul>";
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      html += "<ol>";
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        html += `<li>${renderInlineMarkdown(lines[i].replace(/^\s*\d+\.\s+/, "").trim())}</li>`;
        i += 1;
      }
      html += "</ol>";
      continue;
    }

    const paragraphLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i].trim()) &&
      !/^>\s+/.test(lines[i].trim()) &&
      !/^\s*-\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^```/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    html += `<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`;
  }

  return html;
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveRelativePath(basePath, maybeRelativePath) {
  if (!maybeRelativePath) {
    return "";
  }

  if (/^(https?:)?\/\//.test(maybeRelativePath) || maybeRelativePath.startsWith("/")) {
    return maybeRelativePath;
  }

  const baseParts = basePath.split("/");
  baseParts.pop();
  const relParts = maybeRelativePath.split("/");

  relParts.forEach((part) => {
    if (part === "." || part === "") {
      return;
    }

    if (part === "..") {
      if (baseParts.length > 0) {
        baseParts.pop();
      }
      return;
    }

    baseParts.push(part);
  });

  return baseParts.join("/");
}

function asUrl(path) {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("/")) {
    return path;
  }
  return encodeURI(path);
}

function isExternalHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function activateTab(targetKey) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === targetKey;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.id === `panel-${targetKey}`;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

function renderCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open project ${project.title}`);

  const title = document.createElement("h2");
  title.textContent = project.title;
  card.appendChild(title);

  const summary = document.createElement("p");
  summary.textContent = project.summary || "Add a summary in this project's frontmatter.";
  card.appendChild(summary);

  if (project.images.length > 0) {
    const media = document.createElement("div");
    media.className = "project-media";
    media.setAttribute("aria-label", `${project.title} previews`);

    project.images.slice(0, 4).forEach((image) => {
      const img = document.createElement("img");
      img.src = asUrl(image.path);
      img.alt = image.alt || `${project.title} preview`;
      media.appendChild(img);
    });

    card.appendChild(media);
  }

  card.addEventListener("click", () => openProjectModal(project, card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProjectModal(project, card);
    }
  });

  return card;
}

function renderProjects(projects) {
  tabList.innerHTML = "";
  tabPanelsRoot.innerHTML = "";

  const grouped = new Map();
  projects.forEach((project) => {
    if (!grouped.has(project.category)) {
      grouped.set(project.category, []);
    }
    grouped.get(project.category).push(project);
  });

  const categories = Array.from(grouped.keys());

  categories.forEach((category, index) => {
    const tabKey = toSlug(category) || `category-${index + 1}`;

    const tabButton = document.createElement("button");
    tabButton.className = "tab-btn";
    tabButton.setAttribute("role", "tab");
    tabButton.id = `tab-${tabKey}`;
    tabButton.setAttribute("aria-controls", `panel-${tabKey}`);
    tabButton.setAttribute("aria-selected", String(index === 0));
    tabButton.dataset.tab = tabKey;
    tabButton.textContent = category;
    tabButton.tabIndex = index === 0 ? 0 : -1;
    if (index === 0) {
      tabButton.classList.add("active");
    }
    tabList.appendChild(tabButton);

    const panel = document.createElement("section");
    panel.className = "tab-panel";
    if (index === 0) {
      panel.classList.add("active");
    } else {
      panel.hidden = true;
    }
    panel.id = `panel-${tabKey}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabButton.id);

    const grid = document.createElement("div");
    grid.className = "project-grid";

    grouped
      .get(category)
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((project) => {
        grid.appendChild(renderCard(project));
      });

    panel.appendChild(grid);
    tabPanelsRoot.appendChild(panel);
  });

  tabButtons = Array.from(tabList.querySelectorAll(".tab-btn"));
  tabPanels = Array.from(tabPanelsRoot.querySelectorAll(".tab-panel"));

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + tabButtons.length) % tabButtons.length;
      const nextButton = tabButtons[nextIndex];
      nextButton.focus();
      activateTab(nextButton.dataset.tab);
    });
  });
}

function renderModalImage() {
  const hasImages = activeProjectImages.length > 0;

  if (!hasImages) {
    projectModalImage.removeAttribute("src");
    projectModalImage.alt = "No images for this project";
    projectModalImage.style.display = "none";
    projectImageCount.textContent = "No images";
    prevImageButton.disabled = true;
    nextImageButton.disabled = true;
    return;
  }

  const currentImage = activeProjectImages[activeImageIndex];
  projectModalImage.style.display = "block";
  projectModalImage.src = asUrl(currentImage.path);
  projectModalImage.alt = currentImage.alt;
  projectImageCount.textContent = `${activeImageIndex + 1} / ${activeProjectImages.length}`;
  prevImageButton.disabled = activeProjectImages.length <= 1;
  nextImageButton.disabled = activeProjectImages.length <= 1;
}

function openProjectModal(project, card) {
  activeProjectImages = project.images;
  activeImageIndex = 0;
  lastFocusedCard = card;

  projectModalTitle.textContent = project.title;
  projectModalDescription.innerHTML = renderMarkdown(project.body || "");

  if (project.ctaUrl) {
    projectModalCta.hidden = false;
    projectModalCta.href = asUrl(project.ctaUrl);
    projectModalCta.textContent = project.ctaLabel || "Learn more";
  } else {
    projectModalCta.hidden = true;
    projectModalCta.removeAttribute("href");
  }

  renderModalImage();
  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  projectModalDialog.focus();
}

function closeProjectModal() {
  if (!projectModal.classList.contains("open")) {
    return;
  }

  projectModal.classList.remove("open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastFocusedCard) {
    lastFocusedCard.focus();
  }
}

async function loadProjects() {
  const response = await fetch("projects/index.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load projects/index.json");
  }

  const registry = await response.json();
  const entries = Array.isArray(registry.projects) ? registry.projects : [];
  const projectResults = await Promise.all(
    entries.map(async (projectPath) => {
      const projectResponse = await fetch(asUrl(projectPath), { cache: "no-store" });
      if (!projectResponse.ok) {
        console.warn(`Skipping project: ${projectPath}`);
        return null;
      }

      const markdown = await projectResponse.text();
      const { meta, body } = parseFrontmatter(markdown);

      if (!meta.title || !meta.category || typeof meta.order !== "number") {
        console.warn(`Missing required frontmatter in ${projectPath}`);
        return null;
      }

      const imageList = Array.isArray(meta.images) ? meta.images : [];
      const images = imageList.map((imagePath) => ({
        path: resolveRelativePath(projectPath, String(imagePath)),
        alt: `${meta.title} image`,
      }));

      const rawCtaUrl = meta.cta_url ? String(meta.cta_url).trim() : "";
      const ctaUrl = isExternalHttpUrl(rawCtaUrl) ? rawCtaUrl : "";

      return {
        title: String(meta.title),
        category: String(meta.category),
        order: Number(meta.order),
        summary: meta.summary ? String(meta.summary) : "",
        images,
        ctaLabel: meta.cta_label ? String(meta.cta_label) : "",
        ctaUrl,
        body,
        firstSection: extractFirstSection(body),
      };
    })
  );

  return projectResults.filter(Boolean);
}

prevImageButton.addEventListener("click", () => {
  if (activeProjectImages.length <= 1) {
    return;
  }
  activeImageIndex = (activeImageIndex - 1 + activeProjectImages.length) % activeProjectImages.length;
  renderModalImage();
});

nextImageButton.addEventListener("click", () => {
  if (activeProjectImages.length <= 1) {
    return;
  }
  activeImageIndex = (activeImageIndex + 1) % activeProjectImages.length;
  renderModalImage();
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeProjectModal);
});

document.addEventListener("keydown", (event) => {
  if (!projectModal.classList.contains("open")) {
    return;
  }

  if (event.key === "Escape") {
    closeProjectModal();
  } else if (event.key === "ArrowRight" && activeProjectImages.length > 1) {
    activeImageIndex = (activeImageIndex + 1) % activeProjectImages.length;
    renderModalImage();
  } else if (event.key === "ArrowLeft" && activeProjectImages.length > 1) {
    activeImageIndex = (activeImageIndex - 1 + activeProjectImages.length) % activeProjectImages.length;
    renderModalImage();
  }
});

(async () => {
  try {
    if (window.location.protocol === "file:") {
      tabPanelsRoot.innerHTML =
        '<section class="tab-panel active"><p>Open this site from a local server (not file://). Run <code>python3 -m http.server 8000</code> and visit <code>http://localhost:8000</code>.</p></section>';
      return;
    }

    const projects = await loadProjects();
    if (projects.length === 0) {
      tabPanelsRoot.innerHTML = '<section class="tab-panel active"><p>No projects found. Add markdown files and update projects/index.json.</p></section>';
      return;
    }
    renderProjects(projects);
  } catch (error) {
    tabPanelsRoot.innerHTML = '<section class="tab-panel active"><p>Failed to load projects. Check paths in projects/index.json.</p></section>';
    console.error(error);
  }
})();

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}
