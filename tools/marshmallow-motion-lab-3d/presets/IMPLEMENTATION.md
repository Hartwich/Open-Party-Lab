# 3D-Marshmallow-Rig in ein Spiel übernehmen

`marshmallow-3d-presets.json` ist die eingecheckte Übergabe zwischen dem 3D Motion Lab und Spielen. Sie enthält je ein Profil für `wide`, `square` und `tall`. Körper, Hände, Füße, Gesicht und Waffen werden zur Laufzeit erzeugt; die einzigen Assets sind drei Texturkarten unter `../assets/textures`.

## Einstellungen festschreiben

```powershell
node tools/marshmallow-motion-lab-3d/serve.mjs
```

`http://127.0.0.1:4179` öffnen. `Aktuelles Profil speichern` schreibt die aktive Körperform in den Browser und in die Projektdatei; `Alle Profile ins Projekt schreiben` übernimmt alle drei. Der Server klemmt jeden Wert serverseitig auf seinen gültigen Bereich, bevor er schreibt.

## Datenmodell

Alle Längen sind Welteinheiten. Die Bodenlinie liegt bei `y = 0`, `+Y` zeigt nach oben, `+Z` ist die Blickrichtung der Figur.

```ts
type BodyVariant = "wide" | "square" | "tall";

interface Marshmallow3DProfile {
  bodyVariant: BodyVariant;
  bodyRadius: number;   // 0.30 .. 1.10  Radius des Torsos
  bodyHeight: number;   // 0.40 .. 1.80  Gesamthöhe des Torsos
  roundness: number;    // 0 .. 1        0 = harte Kante, 1 = Kapsel
  bodyLift: number;     // 0 .. 0.60     Abstand Körperunterseite zum Boden
  warp: number;         // 0 .. 1        Gesamtstärke der Verformung
  footGap: number;      // 0 .. 0.80     Abstand der beiden Füße
  footSize: number;     // 0.60 .. 1.60
  legMotion: number;    // 0 .. 1        Schrittweite, Hub und Fußrotation gemeinsam
  armHeight: number;    // 0 .. 1        Schulterhöhe, siehe unten
  armGap: number;       // 0 .. 1        seitlicher Handabstand, siehe unten
  armSize: number;      // 0.60 .. 1.60
  toast: number;        // 0 .. 1        gleichmäßige Grundröstung des Körpers
  roastTop: number;     // 0 .. 1        Röstung vom Scheitel abwärts
  roastBottom: number;  // 0 .. 1        Röstung vom Boden aufwärts
  roastEdge: number;    // 0 .. 1        0 = weicher Verlauf, 1 = harte Kante
  actionHand: "left" | "right";
  accessory: "none" | "helmet" | "headband" | "goggles";
}
```

Abgeleitete Größen:

```ts
shoulderU  = lerp(0.25, 0.95, armHeight);   // 0 = Körperunterseite, 1 = Oberseite
armSpread  = 1 + armGap * 0.85;             // Vielfaches von bodyRadius
handRadius = 0.15 * armSize;
footRadius = 0.17 * footSize;
eyeRadius  = clamp(bodyRadius * 0.24, 0.06, 0.20);
```

## Körpergeometrie

Der Torso ist eine `LatheGeometry` über ein Einheitsprofil mit Radius `1` und Halbhöhe `1`. Das Profil ist ein Rechteck mit abgerundeten Ecken; der Eckradius ergibt sich aus `corner = clamp(0.08 + roundness * 0.9, 0.05, 0.995)`. Nur `roundness` erfordert einen Neuaufbau der Geometrie – alle übrigen Profilwerte gehen als Skalierung in die Verformung ein.

## Texturen

Drei nahtlos kachelnde Karten liegen unter `../assets/textures` und werden von `prepare_textures.py` erzeugt: `marshmallow-albedo.png` (Grundfarbe, Zuckerkorn, Puderzucker), `marshmallow-normal.png` (Relief) und `marshmallow-roughness.png` (Glanz einzelner Kristalle). Alle drei nutzen `RepeatWrapping`.

Die Kachelung wird an die Körpergröße gekoppelt, damit das Korn bei jeder Körperform gleich groß bleibt:

```ts
repeatU = Math.max(1, Math.round(bodyRadius * 6));
repeatV = Math.max(1, Math.round(bodyHeight * 2.4));
```

Hände und Füße verwenden dieselben Bilder mit fester Kachelung `(2, 1)`. Da `Texture.repeat` pro Textur-Objekt gilt, braucht jedes Material eigene Klone – das Bild selbst liegt nur einmal im Speicher.

`toast` wird nicht in die Textur gebacken, sondern als Materialfarbe über das Albedo multipliziert. Der Grundton ist deshalb bewusst hell (`#fffcf6` mit Textur, `#fbf1de` ohne) und wird zu `#a5622b` interpoliert. Fehlen die Texturdateien, bleibt das Rig ohne Karten voll funktionsfähig.

## Röstung oben und unten

Die lokale Röstung ist eine Erweiterung des `MeshStandardMaterial` über `onBeforeCompile`. Der Vertex-Shader reicht zwei Varyings durch:

```glsl
vRoastHeight = transformed.y / max(uBodyTop, 0.0001);  // 0 unten .. 1 oben
vRoastUv     = uv * uRoastRepeat;
```

`uBodyTop` ist die **aktuell gestauchte** Höhe `bodyHeight * (1 + squash)`. Nur dadurch klebt die Röstkante am Körper, statt beim Stauchen zu wandern. Die Flecken laufen mit halber Dichte des Zuckerkorns, sonst wirkt die Kante wie Rauschen statt wie Flammenzungen.

Im Fragment-Shader, direkt nach `<map_fragment>`:

```glsl
float edge   = mix(0.30, 0.02, uRoastEdge);            // Kantenbreite
float height = clamp(vRoastHeight, 0.0, 1.0)
             + (blotch - 0.5) * edge * 1.8;            // Maske versetzt die Kante
float span   = 1.0 + edge * 2.0;                       // deckt Kante + Versatz ab

float topLine    = 1.0 - uRoastTop * span;
float topFactor  = smoothstep(topLine - edge, topLine + edge, height)
                 * smoothstep(0.0, 0.05, uRoastTop);   // Regler 0 = garantiert nichts

float bottomLine   = uRoastBottom * span;
float bottomFactor = (1.0 - smoothstep(bottomLine - edge, bottomLine + edge, height))
                   * smoothstep(0.0, 0.05, uRoastBottom);
```

Drei Details sind wichtig und sollten beim Portieren erhalten bleiben:

1. **`span` statt eines festen Faktors.** Die Grenze muss über das Körperende hinauslaufen, sonst bleibt bei Regler `1.0` ein Rest ungeröstet: Die Kante ist `edge` breit und die Maske verschiebt sie um bis zu `0.9 * edge`.
2. **Das Gate `smoothstep(0.0, 0.05, …)`.** Ohne es würde bei Regler `0` der Maskenversatz allein schon den Scheitel einfärben.
3. **Eigener `customProgramCacheKey`.** Sonst teilt three das Programm mit anderen `MeshStandardMaterial`-Instanzen und verwirft die Injektion.

Farbe und Stärke skalieren mit dem Regler – wenig Röstung ergibt goldbraun `#bd7833`, viel Röstung verkohlt `#3a2211`:

```glsl
vec3 tint = mix(uRoastColor, uCharColor, smoothstep(0.5, 1.0, uRoastTop));
diffuseColor.rgb = mix(diffuseColor.rgb, tint, clamp(topFactor * (0.4 + 0.6 * uRoastTop), 0.0, 1.0));
```

Hände und Füße sind eigene Materialien ohne Shader-Injektion, weil `Material.clone()` `onBeforeCompile` nicht überträgt. Die Füße erhalten den unteren Röstton anteilig (`roastBottom * 0.7`) als einfache Farbmischung, sonst wirken sie bei dunklem Körperfuß wie fremde Objekte.

## Accessoires

Alle Modelle werden mit Einheitsradius `1` in der XZ-Ebene gebaut und zur Laufzeit auf den tatsächlichen, bereits verformten Körperradius skaliert:

```ts
function deformedRadius(unitY, pose, profile) {
  return distance(deform(0, unitY, 0), deform(1, unitY, 0));
}
```

Die Ausrichtung wird aus zwei Punkten der verformten Körperachse zurückgerechnet. Das ist notwendig, weil Beugung und Torsion ausschließlich in den Vertices stecken – ohne diesen Schritt stünde der Helm gerade, während sich der Körper neigt:

```ts
up = normalize(deform(0, unitY + 0.3, 0) - deform(0, unitY, 0));
quaternion.setFromUnitVectors(UP, up);
```

Sitzhöhen in Einheitskoordinaten: Helm `0.55`, Stirnband `0.46`, Brille auf Augenhöhe `0.34`. Die Helmkuppel wird mit `(rise / radius) * 1.12` gestreckt, wobei `rise` der Abstand vom Helmrand zum Scheitel ist. Über den ganzen Reglerbereich liegt dieses Verhältnis zwischen `0.05` (breit und flach) und `2.13` (schmal und hoch), bei den Standardprofilen zwischen `0.21` und `1.03`; der Clamp `0.12 .. 2.4` ist reiner Schutz gegen entartete Werte. Aus einer flachen breiten Figur wird so eine flache Kappe, aus einer schmalen hohen ein Spitzhelm.

Die Brillenringe folgen den bereits berechneten Augenpositionen und werden über `setFromUnitVectors(FORWARD, radialDirection)` nach außen gedreht.

## Verformung

Jeder Vertex des Einheitskörpers wird pro Frame durch dieselbe reine Funktion geschickt. Sie wird auch auf die Anker von Augen, Mund und Händen angewendet, damit das Gesicht die Verformung exakt mitmacht.

```ts
function deformPoint(bx, by, bz, pose, p) {
  const half    = p.bodyHeight * 0.5;
  const u       = clamp((by + 1) * 0.5, 0, 1);          // 0 unten .. 1 oben
  const stretch = 1 + pose.squash;                       // > 1 gestreckt, < 1 gestaucht
  const lateral = 1 / Math.sqrt(Math.max(0.25, stretch)); // volumenerhaltend
  const bulge   = 1 + Math.max(0, -pose.squash) * 0.55 * Math.sin(Math.PI * u);

  let x = bx * p.bodyRadius * lateral * bulge;
  let z = bz * p.bodyRadius * lateral * bulge;
  const y = (by + 1) * half * stretch;                   // Unterseite bleibt bei 0

  const lean = pose.bend * u * u * half * 1.6;           // quadratisch nach oben
  x += pose.bendX * lean;
  z += pose.bendZ * lean;

  const twist = pose.twist * (u - 0.3);                  // Torsion um Y
  return [x * Math.cos(twist) - z * Math.sin(twist), y, x * Math.sin(twist) + z * Math.cos(twist)];
}
```

Zwei Eigenschaften sind Teil des Looks und sollten beim Portieren erhalten bleiben:

1. **Bodenanker.** Wegen `y = (by + 1) * half * stretch` bleibt die Körperunterseite bei jeder Stauchung auf ihrer Grundlinie. Die Figur sinkt beim Stauchen nicht in den Boden.
2. **Volumenerhaltung.** Die X/Z-Skalierung ist die inverse Wurzel der Y-Streckung. Zusätzlich bauscht `bulge` die Körpermitte beim Stauchen auf.

Nach der Verformung müssen die Normalen neu berechnet werden, sonst wirkt die Beleuchtung eingefroren.

## Szenenaufbau

Der Aufbau ist zweistufig:

- `root` – trägt nur die Drehung `rotation.y = facing`. Die Füße hängen hier, ihre Y-Position ist absolut über dem Boden. Dadurch bleiben sie beim Körperwippen am Boden stehen.
- `bodyGroup` – Kind von `root`, liegt bei `y = bodyLift + pose.bodyY`. Torso, Hände und Gesicht hängen hier und übernehmen dadurch Wippen und Sway automatisch.

Eine Tiefensortierung wie im 2D-Lab entfällt: In 3D ergibt sich die Reihenfolge von Armen, Torso und Füßen aus dem Z-Buffer.

## Bewegungsphasen

Alle Zustände laufen über 16 Frames, `t` ist der normalisierte Zyklus `0 .. 1`.

**Jump** – fünf Abschnitte, jeder beginnt exakt beim Endwert des vorherigen, damit keine Sprünge in Stauchung, Höhe oder Handposition entstehen:

| `t` | Phase | Stauchung | Körperhöhe |
| --- | --- | --- | --- |
| 0.00 – 0.20 | Hocke | 0 → −0.30 | 0 → −0.24 |
| 0.20 – 0.32 | Absprung | −0.30 → +0.34 | −0.24 → +0.38 |
| 0.32 – 0.72 | Flug | `0.34 · abs(cos(π k))` | Bogen bis +1.30 |
| 0.72 – 0.86 | Landung | +0.34 → −0.38 | +0.38 → −0.26 |
| 0.86 – 1.00 | Erholung | −0.38 → 0 | −0.26 → 0 |

Im Flug wird die Figur beim Absprung und beim schnellen Fall gestreckt und ist im Scheitelpunkt neutral. Die Füße folgen mit `max(0, bodyY * 0.92 + tuck * legMotion)` und bleiben dadurch während der Hocke auf dem Boden.

**Weitsprung** nutzt dieselbe Funktion mit `flat = true`: Der Bogen sinkt von `0.92` auf `0.52` und `bodyZ` läuft bis `0.85` nach vorne. Damit der 16-Frame-Zyklus geschlossen bleibt, gleitet `bodyZ` in der Erholungsphase auf `0` zurück. Zusätzlich strecken sich die Füße gegen Ende des Flugs nach vorne (`reachOut`).

**Werfen und Granate** – drei Abschnitte, `deep` schaltet auf den Granatenwurf:

| Abschnitt | `t` | Werfen | Granate (`deep`) |
| --- | --- | --- | --- |
| Ausholen | 0.000 – 0.375 | `reach` → −1.00 | `reach` → −1.25 |
| Vorwärtsschnapper | 0.375 – 0.625 | → +0.85 | → +0.45 |
| Rückkehr | 0.625 – 1.000 | → 0 | → 0 |

Die Granate holt also tiefer aus und schiebt kürzer nach vorne. Für Controller-Eingaben wird Frame 6 gehalten, solange die Wurftaste gedrückt bleibt; erst beim Loslassen laufen Schnapper und Rückkehr weiter. Torsion und Vorbeugen folgen `reach`, die Aktionshand ist über `actionHand` wählbar.

**Blaster 2H und Pistole** – ein ruhiger Zielzustand mit Atemschwingung. `twoHand` führt beide Hände nach vorne, sonst zielt nur die Aktionshand und die andere bleibt am Körper. Der Rückstoß ist keine Zyklusphase, sondern ein separater Wert `recoil` 0..1, der über `Math.sin(recoil * π)` einen kurzen Impuls erzeugt: Der Körper weicht entlang `−Z` zurück, die Hände kicken nach oben.

**Walk**, **Rückwärts**, **Seitwärts**, **Idle** und **Freude** sind reine Sinuszyklen. `legMotion` skaliert Schrittweite, Hub und Fußrotation gemeinsam, `warp` die Körperstauchung. `Rückwärts` ist `Walk` mit `direction = −1`: Schrittrichtung, Armschwung, Torsion und Vorbeugen kehren sich um, der Hub bleibt positiv. `Seitwärts` verschiebt die Füße auf X statt Z und setzt `bendX = 1, bendZ = 0`, neigt den Körper also seitlich.

## Waffen

Alle Waffenmodelle sind aus Grundkörpern zusammengesetzt und zeigen entlang `+Z`. Sie hängen in derselben Gruppe wie die Hände und übernehmen damit Wippen und Sway automatisch.

- Einhandwaffen (`grenade`, `handgun`) sitzen exakt auf dem Punkt der Aktionshand.
- Die Zweihandwaffe (`blaster`) sitzt im arithmetischen Mittel beider Handpunkte – dieselbe Regel wie im 2D-Lab:

```ts
weaponCenter = (handPosition[0] + handPosition[1]) * 0.5;
```

Die Neigung ist `rotation.x = aimPitch`; horizontal genügt die Körperdrehung, da die Figur ohnehin zum Ziel schaut. Die Skalierung folgt `clamp(armSize * (0.8 + bodyRadius * 0.35), 0.5, 2)`. Der Mündungsblitz erscheint nur im ersten Drittel des Rückstoßes (`max(0, 1 − recoil * 3)`) und sitzt um `0.42` (Blaster) beziehungsweise `0.22` (Pistole) Einheiten vor dem Handpunkt.

## Drehung und Blick

Die Figur wird nicht gespiegelt, sondern gedreht:

```ts
targetFacing = Math.atan2(aimPoint.x, aimPoint.z);
facing      += shortestAngle(facing, targetFacing) * clamp(delta * 7.5, 0, 1);
```

Die Pupillen nutzen den Nachlauf der Drehung: Das Ziel wird um `−facing` in den Körperraum gedreht, die verbleibende X-Abweichung verschiebt die Pupillen. Solange der Körper der Drehung folgt, führen die Augen die Wendung an; ist die Drehung abgeschlossen, stehen sie mittig. Die Höhe ergibt sich aus dem Winkel zwischen Augenhöhe und Bodenziel, sodass nahe Ziele einen Blick nach unten erzeugen.

## Integration

Die Preset-Datei ist Renderkonfiguration und gehört nicht in den autoritativen Spielzustand. Ein Host-Renderer kann das gewünschte Profil beim Erzeugen der Figur laden oder die Werte in eine spielinterne Character-Konfiguration kopieren. Gameplay, Trefferlogik und Wurfergebnis bleiben serverautoritativ; das Rig visualisiert ausschließlich den Zustand.

Die Zahlenwerte sind nicht mit `../../marshmallow-motion-lab/presets/marshmallow-rig-presets.json` austauschbar: Das 2D-Lab rechnet in Pixeln, dieses Lab in Welteinheiten.
