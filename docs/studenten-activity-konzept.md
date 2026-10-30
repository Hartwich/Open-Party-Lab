# Studenten Activity – Spielkonzept

Stand: 30.10.2026. Konzept umgesetzt als optionales lokales Spiel `studenten-activity`.
Implementierungs- und Prüfstatus: siehe `project-status.md` und die README des Spielpakets.

## Spielidee

Ein fester Satz Begriffe wird viermal gespielt: **Erklären → Zeichnen → Ein Wort → Pantomime**.
Alle lernen die Begriffe im Laufe des Spiels kennen. Die eingeschränkten Ausdrucksmöglichkeiten
machen spätere Durchgänge trotzdem zu einer neuen Aufgabe. Jeder Durchgang verwendet exakt
dieselben Begriffskarten, jeweils neu gemischt.

Eigenes optionales Spiel: `studenten-activity`, Paket `@open-party-lab/game-studenten-activity`.
Die vorhandenen Spiele bleiben eigenständig. Empfohlen: 3–20 Personen im Einzelmodus,
4–20 Personen im Teammodus mit zunächst zwei Teams.

## Setup

| Einstellung | Vorschlag / Standard |
| --- | --- |
| Spielmodus | Teams / Einzel; Standard Teams |
| Begriffsquelle | Vorhandene Begriffe / Eigene Begriffe |
| Kategorie bei vorhandenen Begriffen | U18 / Ü18 / Alle; Standard U18 |
| Anzahl bei vorhandenen Begriffen | 10–100, Standard 30; höchstens verfügbare geeignete Begriffe |
| Eigene Begriffe pro Person | 1–10, Standard 4 |
| Zeit pro Zug | 15–300 Sekunden in 15er-Schritten; Standard 60 |
| Überspringen pro Zug | 0–10, Standard 3 |

Die vier Durchgänge und ihre Reihenfolge sind fest. Die Zugdauer gilt für alle vier.
Die Oberfläche zeigt nur Einstellungen, die zur ausgewählten Begriffsquelle passen.
Bei eigenen Begriffen ergibt sich die Poolgröße aus Teilnehmerzahl × Begriffe pro Person,
beispielsweise sechs Personen × vier Begriffe = 24 Karten.
U18/Ü18/Alle filtert den vorhandenen Pool; eigene Eingaben werden nicht automatisch altersklassifiziert.

### Teamwahl bereits vor dem Start

- Beim ersten Auswählen des Spiels werden die Anwesenden serverseitig zufällig und möglichst
  gleichmäßig auf zwei Teams verteilt. Die Zuordnung erscheint auf Host und Handys.
- Jede Person kann im Setup ihr Team selbst wechseln. Anzahl und Mitglieder sind sichtbar.
- Später Beitretende werden zunächst dem kleineren Team zugeordnet, bei Gleichstand zufällig.
- Gewählte Teams bleiben bei Reconnect und normalen Einstellungsänderungen erhalten.
- Eine bewusste Host-Aktion „Teams neu mischen“ erstellt eine neue zufällige Aufteilung.
- Zum Start braucht jedes Team mindestens zwei Personen. Ungleiche Teamgrößen sind erlaubt;
  nach Spielstart sind die Zuordnungen fest.
- Im Einzelmodus entfällt die Teamwahl.

## Eigene Begriffe: verdeckte Sammlung

Nach dem Setup startet bei dieser Quelle eine eigene Sammelphase ohne laufende Spieluhr.
Jede Person erhält beispielsweise vier private Eingabefelder und bestätigt mit „Begriffe abgeben“.
Bis zum gemeinsamen Abschluss kann sie ihre eigene Liste bearbeiten.

Der Host und andere Handys sehen ausschließlich Fortschritt wie „Lea: 4/4 abgegeben“
und „5 von 6 Personen fertig“. Weder Inhalte noch Vorschauen oder Autorzuordnungen erscheinen dort.
Die eigenen Eingaben sieht ausschließlich die schreibende Person. Auch der vollständige Pool
wird vor dem ersten Durchgang nicht vorgestellt.

Der Server hält Eingaben privat und liefert sie nur an den jeweiligen Autor zurück.
Sie gehören niemals in öffentliche Room-Settings, öffentliche Spielerdaten oder Host-Snapshots.
Leerzeichen werden bereinigt, leere Einträge und gleiche Begriffe innerhalb der eigenen Liste
abgelehnt; sinnvoller Grenzwert: 60 Zeichen pro Karte.
Gleiche Eingaben verschiedener Personen werden als getrennte Karten akzeptiert, damit
Fehlermeldungen keine fremden Eingaben verraten und die zugesagte Poolgröße erhalten bleibt.
Das Setup erklärt diesen Unterschied zum duplikatfreien vorhandenen Pool.

Gestartet wird erst, wenn alle Teilnehmenden vollständig abgegeben haben.
Bei Verbindungsverlust bleiben Eingaben erhalten. Der Host kann vor dem Abschluss eine
ausgeschiedene Person ausdrücklich aus der Partie nehmen; deren Karten entfallen vollständig.
Beim Abschluss werden Teilnehmerkreis und Pool eingefroren. Später Beitretende schauen bis
zur nächsten Partie zu. Reconnects bestehender Teilnehmender bleiben möglich.

## Ablauf eines Durchgangs

1. Kurze Regelübersicht zeigt die aktuelle Disziplin, den Zwischenstand und die nächste Person.
2. Auf dem aktiven Handy startet „Begriff aufdecken & los“ die Zugzeit und zeigt die erste Karte.
3. Es werden innerhalb der eingestellten Zeit möglichst viele Karten gelöst. Nach einem Treffer
   folgt die nächste Karte; die Uhr läuft weiter.
4. Alle raten laut. Die richtig ratende Person drückt „Erraten“. Im Teammodus dürfen nur
   Mitglieder des aktiven Teams Treffer beanspruchen; die darstellende Person niemals.
5. „Weiter“ verbraucht einen Skip und legt die Karte zurück. Sie bleibt ungelöst.
   Vorrang haben in diesem Zug noch nicht gezeigte Karten; sind nur zurückgelegte Karten übrig,
   können diese erneut erscheinen. Keine Karte verschwindet durch Überspringen oder Zeitablauf.
6. Nach Zeitablauf folgt eine kurze Trefferprüfung. Danach übernimmt die nächste Person.
7. Sobald alle Karten bestätigt gelöst sind, endet der Durchgang auch mitten in einem Zug.
   Zwischenstand und nächste Disziplin erscheinen; dann wird derselbe vollständige Pool neu gemischt.
8. Nach Pantomime folgt die Endwertung mit Gesamtpunkten und Punkten je Disziplin.

Im Teammodus wechseln die Teams nach jedem Zug; innerhalb jedes Teams wechseln die Aktiven.
Im Einzelmodus gilt eine einmal zufällig festgelegte Personenreihenfolge.
Die Zugreihenfolge läuft über Durchgangsgrenzen weiter, damit nicht immer dieselben Personen beginnen.
Ein neuer Durchgang beginnt bei der nächsten Person mit voller Zugzeit.
Durchgänge bestehen aus beliebig vielen Zügen, bis der Pool leer ist; sie sind keine einzelnen
Plattformrunden mit jeweils neu erzeugten Begriffen.

### Regeln der vier Disziplinen

| Durchgang | Erlaubt | Einschränkung |
| --- | --- | --- |
| Erklären | Freie mündliche Umschreibung | Begriff, Wortbestandteile, Übersetzungen und Buchstabieren verboten |
| Zeichnen | Auf dem Handy zeichnen; Bild live auf dem Host | Kein Sprechen, keine Buchstaben oder Zahlen, keine verräterischen Gesten |
| Ein Wort | Genau ein Hinweiswort pro Karte; dasselbe darf wiederholt werden | Kein zweites Hinweiswort, keine Gesten/Geräusche, kein Bestandteil des Begriffs |
| Pantomime | Körper und Gesten | Keine Worte, Geräusche, Buchstaben oder Aufschreiben |

Beim Zeichnen wird die Fläche bei jedem Kartenwechsel geleert. Auch hier wird laut geraten,
mit derselben Trefferbestätigung wie in den anderen Disziplinen. Keine zusätzliche Tipp-Pflicht.
Regelverstöße werden sozial geklärt und über die Trefferprüfung korrigiert.

## Wertung und Trefferprüfung

- Teams: ein Punkt pro bestätigter Karte für das aktive Team.
- Einzel: ein Punkt für die darstellende und ein Punkt für die richtig ratende Person.
- Überspringen und Zeitablauf geben keine Punkte und keinen Punktabzug.
- Punkte werden über alle vier Durchgänge addiert. Gleichstände sind gemeinsame Platzierungen.

Wie bei Pantomime kann die aktive Person nach dem Zug Treffer zurücknehmen oder einer anderen
berechtigten Person zuordnen. Wichtig für dieses Spiel: Öffentlich erscheinen dabei ausschließlich
gelöste Karten. Übersprungene, offene und zurückgenommene Karten bleiben für andere geheim.
Eine zurückgenommene Karte geht wieder in den Restpool; die Punkte werden zurückgerechnet.
Eine bei Zeitablauf noch offene Karte kann die aktive Person privat als rechtzeitig gelöst
nachtragen und einem berechtigten Rater zuordnen. Erst dann wird sie öffentlich.
Die Prüfung wird bestätigt, bevor der Server einen Durchgang endgültig abschließt.

Beispiel: 30 Karten bedeuten je Durchgang insgesamt 30 Teampunkte, über die Partie 120.
Im Einzelmodus entstehen entsprechend 60 Punkte je Durchgang, insgesamt 240.

## Host und Controller

**Host:** Vier klar erkennbare Disziplinen als Fortschrittsleiste, aktuelle Person/aktives Team,
großer Timer, Restkarten und Spielstand. Beim Zeichnen steht die Leinwand im Mittelpunkt;
bei Erklären und Pantomime bleibt Raum für die Menschen vor dem Bildschirm. Aktuelle und
noch ungelöste Begriffe stehen niemals auf dem Host. Ein bestätigter Treffer darf kurz erscheinen.
Die Autorschaft eigener Karten bleibt auch im Spiel verborgen.

**Aktives Handy:** Verdeckte Begriffskarte, Start, Weiter, Restzeit und disziplinspezifischer
Hinweis. Beim Zeichnen: vertraute Zeichenfläche mit Werkzeugen sowie kompakte Start-/Weiter-Aktionen.

**Ratendes Handy:** Große Taste „Erraten“, Timer und Teamstatus. Das andere Team sieht
„Team … ist dran“ und den Spielstand. Während der Sammlung sieht jede Person nur ihre Eingaben.

## Vorhandene Grundlagen und erforderliche Ergänzungen

Aktuell im Quellcode geprüft:

- `local-games/pantomime/src/server/index.ts`: aktive Rollen, verdeckte Karten,
  laufender Timer, Solo-/Teamwertung, Trefferzuordnung und Reconnect-Behandlung.
  Die jetzige Teamzuweisung folgt der Beitrittsreihenfolge; sie erfüllt noch keine zufällige
  Zuordnung und freie Teamwahl. Die vorhandene öffentliche Nachprüfung offener Begriffe
  wird für Studenten Activity bewusst nicht übernommen.
- `apps/controller/src/controller-ui/layouts/SocialPartyLayout.tsx` und `models.ts`:
  bestehendes `social_party`-Layout für Karten, Texteingaben, Aktionen und Trefferprüfung.
  Für die Sammlung wird es um eine generische Liste privater Texteingaben erweitert.
- `apps/controller/src/controller-ui/layouts/DrawingGuessLayout.tsx`:
  vorhandene Zeichenfläche; um generische Zugaktionen und mündliche Trefferbestätigung erweitern.
  Die Controller-Bindung wählt je Disziplin `social_party` oder `drawing_guess`.
- `local-games/zeichnen-und-erraten/src/server/index.ts` und `src/server/words.ts`:
  Zeichenaktionen, Linienzustand, Seitenverhältnis sowie vorhandene zweisprachige Begriffspools.
- `packages/game-core/src/types/GameManifest.ts` und `apps/server/src/rooms/roomLifecycle.ts`:
  vorhandenes `playerSetup` für öffentliche Auswahloptionen als Grundlage der Teamwahl.
  Zufällige Defaults und bedingte Anzeige/Validierung nach Spielmodus müssen ergänzt werden.

Ein neues Spiel kann nicht einfach private Quelldateien optionaler Nachbarspiele importieren.
Wiederverwendbare Zeichenmechanik bekommt einen gemeinsamen, dokumentierten Vertrag in `game-core`.
Der neue Spielserver verwaltet selbst Disziplinen, Kartenpool, Trefferprotokoll und Wertung.
Bestehende Inhalte werden nach Prüfung ihrer Lizenz und Eignung für alle vier Disziplinen als
eigener zweisprachiger Activity-Pool übernommen; keine Laufzeitabhängigkeit zu optionalen Spielen.
Nicht jeder vorhandene Zeichen- oder Pantomimebegriff eignet sich unverändert für alle Disziplinen.

Die gesamte Partie lebt in einem serverautoritativen Spielzustand:
`collecting → discipline_intro → turn_ready → acting → review → … → finished`.
Private Karten, Reihenfolge und eigene Eingaben bleiben serverseitig; öffentliche Ansichten
werden ausdrücklich aufgebaut. Nur die aktive Person erhält die aktuelle Karte.
Eingaben werden nach Rolle, Partie, Durchgang, Zug, Karte und Serverzeit geprüft.
Die vorhandene pausenbereinigte Raumzeit wird genutzt; verspätete und doppelte Treffer zählen nicht.
Bei kurzem Verbindungsverlust gilt eine Wiederverbindungsfrist; bei dauerhaft fehlender aktiver
Person endet der Zug ohne Offenlegung der ungelösten Karte. Fehlen spielbare Teams bzw. Rater,
wartet das Spiel auf Wiederverbindung oder einen ausdrücklichen Abbruch.
DE/EN-Texte folgen den bestehenden Katalog- und Sprachmustern; eigene Eingaben bleiben unverändert.

## Umsetzung und Abnahme

1. Gemeinsame Verträge für Team-Setup, private Texteingabeliste und wiederverwendbare Zeichenaktionen.
2. Eigenes Spielpaket mit vollständigem Vier-Durchgänge-Ablauf, vorhandenem Pool und beiden Wertungen.
3. Verdeckte Begriffssammlung, private Reconnect-Wiederherstellung und feste Teilnehmerliste.
4. Host-Darstellung, bestehende Controller-Layouts erweitern, DE/EN und optionale Registrierung.
5. Fokusprüfungen: identischer Pool über vier Durchgänge, Skips/Timeouts/Korrekturen,
   Datenschutz in tatsächlichen Host-/Controller-Nachrichten, Teamwahl und faire Zugrotation.
   Danach Plattform-Typecheck/Build und Host-/Handy-Ansichten einschließlich Zeichnen prüfen.

Abnahmekern: Mit 30 Karten werden dieselben 30 Karten viermal gespielt. Ungelöste Karten
gehen nie verloren. Eigene Begriffe gelangen während der Sammlung niemals an fremde Clients.
Teamwünsche gelten bereits im Setup und bleiben beim Start erhalten.
