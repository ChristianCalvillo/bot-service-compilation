// Declaración de liberías y variables
var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var inMemoryStorage = new builder.MemoryBotStorage();   

// Puesta en marcha del servidor de Restify
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Crea un conector de chat para cominicarse con el servicio de Bot Framework
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Escucha de los mensajes del usuario
server.post('/api/messages', connector.listen());
var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Creación del bot con una función para recibir los mensajes de los usuarios
var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);
bot.set('storage', tableStorage);

// Escucha y Dialogo de prueba para el servicio de QnAMaker
var previewRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey
});

var basicQnAMakerPreviewDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [previewRecognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3
    }
);

bot.dialog('basicQnAMakerPreviewDialog', basicQnAMakerPreviewDialog);

// Escucha y Dialogo de prueba para el servicio de QnAMaker
var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Agrega compatibilidad con la versión preview de QnAMaker
    endpointHostName: process.env.QnAEndpointHostName
});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: "I'm not quite sure what you're asking. Please ask your question again.",
    qnaThreshold: 0.3
});

bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);

bot.dialog('/', //basicQnAMakerDialog);
[
    function (session) {

        var qnaKnowledgebaseId = process.env.QnAKnowledgebaseId;
        var qnaAuthKey = process.env.QnAAuthKey || process.env.QnASubscriptionKey;
        var endpointHostName = process.env.QnAEndpointHostName;

        // Agrega las llaves de suscripción y el ID de la base de conocimiento
        if ((qnaAuthKey == null || qnaAuthKey == '') || (qnaKnowledgebaseId == null || qnaKnowledgebaseId == ''))
            session.send('Please set QnAKnowledgebaseId, QnAAuthKey and QnAEndpointHostName (if applicable) in App Settings. Learn how to get them at https://aka.ms/qnaabssetup.');
        else {
            if (endpointHostName == null || endpointHostName == '')
            // Remplaza con el servicio preview de QnAMakerDialog
            session.replaceDialog('basicQnAMakerPreviewDialog');
        else
            // Remplaza con el servicio de GA QnAMakerDialog
            session.replaceDialog('basicQnAMakerDialog');
        }

    }
]);
