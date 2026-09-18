using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace BetterGravityInstaller;

public record InstallationState(
    string Kind,
    string? PatchState,
    string? Path,
    string? AntigravityVersion,
    string? BetterGravityVersion,
    bool NativePatchAvailable,
    string? Error
);

public record OperationProgress(
    int Percent,
    string Stage,
    string Message
);

public static class PatcherBridge
{
    private static string? _extractedTempDir;

    private static readonly string[] CandidateDirectories = new[]
    {
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Antigravity"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Antigravity"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Antigravity"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Antigravity"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Programs", "Antigravity"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "AppData", "Local", "Programs", "Antigravity"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "AppData", "Local", "Antigravity"),
    };

    public static string? TryFindFromRegistry()
    {
        string[] rootKeys = {
            @"Software\Microsoft\Windows\CurrentVersion\Uninstall",
            @"Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
        };

        RegistryKey[] hives = { Registry.CurrentUser, Registry.LocalMachine };

        foreach (var hive in hives)
        {
            foreach (var subKeyPath in rootKeys)
            {
                try
                {
                    using var key = hive.OpenSubKey(subKeyPath);
                    if (key == null) continue;

                    foreach (var subName in key.GetSubKeyNames())
                    {
                        try
                        {
                            using var appKey = key.OpenSubKey(subName);
                            if (appKey == null) continue;

                            var displayName = appKey.GetValue("DisplayName") as string;
                            if (displayName != null && displayName.Contains("Antigravity", StringComparison.OrdinalIgnoreCase) && !displayName.Contains("Antigravity IDE", StringComparison.OrdinalIgnoreCase))
                            {
                                var installLocation = appKey.GetValue("InstallLocation") as string;
                                if (!string.IsNullOrEmpty(installLocation))
                                {
                                    var trimmed = installLocation.Trim().TrimEnd('\\', '/');
                                    if (File.Exists(Path.Combine(trimmed, "Antigravity.exe")) || File.Exists(Path.Combine(trimmed, "antigravity.exe")))
                                    {
                                        return trimmed;
                                    }
                                }

                                var displayIcon = appKey.GetValue("DisplayIcon") as string;
                                if (!string.IsNullOrEmpty(displayIcon))
                                {
                                    var iconPath = displayIcon.Trim().Trim('\"');
                                    var dir = Path.GetDirectoryName(iconPath);
                                    if (!string.IsNullOrEmpty(dir) && (File.Exists(Path.Combine(dir, "Antigravity.exe")) || File.Exists(Path.Combine(dir, "antigravity.exe"))))
                                    {
                                        return dir;
                                    }
                                }
                            }
                        }
                        catch
                        {
                            // Skip individual unreadable subkeys
                        }
                    }
                }
                catch
                {
                    // Skip inaccessible hives or roots
                }
            }
        }
        return null;
    }

    public static string? FindAntigravityPath(string? hintPath = null)
    {
        if (!string.IsNullOrEmpty(hintPath))
        {
            if (File.Exists(Path.Combine(hintPath, "Antigravity.exe")) || File.Exists(Path.Combine(hintPath, "antigravity.exe")))
            {
                return hintPath;
            }
            var sub = Path.Combine(hintPath, "Antigravity");
            if (File.Exists(Path.Combine(sub, "Antigravity.exe")) || File.Exists(Path.Combine(sub, "antigravity.exe")))
            {
                return sub;
            }
        }

        foreach (var dir in CandidateDirectories)
        {
            if (Directory.Exists(dir) && (File.Exists(Path.Combine(dir, "Antigravity.exe")) || File.Exists(Path.Combine(dir, "antigravity.exe"))))
            {
                return dir;
            }
        }

        return TryFindFromRegistry();
    }

    public static bool IsAntigravityIdePath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return false;
        var trimmed = path.Trim().TrimEnd('\\', '/');
        var name = Path.GetFileName(trimmed);
        if (name.Equals("Antigravity IDE.exe", StringComparison.OrdinalIgnoreCase) ||
            name.Equals("Antigravity IDE", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (File.Exists(Path.Combine(trimmed, "Antigravity IDE.exe")) ||
            File.Exists(Path.Combine(trimmed, "antigravity ide.exe")))
        {
            return true;
        }

        var sub = Path.Combine(trimmed, "Antigravity IDE");
        if (File.Exists(Path.Combine(sub, "Antigravity IDE.exe")) ||
            File.Exists(Path.Combine(sub, "antigravity ide.exe")))
        {
            return true;
        }

        return false;
    }

    public static string? FindAntigravityIdePath()
    {
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);

        var ideCandidates = new[]
        {
            Path.Combine(localAppData, "Programs", "Antigravity IDE"),
            Path.Combine(localAppData, "Antigravity IDE"),
            Path.Combine(programFiles, "Antigravity IDE"),
            Path.Combine(programFilesX86, "Antigravity IDE"),
            Path.Combine(appData, "Programs", "Antigravity IDE")
        };

        foreach (var dir in ideCandidates)
        {
            if (Directory.Exists(dir) && IsAntigravityIdePath(dir))
            {
                return dir;
            }
        }

        try
        {
            var hives = new[] { Registry.CurrentUser, Registry.LocalMachine };
            var rootKeys = new[] { @"Software\Microsoft\Windows\CurrentVersion\Uninstall", @"Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall" };

            foreach (var hive in hives)
            {
                foreach (var subKeyPath in rootKeys)
                {
                    try
                    {
                        using var key = hive.OpenSubKey(subKeyPath);
                        if (key == null) continue;

                        foreach (var subName in key.GetSubKeyNames())
                        {
                            try
                            {
                                using var appKey = key.OpenSubKey(subName);
                                if (appKey == null) continue;

                                var displayName = appKey.GetValue("DisplayName") as string;
                                if (displayName != null && displayName.Contains("Antigravity IDE", StringComparison.OrdinalIgnoreCase))
                                {
                                    var installLocation = appKey.GetValue("InstallLocation") as string;
                                    if (!string.IsNullOrEmpty(installLocation))
                                    {
                                        var trimmed = installLocation.Trim().TrimEnd('\\', '/');
                                        if (IsAntigravityIdePath(trimmed)) return trimmed;
                                    }

                                    var displayIcon = appKey.GetValue("DisplayIcon") as string;
                                    if (!string.IsNullOrEmpty(displayIcon))
                                    {
                                        var iconPath = displayIcon.Trim().Trim('\"');
                                        var dir = Path.GetDirectoryName(iconPath);
                                        if (!string.IsNullOrEmpty(dir) && IsAntigravityIdePath(dir)) return dir;
                                    }
                                }
                            }
                            catch {}
                        }
                    }
                    catch {}
                }
            }
        }
        catch {}

        return null;
    }

    private static (string FileName, bool RunAsNode) ResolveRunner(string? targetInstallationPath)
    {
        // 1. If target installation path contains Antigravity executable, use it
        if (!string.IsNullOrEmpty(targetInstallationPath))
        {
            var hostExe = Path.Combine(targetInstallationPath, "Antigravity.exe");
            if (File.Exists(hostExe))
            {
                return (hostExe, true);
            }
            var hostExeLower = Path.Combine(targetInstallationPath, "antigravity.exe");
            if (File.Exists(hostExeLower))
            {
                return (hostExeLower, true);
            }
        }

        // 2. Try to locate Antigravity from standard candidate locations or Registry
        var foundDir = FindAntigravityPath(targetInstallationPath);
        if (!string.IsNullOrEmpty(foundDir))
        {
            var hostExe = Path.Combine(foundDir, "Antigravity.exe");
            if (File.Exists(hostExe))
            {
                return (hostExe, true);
            }
            var hostExeLower = Path.Combine(foundDir, "antigravity.exe");
            if (File.Exists(hostExeLower))
            {
                return (hostExeLower, true);
            }
        }

        // 3. Fallback to system node
        return ("node", false);
    }

    private static string GetPatcherScriptPath()
    {
        var activeFromBootstrapper = BootstrapperService.GetActivePatcherScriptPath();
        if (!string.IsNullOrEmpty(activeFromBootstrapper)) return activeFromBootstrapper;

        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var inPatcher = System.IO.Path.Combine(baseDir, "Patcher", "patcher-cli.cjs");
        if (File.Exists(inPatcher)) return inPatcher;

        // Fallback for dev / repo structure
        var inRepo = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "..", "..", "packages", "patcher", "dist", "native", "patcher-cli.cjs"));
        if (File.Exists(inRepo)) return inRepo;

        var inRepoPatcher = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "..", "..", "apps", "installer-windows", "Patcher", "patcher-cli.cjs"));
        if (File.Exists(inRepoPatcher)) return inRepoPatcher;

        var tempPatcher = ExtractEmbeddedPatcher();
        if (tempPatcher != null && File.Exists(System.IO.Path.Combine(tempPatcher, "patcher-cli.cjs")))
        {
            return System.IO.Path.Combine(tempPatcher, "patcher-cli.cjs");
        }

        return inPatcher;
    }

    private static string GetRuntimeSourcePath()
    {
        var activeRuntimeFromBootstrapper = BootstrapperService.GetActiveRuntimeDirectory();
        if (!string.IsNullOrEmpty(activeRuntimeFromBootstrapper)) return activeRuntimeFromBootstrapper;

        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var inPatcher = System.IO.Path.Combine(baseDir, "Patcher", "runtime");
        if (Directory.Exists(inPatcher) && File.Exists(System.IO.Path.Combine(inPatcher, "main.cjs"))) return inPatcher;

        var inRepo = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "..", "..", "apps", "installer", "dist-electron", "runtime"));
        if (Directory.Exists(inRepo) && File.Exists(System.IO.Path.Combine(inRepo, "main.cjs"))) return inRepo;

        var inRepoDist = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "..", "..", "packages", "runtime", "dist"));
        if (Directory.Exists(inRepoDist) && File.Exists(System.IO.Path.Combine(inRepoDist, "main.cjs"))) return inRepoDist;

        var tempRuntime = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "BetterGravity", "Patcher", "runtime");
        if (Directory.Exists(tempRuntime) && File.Exists(System.IO.Path.Combine(tempRuntime, "main.cjs"))) return tempRuntime;

        var tempPatcher = ExtractEmbeddedPatcher();
        if (tempPatcher != null)
        {
            var extractedRuntime = System.IO.Path.Combine(tempPatcher, "runtime");
            if (Directory.Exists(extractedRuntime) && File.Exists(System.IO.Path.Combine(extractedRuntime, "main.cjs")))
            {
                return extractedRuntime;
            }
        }

        return inPatcher;
    }

    private static string? ExtractEmbeddedPatcher()
    {
        if (_extractedTempDir != null && Directory.Exists(_extractedTempDir))
        {
            return _extractedTempDir;
        }

        try
        {
            var tempDir = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "BetterGravity", "Patcher");
            var runtimeDir = System.IO.Path.Combine(tempDir, "runtime");
            Directory.CreateDirectory(runtimeDir);

            var assembly = typeof(PatcherBridge).Assembly;
            foreach (var name in assembly.GetManifestResourceNames())
            {
                if (name.Contains("Patcher."))
                {
                    string targetFile;
                    if (name.Contains(".runtime."))
                    {
                        var fileName = name.Substring(name.IndexOf(".runtime.") + 9);
                        targetFile = System.IO.Path.Combine(runtimeDir, fileName);
                    }
                    else
                    {
                        var fileName = name.Substring(name.IndexOf(".Patcher.") + 9);
                        targetFile = System.IO.Path.Combine(tempDir, fileName);
                    }

                    using var stream = assembly.GetManifestResourceStream(name);
                    if (stream != null)
                    {
                        using var fileStream = File.Create(targetFile);
                        stream.CopyTo(fileStream);
                    }
                }
            }
            _extractedTempDir = tempDir;
            return tempDir;
        }
        catch
        {
            return null;
        }
    }

    private static ProcessStartInfo CreateNodeStartInfo(string args, string? targetInstallationPath = null)
    {
        var (exe, runAsNode) = ResolveRunner(targetInstallationPath);

        var psi = new ProcessStartInfo
        {
            FileName = exe,
            Arguments = args,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        if (runAsNode)
        {
            psi.Environment["ELECTRON_RUN_AS_NODE"] = "1";
        }

        return psi;
    }

    public static async Task<string?> DetectAsync()
    {
        // 1. Instant native detection: check known locations and registry
        var nativeFound = FindAntigravityPath();
        if (!string.IsNullOrEmpty(nativeFound))
        {
            return nativeFound;
        }

        // 2. Fallback: try executing patcher-cli detect
        try
        {
            var script = GetPatcherScriptPath();
            if (File.Exists(script))
            {
                var psi = CreateNodeStartInfo($"\"{script}\" detect");
                using var proc = Process.Start(psi);
                if (proc != null)
                {
                    var output = await proc.StandardOutput.ReadToEndAsync();
                    await proc.WaitForExitAsync();

                    if (!string.IsNullOrWhiteSpace(output))
                    {
                        using var doc = JsonDocument.Parse(output.Trim());
                        if (doc.RootElement.TryGetProperty("path", out var pathProp) && pathProp.ValueKind == JsonValueKind.String)
                        {
                            var detected = pathProp.GetString();
                            if (!string.IsNullOrEmpty(detected) && Directory.Exists(detected))
                            {
                                return detected;
                            }
                        }
                    }
                }
            }
        }
        catch
        {
            // Ignore script failure and continue to final fallback
        }

        // 3. Last fallback: standard Windows location
        var standard = System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Programs", "Antigravity");
        if (Directory.Exists(standard)) return standard;

        // 4. Check if Antigravity IDE is present so user receives an informative message
        var ideFound = FindAntigravityIdePath();
        if (!string.IsNullOrEmpty(ideFound)) return ideFound;

        return null;
    }

    public static async Task<InstallationState> InspectAsync(string installationPath)
    {
        if (IsAntigravityIdePath(installationPath))
        {
            return new InstallationState(
                "unsupported-ide",
                "unknown",
                installationPath,
                null,
                null,
                false,
                "Antigravity IDE (VS Code editor) is not supported yet. BetterGravity currently targets the standalone Antigravity 2.0 desktop application.");
        }

        try
        {
            var script = GetPatcherScriptPath();
            var psi = CreateNodeStartInfo($"\"{script}\" inspect \"{installationPath}\"", installationPath);
            using var proc = Process.Start(psi);
            if (proc == null) return new InstallationState("not-found", "unknown", installationPath, null, null, false, "Failed to start inspector process.");

            var outputTask = proc.StandardOutput.ReadToEndAsync();
            var errorTask = proc.StandardError.ReadToEndAsync();
            await proc.WaitForExitAsync();

            var output = await outputTask;
            var error = await errorTask;

            if (!string.IsNullOrWhiteSpace(output))
            {
                using var doc = JsonDocument.Parse(output.Trim());
                if (doc.RootElement.TryGetProperty("installation", out var inst))
                {
                    string kind = inst.GetProperty("kind").GetString() ?? "not-found";
                    string? patchState = inst.TryGetProperty("patchState", out var ps) ? ps.GetString() : null;
                    string? path = inst.TryGetProperty("path", out var p) ? p.GetString() : installationPath;
                    string? hostVer = inst.TryGetProperty("antigravityVersion", out var hv) ? hv.GetString() : null;
                    string? bgVer = inst.TryGetProperty("betterGravityVersion", out var bv) ? bv.GetString() : null;
                    bool nativeAvailable = inst.TryGetProperty("nativePatchAvailable", out var na) && na.GetBoolean();
                    string? inspectError = inst.TryGetProperty("error", out var err) ? err.GetString() : null;

                    return new InstallationState(kind, patchState, path, hostVer, bgVer, nativeAvailable, inspectError ?? (proc.ExitCode != 0 ? error : null));
                }
            }

            return new InstallationState("not-found", "unknown", installationPath, null, null, false, !string.IsNullOrWhiteSpace(error) ? error.Trim() : "Inspection produced no output.");
        }
        catch (Exception ex)
        {
            return new InstallationState("not-found", "unknown", installationPath, null, null, false, ex.Message);
        }
    }

    public static async Task<(bool Success, string Message, InstallationState? FinalState)> RunOperationAsync(
        string operation,
        string installationPath,
        Action<OperationProgress> onProgress)
    {
        try
        {
            await BootstrapperService.EnsureSyncedAsync();

            var script = GetPatcherScriptPath();
            var runtimeSource = GetRuntimeSourcePath();
            var psi = CreateNodeStartInfo($"\"{script}\" run {operation} \"{installationPath}\" \"{runtimeSource}\"", installationPath);

            using var proc = Process.Start(psi);
            if (proc == null) return (false, "Could not start patcher process.", null);

            string? finalMessage = null;
            bool isSuccess = false;
            InstallationState? finalState = null;

            var errBuilder = new StringBuilder();
            proc.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null) errBuilder.AppendLine(e.Data);
            };
            proc.BeginErrorReadLine();

            string? line;
            while ((line = await proc.StandardOutput.ReadLineAsync()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                try
                {
                    using var doc = JsonDocument.Parse(line);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("type", out var typeProp))
                    {
                        var type = typeProp.GetString();
                        if (type == "progress")
                        {
                            int percent = root.GetProperty("percent").GetInt32();
                            string stage = root.GetProperty("stage").GetString() ?? "";
                            string msg = root.GetProperty("message").GetString() ?? "";
                            onProgress(new OperationProgress(percent, stage, msg));
                        }
                        else if (type == "result")
                        {
                            isSuccess = root.GetProperty("success").GetBoolean();
                            finalMessage = root.GetProperty("message").GetString();
                        }
                    }
                }
                catch
                {
                    // Ignore non-json lines
                }
            }

            await proc.WaitForExitAsync();

            var errText = errBuilder.ToString().Trim();
            if (!isSuccess && string.IsNullOrEmpty(finalMessage) && !string.IsNullOrEmpty(errText))
            {
                finalMessage = errText;
            }

            // Refresh state after operation
            finalState = await InspectAsync(installationPath);
            return (isSuccess, finalMessage ?? "Operation finished.", finalState);
        }
        catch (Exception ex)
        {
            return (false, ex.Message, null);
        }
    }
}
