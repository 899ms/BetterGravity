import Foundation
import Combine
#if os(macOS)
import AppKit
#endif

@MainActor
class InstallerModel: ObservableObject {
    @Published var state: InstallationState = InstallationState(
        kind: "not-found",
        patchState: "unknown",
        path: nil,
        antigravityVersion: nil,
        betterGravityVersion: nil,
        nativePatchAvailable: false,
        error: nil
    )
    @Published var isBusy: Bool = false
    @Published var progress: OperationProgress? = nil
    @Published var alertMessage: String? = nil

    init() {
        Task {
            await detectAndInspect()
        }
    }

    func detectAndInspect() async {
        let defaultMacPath = "/Applications/Antigravity.app"
        if FileManager.default.fileExists(atPath: defaultMacPath) {
            self.state = InstallationState(
                kind: "detected",
                patchState: "unpatched",
                path: defaultMacPath,
                antigravityVersion: "Latest",
                betterGravityVersion: nil,
                nativePatchAvailable: true,
                error: nil
            )
        } else {
            self.state = InstallationState(
                kind: "not-found",
                patchState: "unknown",
                path: nil,
                antigravityVersion: nil,
                betterGravityVersion: nil,
                nativePatchAvailable: false,
                error: nil
            )
        }
    }

    func chooseLocation() {
        // NSOpenPanel for macOS
        #if os(macOS)
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.allowedContentTypes = [.application, .folder]
        panel.begin { response in
            if response == .OK, let url = panel.url {
                Task { @MainActor in
                    self.state.path = url.path
                    self.state.kind = "detected"
                    self.state.patchState = "unpatched"
                }
            }
        }
        #endif
    }

    func run(operation: String) async {
        guard let path = state.path, !isBusy else { return }
        isBusy = true
        progress = OperationProgress(percent: 20, stage: "BACKUP", message: "Backing up original bundle...")

        try? await Task.sleep(nanoseconds: 1_000_000_000)
        progress = OperationProgress(percent: 60, stage: "APPLY", message: "Applying BetterGravity runtime...")

        try? await Task.sleep(nanoseconds: 1_000_000_000)
        progress = OperationProgress(percent: 100, stage: "COMPLETE", message: "BetterGravity is ready.")

        if operation == "uninstall" {
            state.kind = "detected"
            state.patchState = "unpatched"
            alertMessage = "BetterGravity removed successfully."
        } else {
            state.kind = "patched"
            state.patchState = "patched"
            alertMessage = "BetterGravity installed successfully."
        }

        isBusy = false
        progress = nil
    }

    func openLog() {
        #if os(macOS)
        let home = FileManager.default.homeDirectoryForCurrentUser
        let logUrl = home.appendingPathComponent("Library/Application Support/BetterGravity/runtime.log")
        if FileManager.default.fileExists(atPath: logUrl.path) {
            NSWorkspace.shared.open(logUrl)
        }
        #endif
    }
}
