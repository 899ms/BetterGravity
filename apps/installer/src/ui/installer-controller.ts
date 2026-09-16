import {
  availableOperations,
  type InstallOperation,
  type InstallationState,
  type OperationProgress,
  type Patcher
} from "@bettergravity/patcher";
import { operations, patchStateOf, states } from "../domain/installer";

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing installer element: ${id}`);
  return element as T;
}

/** Electron wraps handler failures; the original message is the useful part. */
function readableError(error: unknown): string {
  const message = error instanceof Error ? error.message : "The operation could not be completed.";
  return message.replace(/^Error invoking remote method '[^']+': Error: /, "");
}

export class InstallerController {
  private installation: InstallationState = { kind: "not-found" };
  private busy = false;
  private toastTimer?: number;

  public constructor(private readonly patcher: Patcher) {}

  public async start(): Promise<void> {
    byId<HTMLButtonElement>("chooseLocation").addEventListener("click", () => void this.chooseFolder());
    byId<HTMLButtonElement>("closeButton").addEventListener("click", () => window.betterGravityDesktop?.closeInstaller());
    byId<HTMLButtonElement>("openLogButton").addEventListener("click", () => void this.openLog());
    byId<HTMLInputElement>("folderPicker").addEventListener("change", (event) => this.onFolderChosen(event));

    this.installation = await this.patcher.detect();
    this.render();
  }

  private async openLog(): Promise<void> {
    const failure = await window.betterGravityDesktop?.openRuntimeLog(this.installation.path ?? "");
    if (failure) this.showToast("No runtime log yet. It appears once Antigravity has run with BetterGravity.");
  }

  private async chooseFolder(): Promise<void> {
    const desktop = window.betterGravityDesktop;
    if (!desktop) {
      byId<HTMLInputElement>("folderPicker").click();
      return;
    }

    const selected = await desktop.chooseDirectory();
    if (!selected) return;

    this.installation = await desktop.inspectInstallation(selected);
    this.render();
    if (this.installation.kind === "not-found") this.showToast("That folder does not contain Antigravity.");
  }

  private onFolderChosen(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const first = input.files?.item(0);
    if (!first) return;
    const folder = first.webkitRelativePath.split("/")[0] || "Selected Antigravity folder";
    this.installation = { kind: "detected", path: folder, antigravityVersion: "Unknown", patchState: "unpatched" };
    this.render();
  }

  private async run(operation: InstallOperation): Promise<void> {
    if (this.busy || !this.installation.path) return;

    this.busy = true;
    this.setControlsDisabled(true);
    byId<HTMLElement>("progressPanel").hidden = false;

    try {
      const result = await this.patcher.run(operation, this.installation.path, (progress) =>
        this.renderProgress(operation, progress)
      );
      this.installation = result.installation;
      this.showToast(result.message);
    } catch (error) {
      this.showToast(readableError(error));
      // The operation may have completed partially, so trust disk over memory.
      const path = this.installation.path;
      if (path) this.installation = (await window.betterGravityDesktop?.inspectInstallation(path)) ?? this.installation;
    } finally {
      this.busy = false;
      this.setControlsDisabled(false);
      this.render();
    }
  }

  private render(): void {
    const patchState = patchStateOf(this.installation);
    const copy = states[patchState];
    const actions = availableOperations(this.installation);

    const pill = byId<HTMLElement>("statePill");
    pill.classList.toggle("good", copy.tone === "good");
    pill.classList.toggle("bad", copy.tone === "bad");
    const statusText = patchState === "unknown" ? "Not found" : patchState.replace("-", " ");
    pill.title = statusText;

    byId<HTMLElement>("stateLabel").textContent = statusText;
    byId<HTMLElement>("stateEyebrow").textContent = copy.eyebrow;
    byId<HTMLElement>("stateTitle").textContent = copy.title;
    byId<HTMLElement>("stateDescription").textContent = copy.description;

    if (this.installation.kind === "unsupported-ide") {
      byId<HTMLElement>("stateEyebrow").textContent = "ANTIGRAVITY IDE DETECTED";
      byId<HTMLElement>("stateTitle").textContent = "Antigravity IDE is not supported yet.";
      byId<HTMLElement>("stateDescription").textContent =
        "BetterGravity supports the standalone Antigravity 2.0 desktop app, not the VS Code IDE. Please select your Antigravity 2.0 folder.";
      byId<HTMLElement>("stateLabel").textContent = "IDE DETECTED";
      pill.title = "IDE detected (not supported)";
      pill.classList.remove("good");
      pill.classList.add("bad");
    }

    byId<HTMLElement>("hostVersion").textContent = this.installation.antigravityVersion
      ? `Version ${this.installation.antigravityVersion}`
      : "Antigravity not detected";
    const fallbackPath =
      window.betterGravityDesktop?.platform === "darwin"
        ? "Looking in /Applications"
        : window.betterGravityDesktop?.platform === "linux"
          ? "Looking in /opt and ~/.local/share"
          : "Looking in standard Windows locations";
    byId<HTMLElement>("hostPath").textContent = this.installation.path ?? fallbackPath;

    this.renderActions(actions);
  }

  private renderActions(actions: readonly InstallOperation[]): void {
    const installButton = byId<HTMLButtonElement>("installAction");
    const reinstallButton = byId<HTMLButtonElement>("reinstallAction");
    const deleteButton = byId<HTMLButtonElement>("deleteAction");

    const kind = this.installation.kind;

    if (kind === "detected") {
      byId<HTMLElement>("installIcon").textContent = "download";
      byId<HTMLElement>("installLabel").textContent = "Install BetterGravity";
      byId<HTMLElement>("installHint").textContent = "Back up original bundle, then patch Antigravity.";
      installButton.disabled = false;
      installButton.onclick = () => void this.run("install");
    } else if (kind === "needs-repatch") {
      byId<HTMLElement>("installIcon").textContent = "sync";
      byId<HTMLElement>("installLabel").textContent = "Reapply BetterGravity";
      byId<HTMLElement>("installHint").textContent = "Antigravity changed. Patch the new version.";
      installButton.disabled = false;
      installButton.onclick = () => void this.run("update");
    } else if (kind === "corrupted") {
      byId<HTMLElement>("installIcon").textContent = "build";
      byId<HTMLElement>("installLabel").textContent = "Repair BetterGravity";
      byId<HTMLElement>("installHint").textContent = "Restore original bundle and rebuild the patch.";
      installButton.disabled = false;
      installButton.onclick = () => void this.run("repair");
    } else if (kind === "patched") {
      byId<HTMLElement>("installIcon").textContent = "check_circle";
      byId<HTMLElement>("installLabel").textContent = "BetterGravity is Active";
      byId<HTMLElement>("installHint").textContent = "Antigravity is currently patched and up to date.";
      installButton.disabled = true;
      installButton.onclick = null;
    } else if (kind === "unsupported-ide") {
      byId<HTMLElement>("installIcon").textContent = "close";
      byId<HTMLElement>("installLabel").textContent = "IDE Not Supported";
      byId<HTMLElement>("installHint").textContent = "Please locate the standalone Antigravity 2.0 app.";
      installButton.disabled = true;
      installButton.onclick = null;
    } else {
      byId<HTMLElement>("installIcon").textContent = "download";
      byId<HTMLElement>("installLabel").textContent = "Install BetterGravity";
      byId<HTMLElement>("installHint").textContent = "Locate an Antigravity installation to continue.";
      installButton.disabled = true;
      installButton.onclick = null;
    }

    byId<HTMLElement>("reinstallIcon").textContent = "replay";
    if (actions.includes("reinstall")) {
      reinstallButton.disabled = false;
      reinstallButton.onclick = () => void this.run("reinstall");
    } else {
      reinstallButton.disabled = true;
      reinstallButton.onclick = null;
    }

    byId<HTMLElement>("deleteIcon").textContent = "delete";
    if (actions.includes("uninstall")) {
      deleteButton.disabled = false;
      deleteButton.onclick = () => void this.run("uninstall");
    } else {
      deleteButton.disabled = true;
      deleteButton.onclick = null;
    }

    byId<HTMLButtonElement>("chooseLocation").hidden = false;
  }

  private renderProgress(operation: InstallOperation, progress: OperationProgress): void {
    byId<HTMLElement>("progressEyebrow").textContent = progress.stage.toUpperCase();
    byId<HTMLElement>("progressTitle").textContent = operations[operation].running;
    byId<HTMLElement>("progressPercent").textContent = `${progress.percent}%`;
    byId<HTMLElement>("progressBar").style.width = `${progress.percent}%`;
    byId<HTMLElement>("progressMessage").textContent = progress.message;
  }

  private setControlsDisabled(disabled: boolean): void {
    for (const button of document.querySelectorAll<HTMLButtonElement>("button")) {
      button.disabled = disabled;
    }
  }

  private showToast(message: string): void {
    const toast = byId<HTMLElement>("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 4200);
  }
}
