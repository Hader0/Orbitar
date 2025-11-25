# Prompt Lab Data Contract

## Plans

We use the following plan identifiers consistently across the backend, analytics, and Prompt Lab:

- `free`
- `light`
- `pro`
- `admin`

## Template identity

Each template family is identified by a lowercase snake_case slug:

**Pattern:** `category_scope_variant`

Examples:

- `coding_feature_default`
- `coding_bugfix_concise`
- `writing_blog_longform`
- `writing_email_polite`
- `planning_project_brief`
- `research_comparison_standard`

This slug is the canonical `templateId` used in:

- API logging (`RefineEvent.templateId`)
- Template registries
- Prompt Lab dashboards

## Template versions

We use semver-style strings for template versions:

- `1.0.0` – initial GA version
- `1.1.0` – minor tuning (same overall structure)
- `2.0.0` – major rewrite (structural behavior change)
- Patch bumps (`x.y.z`) are reserved for small, low-risk fixes.

All existing templates are initially versioned as `1.0.0`.

Version is stored as a string in:

- `RefineEvent.templateVersion`
- Any template registries (`getTemplateVersion(templateId)`)

Prompt Lab treats templateId + templateVersion as the unique key for metrics and comparisons.
