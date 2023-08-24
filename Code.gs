var MAIN_SHEET_NAME = "ranking";
var CONFIG_SHEET_NAME = "config";
var PICKS_SHEET_NAME = "picks";
var LOG_SHEET_NAME = "log";
var CACHE_EXPIRATION = 3600; // Cache expiration in seconds (1 hour)

function getSheetByName(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function fetchDataFromSleeper(isTriggered) {
  var sheet = getSheetByName(MAIN_SHEET_NAME);
  var pickSheet = getSheetByName(PICKS_SHEET_NAME);
  var configSheet = getSheetByName(CONFIG_SHEET_NAME);
  var lastRow = sheet.getLastRow();

  // Use cache service for frequently accessed data
  var cache = CacheService.getScriptCache();

  var lastPickMarked = pickSheet.getRange("A1").getValue() || 0;
  var userId = cache.get("userId") || configSheet.getRange("B2").getValue();
  var leagueId = cache.get("leagueId") || configSheet.getRange("B3").getValue();
  var draftId = cache.get("draftId") || configSheet.getRange("B4").getValue();

  try {
    if (!userId) {
      userId = getUserIdFromUsername(configSheet.getRange("B1").getValue());
      configSheet.getRange("B2").setValue(userId);
      cache.put("userId", userId, CACHE_EXPIRATION);
    }
    if (!leagueId) {
      leagueId = getLeagueId(userId);
      configSheet.getRange("B3").setValue(leagueId);
      cache.put("leagueId", leagueId, CACHE_EXPIRATION);
    }
    if (!draftId) {
      draftId = getDraftIdFromLeagueId(leagueId);
      configSheet.getRange("B4").setValue(draftId);
      cache.put("draftId", draftId, CACHE_EXPIRATION);
    }
    if (!draftId || !userId) {
      logEntry(null, "Benutzer-ID oder Draft-ID nicht gefunden. Bitte Einstellungen überprüfen.");
      return;
    }

    var apiUrl = "https://api.sleeper.app/v1/draft/" + draftId + "/picks";
    var response = UrlFetchApp.fetch(apiUrl);
    var data = JSON.parse(response.getContentText());

    var myUserId = configSheet.getRange("B2").getValue();
    var allSheetData = sheet.getRange(2, 1, lastRow, 3).getValues();
    var updates = [];

    for (var i = lastPickMarked; i < data.length; i++) {
      var playerData = data[i];
      var pickNumber = playerData.pick_no;
      var pickedBy = playerData.picked_by;
      var fullNameAPI = playerData.metadata.first_name + " " + playerData.metadata.last_name;

      for (var row = 0; row < allSheetData.length; row++) {
        if (isNameMatch(fullNameAPI, allSheetData[row][2])) {
          var backgroundColors = (pickedBy === myUserId) ? Array(8).fill("green") : Array(8).fill("gray");
          updates.push({range: sheet.getRange(row + 2, 1, 1, 8), colors: backgroundColors});
          logEntry(row + 2, "Farbe geändert zu: " + backgroundColors[0]);
          pickSheet.getRange("A1").setValue(pickNumber);
          break;
        }
      }
    }

    // Apply all updates in a single batch operation
    updates.forEach(update => {
      update.range.setBackgrounds([update.colors]);
    });

  } catch (e) {
    logEntry(null, "Ein Fehler ist aufgetreten: " + e.toString());
  }

  //Meldung der Aktuallisierung geben, wenn fetch nicht von trigger aufgerufen wurde
  if (!isTriggered) {
    SpreadsheetApp.getUi().alert('Alle Picks wurden aktualisiert!');
  }
}

function getUserIdFromUsername(username) {
  var apiUrl = "https://api.sleeper.app/v1/user/" + username;
  var data = JSON.parse(UrlFetchApp.fetch(apiUrl).getContentText());
  return data.user_id;
}

function getLeagueId(userId) {
  var configSheet = getSheetByName(CONFIG_SHEET_NAME);
  var year = configSheet.getRange("B5").getValue() || new Date().getFullYear();
  configSheet.getRange("B5").setValue(year);

  var apiUrl = "https://api.sleeper.app/v1/user/" + userId + "/leagues/nfl/" + year;
  var leagues = JSON.parse(UrlFetchApp.fetch(apiUrl).getContentText());

  var draftingLeague = leagues.find(league => league.status === "drafting" || league.status === "in_season");
  return draftingLeague ? draftingLeague.league_id : null;
}

function getDraftIdFromLeagueId(leagueId) {
  var apiUrl = "https://api.sleeper.app/v1/league/" + leagueId + "/drafts";
  var drafts = JSON.parse(UrlFetchApp.fetch(apiUrl).getContentText());
  return drafts[0] ? drafts[0].draft_id : null;
}

function arraysEqual(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

function logEntry(row, text) {
  Logger.log(text);
  var logSheet = getSheetByName(LOG_SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().insertSheet(LOG_SHEET_NAME);
  if (!logSheet.getRange("A1").getValue()) {
    logSheet.appendRow(["Timestamp", "Zeile", "Nachricht"]);
  }
  logSheet.appendRow([new Date(), row, text]);
}

function isNameMatch(name1, name2) {
  var regEx = new RegExp(name1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return regEx.test(name2);
}

function setupTrigger() {
  // Überprüfen, ob bereits ein Trigger für fetchDataFromSleeper existiert.
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'fetchDataFromSleeper') {
      return; // Es gibt bereits einen Trigger. Nicht erneut erstellen.
    }
  }
  
  // Trigger erstellen
  ScriptApp.newTrigger('fetchDataFromSleeper')
    .timeBased()
    .everyMinutes(1)
    .create();

  // fetchDataFromSleeper sofort ausführen
  fetchDataFromSleeper(true);
}

function deleteTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'fetchDataFromSleeper') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// Function to show the configuration sidebar
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Page')
      .setTitle('Konfiguration')
      .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Function to store configuration data from the form to the sheet
function storeConfigData(username, userId, leagueId, draftId, year) {
  var configSheet = getSheetByName(CONFIG_SHEET_NAME);
  configSheet.getRange("B1").setValue(username);
  configSheet.getRange("B2").setValue(userId);
  configSheet.getRange("B3").setValue(leagueId);
  configSheet.getRange("B4").setValue(draftId);
  configSheet.getRange("B5").setValue(year);
}

// Function to get the configuration data from the CONFIG_SHEET
function getConfigData() {
  var configSheet = getSheetByName(CONFIG_SHEET_NAME);
  return {
    username: configSheet.getRange("B1").getValue(),
    userId: configSheet.getRange("B2").getValue(),
    leagueId: configSheet.getRange("B3").getValue(),
    draftId: configSheet.getRange("B4").getValue(),
    year: configSheet.getRange("B5").getValue()
  };
}


function getRosterData() {
  var configSheet = getSheetByName(CONFIG_SHEET_NAME);
  var draftId = configSheet.getRange("B4").getValue();
  var userId = configSheet.getRange("B2").getValue();
  var apiUrl = "https://api.sleeper.app/v1/draft/" + draftId + "/picks";
  var response = UrlFetchApp.fetch(apiUrl);
  var data = JSON.parse(response.getContentText());

  var myPicks = data.filter(function(pick) {
    return pick.picked_by === userId;
  });

  // Sort by position order and then pick number
  var positionOrder = ["QB", "RB", "WR", "TE", "K", "DEF"];
  myPicks.sort(function(a, b) {
    if (positionOrder.indexOf(a.metadata.position) !== positionOrder.indexOf(b.metadata.position)) {
      return positionOrder.indexOf(a.metadata.position) - positionOrder.indexOf(b.metadata.position);
    }
    return a.pick_no - b.pick_no;
  });

  var rosterData = myPicks.map(function(pick) {
    return {
      position: pick.metadata.position,
      name: pick.metadata.first_name + " " + pick.metadata.last_name,
      team: pick.metadata.team,
      pickNumber: pick.pick_no
    };
  });

  return rosterData;
}

function showRosterSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('RosterSidebar')
      .setTitle('Aktuelles Team')
      .setWidth(500);
  SpreadsheetApp.getUi().showSidebar(html);
}

function onOpen() {
  fetchDataFromSleeper(false);
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Draft Helfer')
      .addItem('Konfiguration', 'showSidebar')
      .addItem('Aktuelles Team', 'showRosterSidebar')
      .addItem('Lade Daten von Sleeper', 'fetchDataFromSleeper')
      .addItem('start: Autofetch', 'setupTrigger')
      .addItem('stop: Autofetch', 'deleteTrigger')
      .addToUi();
}

// Function to get the current pick number
function getCurrentPick() {
  var pickSheet = getSheetByName(PICKS_SHEET_NAME);
  return pickSheet.getRange("A1").getValue();
}

// Function to reset all picks
function resetAllPicks() {
  var pickSheet = getSheetByName(PICKS_SHEET_NAME);
  pickSheet.getRange("A1").setValue(0);

  var rankingSheet = getSheetByName(MAIN_SHEET_NAME);
  var lastRow = rankingSheet.getLastRow();
  rankingSheet.getRange(2, 1, lastRow, 8).setBackground("white");
}


