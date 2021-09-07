const functions = require("firebase-functions");
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.register = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {

        try {
            const key = request.body.serialNumber;
            let fields = Object.assign(request.body);
            delete fields.serialNumber;
            fields["createdAt"] = admin.firestore.FieldValue.serverTimestamp();
            await db.doc(`/receipt/${key}`).set(fields);
            response.send({
                result: "OK"
            });
        } catch (e) {
            console.error(e);
            response.send({ result: e.message });
        }

    });
});

exports.verify = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {

        console.log(request.query);

        try {
            const key = request.query.serialNumber;
            if (key != undefined) {
                let fields = Object.assign(request.query);
                delete fields.serialNumber;
                console.log(key);
                const doc = await db.doc(`/receipt/${key}`).get();
                if (doc.exists) {
                    if (request.query.responseType == 'json') {
                        console.log(`verified ${key} using camera.html`);
                        response.send({result: 'valid'});
                    } else {
                        console.log(`verified ${key} - native`);
                        response.redirect('/valid.html');         
                    }
                } else {
                    // insert it back to the DB so next time it's found.
                    if (key.length == 36) {
                        console.warn(`key not found: ${request.url}, ${request.ip}`);
                        let fields = Object.assign(request.query);
                        delete fields.serialNumber;
                        fields["createdAt"] = admin.firestore.FieldValue.serverTimestamp();
                        fields["reinsert"] = true;
                        await db.doc(`/receipt/${key}`).set(fields);
                        console.warn(`reinserted key = ${key}`);
                        if (request.query.responseType == 'json') {
                            response.send({ result: 'valid' });
                        } else {
                            response.redirect('/valid.html');
                        }
                    } else {
                        console.warn(`potential forgery: ${request.url}, ${request.ip}`);
                        if (request.query.responseType == 'json') {
                            response.send({ result: 'notfound' });
                        } else {
                            response.redirect('/notfound.html');
                        }
                    }
                }
            } else {
            }
        } catch (e) {
            console.error(e);
            response.send({ result: e.message });
        }

    });
});


