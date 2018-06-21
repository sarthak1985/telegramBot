var telegramToken = "{telegramToken}"; // ------------- Replace this with Telegram Token Url ----------- 
var url = "https://api.telegram.org/bot" + telegramToken;
var webAppUrl = "{webAppUrl}"; //------------- Replace this with googlr WebApps Url ----------- 
var ssid = "{Google Sheet Id}"; //------------- Replace this with Google Sheet Id -----------
var spid = "{Log Chat Id}"; //------------- Replace this with a Telegram Chat Id where you want to send your error message -----------
var cmpUrl = "https://api.coinmarketcap.com/v1";
var quoteUrl = 'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1';

var giphyUrl = "http://api.giphy.com/v1";
var giphyAPIToken = "dc6zaTOxFJmzC";

/* ------------- TELEGRAM METHODS STARTS ----------- */
function getMe() {
  
  var response = UrlFetchApp.fetch(url + "/getMe");
  Logger.log(response);
  
}

function getUpdates() {
  
  var response = UrlFetchApp.fetch(url + "/getUpdates");
  Logger.log(response.getContentText());
}

function setWebhook() {
  
  var response = UrlFetchApp.fetch(url + "/setWebhook?url=" + webAppUrl);
  Logger.log(response.getContentText());
  
}

function send(data) {
  //var response = UrlFetchApp.fetch(url + "/sendMessage?chat_id=" + id + "&text=" + encodeURIComponent(text));
  var response = UrlFetchApp.fetch(url+ '/', data);
  Logger.log(response.getContentText());
  
}
/* ----------TELEGRAM METHODS ENDS--------------------*/

/* ----------GOOGLE WEBAPPS METHODS STARTS------------*/

function doGet(e) {
  return HtmlService.createHtmlOutput("Hello" + JSON.stringify(e));
}


//TELEGARM WEBHOOK POST

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
     //GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), "log",JSON.stringify(contents, null, 4));
    
    if (contents.hasOwnProperty('message')) {
      //GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), "log",JSON.stringify(contents, null, 4));
      var msg = contents.message;
      var chatId = msg.chat.id;
      var name = msg.from.first_name+ " " + msg.from.last_name;
      
      // Make sure the update is a command and offset position is 0.
      if (msg.hasOwnProperty('entities') && msg.entities[0].type == 'bot_command' && msg.entities[0].offset == 0) {
        
        var cmdLenght = msg.entities[0].length;
        var messageText = msg.text;
        var cmd = messageText.substring (0,cmdLenght);
        
        //CMD WITH NO INSTRUCTIONS
        
        if (messageText == '/hi') {
          sendGreetings(chatId,name);
        }
        
        //CMD WITH INSTRUCTIONS
        var instruction = messageText.split(" ").slice(1).join(" ");
        switch (cmd.toLowerCase()){
            
          case "/coin":
            getCoinValue(chatId,instruction)
            break;
            
          case "/sticker":
            getSticker(chatId,instruction)
            break;
            
          case "/log":
            log(instruction,chatId,name);
            break;
            
            
        }
      }
    }
    
  } catch (e) {
    sendMessage(spid,'HTML',JSON.stringify(e, null, 4));
  }
  
}

/* ----------GOOGLE WEBAPPS METHODS ENDS---------------*/

/* ----------GIFY METHODS STARTS---------------*/

function translateWordtoSticker(text)
{
  var response = UrlFetchApp.fetch(giphyUrl + "/stickers/translate?s=" + encodeURIComponent(text) + "&api_key="+ giphyAPIToken);
  var rs = JSON.parse(response.getContentText()); 
  var url = rs.data.images.original.mp4;
  
  return url;
}

/* ----------GIFY METHODS ENDS---------------*/

// TELEGRAM COMMAND METHODS

function sendGreetings(chatId,name){
  
  var gText = "Hello " + name + ". Greetings of the day !!! ";
  var data = UrlFetchApp.fetch(quoteUrl);
  var posts = JSON.parse(data);
  var post = posts.shift();
  var cleanContent = post.content.replace(/<(?:.|\n)*?>/gm, "").replace(/\n/gm, "");
  var quote = '"' + cleanContent + '"\n � <strong>' + post.title + '</strong>';
  var replyText = gText + "\n" + quote;
  sendMessage(chatId,'HTML',replyText);
  
}

function getCoinValue(chatId,coinName){
  var replyText = "Sorry Something Went Wrong. ";
  
  
  var response = UrlFetchApp.fetch(cmpUrl + "/ticker/" + coinName, {'muteHttpExceptions': true} );
  var data = JSON.parse(response.getContentText());  
  if (data.hasOwnProperty('error')){
    replyText = data.error;
  }
  else{
    replyText = "<strong>Coin Name:</strong> " + coinName.toUpperCase() + " - <strong>USD Value:</strong> " + data[0]['price_usd'] + " - <strong>BTC Value:</strong> " + data[0]['price_btc'];     
  }
  sendMessage(chatId,'HTML',replyText);
  
}

function getSticker(chatId,searchText){
  
  var stickerUrl = translateWordtoSticker(searchText);
  
  sendVideo(chatId,'HTML',stickerUrl);
}

function log(text,chatId,name){
  var ss = SpreadsheetApp.openById(ssid);
  var sheetName = text.split(" ")[0];
  var newText = text.split(" ").slice(1).join(" ");
  var sheet = ss.getSheetByName(sheetName) ? ss.getSheetByName(sheetName) : createSheet(ss,sheetName);
  sheet.appendRow([new Date(), id, name, newText]);
  var replyText = "Your text " + newText + " is now added to the sheet " + sheetName;
  
  sendMessage(chatId,'HTML',replyText);
}



// UTILITY METHODS

function sendMessage(chatId,parseMode,message){
  
  var payload = {
    'method': 'sendMessage',
    'chat_id': String(chatId),
    'text': message,
    'parse_mode': parseMode
  }
  var data = {
    "method": "post",
    "payload": payload
  }
  
  send(data);
  
}

function sendPhoto(chatId,parseMode,photoUrl){
  var payload = {
    'method': 'sendPhoto',
    'chat_id': String(chatId),
    'photo': photoUrl,
    'parse_mode': parseMode
  }
  var data = {
    "method": "post",
    "payload": payload
  }
  
  send(data);
}

function sendVideo(chatId,parseMode,videoUrl){
  var payload = {
    'method': 'sendVideo',
    'chat_id': String(chatId),
    'video': videoUrl,
    'parse_mode': parseMode
  }
  var data = {
    "method": "post",
    "payload": payload
  }
  
  send(data);
}

function sendSticker(chatId,webpUrl){
  var payload = {
    'method': 'sendSticker',
    'chat_id': String(chatId),
    'sticker': webpUrl
  }
  var data = {
    "method": "post",
    "payload": payload
  }
  
  send(data);
}

function createSheet(ss, sheetName) {
  var sheet = ss.insertSheet(sheetName);
  sheet.setFrozenRows(1);
  var values = [
    ["Date", "Sender ID", "Name", "Details"]
  ];
  var range = sheet.getRange("A1:D1");
  range.setValues(values);
  
  return sheet;
}
