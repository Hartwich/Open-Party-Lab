# Arena Survivor – Performance & Eingabelatenz

Stand: 11.09.2026 · Analyse von Controller (Handy), Server und Host (TV/PC-Bildschirm)

## Weg einer Stick-Bewegung bis zum Bildschirm

| Schritt | Vorher | Nach den Quick Wins |
|---|---|---|
| Handy: pointermove → `game:input` (volatile) | 0–16 ms, bei überlastetem Hauptthread deutlich mehr | 0–16 ms, Hauptthread entlastet |
| WLAN uplink | wenige ms, aber Warteschlange durch Downstream-Flut (s. 1) | wenige ms |
| Server: Input setzt nur `moveInputX/Y`, Bewegung passiert erst im nächsten Tick | 0–16 ms | 0–16 ms |
| Server → Host: Takt `hostStateIntervalMs` | 33 ms bei 16-ms-Ticks → nur jeder 2. **oder** 3. Tick, 0–48 ms, ungleichmäßig 21–31 Hz | 24 ms → genau jeder 2. Tick, 0–32 ms, gleichmäßig ~31 Hz |
| Host: JSON-Parse (~45 KB) + rAF-Flush + Phaser-Frame | 16–33 ms | unverändert |
| TV-Eingangslatenz | 20–100 ms, wenn der TV nicht im Spielmodus ist | unverändert |

## Befunde, nach Wirkung sortiert

### 1. Handys bekamen den kompletten Weltzustand – behoben
`toControllerState` schickte allen Controllern alle Gegner, Projektile, Pickups und Spawn-Marker. Die Plattform hat für Arena Survivor keinen Controller-Takt gesetzt (`controllerStateIntervalMs` = 0) und sendet deshalb bei **jedem** Tick (62 Hz) **und** nach **jedem** Move-Input irgendeines Spielers.

Gemessen (Welle 1, Stufe 5, 4 Spieler, ~50 Gegner): Host-State **43 KB**, Controller-State vorher gleich groß, jetzt **3 KB**.

Bei 4 Spielern kamen so schnell 10–40 MB/s WLAN-Downstream zusammen. Das bremst den Uplink der Stick-Eingaben (gemeinsame Funkzeit) und belegt den Handy-Hauptthread mit JSON-Parsing und React-Renders, also genau dem Thread, der die Pointer-Events des Sticks liefert.

**Umgesetzt:** `toControllerStateForPlayer` liefert nur den eigenen Spieler plus Welle/Zeit/Ergebnis, dazu `controllerStateIntervalMs: 100` (10 Hz, reicht für HP/XP/Material).

### 2. Ungleichmäßiger Host-Takt – behoben
Der Plattform-Default 33 ms passt nicht zum 16-ms-Tick, weil 2 Ticks (≈32 ms) knapp darunter liegen. **Umgesetzt:** `hostStateIntervalMs: 24`.

### 3. Jeder Move-Input löst einen kompletten Broadcast aus – offen (Plattform)
`game:input` → `broadcastGameState` baut `toPublicState` (alle Entities) plus alle Controller-States – **vor** der Throttle-Prüfung. Die Position ändert sich aber erst im nächsten Tick. Außerdem stört das den Host-Takt. Zwei Vorschläge:
- In `stateBroadcaster.broadcastGameState` erst `shouldEmit…` prüfen, dann die States bauen.
- Opt-in in `GameBroadcastPolicy`, z. B. `deferInputBroadcastToTick: true`: Bei tickenden Spielen nach Inputs nicht broadcasten.

`registerSocketHandlers.ts` wurde parallel bearbeitet, deshalb ist das noch nicht angefasst.

### 4. Host rendert nur, wenn ein State ankommt – offen
Die Sprites springen mit ~31 Hz, während der Bildschirm mit 60 Hz zeichnet. Das ruckelt und fühlt sich träge an. Vorschlag: In `update()` jedes Frame per Dead-Reckoning extrapolieren (`x + vx·Δt`, Δt auf ~50 ms begrenzt). `vx/vy` sind für Spieler, Gegner und Projektile schon im State. Das bringt keine zusätzliche Latenz, anders als Snapshot-Interpolation.

### 5. Host-Rendering (Phaser CANVAS) – offen
- **Riesige Texturen, klein gezeichnet:** Marshmallow-Rig `helmet.png` 1,25 MB, `foot-knob`/`hand-knob`/Stirnbänder je ~650–740 KB, Gegner bis 300 KB, Torsos ~280 KB. Gezeichnet werden sie mit 20–80 px, und zwar mit `imageSmoothingQuality = "high"`. Canvas2D skaliert diese Bitmaps dann in jedem Frame neu herunter (pro Marshmallow-Spieler 7 Bilder). → Assets auf ~2× Anzeigegröße verkleinern (z. B. 256 px) oder beim Laden verkleinert rendern; Qualität auf `"medium"`. *(Pixelmaße nicht geprüft, die Dateien liegen zu tief für den Zugriff. Die Dateigrößen deuten auf ≥1024 px.)*
- **Vektor-Projektile:** Das Graphics-Objekt wird pro State neu gebaut und in jedem Frame abgespielt. Pro Projektil entstehen `new Phaser.Geom.Point`-Allokationen, dazu Glow-Kreise mit Alpha (Füllrate bei Zoom). → Formen einmal mit `generateTexture` erzeugen und gepoolte Images verwenden.
- **Sprite-Churn:** Gegner- und Pickup-Sprites werden bei Tod/Spawn zerstört und neu erzeugt (GC). → Pool mit `setVisible(false)`.
- **Zielsuche pro Waffe:** `resolveWeaponAimAngle` filtert und reduziert für jede Waffe jedes Spielers alle Gegner (bis 4×6×100 pro State), das Marshmallow-Gesicht macht es noch einmal. → Nächsten Gegner einmal pro Spieler berechnen.
- **Alle 4 Themes werden vorgeladen** (Charaktere, Gegner, Porträts, Waffen). → Nur das gewählte Theme laden: kürzere Ladezeit, weniger Speicher.
- **HUD:** ~40 DOM-Style- und Text-Schreibzugriffe pro State, auch ohne Änderung. → Letzte Werte cachen und nur Änderungen schreiben.
- Langfristig: WebGL (`Phaser.AUTO`), wenn die SVGs beim Laden mit fester Größe gerastert werden (`load.svg(key, url, { width, height })`). Der Canvas-Modus wurde wegen der SVG-Zuverlässigkeit gewählt.

### 6. Controller-Robustheit & Transport – offen (Plattform)
- **Stop kann verloren gehen:** Auch `move(0,0)` wird volatile gesendet. Wenn der Socket in dem Moment nicht schreibbar ist, läuft die Figur weiter. → Null-Vektor zuverlässig senden (`shouldUseVolatileInput` in `controllerSocketClient.ts`) oder den aktuellen Vektor alle ~100 ms wiederholen, solange der Daumen liegt.
- **Transport:** socket.io startet mit HTTP-Long-Polling und wechselt erst dann auf WebSocket. In der Zwischenzeit werden volatile Pakete oft verworfen und die Latenz ist hoch. → `transports: ["websocket"]` für Controller und Host.
- `updatedAt: input.sentAt` nimmt die Handy-Uhr (Uhrzeitversatz möglich). → `context.now` verwenden.

### 7. Server-Simulation – beobachten
Jedes System kopiert alle Entities per Spread (~9 Systeme × ~300 Objekte × 62 Hz). Das kann GC-Pausen erzeugen, die Ticks verzögern. Kollisionen (Projektile × Gegner) sind bei max. 100 Gegnern unkritisch. Erst mit dem Perf-Overlay messen (`round-timer` cycle, `runtime-tick`).

## Umgesetzte Änderungen

| Datei | Änderung |
|---|---|
| `local-games/arena-survivor/src/server/ArenaSurvivorServerGame.ts` | schlanker Controller-State, neu `toControllerStateForPlayer` |
| `local-games/arena-survivor/src/manifest.ts` | `broadcast: { hostStateIntervalMs: 24, controllerStateIntervalMs: 100 }` |
| `local-games/arena-survivor/src/controller/ArenaSurvivorController.ts` | `stickPlacement: "bottom"` im Spiel-Joystick |
| `apps/controller/src/controller-ui/layouts/models.ts` | neues optionales Feld `stickPlacement` (Default `"center"`, andere Spiele unverändert) |
| `apps/controller/src/controller-ui/layouts/VirtualJoystickLayout.tsx` | Stick unten verankert: Safe Area + Abstand zur Gestenleiste, im Querformat höchstens 70 dvh groß |

Aktivieren: `npm run games:sync-local` (baut das Spiel-Paket neu), dann `npm run typecheck` und `npm run dev:all`.

## Nächste sinnvolle Schritte
1. Plattform: Throttle vor dem State-Bau + Opt-out für Input-Broadcasts (Punkt 3).
2. Host: Extrapolation im `update()`-Loop (Punkt 4).
3. Assets verkleinern und nur das aktive Theme laden (Punkt 5).
4. Stop-Input zuverlässig, WebSocket-only (Punkt 6).
5. Optional: „schwebender" Stick, der dort erscheint, wo der Daumen die untere Bildschirmhälfte berührt.
