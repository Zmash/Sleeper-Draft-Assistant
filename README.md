# Sleeper-Draft-Assistant
Dieses Repository enthält ein Google Spreadsheet Script, welches über die Sleeper API kommuniziert. Es dient als Draft-Helper für NFL Fantasy Sleeper Drafts. Das Script automatisiert das Abhaken der Drafts in einem Raking Sheet, ermöglicht einfache Konfigurationen und bietet Echtzeit-Updates.

## Über
Das NFL Fantasy Sleeper Draft Helper Script ist ein leistungsstarkes Tool zur Automatisierung von NFL Fantasy Sleeper Drafts. Mit seinem cloudbasierten Ansatz ermöglicht es Nutzern, schnell und effizient Spielerrankings zu verwalten.

## Hauptfunktionen
- **Automatisierter Fetch:** Das Script verfolgt automatisch die Picks, die in deinem Fantasy-Draft getroffen wurden.
- **Echtzeit-Aktualisierung:** Alle Picks werden in Echtzeit aktualisiert, so dass dein Raking immer auf dem neuesten Stand ist.
- **Benutzerdefinierte Konfiguration:** Über das Konfigurationsblatt können benutzerspezifische Einstellungen wie Benutzer-ID, Liga-ID und Draft-ID leicht vorgenommen werden.
- **Roster Sidebar:** Zeige dein aktuelles Team mit einem einfachen Klick auf der Sidebar.
- **Logging:** Das Log-Blatt protokolliert alle Aktionen und gibt bei Bedarf detaillierte Fehlermeldungen aus.

## Einrichtung
1. **Öffne Google Spreadsheet.**
2. **Kopiere das Example_Sheet.xlsx in das Spreadsheet oder lege zumindest ein Blatt mit dem Namen "ranking" und eins mit dem namen "config" an.**
3. **Falls du nicht das Example_Sheet.xlsx nutzt füge in "ranking" eine Header-Zeile ein in der Zumindest in Spalte C Der Player Name steht (Vollständiger name).**
4. **Füge in das Blatt "config" mindestens deinen Sleeper username in 1B hinzu, besser noch die Draft_id in 4B.**
5. **Kopiere dein Ranking in das "raking Blatt". Die erste Zeile muss als Header hinterlegt bleiben. Spalte C muss der Vor- und Nachname des Spielers beinhalten.**
6. **Gehe zum Menü "Erweiterungen" > "Script-Editor".**
7. **Kopiere das gesamte Script, sowie die HTML Datein aus diesem Repository in den Script-Editor.**
8. **Speichee das Script und kehre zu deinem Spreadsheet zurück.**
9. **Nutze das "Draft Helfer" Menü, um mit der Konfiguration zu beginnen.**
10. **Klicke Picks aktuallisieren oder starte über das "Draft Helfer" Menü den echtzeit fetch über "start: Autofetch."**
11. **Deine Picks werden grün und Picks von deinen Mitspielern grau markiert. Weiße Zeilen sind nciht gepickte Spieler.**

## Support
Falls du Unterstützung benötigst oder Fehler melden möchtest, öffne bitte einen Issue in diesem Repository.

## Lizenz
Dieses Projekt steht unter der MIT-Lizenz - siehe die [LICENSE.md](LICENSE.md) Datei für Details.

---

Entwickelt mit ❤️ für Fantasy Football Fans.
