# Publishing This Repository

This source tree is intended to be published as a brand-new GitHub repository with no old history.

Before making the repository public:

```bash
npm ci
npm run typecheck
npm run build
```

- confirm `Temp/`, `artifacts/`, `node_modules/`, `dist/`, logs, and editor folders are absent;
- review `NOTICE.md`, `CONTRIBUTING.md`, and `LICENSE`;
- review all assets and generated media rights;
- keep the Firefox controller note in `README.md` visible until the controller flow has been tested there more deeply;
- decide whether GitHub Issues, Discussions, private vulnerability reporting, and branch protection should be enabled.

This repository uses a monorepo layout because server, host, controller, protocol, and game catalog changes are tightly coupled.

After the local initial commit exists, create an empty GitHub repository and push:

```bash
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

If GitHub CLI is installed and authenticated, the equivalent one-command path is:

```bash
gh repo create <owner>/<repo> --public --source . --remote origin --push
```
