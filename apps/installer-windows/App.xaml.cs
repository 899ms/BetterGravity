using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows;

namespace BetterGravityInstaller;

public partial class App : Application
{
    protected override async void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        string? capturePath = null;
        var cmd = Environment.CommandLine;
        int idx = cmd.IndexOf("--capture");
        if (idx >= 0)
        {
            capturePath = cmd.Substring(idx + 9).Trim().Trim('"');
        }

        var window = new MainWindow();
        window.Show();

        if (!string.IsNullOrEmpty(capturePath))
        {
            await Task.Delay(2000);
            window.CaptureAndSave(capturePath);
            Shutdown(0);
        }
    }
}
