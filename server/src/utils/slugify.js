function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

// Generates a unique slug for a model by appending -2, -3, ... when taken
async function uniqueSlug(Model, field, title, session) {
  const base = slugify(title) || 'event';
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Model.exists({ [field]: slug }, session ? { session } : undefined);
    if (!exists) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

module.exports = { slugify, uniqueSlug };
