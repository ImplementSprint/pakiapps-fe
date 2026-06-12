/**
 * Type declaration for Figma asset imports.
 *
 * The custom Vite plugin (resolve-figma-assets) maps `figma:asset/<hash>.png`
 * to the real file in `src/assets/` during both dev and production builds.
 * This declaration tells TypeScript that such imports resolve to a string URL,
 * silencing the "Cannot find module" errors in the IDE.
 */
declare module 'figma:asset/*.png' {
  const src: string;
  export default src;
}

declare module 'figma:asset/*.jpg' {
  const src: string;
  export default src;
}

declare module 'figma:asset/*.svg' {
  const src: string;
  export default src;
}

// General image declarations for standard imports
declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}
