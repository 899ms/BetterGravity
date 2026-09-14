using System;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

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
    private static string GetPatcherScriptPath()
    {
        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var inPatcher = System.IO.Path.Combine(baseDir, "Patcher", "patcher-cli.cjs");
        if (File.Exists(inPatcher)) return inPatcher;

        // Fallback for dev / repo structure
        var inRepo = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "..", "..", "packages", "patcher", "dist", "native", "patcher-cli.cjs"));
        if (File.Exists(inRepo)) return inRepo;

        var tempPatcher = ExtractEmbeddedPatcher();
        if (tempPatcher != null && File.Exists(System.IO.Path.Combine(tempPatcher, "patcher-cli.cjs")))
        {
            return System.IO.Path.Combine(tempPatcher, "patcher-cli.cjs");
        }

        return inPatcher;
    }

    private static string GetRuntimeSourcePath()
    {
        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var inPatcher = System.IO.Path.Combine(baseDir, "Patcher", "runtime");
        if (Directory.Exists(inPatcher)) return inPatcher;

        var inRepo = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "..", "..", "apps", "installer", "dist-electron", "runtime"));
        if (Directory.Exists(inRepo)) return inRepo;

        var tempRuntime = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "BetterGravity", "Patcher", "runtime");
        if (Directory.Exists(tempRuntime)) return tempRuntime;

        return inPatcher;
    }

    private static string? ExtractEmbeddedPatcher()
    {
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
            return tempDir;
        }
        catch
        {
            return null;
        }
    }

    private static ProcessStartInfo CreateNodeStartInfo(string args, string? targetInstallationPath = null)
    {
        // Try system node first, fallback to Antigravity.exe with ELECTRON_RUN_AS_NODE=1
        string exe = "node";
        var psi = new ProcessStartInfo
        {
            FileName = exe,
            Arguments = args,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        if (!string.IsNullOrEmpty(targetInstallationPath))
        {
            var hostExe = System.IO.Path.Combine(targetInstallationPath, "Antigravity.exe");
            if (File.Exists(hostExe))
            {
                psi.Environment["ELECTRON_RUN_AS_NODE"] = "1";
            }
        }

        return psi;
    }

    public static async Task<string?> DetectAsync()
    {
        try
        {
            var script = GetPatcherScriptPath();
            if (!File.Exists(script)) return null;

            var psi = CreateNodeStartInfo($"\"{script}\" detect");
            using var proc = Process.Start(psi);
            if (proc == null) return null;

            var output = await proc.StandardOutput.ReadToEndAsync();
            await proc.WaitForExitAsync();

            using var doc = JsonDocument.Parse(output.Trim());
            if (doc.RootElement.TryGetProperty("path", out var pathProp) && pathProp.ValueKind == JsonValueKind.String)
            {
                return pathProp.GetString();
            }
        }
        catch
        {
            // Fallback: standard Windows location
            var standard = System.IO.Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs", "Antigravity");
            if (Directory.Exists(standard)) return standard;
        }

        return null;
    }

    public static async Task<InstallationState> InspectAsync(string installationPath)
    {
        try
        {
            var script = GetPatcherScriptPath();
            var psi = CreateNodeStartInfo($"\"{script}\" inspect \"{installationPath}\"", installationPath);
            using var proc = Process.Start(psi);
            if (proc == null) return new InstallationState("not-found", "unknown", installationPath, null, null, false, "Failed to start inspector.");

            var output = await proc.StandardOutput.ReadToEndAsync();
            await proc.WaitForExitAsync();

            using var doc = JsonDocument.Parse(output.Trim());
            if (doc.RootElement.TryGetProperty("installation", out var inst))
            {
                string kind = inst.GetProperty("kind").GetString() ?? "not-found";
                string? patchState = inst.TryGetProperty("patchState", out var ps) ? ps.GetString() : null;
                string? path = inst.TryGetProperty("path", out var p) ? p.GetString() : installationPath;
                string? hostVer = inst.TryGetProperty("antigravityVersion", out var hv) ? hv.GetString() : null;
                string? bgVer = inst.TryGetProperty("betterGravityVersion", out var bv) ? bv.GetString() : null;
                bool nativeAvailable = inst.TryGetProperty("nativePatchAvailable", out var na) && na.GetBoolean();
                string? error = inst.TryGetProperty("error", out var err) ? err.GetString() : null;

                return new InstallationState(kind, patchState, path, hostVer, bgVer, nativeAvailable, error);
            }
        }
        catch (Exception ex)
        {
            return new InstallationState("not-found", "unknown", installationPath, null, null, false, ex.Message);
        }

        return new InstallationState("not-found", "unknown", installationPath, null, null, false, "Unknown inspection failure.");
    }

    public static async Task<(bool Success, string Message, InstallationState? FinalState)> RunOperationAsync(
        string operation,
        string installationPath,
        Action<OperationProgress> onProgress)
    {
        try
        {
            var script = GetPatcherScriptPath();
            var runtimeSource = GetRuntimeSourcePath();
            var psi = CreateNodeStartInfo($"\"{script}\" run {operation} \"{installationPath}\" \"{runtimeSource}\"", installationPath);

            using var proc = Process.Start(psi);
            if (proc == null) return (false, "Could not start patcher process.", null);

            string? finalMessage = null;
            bool isSuccess = false;
            InstallationState? finalState = null;

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
