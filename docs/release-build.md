# Open Party Lab – Portable Windows Build

1. Extract the complete ZIP archive to a normal folder.
2. Double-click `Open-Party-Lab.exe`.
3. The shared host screen opens automatically in your browser.
4. Players scan the QR code and open the controller page on phones connected to the same LAN/Wi-Fi.

The portable build contains the server, host, controller, all game repositories, and its own Node.js runtime. Node.js and npm do not need to be installed.

Windows may show a SmartScreen warning because this community build is not code-signed. You can inspect the Apache-2.0 source at https://github.com/Hartwich/Open-Party-Lab before running it.

If startup fails, check `open-party-lab.log`. Port 3000 must be available, and Windows Firewall must allow private-network access so phones can connect.
