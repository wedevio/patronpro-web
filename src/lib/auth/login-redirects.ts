export const COLLABORATOR_HOME_PATH = "/collaborators";
export const DEFAULT_PANEL_LAB_LOGIN_URL = "https://getpatronpro-panel.automatic.picturelle.com/login";

export function isPanelPath(pathname: string) {
  return pathname === "/panel" || pathname.startsWith("/panel/");
}

export function isCollaboratorNextPath(value: string) {
  if (!value || value.startsWith("//")) return false;
  return value === COLLABORATOR_HOME_PATH
    || value.startsWith(`${COLLABORATOR_HOME_PATH}/`)
    || value.startsWith(`${COLLABORATOR_HOME_PATH}?`);
}

export function safeLoginNextPath(value: string | null) {
  if (!value) return COLLABORATOR_HOME_PATH;
  return isCollaboratorNextPath(value) ? value : COLLABORATOR_HOME_PATH;
}

export function buildPanelLabLoginRedirect(requestUrl: string, panelLoginUrl = DEFAULT_PANEL_LAB_LOGIN_URL) {
  return new URL(panelLoginUrl, requestUrl);
}
