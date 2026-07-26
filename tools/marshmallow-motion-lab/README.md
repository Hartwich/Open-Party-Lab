# Marshmallow Motion Lab

Plattformweite, isolierte Bewegungswerkbank für den Chaos-Kommando-Charakter. Das Tool liegt bewusst außerhalb der optionalen Game-Repositories unter `party-platform-public/tools`. Es importiert nichts aus einem Spiel, verändert weder Phaser-Renderer noch Serverzustand und enthält sämtliche benötigten Vorschau-, Torso- und Waffenassets selbst.

## Start

```powershell
node tools/marshmallow-motion-lab/serve.mjs
```

Danach `http://127.0.0.1:4178` öffnen. Alternativ funktioniert `index.html` auch direkt als lokale Datei; in diesem Modus kann das Lab jedoch nur in `localStorage` und nicht in die Projektdatei schreiben.

## Presets für Spiele speichern

Die dauerhaft eingecheckten Werte liegen in [`presets/marshmallow-rig-presets.json`](./presets/marshmallow-rig-presets.json). `Aktuelles Profil speichern` aktualisiert bei laufendem `serve.mjs` sowohl den Browser als auch das gewählte Profil in dieser Datei. `Alle Profile ins Projekt schreiben` übernimmt Breit, Quadrat und Hoch gemeinsam. Damit können andere Entwickler die Werte in Chaos-Kommando, Arena Survivor oder weitere Host-Renderer kopieren.

Die vollständige technische Übergabe mit Datenmodell, Formeln, Renderreihenfolge, Waffenankern und Granatenphasen steht in [`presets/IMPLEMENTATION.md`](./presets/IMPLEMENTATION.md).

[`presets/marshmallow-motion-handoff.json`](./presets/marshmallow-motion-handoff.json) ist der kompakte Übergabeindex für Spiele. Er listet Renderraum, alle Sprite- und Warp-Rig-Zustände, Eingabearten, Granatenphasen, Ebenenreihenfolge, portable Profilfelder und optionale Assetsets. Wichtig: Die Presets enthalten die abgestimmten Maße und Anker; die eigentlichen Posegleichungen und Zeitverläufe bleiben im kanonischen Renderer `motion-lab.js`.

## Bedienung

- `Idle` und `Walk` wechseln das normalisierte Sprite-Sheet.
- Mausbewegung steuert den Zielpunkt und die Pupillen.
- `Frames überblenden` prüft weiche Zwischenphasen.
- `Onion Skin` zeigt vorherigen und folgenden Frame.
- Mittelpunkt und Bodenlinie machen verbliebene Sprünge sichtbar.
- Leertaste pausiert, Pfeiltasten schalten einzelne Frames.

## Zweite Option: Warp-Rig

`Warp-Rig` verwendet nur einen statischen Torso. Eine minimale gegenphasige X/Y-Skalierung mit leichter Scherung erhält annähernd das Volumen und erzeugt die weiche Marshmallow-Verformung. Hände und Füße verwenden freigestellte, geröstete Marshmallow-PNGs, werden aber weiterhin mit exakt denselben prozeduralen Maßen, Ankern, Rotationen und Bewegungsmustern wie die bisherigen Blob-Ellipsen gezeichnet. `Warp-Stärke` und `Fuß-Abstand` lassen sich live abstimmen. Die ursprüngliche 4×4-Sprite-Variante bleibt unverändert verfügbar.

Für den Warp-Modus stehen drei Körperformen zur Auswahl: `Breit`, `Quadrat` und `Hoch`. Der Fußabstand besitzt einen deutlich sichtbaren 90-Pixel-Regelbereich. Armhöhe und Arm-Basisabstand sind separat einstellbar. Gesicht, Augen und Pupillen werden mit derselben Transformationsmatrix wie der Torso gewarpt; die Pupillen verfolgen den Mauszeiger weiterhin im korrekt zurückgerechneten lokalen Körperraum.

Weitere Regler steuern Torso-Höhe beziehungsweise sichtbare Beinlänge, Fußgröße, Armgröße und die gesamte Beinbewegung. Die Beinbewegung steht standardmäßig auf 60 Prozent und skaliert Schrittweite, Hub und Fußrotation gemeinsam.

Zusätzlich zu `Idle` und `Walk` besitzt das Warp-Rig die Bewegungsmuster `Jump`, `Werfen` und `Schießen`. Schießen richtet die Hände auf den Zielpunkt aus; Werfen zeigt Ausholen und Release; Jump bewegt Körper, Füße und Hände als zusammenhängenden Sprungbogen.

`Freude` hebt beide Hände und federt Körper und Füße. `Weitsprung` kombiniert einen flacheren Sprungbogen mit horizontaler Körperbewegung. `Pistole` richtet nur die ausgewählte linke oder rechte Hand auf den Zielpunkt und lässt die andere Hand frei.

`Granate` ist ein zweiter, spielnaher Wurfablauf. Die Aktionshand ist links oder rechts wählbar. Der Zielpunkt beeinflusst die Gegenrichtung des Ausholens und die Richtung des Vorwärtsschnappens. Der Ausholpunkt liegt deutlich hinter dem Körper, der eigentliche Vorwärtshub bleibt bewusst kurz. Nach dem Wurf führt eine eigene Nachschwingphase die Hand weich zum Ausgangspunkt zurück, bevor der Zyklus erneut beginnt. Für die Hold/Release-Vorschau den Button `Wurf gedrückt halten` drücken: Der Arm holt bis zum definierten Hold-Punkt aus und bleibt dort beliebig lange stehen. Erst beim Loslassen werden Release und Rückkehr abgespielt. Diese Trennung ist für die spätere Controller-Implementierung vorgesehen.

Alternativ funktioniert der Granatenwurf direkt auf der Bühne: Maus an der gewünschten Wurfrichtung drücken und halten, zum Werfen loslassen. Der angeklickte Zielpunkt wird sofort übernommen, damit das Ausholen von Beginn an exakt entgegen der Wurfrichtung läuft.

`Walk links` und `Walk rechts` stehen in beiden Techniken bereit. Der Sprite-Modus spiegelt dafür dasselbe normalisierte Sheet; das Warp-Rig kehrt Schrittphase, Sway und Armswing um. Im Warp-Rig wechselt zusätzlich die Zeichenebene: Beim Lauf nach links liegt der linke Arm hinter dem Torso und der rechte Fuß vor dem linken. Beim Lauf nach rechts liegt der rechte Arm hinter dem Torso und der linke Fuß vor dem rechten. In allen übrigen Zuständen bleiben beide Arme vor dem Körper.

Bei `Schießen` und `Pistole` wird ohne Mausklick nur gezielt. Ein Klick auf die Bühne löst den kurzen Rückstoß aus. Der Körper bewegt sich entlang des negativen Zielvektors, wodurch der Rückstoß beim Zielen nach links und rechts korrekt gespiegelt ist.

Die Aktionsvorschau verwendet erste freigestellte Waffenassets im gerösteten Marshmallow-Comicstil: `Granate` hält eine Marshmallow-Granate, `Pistole` eine einhändig geführte Handfeuerwaffe und `Blaster 2H` einen kompakten Blaster mit zwei getrennten Griffpunkten. Waffenrichtung und Spiegelung folgen dem Zielvektor. Hände und Waffen liegen vor dem Gesicht; die Hände werden zuerst und die Waffen darüber gezeichnet. Der Mittelpunkt der Zweihandwaffe wird direkt aus dem Mittelwert beider Handpunkte berechnet.

Die drei Testwaffen gehören vollständig zum Motion Lab:

- `tools/marshmallow-motion-lab/assets/weapons/grenade.png`
- `tools/marshmallow-motion-lab/assets/weapons/handgun.png`
- `tools/marshmallow-motion-lab/assets/weapons/two-hand-blaster.png`

Daneben liegt unter `assets/weapons/arsenal` ein eigenständiges, stilistisch einheitliches Paket aus 30 transparenten Waffen- und Ausrüstungs-PNGs. Es umfasst Pistolen, Gewehre, schwere Waffen, Werfer, Nahkampfwaffen, mehrere Granaten, vier Luftschlag-Marker, eine Näherungsmine, eine Nachschubkiste sowie alberne Sonderwaffen. Das Paket wird bewusst nicht vollständig in die Lab-Auswahl geladen. [`weapon-pack.json`](./assets/weapons/arsenal/weapon-pack.json) dient Spielen als maschinenlesbarer Index; [`README.md`](./assets/weapons/arsenal/README.md) beschreibt Zeichenreihenfolge, Spiegelung und die noch pro Spiel festzulegenden Waffenanker.

Die gerösteten Limb-Assets liegen unter `tools/marshmallow-motion-lab/assets/limbs/hand-knob.png` und `foot-knob.png`. Beim `Blaster 2H` werden beide Handanker gegenüber dem normalen Arm-Basisabstand standardmäßig zusätzlich um `42 px` entlang des Zielvektors vom Körper weg verschoben. Der Blaster bleibt zwischen den beiden resultierenden Handpunkten zentriert.

Der zusätzliche Handabstand des `Blaster 2H` ist nun über `Zweihänder-Abstand` pro Körperform einstellbar und wird im jeweiligen Preset gespeichert. Als Kopfbedeckungen stehen außerdem `Helm` und `Stirnband` zur Verfügung. Beide besitzen getrennte Höhen- und Größenregler; Auswahl, Höhe und Skalierung werden ebenfalls separat für `Breit`, `Quadrat` und `Hoch` gespeichert. Die freigestellten Assets liegen unter `tools/marshmallow-motion-lab/assets/accessories` und werden gemeinsam mit Torso und Gesicht gewarpt.

Für spätere Spielerfarben liegen sechs vorbereitete, geometrisch normalisierte Stirnbänder unter `assets/accessories/headbands`: Rot, Blau, Grün, Gold, Violett und Türkis. Das Lab lädt weiterhin nur das rote Standardasset. `headband-variants.json` enthält IDs, vorgeschlagene Farben, Pfade und die gemeinsame Canvasgröße für die spätere Spielintegration.

Der Regler `Arm-Basisabstand` bewahrt den bisherigen Mittelpunkt von `184 px`, reicht nach unten jetzt aber bis `0 px`. Dadurch können die Arm-Knubbel auch bei schmalen oder hohen Körperformen eng am Torso positioniert werden.

Fußabstand und Torsohöhe reichen nun tatsächlich bis `0 px`. Presets werden unter einer versionierten lokalen Kennung gespeichert und enthalten auch die ausgewählte Aktionshand.

`Breit`, `Quadrat` und `Hoch` besitzen jeweils ein eigenes Preset. Beim Wechsel der Körperform wird nur das zugehörige Profil geladen. Das bisherige einzelne Preset wird beim ersten Start automatisch in das passende Körperprofil migriert.

## Asset-Aufbereitung

`prepare_sheets.py` schneidet die beiden 4×2-Quell-Sheets in Einzelframes. Es richtet jeden Frame am Torso-Mittelpunkt und an derselben Bodenlinie aus, verwendet aber eine gemeinsame Skalierung pro Bewegungsmuster, damit die beabsichtigte Körperverformung erhalten bleibt.

Die Quell-Sheets werden vor der Aufbereitung mit dem installierten Imagegen-Chroma-Key-Helfer in `assets/raw/*-alpha.png` umgewandelt. Die drei Torsoquellen sind dort einheitlich als `torso-wide-source.png`, `torso-square-source.png` und `torso-tall-source.png` abgelegt.
