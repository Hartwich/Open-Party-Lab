using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;
using System.Web.Script.Serialization;
using System.Runtime.InteropServices;

internal static class HotspotLauncher
{
    private const uint ExecutionContinuous = 0x80000000;
    private const uint ExecutionSystemRequired = 0x00000001;
    private const uint ExecutionDisplayRequired = 0x00000002;

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint SetThreadExecutionState(uint flags);

    private static bool IsRoomCode(string value)
    {
        if (value == null || value.Length != 4) return false;
        foreach (char c in value) if (!((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))) return false;
        return true;
    }

    private static string ReadRoomCode()
    {
        try {
            string value = File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "room-code.txt")).Trim().ToUpperInvariant();
            if (IsRoomCode(value)) return value;
        } catch (IOException) { } catch (UnauthorizedAccessException) { }
        return Guid.NewGuid().ToString("N").Substring(0, 4).ToUpperInvariant();
    }

    private sealed class HotspotSession
    {
        public string Name;
        public string Password;
        public string Address;
        public int MaxClients;
        public string UpstreamId;
        public string RestoreConfig;
        public System.Drawing.Bitmap WifiQr;
#if OFFLINE_HOTSPOT
        public Process OfflineProcess;
#endif
    }

#if OFFLINE_HOTSPOT
    private static HotspotSession StartOffline(string name, string password)
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string powershell = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell", "v1.0", "powershell.exe");
        var info = new ProcessStartInfo(powershell, "-NoProfile -NonInteractive -File \"" + Path.Combine(root, "offline-hotspot.ps1") + "\"") {
            UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true,
            RedirectStandardOutput = true, RedirectStandardError = true, StandardOutputEncoding = Encoding.UTF8
        };
        var process = Process.Start(info);
        try {
            var errors = process.StandardError.ReadToEndAsync();
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(name)));
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(password)));
            process.StandardInput.Flush();
            var line = process.StandardOutput.ReadLineAsync();
            if (!line.Wait(45000)) throw new Exception("Offline hotspot startup timed out. Check your Wi-Fi driver.");
            if (String.IsNullOrWhiteSpace(line.Result)) throw new Exception("Windows could not run the offline hotspot helper. " + errors.GetAwaiter().GetResult());
            var result = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(line.Result);
            if (!(bool)result["success"]) throw new Exception((string)result["error"]);
            var session = CreateSession((string)result["name"], password, result);
            session.OfflineProcess = process;
            return session;
        } catch {
            StopOffline(process);
            throw;
        }
    }

    private static void StopOffline(Process process)
    {
        try {
            // EOF also cleans up after a launcher crash. Do not touch other access points.
            process.StandardInput.Close();
            if (!process.WaitForExit(5000)) { process.Kill(); process.WaitForExit(); }
        } finally { process.Dispose(); }
    }
#endif

    private static void StopHotspot(HotspotSession session)
    {
#if OFFLINE_HOTSPOT
        if (session.OfflineProcess != null) { StopOffline(session.OfflineProcess); return; }
#endif
        HotspotCommand("stop", session.Name, session.Password, session.UpstreamId, session.RestoreConfig);
    }

    private static System.Drawing.Bitmap CreateWifiQr(string name, string password, bool controller = false)
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        var info = new ProcessStartInfo(Path.Combine(root, "runtime", "node.exe"), "\"" + Path.Combine(root, "wifi-qr.mjs") + "\"" + (controller ? " --controller" : "")) {
            UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true
        };
        info.EnvironmentVariables["NODE_OPTIONS"] = "";
        info.EnvironmentVariables["NODE_PATH"] = "";
        using (var process = Process.Start(info))
        using (var stream = new MemoryStream()) {
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(name)));
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(password)));
            process.StandardInput.Close();
            var errors = process.StandardError.ReadToEndAsync();
            process.StandardOutput.BaseStream.CopyTo(stream);
            process.WaitForExit();
            string error = errors.GetAwaiter().GetResult();
            if (process.ExitCode != 0) throw new Exception(error);
            stream.Position = 0;
            using (var image = System.Drawing.Image.FromStream(stream)) return new System.Drawing.Bitmap(image);
        }
    }

    private static Dictionary<string, object> HotspotCommand(string action, string name, string password, string upstreamId = "", string restoreConfig = "")
    {
        string script = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "hotspot.ps1");
        if (!File.Exists(script)) throw new Exception("The hotspot helper is missing. Extract the complete test-build ZIP.");
        string powershell = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell", "v1.0", "powershell.exe");
        var info = new ProcessStartInfo(powershell, "-NoProfile -NonInteractive -File \"" + script + "\" -Action " + action) {
            UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true,
            RedirectStandardOutput = true, RedirectStandardError = true, StandardOutputEncoding = Encoding.UTF8
        };
        using (var process = Process.Start(info)) {
            // Credentials stay on stdin, outside command lines and log files.
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(name ?? "")));
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(password ?? "")));
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(upstreamId ?? "")));
            process.StandardInput.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(restoreConfig ?? "")));
            process.StandardInput.Close();
            var errorTask = process.StandardError.ReadToEndAsync();
            string output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();
            string error = errorTask.GetAwaiter().GetResult();
            if (String.IsNullOrWhiteSpace(output)) throw new Exception("Windows could not run the hotspot helper. " + error);
            var result = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(output.Trim());
            if (!result.ContainsKey("success") || !(bool)result["success"])
                throw new Exception(result.ContainsKey("error") ? (string)result["error"] : "Windows could not configure the hotspot.");
            return result;
        }
    }

    private static bool ShowSetup(out HotspotSession session, out bool keepAwake, out string roomCode)
    {
        HotspotSession selected = null;
        using (var window = new Form { Text = "Open Party Lab · Network setup", ClientSize = new System.Drawing.Size(500, 450),
            FormBorderStyle = FormBorderStyle.FixedDialog, MaximizeBox = false, StartPosition = FormStartPosition.CenterScreen })
        using (var worker = new BackgroundWorker()) {
            var option = new CheckBox { Text = "Create Wi-Fi hotspot", Left = 20, Top = 20, Width = 450, Checked = false };
#if OFFLINE_HOTSPOT
            window.ClientSize = new System.Drawing.Size(500, 500);
            var mode = new ComboBox { Left = 20, Top = 60, Width = 450, DropDownStyle = ComboBoxStyle.DropDownList, Enabled = false };
            mode.Items.AddRange(new object[] { "Windows Mobile hotspot (share a connection)", "Offline local Wi-Fi (no internet required)" });
            mode.SelectedIndex = 1;
#endif
            var nameLabel = new Label { Text = "Network name", Left = 20, Top = 60, Width = 450 };
            var name = new TextBox { Text = "Open-Party-Lab", Left = 20, Top = 82, Width = 450, Enabled = false };
            var passwordLabel = new Label { Text = "Password", Left = 20, Top = 120, Width = 450 };
            var password = new TextBox { Text = Guid.NewGuid().ToString("N").Substring(0, 16), Left = 20, Top = 142, Width = 450, Enabled = false };
            var roomLabel = new Label { Text = "Room code (4 letters or digits)", Left = 20, Top = 180, Width = 450 };
            var roomInput = new TextBox { Text = ReadRoomCode(), Left = 20, Top = 202, Width = 450, MaxLength = 4, CharacterCasing = CharacterCasing.Upper };
            var awakeOption = new CheckBox { Text = "Keep laptop awake while playing (screen stays on)", Left = 20, Top = 250, Width = 460, Height = 28, Checked = true };
            var status = new Label { Text = "Use your current network, or create a hotspot for phones.\r\nWindows may require an internet connection to share.\r\nHotspot support and the device limit depend on your PC.", Left = 20, Top = 190, Width = 450, Height = 80 };
            var start = new Button { Text = "Start game", Left = 20, Top = 290, Width = 260 };
            var cancel = new Button { Text = "Cancel", Left = 300, Top = 290, Width = 170, DialogResult = DialogResult.Cancel };
            option.CheckedChanged += delegate { name.Enabled = password.Enabled = option.Checked; start.Text = option.Checked ? "Start hotspot & game" : "Start game"; };
            window.FormClosing += delegate(object sender, FormClosingEventArgs e) { if (worker.IsBusy) e.Cancel = true; };
            worker.DoWork += delegate(object sender, DoWorkEventArgs e) {
                var settings = (string[])e.Argument;
                System.Drawing.Bitmap qr = null;
                HotspotSession createdSession = null;
                try {
#if OFFLINE_HOTSPOT
                    if (settings[2] == "offline") createdSession = StartOffline(settings[0], settings[1]);
                    else
#endif
                    createdSession = CreateSession(settings[0], settings[1], HotspotCommand("start", settings[0], settings[1]));
                    qr = CreateWifiQr(createdSession.Name, settings[1]);
                    createdSession.WifiQr = qr;
                    e.Result = createdSession;
                } catch {
                    if (qr != null) qr.Dispose();
                    if (createdSession != null) StopHotspot(createdSession);
                    throw;
                }
            };
            worker.RunWorkerCompleted += delegate(object sender, RunWorkerCompletedEventArgs e) {
                option.Enabled = roomInput.Enabled = awakeOption.Enabled = start.Enabled = cancel.Enabled = true;
                name.Enabled = password.Enabled = option.Checked;
#if OFFLINE_HOTSPOT
                mode.Enabled = option.Checked;
#endif
                if (e.Error != null) {
                    status.Text = "Hotspot setup failed. You can retry or use your current network.";
                    MessageBox.Show(e.Error.Message, "Hotspot unavailable", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
                selected = (HotspotSession)e.Result;
                window.DialogResult = DialogResult.OK;
                window.Close();
            };
            start.Click += delegate {
                if (!IsRoomCode(roomInput.Text.Trim().ToUpperInvariant())) {
                    MessageBox.Show("Use exactly 4 letters (A-Z) or digits (0-9) for the room code.", "Room code"); return;
                }
                if (!option.Checked) { window.DialogResult = DialogResult.OK; window.Close(); return; }
                string networkName = name.Text.Trim();
                if (Encoding.UTF8.GetByteCount(networkName) < 1 || Encoding.UTF8.GetByteCount(networkName) > 32 || password.Text.Length < 8 || password.Text.Length > 63) {
                    MessageBox.Show("Use a network name of 1–32 UTF-8 bytes and a password of 8–63 printable ASCII characters.", "Hotspot settings"); return;
                }
                option.Enabled = roomInput.Enabled = awakeOption.Enabled = name.Enabled = password.Enabled = start.Enabled = cancel.Enabled = false;
                status.Text = "Starting Windows hotspot. Please wait…";
#if OFFLINE_HOTSPOT
                mode.Enabled = false;
                worker.RunWorkerAsync(new string[] { networkName, password.Text, mode.SelectedIndex == 1 ? "offline" : "mobile" });
#else
                worker.RunWorkerAsync(new string[] { networkName, password.Text });
#endif
            };
#if OFFLINE_HOTSPOT
            foreach (Control control in new Control[] { nameLabel, name, passwordLabel, password, roomLabel, roomInput, awakeOption, status, start, cancel }) control.Top += 50;
            status.Text = "Offline Wi-Fi connects phones directly to this PC.\r\nNo internet is shared. Keep Wi-Fi enabled.\r\nStandalone hotspot support depends on your Wi-Fi driver.";
            option.CheckedChanged += delegate { mode.Enabled = option.Checked; };
            window.Controls.Add(mode);
#endif
            foreach (Control control in new Control[] { status, start, cancel }) control.Top += 110;
            window.Controls.AddRange(new Control[] { option, nameLabel, name, passwordLabel, password, roomLabel, roomInput, awakeOption, status, start, cancel });
            window.AcceptButton = start; window.CancelButton = cancel;
            bool accepted = window.ShowDialog() == DialogResult.OK;
            session = selected;
            keepAwake = accepted && awakeOption.Checked;
            roomCode = roomInput.Text.Trim().ToUpperInvariant();
            return accepted;
        }
    }

    private static int Run(bool checkOnly)
    {
        Application.EnableVisualStyles();
        HotspotSession session = null;
        bool keepAwake = false;
        string roomCode = ReadRoomCode();
        uint previousExecutionState = 0;
        if (!checkOnly && !ShowSetup(out session, out keepAwake, out roomCode)) return 0;
        try {
            if (keepAwake) {
                // This request belongs to the main/UI thread. Restore it on the same thread.
                previousExecutionState = SetThreadExecutionState(ExecutionContinuous | ExecutionSystemRequired | ExecutionDisplayRequired);
                if (previousExecutionState == 0) throw new Win32Exception(Marshal.GetLastWin32Error(), "Windows could not enable keep-awake mode.");
            }
            if (!checkOnly) {
                try { File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "room-code.txt"), roomCode); }
                catch (IOException) { } catch (UnauthorizedAccessException) { }
            }
            return RunServer(checkOnly, session, keepAwake, roomCode);
        }
        finally {
            if (previousExecutionState != 0) SetThreadExecutionState(previousExecutionState | ExecutionContinuous);
            if (session != null) {
                try { StopHotspot(session); }
                catch (Exception error) { MessageBox.Show("The game stopped, but the hotspot could not be stopped. Turn it off in Windows Mobile hotspot settings.\r\n\r\n" + error.Message, "Hotspot cleanup", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
                finally { if (session.WifiQr != null) session.WifiQr.Dispose(); }
            }
        }
    }

    private static HotspotSession CreateSession(string name, string password, Dictionary<string, object> result)
    {
        return new HotspotSession { Name = name, Password = password, Address = (string)result["address"],
            MaxClients = Convert.ToInt32(result["maxClients"]), UpstreamId = (string)result["upstreamId"], RestoreConfig = (string)result["restoreConfig"] };
    }

    private static int HotspotSmoke()
    {
        string name = "OpenPartyLab-Test-" + Guid.NewGuid().ToString("N").Substring(0, 8);
        string password = Guid.NewGuid().ToString("N").Substring(0, 16);
        var session = CreateSession(name, password, HotspotCommand("start", name, password));
        int exit;
        try { exit = RunServer(true, session); }
        finally { StopHotspot(session); }
        File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "hotspot-check.json"),
            new JavaScriptSerializer().Serialize(new { success = exit == 0, address = session.Address, maxClients = session.MaxClients, cleanup = true }));
        return exit;
    }

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

    private static int FindAvailablePort()
    {
        for (int port = 3000; port <= 3099; port++)
        {
            var probe = new TcpListener(IPAddress.Any, port);
            probe.Server.ExclusiveAddressUse = true;
            try { probe.Start(); return port; }
            catch (SocketException) { /* Try the next port. */ }
            finally { probe.Stop(); }
        }
        throw new Exception("No available port between 3000 and 3099. Close another application and try again.");
    }

    [STAThread]
    private static int Main(string[] args)
    {
        bool checkOnly = Array.IndexOf(args, "--check") >= 0;
        bool hotspotSmoke = Array.IndexOf(args, "--hotspot-smoke") >= 0;
        try
        {
            if (Array.IndexOf(args, "--hotspot-check") >= 0) {
                var result = HotspotCommand("check", null, null);
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "hotspot-check.json"), new JavaScriptSerializer().Serialize(result));
                return 0;
            }
            using (var singleInstance = new Mutex(false, "Local\\OpenPartyLabPortable"))
            {
                if (!singleInstance.WaitOne(0))
                    throw new Exception("Open Party Lab is already running. Close its launcher window before starting again.");
                try { return hotspotSmoke ? HotspotSmoke() : Run(checkOnly); }
                finally { singleInstance.ReleaseMutex(); }
            }
        }
        catch (Exception error)
        {
            if (!checkOnly && !hotspotSmoke && Array.IndexOf(args, "--hotspot-check") < 0) MessageBox.Show(error.Message, "Open Party Lab", MessageBoxButtons.OK, MessageBoxIcon.Error);
            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "open-party-lab.log"), error.Message + Environment.NewLine);
            return 1;
        }
    }

    private static int RunServer(bool checkOnly, HotspotSession session, bool keepAwake = false, string roomCode = "PART")
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string nodePath = Path.Combine(root, "runtime", "node.exe");
        string appRoot = Path.Combine(root, "app");
        string serverPath = Path.Combine(appRoot, "server", "main.js");
        string logPath = Path.Combine(root, "open-party-lab.log");
        string lanIp = session == null ? FindLanIPv4() : session.Address;
        string publicHost = lanIp ?? "127.0.0.1";

        if (!File.Exists(nodePath) || !File.Exists(serverPath))
        {
            throw new Exception("The portable package is incomplete. Please extract the complete ZIP before starting Open Party Lab.");
        }

        // Do not mistake another service's /health response for our own server.
        int port = FindAvailablePort();
        string origin = "http://" + publicHost + ":" + port + "/";
        string hostUrl = origin + "?room=" + Uri.EscapeDataString(roomCode);
        string controllerOrigin = origin + "controller/";
        string controllerUrl = controllerOrigin + "#join?room=" + Uri.EscapeDataString(roomCode);

        var startInfo = new ProcessStartInfo(nodePath, "\"" + serverPath + "\"")
        {
            WorkingDirectory = appRoot,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        startInfo.EnvironmentVariables["NODE_ENV"] = "production";
        startInfo.EnvironmentVariables["PORT"] = port.ToString();
        startInfo.EnvironmentVariables["HOST"] = "0.0.0.0";
        startInfo.EnvironmentVariables["RENDER"] = "false";
        startInfo.EnvironmentVariables["RENDER_EXTERNAL_URL"] = "";
        startInfo.EnvironmentVariables["NODE_OPTIONS"] = "";
        startInfo.EnvironmentVariables["NODE_PATH"] = "";
        startInfo.EnvironmentVariables["OPEN_PARTY_LAB_WEB_ROOT"] = Path.Combine(appRoot, "web");
        startInfo.EnvironmentVariables["PUBLIC_CONTROLLER_ORIGIN"] = controllerOrigin;
        startInfo.EnvironmentVariables["PRIMARY_ROOM_CODE"] = roomCode;

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
                        var request = WebRequest.CreateHttp("http://127.0.0.1:" + port + "/health");
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
                using (var controllerQr = CreateWifiQr(controllerUrl, "", true))
                using (var window = new Form())
                using (var timer = new System.Windows.Forms.Timer { Interval = 1000 })
                {
                    window.Text = keepAwake ? "Open Party Lab · Keep awake: on" : "Open Party Lab";
                    bool showWifi = session != null && session.WifiQr != null;
                    int middle = showWifi ? 316 : 20;
                    int controllerLeft = middle + 388;
                    window.ClientSize = new System.Drawing.Size(controllerLeft + 290, 410);
                    window.FormBorderStyle = FormBorderStyle.FixedDialog;
                    window.MaximizeBox = false;
                    window.StartPosition = FormStartPosition.CenterScreen;
                    var label = new Label {
                        Text = "Open Party Lab is running.\r\n\r\nRoom code: " + roomCode + "\r\nKeep laptop awake: " + (keepAwake ? "on" : "off") + "\r\n\r\n" + (session == null ? "Phones: connect to the same Wi-Fi." : "Wi-Fi: " + session.Name + "\r\nPassword: " + session.Password + "\r\n" + (session.MaxClients > 0 ? "Windows hotspot limit: " + session.MaxClients + " devices" : "Offline local Wi-Fi · no internet")),
                        Left = middle, Top = 20, Width = 368, Height = 210
                    };
                    var controllerLink = new LinkLabel { Text = controllerUrl, Left = middle, Top = 236, Width = 368, Height = 48 };
                    controllerLink.LinkClicked += delegate { Process.Start(new ProcessStartInfo(controllerUrl) { UseShellExecute = true }); };
                    var instruction = new Label { Text = "Close this window to stop" + (session == null ? " the game." : " the game and hotspot."), Left = middle, Top = 300, Width = 368, Height = 38 };
                    var open = new Button { Text = "Open host", Left = middle, Top = 354, Width = 170 };
                    open.Click += delegate { Process.Start(new ProcessStartInfo(hostUrl) { UseShellExecute = true }); };
                    var stop = new Button { Text = "Stop", Left = middle + 190, Top = 354, Width = 170 };
                    stop.Click += delegate { window.Close(); };
                    window.Controls.AddRange(new Control[] { label, controllerLink, instruction, open, stop });
                    if (showWifi) {
                        window.Controls.Add(new Label { Text = "1. Join Wi-Fi", Left = 20, Top = 20, Width = 270, Height = 24 });
                        window.Controls.Add(new PictureBox { Image = session.WifiQr, SizeMode = PictureBoxSizeMode.Zoom, BackColor = System.Drawing.Color.White, Left = 20, Top = 60, Width = 270, Height = 270 });
                    }
                    window.Controls.Add(new Label { Text = (showWifi ? "2. " : "") + "Connect controller", Left = controllerLeft, Top = 20, Width = 270, Height = 24 });
                    window.Controls.Add(new PictureBox { Image = controllerQr, SizeMode = PictureBoxSizeMode.Zoom, BackColor = System.Drawing.Color.White, Left = controllerLeft, Top = 60, Width = 270, Height = 270 });
                    timer.Tick += delegate {
#if OFFLINE_HOTSPOT
                        if (session != null && session.OfflineProcess != null && session.OfflineProcess.HasExited) {
                            timer.Stop();
                            MessageBox.Show("The offline hotspot stopped. Check your Wi-Fi adapter and restart the launcher.", "Open Party Lab");
                            window.Close();
                            return;
                        }
#endif
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
