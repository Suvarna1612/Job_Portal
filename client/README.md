# ⚡ React + Vite

Welcome to your minimal React setup powered by [Vite](https://vitejs.dev/)! This template is designed to get you up and running immediately with a streamlined developer experience.

### ✨ What's Included
* **🔥 Hot Module Replacement (HMR):** See your changes reflected instantly in the browser.
* **🧹 ESLint Rules:** Keep your code clean and consistent from day one.

---

## 🔌 Official Plugins

Fast Refresh is supported out of the box. You can choose between two official compiler plugins depending on your project's needs:

| Plugin | Compiler | Description |
| :--- | :--- | :--- |
| [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) | **Babel** | The standard choice for maximum ecosystem compatibility. |
| [`@vitejs/plugin-react-swc`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) | **SWC** | Written in Rust, offering significantly faster build and compilation times. |

---

## 🛠️ Expanding the ESLint Configuration

The current setup is great for prototyping, but if you are building a **production application**, we highly recommend stepping up your tooling.

> **💡 Recommendation:** Switch to **TypeScript** with type-aware lint rules enabled to catch bugs before they happen.
> 
> Check out the official [Vite React + TS Template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for a guide on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) into your project.
