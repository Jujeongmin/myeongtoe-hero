/// <reference types="vite/client" />

// Modification time of each file under art/ in the dev server (empty in builds); see
// vite-plugins/artVersions.ts.
declare module "virtual:art-versions" {
  const versions: Record<string, number>;
  export default versions;
}
