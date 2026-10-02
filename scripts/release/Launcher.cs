using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

internal static class Launcher
{
    private static bool IsPrivateIPv4(IPAddress address)
    {
        byte[] bytes = address.GetAddressBytes();
        return bytes.Length == 4 && (
            bytes[0] == 10 ||
            (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
            (bytes[0] == 192 && bytes[1] == 168));
    }

    private static string FindLanIPv4(bool wirelessOnly)
    {
        foreach (NetworkInterface networkInterface in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (
                networkInterface.OperationalStatus != OperationalStatus.Up ||
                networkInterface.NetworkInterfaceType == NetworkInterfaceType.Loopback ||
                networkInterface.NetworkInterfaceType == NetworkInterfaceType.Tunnel ||
                (wirelessOnly && networkInterface.NetworkInterfaceType != NetworkInterfaceType.Wireless80211))
            {
                continue;
            }

            foreach (UnicastIPAddressInformation addressInfo in networkInterface.GetIPProperties().UnicastAddresses)
            {
                if (addressInfo.Address.AddressFamily == AddressFamily.InterNetwork && IsPrivateIPv4(addressInfo.Address))
                {
                    return addressInfo.Address.ToString();
                }
            }
        }

        return null;
    }

    private static string FindLanIPv4()
    {
        return FindLanIPv4(true) ?? FindLanIPv4(false);
    }

    [STAThread]
    private static int Main(string[] args)
    {
        bool checkOnly = Array.IndexOf(args, "--check") >= 0;
        try
        {
            using (var singleInstance = new Mutex(false, "Local\\OpenPartyLabPortable"))
            {
                if (!singleInstance.WaitOne(0))
                    throw new Exception("Open Party Lab is already running. Close its launcher window before starting again.");
                try { return Run(checkOnly); }
                finally { singleInstance.ReleaseMutex(); }
            }
        }
        catch (Exception error)
        {
            if (!checkOnly) MessageBox.Show(error.Message, "Open Party Lab", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    private static int Run(bool checkOnly)
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string nodePath = Path.Combine(root, "runtime", "node.exe");
        string appRoot = Path.Combine(root, "app");
        string serverPath = Path.Combine(appRoot, "server", "main.js");
        string logPath = Path.Combine(root, "open-party-lab.log");
        string lanIp = FindLanIPv4();
        string publicHost = lanIp ?? "127.0.0.1";
        string hostUrl = "http://" + publicHost + ":3000/";
        string controllerOrigin = hostUrl + "controller/";

        if (!File.Exists(nodePath) || !File.Exists(serverPath))
        {
            throw new Exception("The portable package is incomplete. Please extract the complete ZIP before starting Open Party Lab.");
        }

        // Do not mistake another service's /health response for our own server.
        var portProbe = new TcpListener(IPAddress.Any, 3000);
        try { portProbe.Start(); }
        catch (SocketException) { throw new Exception("Port 3000 is already in use. Stop the other Open Party Lab server or application first."); }
        finally { portProbe.Stop(); }

        var startInfo = new ProcessStartInfo(nodePath, "\"" + serverPath + "\"")
        {
            WorkingDirectory = appRoot,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        startInfo.EnvironmentVariables["NODE_ENV"] = "production";
        startInfo.EnvironmentVariables["PORT"] = "3000";
        startInfo.EnvironmentVariables["HOST"] = "0.0.0.0";
        startInfo.EnvironmentVariables["RENDER"] = "false";
        startInfo.EnvironmentVariables["RENDER_EXTERNAL_URL"] = "";
        startInfo.EnvironmentVariables["NODE_OPTIONS"] = "";
        startInfo.EnvironmentVariables["NODE_PATH"] = "";
        startInfo.EnvironmentVariables["OPEN_PARTY_LAB_WEB_ROOT"] = Path.Combine(appRoot, "web");
        startInfo.EnvironmentVariables["PUBLIC_CONTROLLER_ORIGIN"] = controllerOrigin;

        using (var log = TextWriter.Synchronized(new StreamWriter(logPath, true) { AutoFlush = true }))
        using (var server = new Process { StartInfo = startInfo, EnableRaisingEvents = true })
        {
            log.WriteLine("Host URL: " + hostUrl);
            log.WriteLine("Controller URL: " + controllerOrigin);
            log.Flush();

            server.OutputDataReceived += delegate(object sender, DataReceivedEventArgs args) { if (args.Data != null) { log.WriteLine(args.Data); log.Flush(); } };
            server.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs args) { if (args.Data != null) { log.WriteLine(args.Data); log.Flush(); } };

            server.Start();
            try
            {
                server.BeginOutputReadLine();
                server.BeginErrorReadLine();
                bool ready = false;
                for (int attempt = 0; attempt < 50 && !server.HasExited; attempt++)
                {
                    try
                    {
                        var request = WebRequest.CreateHttp("http://127.0.0.1:3000/health");
                        request.Proxy = null;
                        request.Timeout = 250;
                        using (request.GetResponse()) { ready = true; }
                        if (ready) break;
                    }
                    catch { Thread.Sleep(100); }
                }

                if (!ready)
                {
                    throw new Exception("Open Party Lab could not start. Check open-party-lab.log for the exact server error.");
                }

                if (checkOnly) return 0;

                if (lanIp == null)
                {
                    System.Windows.Forms.MessageBox.Show(
                        "No private LAN IPv4 address was detected. Open Party Lab will use localhost, so phone controllers cannot connect until the computer is connected to a LAN or Wi-Fi network.",
                        "Open Party Lab",
                        System.Windows.Forms.MessageBoxButtons.OK,
                        System.Windows.Forms.MessageBoxIcon.Warning);
                }

                Application.EnableVisualStyles();
                using (var window = new Form())
                using (var timer = new System.Windows.Forms.Timer { Interval = 1000 })
                {
                    window.Text = "Open Party Lab";
                    window.ClientSize = new System.Drawing.Size(460, 190);
                    window.FormBorderStyle = FormBorderStyle.FixedDialog;
                    window.MaximizeBox = false;
                    window.StartPosition = FormStartPosition.CenterScreen;
                    var label = new Label {
                        Text = "Open Party Lab is running.\r\n\r\nPhones: same Wi-Fi\r\n" + controllerOrigin + "\r\n\r\nClose this window to stop.",
                        Left = 16, Top = 16, Width = 430, Height = 110
                    };
                    var open = new Button { Text = "Open", Left = 16, Top = 142, Width = 180 };
                    open.Click += delegate { Process.Start(new ProcessStartInfo(hostUrl) { UseShellExecute = true }); };
                    var stop = new Button { Text = "Stop", Left = 240, Top = 142, Width = 180 };
                    stop.Click += delegate { window.Close(); };
                    window.Controls.AddRange(new Control[] { label, open, stop });
                    timer.Tick += delegate {
                        if (server.HasExited) {
                            timer.Stop();
                            MessageBox.Show("The server stopped. Check open-party-lab.log.", "Open Party Lab");
                            window.Close();
                        }
                    };
                    timer.Start();
                    Process.Start(new ProcessStartInfo(hostUrl) { UseShellExecute = true });
                    Application.Run(window);
                    return server.HasExited ? server.ExitCode : 0;
                }
            }
            finally
            {
                if (!server.HasExited) server.Kill();
                server.WaitForExit();
                // Drain redirected output before disposing the log writer.
            }
        }
    }
}
