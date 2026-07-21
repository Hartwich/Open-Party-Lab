using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

internal static class Launcher
{
    [STAThread]
    private static int Main()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string nodePath = Path.Combine(root, "runtime", "node.exe");
        string appRoot = Path.Combine(root, "app");
        string serverPath = Path.Combine(appRoot, "server", "main.js");
        string logPath = Path.Combine(root, "open-party-lab.log");

        if (!File.Exists(nodePath) || !File.Exists(serverPath))
        {
            System.Windows.Forms.MessageBox.Show(
                "The portable package is incomplete. Please extract the complete ZIP before starting Open Party Lab.",
                "Open Party Lab",
                System.Windows.Forms.MessageBoxButtons.OK,
                System.Windows.Forms.MessageBoxIcon.Error);
            return 1;
        }

        var startInfo = new ProcessStartInfo(nodePath, "\"" + serverPath + "\"")
        {
            WorkingDirectory = appRoot,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        startInfo.EnvironmentVariables["NODE_ENV"] = "production";
        startInfo.EnvironmentVariables["OPEN_PARTY_LAB_WEB_ROOT"] = Path.Combine(appRoot, "web");

        using (var log = new StreamWriter(logPath, true))
        using (var server = new Process { StartInfo = startInfo, EnableRaisingEvents = true })
        {
            server.OutputDataReceived += delegate(object sender, DataReceivedEventArgs args) { if (args.Data != null) { log.WriteLine(args.Data); log.Flush(); } };
            server.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs args) { if (args.Data != null) { log.WriteLine(args.Data); log.Flush(); } };

            try
            {
                server.Start();
                server.BeginOutputReadLine();
                server.BeginErrorReadLine();
            }
            catch (Exception error)
            {
                System.Windows.Forms.MessageBox.Show(error.Message, "Open Party Lab", System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return 1;
            }

            bool ready = false;
            for (int attempt = 0; attempt < 50 && !server.HasExited; attempt++)
            {
                try
                {
                    var request = WebRequest.CreateHttp("http://127.0.0.1:3000/health");
                    request.Timeout = 250;
                    using (request.GetResponse()) { ready = true; }
                    if (ready) break;
                }
                catch { Thread.Sleep(100); }
            }

            if (!ready)
            {
                System.Windows.Forms.MessageBox.Show(
                    "Open Party Lab could not start. Check open-party-lab.log; port 3000 may already be in use.",
                    "Open Party Lab",
                    System.Windows.Forms.MessageBoxButtons.OK,
                    System.Windows.Forms.MessageBoxIcon.Error);
                if (!server.HasExited) server.Kill();
                return 1;
            }

            Process.Start(new ProcessStartInfo("http://127.0.0.1:3000/") { UseShellExecute = true });
            server.WaitForExit();
            return server.ExitCode;
        }
    }
}
