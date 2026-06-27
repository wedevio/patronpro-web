import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  COLLABORATOR_HOME_PATH,
  DEFAULT_PANEL_LAB_LOGIN_URL,
  buildPanelLabLoginRedirect,
  isCollaboratorNextPath,
  isPanelPath,
  safeLoginNextPath,
} from "./login-redirects";

describe("login redirects", () => {
  test("defaults login success to the collaborator OS", () => {
    assert.equal(safeLoginNextPath(null), COLLABORATOR_HOME_PATH);
    assert.equal(safeLoginNextPath(""), COLLABORATOR_HOME_PATH);
  });

  test("keeps collaborator paths and rejects panel or external paths", () => {
    assert.equal(safeLoginNextPath("/collaborators"), "/collaborators");
    assert.equal(
      safeLoginNextPath("/collaborators/schools/SCH-0002?tab=fit"),
      "/collaborators/schools/SCH-0002?tab=fit"
    );
    assert.equal(safeLoginNextPath("/panel"), COLLABORATOR_HOME_PATH);
    assert.equal(safeLoginNextPath("/panel/docs"), COLLABORATOR_HOME_PATH);
    assert.equal(safeLoginNextPath("//evil.example/collaborators"), COLLABORATOR_HOME_PATH);
    assert.equal(safeLoginNextPath("/collaboratorship"), COLLABORATOR_HOME_PATH);
  });

  test("classifies route families exactly", () => {
    assert.equal(isPanelPath("/panel"), true);
    assert.equal(isPanelPath("/panel/docs"), true);
    assert.equal(isPanelPath("/panelish"), false);

    assert.equal(isCollaboratorNextPath("/collaborators"), true);
    assert.equal(isCollaboratorNextPath("/collaborators?tab=fit"), true);
    assert.equal(isCollaboratorNextPath("/collaborators/sources"), true);
    assert.equal(isCollaboratorNextPath("/collaboratorship"), false);
  });

  test("builds the panel-lab redirect URL", () => {
    assert.equal(
      buildPanelLabLoginRedirect("https://getpatronpro.automatic.picturelle.com/panel").toString(),
      DEFAULT_PANEL_LAB_LOGIN_URL
    );
    assert.equal(
      buildPanelLabLoginRedirect(
        "https://getpatronpro.automatic.picturelle.com/panel/docs",
        "https://panel.example.test/login"
      ).toString(),
      "https://panel.example.test/login"
    );
  });
});
