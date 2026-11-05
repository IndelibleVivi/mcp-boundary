export const CURRENT_LAB_REPOSITORY =
  "git+https://github.com/IndelibleVivi/mcp-boundary.git";
export const CURRENT_LAB_HOMEPAGE =
  "https://github.com/IndelibleVivi/mcp-boundary/tree/main/lab#readme";

export function packageMetadataMatchesCurrentLab(packageJson) {
  return (
    packageJson.repository?.type === "git" &&
    packageJson.repository?.url === CURRENT_LAB_REPOSITORY &&
    packageJson.repository?.directory === "lab" &&
    packageJson.homepage === CURRENT_LAB_HOMEPAGE
  );
}
