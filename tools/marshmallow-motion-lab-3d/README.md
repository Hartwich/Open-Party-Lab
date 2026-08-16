# Marshmallow Motion Lab 3D

Dreidimensionale Bewegungswerkbank für die Marshmallow-Figur. Das Tool liegt wie das 2D-Lab außerhalb der optionalen Game-Repositories unter `party-platform-public/tools` und ist vollständig eigenständig: Es importiert nichts aus einem Spiel, verändert weder Phaser-Renderer noch Serverzustand und hat eine eigene Preset-Datei.

Das bestehende [2D Motion Lab](../marshmallow-motion-lab/README.md) bleibt unverändert. Beide Werkbänke laufen parallel auf getrennten Ports.

## Start

```powershell
node tools/marshmallow-motion-lab-3d/serve.mjs
```

Danach `http://127.0.0.1:4179` öffnen.

Der Server liefert `three.js` aus `node_modules/three` unter `/vendor/three` aus. Falls die Seite leer bleibt, im Plattform-Root einmal `npm install` ausführen. Anders als beim 2D-Lab funktioniert das direkte Öffnen von `index.html` als Datei **nicht** – ES-Module und die Importmap benötigen einen HTTP-Server.

## Technik

Die Figur ist vollständig prozedural. Es gibt kein Skelett und kein 3D-Modell; der Look entsteht wie im 2D-Warp-Rig aus Verformung:

- **Torso** – ein rotationssymmetrisches Marshmallow-Mesh (Zylinder mit abgerundeten Kanten, über `roundness` bis zur Kapsel regelbar). Jeder Frame verformt die Vertices direkt: volumenerhaltende X/Z-Gegenskalierung zur Y-Streckung, eine Ausbauchung beim Stauchen, quadratisches Vorbeugen und eine Torsion über die Körperhöhe.
- **Hände und Füße** – freischwebende Kugel-Knubbel ohne Arme und Beine, exakt wie in der 2D-Vorlage.
- **Gesicht** – Augen, Pupillen und Mund werden mit derselben Verformungsfunktion auf die Körperoberfläche gesetzt und wandern dadurch korrekt mit jeder Stauchung mit.
- **Waffen** – einfache Low-Poly-Modelle aus Grundkörpern, ebenfalls im Code erzeugt.

Die Körperunterseite bleibt bei jeder Verformung auf ihrer eigenen Grundlinie. Stauchen drückt die Figur also nach unten zusammen, statt sie im Boden versinken zu lassen.

## Textur

Die einzigen Binärdateien des Tools sind drei Texturen unter `assets/textures`, erzeugt von [`prepare_textures.py`](./prepare_textures.py):

| Datei | Wirkung |
| --- | --- |
| `marshmallow-albedo.png` | Grundfarbe mit Zuckerkorn und Puderzucker-Staub |
| `marshmallow-normal.png` | Oberflächenrelief derselben Struktur |
| `marshmallow-roughness.png` | Rauheit, damit einzelne Zuckerkörner glänzen |
| `marshmallow-roast.png` | Fleckenmaske, die die Röstkante ausfransen lässt |

Alle vier kacheln nahtlos: Das Rauschen entsteht auf einem zyklischen Gitter, die Normal Map wird mit umlaufender Ableitung berechnet. Die Kachelung wird zur Laufzeit an die Körpergröße gekoppelt, damit das Korn bei jeder Körperform gleich groß bleibt. Neu erzeugen lassen sie sich jederzeit mit:

```powershell
python tools/marshmallow-motion-lab-3d/prepare_textures.py
```

Der Schalter `Textur` blendet Albedo, Relief und Rauheit ab und zeigt die reine Silhouette – nützlich, um Bewegungen ohne Oberflächenablenkung zu beurteilen. Die Röstung bleibt dabei erhalten. Fehlen die Dateien, läuft das Lab ohne Textur weiter und weist in der Statuszeile darauf hin.

## Röstung

Vier Regler steuern, wie stark die Figur am Feuer war:

| Regler | Wirkung |
| --- | --- |
| `Grundröstung` | Gleichmäßiger Braunton über den ganzen Körper – wie lange die Figur insgesamt in der Nähe des Feuers lag. |
| `Röstung oben` | Wie weit die Röstung vom Scheitel nach unten reicht und wie dunkel sie dort wird. |
| `Röstung unten` | Dasselbe vom Boden nach oben. Die Füße nehmen diesen Wert anteilig mit. |
| `Röstkante` | 0 = weicher Verlauf über den halben Körper, 1 = harte, klar abgegrenzte Kante. |

Oben und unten sind unabhängig, es lässt sich also eine unten verkohlte und oben noch rohe Figur bauen – oder umgekehrt. Wenig Röstung ergibt goldbraun, viel Röstung verkohlt.

Entscheidend für den Look ist die Fleckenmaske: Sie verschiebt die Röstgrenze lokal um bis zu 90 Prozent der Kantenbreite. Dadurch franst der Übergang in unregelmäßige Zungen aus, statt als sauberer Ring um den Körper zu laufen. Bei Regler 1 ist der Körper trotzdem vollständig eingefärbt – die Grenze läuft weit genug über das Körperende hinaus, um Kantenbreite und Maskenversatz mit abzudecken.

## Accessoires

Vier Zustände: `Keins`, `Helm`, `Stirnband` und `Brille`. Es ist immer genau eines aktiv, und die Auswahl gehört zum Profil, wird also mitgespeichert.

Alle Accessoires werden mit Einheitsradius gebaut und zur Laufzeit auf den tatsächlichen, bereits verformten Körperradius skaliert. Sie sitzen dadurch bei jeder Körperform richtig und weiten sich mit, wenn sich die Figur staucht. Die Ausrichtung wird aus zwei Punkten der verformten Körperachse zurückgerechnet – neigt sich die Figur beim Laufen oder Werfen, kippt der Helm mit. Über den ganzen Bewegungsumfang sind das bis zu 31 Grad.

- **Helm** – Kuppel, Krempe, Kinnriemen und ein Kamm. Die Kuppel wird so gestreckt, dass sie den Scheitel gerade überdeckt: bei einer flachen breiten Figur wird daraus eine flache Kappe, bei einer schmalen hohen ein Spitzhelm.
- **Stirnband** – umlaufendes Band mit Knoten und zwei flatternden Enden am Hinterkopf.
- **Brille** – zwei Ringe mit Glas auf Augenhöhe plus ein Halteband um den Körper. Die Ringe folgen den Augenpositionen und werden mit dem Gesicht mitverformt.

## Bewegungen

| Zustand | Beschreibung |
| --- | --- |
| `Idle` | Ruhiges Atmen mit leichter Torsion und wippenden Händen. |
| `Walk` | Schrittzyklus auf der Stelle mit Körperwippen, Sway, gegenläufigem Armschwung und Fußrotation. |
| `Rückwärts` | Derselbe Zyklus mit gespiegeltem Schritt und Armschwung; die Figur lehnt sich zurück statt vor. |
| `Seitwärts` | Seitschritt: Die Füße wandern auf der X-Achse, der Körper neigt sich seitlich statt nach vorne. |
| `Jump` | Fünfphasiger Sprung: Hocke, Absprung, Flug mit Streckung, Landung mit Stauchung, Erholung. |
| `Weitsprung` | Flacherer Bogen mit horizontaler Körperbewegung und zur Landung vorgestreckten Füßen. |
| `Freude` | Zwei Hopser pro Zyklus mit erhobenen Händen, federndem Körper und wippenden Füßen. |
| `Werfen` | Ausholen entgegen der Blickrichtung, Vorwärtsschnapper, weiche Rückkehr. |
| `Granate` | Wie Werfen, aber deutlich tieferes Ausholen und kürzerer Vorwärtshub – mit Granate in der Hand. |
| `Blaster 2H` | Beide Hände führen den Blaster nach vorne; Klick löst Rückstoß und Mündungsblitz aus. |
| `Pistole` | Nur die Aktionshand zielt, die andere bleibt frei. |

Alle Zustände laufen wie im 2D-Lab über 16 Frames. `Wurf gedrückt halten` friert bei `Werfen` und `Granate` Frame 6 ein, bis losgelassen wird; das ist die Vorlage für die spätere Controller-Anbindung.

Da 3D nicht auf links/rechts beschränkt ist, gibt es kein `Walk links` und `Walk rechts` mehr – die Figur dreht sich weich in die Zielrichtung. `Rückwärts` und `Seitwärts` sind das eigentliche 3D-Äquivalent dazu. Die Pupillen führen die Drehung an und senken sich bei nahen Zielen.

## Waffen

Granate, Pistole und Blaster sind Low-Poly-Modelle aus Kugeln, Boxen, Zylindern und Tori und sehen dadurch aus jedem Kamerawinkel richtig aus. Einhandwaffen sitzen in der Aktionshand, der Zweihand-Blaster genau in der Mitte zwischen beiden Handpunkten – dieselbe Regel wie im 2D-Lab. Die Neigung folgt dem Zielwinkel, die horizontale Ausrichtung ergibt sich aus der Körperdrehung.

Ein Klick auf die Bühne bei `Blaster 2H` oder `Pistole` löst den Rückstoß aus: Der Körper weicht entgegen der Blickrichtung zurück und ein kurzer Mündungsblitz erscheint vor dem Lauf. Ein Klick wird dabei von einer Kamerafahrt unterschieden – nur ein kurzer Druck ohne nennenswerte Mausbewegung zählt als Schuss.

## Bedienung

- **Maus bewegen** – Zielpunkt auf der Bodenebene setzen; die Figur dreht sich dorthin.
- **Ziehen** – Kamera umkreisen. Beim Ziehen bleibt der Zielpunkt stehen, es gibt also keinen Konflikt zwischen Zielen und Kamera.
- **Mausrad** – Zoom.
- **Klick auf die Bühne** – bei `Blaster 2H` und `Pistole` einen Schuss auslösen.
- **Leertaste** – Play/Pause · **←/→** – Einzelframe · **1**–**9** – Zustand · **R** – Kamera zurücksetzen.
- **Front / 3-4 / Seite / Oben** – Kamera-Presets, passend zur eingestellten Körperhöhe.
- **Geisterbilder** – das 3D-Gegenstück zum Onion Skin: zwei halbtransparente Kopien bei Frame ±2.

## Regler

`Körperbreite`, `Körperhöhe`, `Rundung` und `Körper-Bodenabstand` bestimmen die Silhouette. `Warp-Stärke` skaliert die gesamte Verformung, `Beinbewegung` gemeinsam Schrittweite, Hub und Fußrotation. `Fuß-Abstand`, `Fußgröße`, `Arm-Höhe`, `Arm-Abstand` und `Armgröße` positionieren die Knubbel. Die vier Röstregler sind oben beschrieben.

## Presets für Spiele speichern

Die eingecheckten Werte liegen in [`presets/marshmallow-3d-presets.json`](./presets/marshmallow-3d-presets.json). Ein Profil enthält Silhouette, Bewegungsparameter, alle vier Röstwerte, die Aktionshand und das Accessoire – ein Spiel kann die komplette Figur daraus aufbauen.

`Aktuelles Profil speichern` schreibt die aktive Körperform in den Browser und in die Projektdatei, `Alle Profile ins Projekt schreiben` übernimmt Breit, Quadrat und Hoch gemeinsam. Der Server klemmt beim Schreiben jeden Wert auf seinen gültigen Bereich und setzt unbekannte Accessoires auf `none`. Fehlt ein Feld – etwa weil ein älteres Preset eingespielt wird –, greift der dokumentierte Standardwert; ein vorhandenes, aber unbrauchbares Feld wird dagegen als Fehler gemeldet.

Die technische Übergabe mit Datenmodell, Verformungsformeln und Bewegungsphasen steht in [`presets/IMPLEMENTATION.md`](./presets/IMPLEMENTATION.md).

## Verhältnis zum 2D-Lab

| | 2D Motion Lab | 3D Motion Lab |
| --- | --- | --- |
| Port | 4178 | 4179 |
| Renderer | Canvas 2D | three.js (WebGL) |
| Presets | `marshmallow-rig-presets.json` | `marshmallow-3d-presets.json` |
| Blickrichtung | links / rechts gespiegelt | frei drehbar |
| Bewegungen | 10 Zustände | 11 Zustände, inkl. Rückwärts und Seitwärts |
| Figur | PNG-Sheets und Torso-Grafiken | prozedurales Mesh, drei Texturkarten |
| Waffen | freigestellte PNGs | Low-Poly-Modelle im Code |

Die Profilnamen `wide`, `square` und `tall` sind in beiden Werkbänken identisch, die Zahlenwerte jedoch nicht: Das 2D-Lab rechnet in Pixeln, das 3D-Lab in Welteinheiten (1 Einheit ≈ 1 Meter, Bodenlinie `y = 0`). Die Preset-Dateien lassen sich deshalb nicht gegenseitig einlesen.

## Erweitern

Ein neuer Zustand braucht drei Schritte: eine `poseX()`-Funktion in `motion-lab-3d.js`, einen Eintrag im `switch` von `buildPose()` und in `STATE_ORDER`, sowie einen Button mit passendem `data-state` in `index.html`. Soll eine Waffe dazu sichtbar sein, kommt der Zustand zusätzlich in `STATE_WEAPON`; für einen Hold/Release-Ablauf in `HOLD_STATES`, für Rückstoß in `SHOOT_STATES`.

Posenfunktionen sind reine Funktionen ohne Zugriff auf Szene oder DOM. Sie lassen sich dadurch isoliert prüfen – etwa darauf, dass sich der 16-Frame-Zyklus schließt und kein Fuß unter die Bodenlinie gerät.
