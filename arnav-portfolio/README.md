# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Portfolio pages

- `/` is the home portfolio.
- `/works` is the project collection, with category filters and project previews.
- Navigation uses the existing red brick shutter. The URL and page change at its midpoint; browser Back/Forward also use this transition.
- Project content shared by Home and Works lives in `src/data/projects.js`. These are the existing preview entries; replace their names, images, descriptions, and links with final project content.
- The Works layout lives in `src/pages/WorksPage.jsx` and `src/pages/WorksPage.css`.

For production hosting, configure an SPA fallback that serves `index.html` for `/works` (and other application routes), so direct visits and refreshes work. Vite's dev and preview servers already provide this fallback.
