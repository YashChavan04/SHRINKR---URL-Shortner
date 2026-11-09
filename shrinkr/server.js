const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "links.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readLinks() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Could not read link database:", error.message);
    return [];
  }
}

function writeLinks(links) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(links, null, 2));
}

function makeCode(length = 6) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

app.get("/api/links", (req, res) => {
  const links = readLinks()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(link => ({ ...link, shortUrl: `${BASE_URL}/${link.code}` }));
  res.json(links);
});

app.post("/api/shorten", (req, res) => {
  const rawUrl = String(req.body.url || "");
  const destination = normalizeUrl(rawUrl);
  const customCode = String(req.body.customCode || "").trim();

  if (!rawUrl.trim()) {
    return res.status(400).json({ error: "Enter a URL to shorten." });
  }
  if (!isValidUrl(destination)) {
    return res.status(400).json({ error: "Enter a valid http or https URL." });
  }
  if (customCode && !/^[a-zA-Z0-9_-]{3,20}$/.test(customCode)) {
    return res.status(400).json({ error: "Custom codes must be 3–20 characters and use only letters, numbers, - or _." });
  }

  const links = readLinks();
  const code = customCode || makeCode();
  if (links.some(link => link.code.toLowerCase() === code.toLowerCase())) {
    return res.status(409).json({ error: "That short code is already taken. Try another one." });
  }

  const link = {
    id: crypto.randomUUID(),
    originalUrl: destination,
    code,
    clicks: 0,
    createdAt: new Date().toISOString(),
    lastClickedAt: null
  };
  links.push(link);
  writeLinks(links);

  res.status(201).json({ ...link, shortUrl: `${BASE_URL}/${code}` });
});

app.delete("/api/links/:id", (req, res) => {
  const links = readLinks();
  const updated = links.filter(link => link.id !== req.params.id);
  if (updated.length === links.length) {
    return res.status(404).json({ error: "Link not found." });
  }
  writeLinks(updated);
  res.json({ success: true });
});

app.get("/:code", (req, res, next) => {
  // Let API and reserved paths continue through Express normally.
  if (req.params.code === "api" || req.params.code.includes(".")) return next();

  const links = readLinks();
  const link = links.find(item => item.code === req.params.code);
  if (!link) {
    return res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
  }

  link.clicks += 1;
  link.lastClickedAt = new Date().toISOString();
  writeLinks(links);
  res.redirect(302, link.originalUrl);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`SHRINKR is running at ${BASE_URL}`);
});
