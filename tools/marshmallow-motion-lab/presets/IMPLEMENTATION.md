# Marshmallow-Rig in ein Spiel übernehmen

Die Datei `marshmallow-rig-presets.json` ist die eingecheckte Übergabe zwischen Motion Lab und Spielen. Sie enthält je ein festes Profil für `wide`, `square` und `tall` sowie alle aktuell verwendeten Assetpfade. Sämtliche referenzierten Dateien liegen innerhalb von `tools/marshmallow-motion-lab`; das Lab benötigt kein installiertes lokales Game.

Der maschinenlesbare Übergabeindex `marshmallow-motion-handoff.json` ergänzt die Profile um Zustandsnamen, Eingabemodelle, Renderraum, Granatenphasen, Ebenenreihenfolge und optionale Assetsets. Die sechs vorbereiteten Stirnbandfarben sind über `assets/accessories/headbands/headband-variants.json` auffindbar und verwenden dieselbe Canvasgröße sowie denselben Zeichenanker.

## Einstellungen festschreiben

Das Lab aus dem Plattform-Root starten:

```powershell
node tools/marshmallow-motion-lab/serve.mjs
```

Danach `http://127.0.0.1:4178` öffnen. `Aktuelles Profil speichern` schreibt die aktive Körperform sowohl in den Browser als auch in die Projektdatei. `Alle Profile ins Projekt schreiben` übernimmt alle drei im Browser gespeicherten Profile. Nicht bearbeitete Formen erhalten die dokumentierten Standardwerte.

Direktes Öffnen von `index.html` kann weiterhin lokal im Browser speichern, besitzt aber keinen Schreibzugriff auf das Repository.

## Datenmodell

```ts
type TorsoVariant = "wide" | "square" | "tall";

interface MarshmallowRigProfile {
  torsoVariant: TorsoVariant;
  warp: number;         // 0..1
  limbGap: number;      // 0..1; sichtbare Fußdistanz = limbGap * 162
  torsoHeight: number;  // 0..1; Torso-Bodenversatz = torsoHeight * 145
  legSize: number;      // 0.7..1.4
  legMotion: number;    // 0..1
  armHeight: number;    // 0..1; Schulterhöhe = 155 + armHeight * 92
  armGap: number;       // 0..1; nichtlinear, siehe armBaseGap()
  armSize: number;      // 0.7..1.4
  twoHandOffset: number; // 0..140; Zusatzabstand beider Blaster-Hände in Rig-Pixeln
  helmetHeight: number;  // 0..1; Helm-Anker relativ zur Torso-Oberkante
  helmetScale: number;   // 0.5..1.5
  headbandHeight: number;// 0..1; Stirnband-Anker relativ zur Torso-Oberkante
  headbandScale: number; // 0.5..1.5
  headgear: "none" | "helmet" | "headband";
  actionHand: "left" | "right";
}
```

`armGap` erhält bei `0.5` den bisherigen Wert `184 px`. Unterhalb davon läuft der Abstand linear bis `0 px`; oberhalb davon bis `223 px`. Die Referenzimplementierung steht in `motion-lab.js` in `armBaseGap()`.

## Renderreihenfolge

Die Ebenenreihenfolge ist Bestandteil des Looks:

1. Füße
2. beim Walk der hintere Arm
3. Torso
4. Gesicht und Augen
5. vordere Hände
6. Waffen

Beim Walk nach links liegt der linke Arm hinter dem Torso und der rechte Fuß vorne. Beim Walk nach rechts liegt der rechte Arm hinter dem Torso und der linke Fuß vorne. In allen anderen Zuständen liegen beide Hände vor Gesicht und Augen. Waffen werden nach den Händen gezeichnet und verdecken dadurch die Greifpunkte korrekt.

## Körper-Warp

Der Körper verwendet einen festen Weltanker. Die Bewegung entsteht aus einer kleinen gegenphasigen X/Y-Skalierung plus leichter X-Scherung. Augen und Pupillen werden innerhalb derselben Transformationsmatrix gezeichnet. Zielkoordinaten müssen deshalb vor der Blickberechnung in den lokalen, invers transformierten Körperraum zurückgerechnet werden.

## Hände, Füße und Waffen

Hände und Füße verwenden die freigestellten Bilder `assets/limbs/hand-knob.png` und `assets/limbs/foot-knob.png`. Position, Zielgröße und Rotation bleiben prozedural und werden aus dem Profil abgeleitet. Das Bild wird jeweils in die bisherige Ellipsen-Bounding-Box gezeichnet, sodass die Animationsgeometrie unverändert bleibt. Für den Zweihand-Blaster werden beide Griffpunkte um den profilspezifischen Wert `twoHandOffset` entlang des Zielvektors vom Körper weg verschoben. Anschließend wird der Waffenmittelpunkt aus dem arithmetischen Mittel der beiden tatsächlichen Handpunkte berechnet:

```ts
weaponCenterX = (rearHandX + frontHandX) * 0.5;
weaponCenterY = (rearHandY + frontHandY) * 0.5;
```

Die Waffen-PNGs zeigen nach rechts. Beim Zielen nach links werden sie horizontal gespiegelt; die Zielsteigung bleibt erhalten.

## Kopfbedeckungen

Helm und Stirnband liegen unter `assets/accessories`. Beide werden mit derselben Transformationsmatrix wie Torso und Gesicht gerendert und folgen damit dem Warp. `helmetHeight` steuert die Unterkante des Helms, `headbandHeight` die Oberkante des Stirnbands, jeweils relativ zur Torso-Oberkante. Der Wert `0` ist die niedrigste und `1` die höchste Position. Größe und Höhe werden getrennt je Körperprofil gespeichert. Die Kopfbedeckung wird nach dem Gesicht, aber vor Händen und Waffen gezeichnet.

## Granatenzustand

Der 16-Frame-Zyklus besteht aus drei getrennten Abschnitten:

- Frames 0–6: Ausholen entgegen dem normalisierten Zielvektor
- Frames 6–10: kurzer Vorwärtsschwung
- Frames 10–16: weiche Rückkehr zum Ruhepunkt

Für Controller-Eingaben wird Frame 6 gehalten, solange die Wurftaste gedrückt bleibt. Erst beim Loslassen laufen Vorwärtsschwung und Rückkehr weiter.

## Integration

Die Preset-Datei ist Renderkonfiguration und gehört nicht in den autoritativen Spielzustand. Chaos-Kommando oder Arena Survivor können das gewünschte Profil beim Erzeugen ihrer Host-Figur laden oder die Werte in eine spielinterne Character-Konfiguration kopieren. Gameplay, Trefferlogik und Wurfergebnis bleiben serverautoritativ; das Rig visualisiert ausschließlich den Zustand.

Für eine vollständige Übernahme benötigt ein Spiel vier Teile:

1. die gewünschte Körperform aus `marshmallow-rig-presets.json`;
2. die dort referenzierten Torso-, Limb-, Waffen- und Zubehörassets;
3. die Pose- und Zeichenlogik aus dem kanonischen Renderer `motion-lab.js` oder eine gleichwertige Portierung anhand dieser Anleitung;
4. die vom Spiel gelieferten Werte für Bewegungszustand, normierten Framefortschritt, Zielrichtung und gegebenenfalls Press/Hold/Release.

Presets allein enthalten bewusst keine ausführbaren Bewegungsgleichungen. Diese Trennung verhindert, dass visuelle Abstimmwerte mit Laufzeitcode oder serverautoritativem Gameplay vermischt werden. `marshmallow-motion-handoff.json` benennt beide Seiten dieser Grenze explizit und ist der empfohlene Einstiegspunkt für eine Übernahme.

Wenn Assets in ein Game kopiert werden, ist `tools/marshmallow-motion-lab/assets` die einzige Quelle. Dabei müssen auch deren Lizenz-/Quellhinweise und die Pfade im jeweiligen Game-Manifest beziehungsweise Host-Bundle aktualisiert werden.
