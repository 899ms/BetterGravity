import SwiftUI
#if os(macOS)
import AppKit
#endif

struct ContentView: View {
    @ObservedObject var model: InstallerModel

    var body: some View {
        VStack(spacing: 0) {
            // Header / Titlebar
            HStack(spacing: 10) {
                Image(systemName: "wrench.and.screwdriver")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 22, height: 22)
                    .foregroundColor(Color(red: 0.54, green: 0.71, blue: 0.97)) // Google blue

                VStack(alignment: .leading, spacing: 1) {
                    Text("BetterGravity")
                        .font(.system(size: 13.5, weight: .medium))
                        .foregroundColor(Color(red: 0.945, green: 0.953, blue: 0.957))
                    Text("INSTALLER")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                }

                Spacer()

                Text("v2.0.2")
                    .font(.system(size: 11, weight: .regular, design: .monospaced))
                    .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 14)
            .background(Color(red: 0.067, green: 0.071, blue: 0.078)) // #111214

            // Main Body
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    // Welcome
                    VStack(alignment: .leading, spacing: 3) {
                        Text(model.state.kind == "needs-repatch" ? "Antigravity changed." : (model.state.kind == "patched" ? "BetterGravity is installed." : "Antigravity is ready."))
                            .font(.system(size: 24, weight: .medium))
                            .foregroundColor(Color(red: 0.945, green: 0.953, blue: 0.957))

                        Text(model.state.kind == "needs-repatch"
                             ? "An update replaced the patched bundle. Reapply BetterGravity to get it back."
                             : (model.state.kind == "patched"
                                ? "Open Antigravity, then find BetterGravity in Settings to add themes and plugins."
                                : "A supported Antigravity installation was found. BetterGravity is not installed yet."))
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 0.769, green: 0.780, blue: 0.773))
                    }

                    // Status Card (Border-free)
                    HStack(spacing: 14) {
                        Circle()
                            .fill(Color(red: 0.141, green: 0.149, blue: 0.173)) // #24262c
                            .frame(width: 42, height: 42)
                            .overlay(
                                Text("AG")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(Color(red: 0.769, green: 0.780, blue: 0.773))
                            )

                        VStack(alignment: .leading, spacing: 2) {
                            Text("ANTIGRAVITY")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                            Text(model.state.antigravityVersion != nil ? "Version \(model.state.antigravityVersion!)" : "Detecting version…")
                                .font(.system(size: 13.5, weight: .medium))
                                .foregroundColor(Color(red: 0.945, green: 0.953, blue: 0.957))
                            Text(model.state.path ?? "Scanning standard installation locations…")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                                .lineLimit(1)
                        }

                        Spacer()

                        // Status Dot Indicator (Border-free minimal indicator)
                        Circle()
                            .fill(model.state.kind == "patched"
                                  ? Color(red: 0.506, green: 0.788, blue: 0.584) // #81c995
                                  : (model.state.kind == "corrupted"
                                     ? Color(red: 0.949, green: 0.545, blue: 0.510) // #f28b82
                                     : Color(red: 0.992, green: 0.839, blue: 0.388))) // #fdd663
                            .frame(width: 8, height: 8)
                            .padding(8)
                            .help(model.state.kind == "patched" ? "Active" : (model.state.kind == "needs-repatch" ? "Needs Repatch" : "Unpatched"))
                    }
                    .padding(14)
                    .background(Color(red: 0.094, green: 0.098, blue: 0.114)) // #18191d
                    .cornerRadius(16)

                    // 3 Horizontal Action Cards (Border-free)
                    VStack(spacing: 9) {
                        // Action 1: Install / Reapply
                        Button {
                            Task { await model.run(operation: model.state.kind == "needs-repatch" ? "update" : "install") }
                        } label: {
                            HStack(spacing: 14) {
                                Circle()
                                    .fill(Color(red: 0.118, green: 0.192, blue: 0.329)) // #1e3154
                                    .frame(width: 42, height: 42)
                                    .overlay(
                                        Image(systemName: model.state.kind == "needs-repatch" ? "arrow.triangle.2.circlepath" : "arrow.down")
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundColor(Color(red: 0.541, green: 0.706, blue: 0.973)) // #8ab4f8
                                    )

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(model.state.kind == "needs-repatch" ? "Reapply BetterGravity" : "Install BetterGravity")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(Color(red: 0.945, green: 0.953, blue: 0.957))
                                    Text(model.state.kind == "needs-repatch" ? "Antigravity changed. Patch the new version." : "Back up original bundle, then patch Antigravity.")
                                        .font(.system(size: 11.5))
                                        .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                                }

                                Spacer()

                                Circle()
                                    .fill(Color(red: 0.118, green: 0.192, blue: 0.329))
                                    .frame(width: 32, height: 32)
                                    .overlay(
                                        Image(systemName: "arrow.right")
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundColor(Color(red: 0.541, green: 0.706, blue: 0.973))
                                    )
                            }
                            .padding(.horizontal, 16)
                            .frame(height: 66)
                            .background(Color(red: 0.090, green: 0.141, blue: 0.231)) // #17243b
                            .cornerRadius(16)
                        }
                        .buttonStyle(.plain)
                        .disabled(model.state.kind == "patched" || model.isBusy)

                        // Action 2: Reinstall
                        Button {
                            Task { await model.run(operation: "reinstall") }
                        } label: {
                            HStack(spacing: 14) {
                                Circle()
                                    .fill(Color(red: 0.141, green: 0.149, blue: 0.173))
                                    .frame(width: 42, height: 42)
                                    .overlay(
                                        Image(systemName: "arrow.clockwise")
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                                    )

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Reinstall BetterGravity")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(Color(red: 0.945, green: 0.953, blue: 0.957))
                                    Text("Rebuild the patch from the original backup bundle.")
                                        .font(.system(size: 11.5))
                                        .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                                }

                                Spacer()

                                Circle()
                                    .fill(Color(red: 0.141, green: 0.149, blue: 0.173))
                                    .frame(width: 32, height: 32)
                                    .overlay(
                                        Image(systemName: "arrow.right")
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                                    )
                            }
                            .padding(.horizontal, 16)
                            .frame(height: 66)
                            .background(Color(red: 0.102, green: 0.106, blue: 0.118)) // #1a1b1e
                            .cornerRadius(16)
                        }
                        .buttonStyle(.plain)
                        .disabled(model.state.kind != "patched" || model.isBusy)

                        // Action 3: Delete
                        Button {
                            Task { await model.run(operation: "uninstall") }
                        } label: {
                            HStack(spacing: 14) {
                                Circle()
                                    .fill(Color(red: 0.169, green: 0.094, blue: 0.102)) // #2b181a
                                    .frame(width: 42, height: 42)
                                    .overlay(
                                        Image(systemName: "trash")
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundColor(Color(red: 0.949, green: 0.545, blue: 0.510))
                                    )

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Delete BetterGravity")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(Color(red: 0.945, green: 0.953, blue: 0.957))
                                    Text("Restore Antigravity to stock. Themes and plugins are kept.")
                                        .font(.system(size: 11.5))
                                        .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                                }

                                Spacer()

                                Circle()
                                    .fill(Color(red: 0.169, green: 0.094, blue: 0.102))
                                    .frame(width: 32, height: 32)
                                    .overlay(
                                        Image(systemName: "arrow.right")
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundColor(Color(red: 0.949, green: 0.545, blue: 0.510))
                                    )
                            }
                            .padding(.horizontal, 16)
                            .frame(height: 66)
                            .background(Color(red: 0.102, green: 0.106, blue: 0.118))
                            .cornerRadius(16)
                        }
                        .buttonStyle(.plain)
                        .disabled(model.state.kind == "not-found" || model.state.kind == "detected" || model.isBusy)
                    }

                    // Choose location pill button (Border-free)
                    Button {
                        model.chooseLocation()
                    } label: {
                        HStack(spacing: 7) {
                            Image(systemName: "folder")
                                .font(.system(size: 12))
                                .foregroundColor(Color(red: 0.502, green: 0.525, blue: 0.545))
                            Text("Choose a different installation folder…")
                                .font(.system(size: 11.5, weight: .medium))
                                .foregroundColor(Color(red: 0.604, green: 0.627, blue: 0.651))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 7)
                        .background(Color(red: 0.110, green: 0.114, blue: 0.129)) // #1c1d21
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 4)

                    // Progress Panel (Border-free)
                    if let progress = model.progress {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(progress.stage.uppercased())
                                    .font(.system(size: 9.5, weight: .semibold))
                                    .foregroundColor(Color(red: 0.541, green: 0.706, blue: 0.973))
                                Spacer()
                                Text("\(progress.percent)%")
                                    .font(.system(size: 11.5, design: .monospaced))
                                    .foregroundColor(Color(red: 0.541, green: 0.706, blue: 0.973))
                            }
                            ProgressView(value: Double(progress.percent), total: 100)
                                .accentColor(Color(red: 0.541, green: 0.706, blue: 0.973))
                            Text(progress.message)
                                .font(.system(size: 11.5))
                                .foregroundColor(Color(red: 0.557, green: 0.569, blue: 0.561))
                        }
                        .padding(16)
                        .background(Color(red: 0.094, green: 0.098, blue: 0.114))
                        .cornerRadius(16)
                    }
                }
                .padding(24)
            }

            // Footer (Border-free)
            HStack {
                // Security assurance pill badge
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundColor(Color(red: 0.506, green: 0.788, blue: 0.584)) // #81c995
                        .font(.system(size: 13))
                    Text("Original bundle is safely backed up before patching")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(red: 0.506, green: 0.788, blue: 0.584))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 5)
                .background(Color(red: 0.078, green: 0.129, blue: 0.094)) // #142118
                .clipShape(Capsule())

                Spacer()

                HStack(spacing: 8) {
                    Button("Runtime log") {
                        model.openLog()
                    }
                    .buttonStyle(.plain)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(red: 0.769, green: 0.780, blue: 0.773))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(Color(red: 0.110, green: 0.114, blue: 0.129))
                    .clipShape(Capsule())

                    Button("Close") {
                        #if os(macOS)
                        NSApplication.shared.terminate(nil)
                        #endif
                    }
                    .buttonStyle(.plain)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(red: 0.769, green: 0.780, blue: 0.773))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(Color(red: 0.110, green: 0.114, blue: 0.129))
                    .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color(red: 0.067, green: 0.071, blue: 0.078))
        }
        .frame(width: 720, height: 640)
        .background(Color(red: 0.075, green: 0.075, blue: 0.078))
    }
}
