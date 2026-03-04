/**
 * NexusTourney Backend - Google Apps Script
 * This script acts as a JSON API for the tournament application.
 * Database: Google Sheets
 */

const SPREADSHEET_ID = '14L6bK4nVmLVXDFfHia0j4limkullHsgHihm3ykLWL2M'; // Replace with your actual Spreadsheet ID
const ADMIN_EMAIL = 'dalinigba@gmail.com'; // L'email qui recevra les réponses et sera utilisé comme référence

function doGet(e) {
    try {
        ensureSheetsExist();
        const data = getAllData();
        return ContentService.createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doPost(e) {
    try {
        ensureSheetsExist();
        const payload = JSON.parse(e.postData.contents);
        const action = payload.action;
        const data = payload.data;
        let result;

        switch (action) {
            case 'addGame':
                result = addRow('Games', data);
                break;
            case 'updateGame':
                result = updateRow('Games', data.id, data);
                break;
            case 'deleteGame':
                result = deleteRow('Games', data.id);
                break;
            case 'registerPlayer':
                // Check if already registered by email or if pseudo is taken
                const players = getSheetData(SpreadsheetApp.openById(SPREADSHEET_ID), 'Players');
                if (players.some(p => p.email === data.email)) {
                    throw new Error('Cet email est déjà inscrit (une seule inscription autorisée).');
                }
                if (data.pseudo && players.some(p => p.pseudo && p.pseudo.toLowerCase() === data.pseudo.toLowerCase())) {
                    throw new Error('Ce pseudonyme est déjà utilisé. Veuillez en choisir un autre.');
                }
                // ID is generated inside addRow
                result = addRow('Players', data);

                // Send email via GmailApp (Server-side SMTP equivalent)
                try {
                    const settings = getSettings(ss);
                    const emailContent = `Félicitations ${data.firstName} ! Votre inscription est validée.\n\n` +
                        `Votre identifiant unique est : ${data.id}\n\n` +
                        `Conservez-le précieusement pour modifier votre inscription ou voir vos statistiques.`;

                    const senderName = settings.site_name || "NexusTourney Administration";

                    GmailApp.sendEmail(
                        data.email,
                        "Confirmation d'inscription - NexusTourney",
                        emailContent,
                        {
                            name: senderName,
                            replyTo: settings.email_sender || ADMIN_EMAIL
                        }
                    );
                    console.log("Email sent successfully via GmailApp");
                } catch (e) {
                    console.error("Email sending failed: " + e.toString());
                    // We don't throw here so the registration itself is still considered successful
                }
                break;
            case 'updatePlayer':
                result = updateRow('Players', data.id, data);
                break;
            case 'deletePlayer':
                result = deleteRow('Players', data.id);
                break;
            case 'updateMatch':
                result = updateRow('Matches', data.id, data);
                break;
            case 'addMatch':
                result = addRow('Matches', data);
                break;
            case 'deleteMatch':
                result = deleteRow('Matches', data.id);
                break;
            case 'setMatches': // For bracket generation
                result = setAllRows('Matches', data);
                break;
            case 'updateSetting':
                result = updateSetting(data.key, data.value);
                break;
            case 'updateSettings':
                result = updateSettings(data);
                break;
            case 'updateMajor':
                result = addRow('Majors', data);
                break;
            case 'deleteMajor':
                result = deleteRow('Majors', data.id);
                break;
            case 'updateLevel':
                result = addRow('Levels', data);
                break;
            case 'deleteLevel':
                result = deleteRow('Levels', data.id);
                break;
            case 'getCloudinarySignature':
                result = generateCloudinarySignature();
                break;
            default:
                throw new Error('Unknown action: ' + action);
        }

        return ContentService.createTextOutput(JSON.stringify({ success: true, result }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// --- Helpers ---

const REQUIRED_SHEETS = {
    'Games': ['id', 'name', 'type', 'imageUrl', 'backgroundImageUrl'],
    'Players': ['id', 'firstName', 'lastName', 'pseudo', 'major', 'level', 'gameId', 'avatarUrl', 'email'],
    'Matches': ['id', 'gameId', 'player1Id', 'player2Id', 'status', 'winnerId', 'round', 'nextMatchId'],
    'Settings': ['key', 'value'],
    'Majors': ['id', 'name'],
    'Levels': ['id', 'name']
};

function ensureSheetsExist() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Object.keys(REQUIRED_SHEETS).forEach(sheetName => {
        let sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            sheet.appendRow(REQUIRED_SHEETS[sheetName]);

            // Basic formatting for headers
            sheet.getRange(1, 1, 1, REQUIRED_SHEETS[sheetName].length)
                .setBackground('#4c1d95')
                .setFontColor('#ffffff')
                .setFontWeight('bold');
            sheet.setFrozenRows(1);
        }
    });
}

function getAllData() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return {
        games: getSheetData(ss, 'Games'),
        players: getSheetData(ss, 'Players'),
        matches: getSheetData(ss, 'Matches'),
        majors: getSheetData(ss, 'Majors'),
        levels: getSheetData(ss, 'Levels'),
        settings: getSettings(ss)
    };
}

function getSheetData(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const rows = sheet.getDataRange().getValues();
    if (rows.length === 0) return [];
    const headers = rows[0];

    // Create a mapping from sheet headers to frontend-friendly camelCase keys
    const headerMap = {
        'imageurl': 'imageUrl',
        'avatarurl': 'avatarUrl',
        'player1id': 'player1Id',
        'player2id': 'player2Id',
        'winnerid': 'winnerId',
        'gameid': 'gameId',
        'firstname': 'firstName',
        'lastname': 'lastName',
        'matchorder': 'matchOrder',
        'registrationsopen': 'registrationsOpen',
        'admincode': 'adminCode',
        'cloudinarycloudname': 'CLOUDINARY_CLOUD_NAME',
        'cloudinaryapikey': 'CLOUDINARY_API_KEY',
        'cloudinaryapisecret': 'CLOUDINARY_API_SECRET'
    };

    return rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => {
            if (!h) return;
            const originalHeader = h.toString();
            const lowerHeader = originalHeader.toLowerCase().replace(/\s/g, '');
            const key = headerMap[lowerHeader] || originalHeader;
            obj[key] = row[i];
        });
        return obj;
    });
}

function getSettings(ss) {
    const data = getSheetData(ss, 'Settings');
    const settings = {};
    data.forEach(item => settings[item.key] = item.value);
    return settings;
}

function addRow(sheetName, data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Generate ID if missing and 'id' column exists (case-insensitive)
    const idIndex = headers.findIndex(h => h && h.toString().toLowerCase() === 'id');
    if (!data.id && idIndex !== -1) {
        data.id = (sheetName.charAt(0).toLowerCase()) + Date.now();
    }

    const newRow = headers.map(h => {
        if (!h) return '';
        // Exact match first
        if (data[h] !== undefined) return data[h];
        // Case-insensitive match if not found
        const key = h.toString().toLowerCase();
        const dataKey = Object.keys(data).find(k => k.toLowerCase() === key);
        return dataKey ? data[dataKey] : '';
    });
    sheet.appendRow(newRow);
    return data;
}

function updateRow(sheetName, id, data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIndex = headers.findIndex(h => h && h.toString().toLowerCase() === 'id');
    if (idIndex === -1) throw new Error('ID column not found in ' + sheetName);

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][idIndex] == id) {
            headers.forEach((h, j) => {
                if (!h) return;
                const key = h.toString().toLowerCase();
                // Find matching value in data (exact or case-insensitive)
                let value = data[h];
                if (value === undefined) {
                    const dataKey = Object.keys(data).find(k => k.toLowerCase() === key);
                    if (dataKey) value = data[dataKey];
                }

                if (value !== undefined) {
                    sheet.getRange(i + 1, j + 1).setValue(value);
                }
            });
            return data;
        }
    }
    throw new Error('Row not found with ID: ' + id);
}

function deleteRow(sheetName, id) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idIndex = headers.indexOf('id');

    for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][idIndex] == id) {
            sheet.deleteRow(i + 1);
            return { id };
        }
    }
    throw new Error('Row not found with ID: ' + id);
}

function setAllRows(sheetName, dataArray) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Clear only data, keep headers
    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }

    if (dataArray.length > 0) {
        const values = dataArray.map(item => headers.map(h => item[h] || ''));
        sheet.getRange(2, 1, values.length, headers.length).setValues(values);
    }
    return dataArray;
}

function updateSetting(key, value) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Settings');
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == key) {
            sheet.getRange(i + 1, 2).setValue(value);
            return { key, value };
        }
    }
    // Not found, add it
    sheet.appendRow([key, value]);
    return { key, value };
}

function updateSettings(settingsObject) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Settings');
    const results = {};

    for (const key in settingsObject) {
        const value = settingsObject[key];
        const rows = sheet.getDataRange().getValues();
        let found = false;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] == key) {
                sheet.getRange(i + 1, 2).setValue(value);
                found = true;
                break;
            }
        }
        if (!found) {
            sheet.appendRow([key, value]);
        }
        results[key] = value;
    }
    return results;
}

function generateCloudinarySignature() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const settings = getSettings(ss);
    const secret = settings.CLOUDINARY_API_SECRET;
    const key = settings.CLOUDINARY_API_KEY;
    const name = settings.CLOUDINARY_CLOUD_NAME;

    if (!secret || !key || !name) {
        throw new Error("Cloudinary configuration missing in Settings (API Key, Secret, or Cloud Name)");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = "timestamp=" + timestamp + secret;
    const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, stringToSign)
        .map(function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');

    return {
        signature: signature,
        timestamp: timestamp,
        cloud_name: name,
        api_key: key
    };
}
