---
name: publish
description: Publish a new version of the npm package
disable-model-invocation: true
---

# Publish NPM Package

## 1. Ask the user what version bump they want

- **patch** (e.g. 3.2.0 → 3.2.1) - bug fixes
- **minor** (e.g. 3.2.0 → 3.3.0) - new features
- **major** (e.g. 3.2.0 → 4.0.0) - breaking changes

## 2. Bump the version

Run `npm version patch`, `npm version minor`, or `npm version major` based on the user's choice. This updates `package.json` and creates a git tag.

## 3. Tell the user to publish

Tell the user to run:

```bash
npm publish --access public
```

**Do NOT run `npm publish` yourself.** The user needs to authenticate with npm and must run this command manually.
