# Marshmallow Comic Arsenal

Dieses Verzeichnis ist ein eigenständiges, stilistisch geschlossenes Waffenpaket. Die Waffen werden **nicht automatisch zur Auswahl des Motion Labs hinzugefügt**. Spiele können nur die benötigten PNGs und Metadaten übernehmen.

## Inhalt

- 11 reguläre Fern- und schwere Waffen
- 4 Nahkampfwaffen
- 7 Granaten und andere Wurfobjekte
- 4 alternative Luftschlag-Marker: Funkgerät, Leuchtrakete, Signalpfeife und eine zusätzliche Leuchtpistole
- Näherungsmine und Nachschubkiste als platzierbares Objekt beziehungsweise Pickup
- 2 alberne Fernwaffen
- insgesamt 30 transparente PNGs

[`weapon-pack.json`](./weapon-pack.json) ist der maschinenlesbare Index. Er enthält Kategorie, Handanzahl, Canvas-Gruppe, empfohlenen vorhandenen Rig-Zustand sowie die Pfade zur freigestellten Datei und zur hochauflösenden Imagegen-Quelle.

## Zeichen- und Integrationsregeln

- Schusswaffen zeigen standardmäßig nach rechts. Für links werden Bild und spielseitige Anker gemeinsam horizontal gespiegelt.
- Hände werden hinter der Waffe, die Waffe vor Augen und Gesicht gezeichnet.
- Die transparenten Canvases sind nach Waffentyp normalisiert; sie ersetzen aber keine Waffenanker.
- Griff-, Lauf-, Abwurf-, Kollisions- und Effektpunkte müssen pro Waffe im jeweiligen Spiel festgelegt werden. Diese Punkte hängen von Körperprofil, Darstellungsgröße und gewünschter Haltung ab.
- `handgun`, `shoot` und `grenade` sind bereits vorhandene Motion-Rig-Ausgangszustände. Für Schwert, Axt, Pfanne und Baseballschläger ist eine eigene Nahkampfbewegung erforderlich. Funkgerät und Pfeife benötigen eine kurze Benutzen-Pose, die Mine eine Platzieren-Pose. Die Nachschubkiste ist als Weltobjekt gedacht und besitzt keine Hände.

Die nicht freigestellten Imagegen-Ergebnisse liegen als reproduzierbare Quellen unter `../../raw/weapons`. Die drei bereits im Lab verwendeten Waffen wurden ebenfalls in dieses Paket kopiert, damit Verbraucher nur dieses Verzeichnis benötigen.

`normalize_pack.py` setzt ausgewählte Dateien erneut auf ihre im Manifest definierte Standard-Canvas. Dadurch lassen sich zukünftige Ergänzungen nach dem Freistellen ohne manuelle Größenarbeit in das Paket einordnen.
