const functions = require("firebase-functions");
const cors = require('cors')({ origin: true });   // 
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.register = functions.https.onRequest((request, response) => {
    cors(request, response, async (err) => {

        if (err) {
            // Denied by CORS/error with CORS configuration
            console.error("CORS blocked request -> ", err);
            response.status(403).send("Forbidden by CORS");
            return;
        }

        try {
            console.log(`referer = ${request.headers.referer}, hostname = ${request.hostname}`);

            let ip1;

            if (!process.env.FUNCTIONS_EMULATOR) {
                let ipAddress = request.headers['x-forwarded-for'];
                ip1 = ipAddress.split(',')[0];
                console.log(`Fetching client ipAddress ${ip1}`);
            } else {
                ip1 = 'emulator';
            }

            // if (request.headers.referer.includes('vaccine-ontario.ca') || request.headers.referer.includes('covidpass') || process.env.FUNCTIONS_EMULATOR) {
            const key = request.body.serialNumber;
            let fields = Object.assign(request.body);
            delete fields.serialNumber;
            fields["createdAt"] = admin.firestore.FieldValue.serverTimestamp();
            fields["clientIp"] = ip1;
            await db.doc(`/receipt/${key}`).set(fields);
            response.send({
                result: "OK"
            });
            // } else {
            //     response.sendStatus(401);
            // }
        } catch (e) {
            console.error(e);
            response.send({ result: e.message });
        }

    });
});

exports.registerv2 = functions.https.onRequest((request, response) => {
    cors(request, response, async (err) => {

        if (err) {
            // Denied by CORS/error with CORS configuration
            console.error("CORS blocked request -> ", err);
            response.status(403).send("Forbidden by CORS");
            return;
        }

        try {
            console.log(`referer = ${request.headers.referer}, hostname = ${request.hostname}`);

            let ip1;

            if (!process.env.FUNCTIONS_EMULATOR) {
                let ipAddress = request.headers['x-forwarded-for'];
                ip1 = ipAddress.split(',')[0];
                console.log(`Fetching client ipAddress ${ip1}`);
            } else {
                ip1 = 'emulator';
            }

            if (request.headers.referer.includes('vaccine-ontario.ca') || request.headers.referer.includes('covidpass') || process.env.FUNCTIONS_EMULATOR) {
                const key = request.body.serialNumber;
                let fields = Object.assign(request.body);
                delete fields.serialNumber;
                fields["createdAt"] = admin.firestore.FieldValue.serverTimestamp();
                fields["clientIp"] = ip1;
                await db.doc(`/receipt/${key}`).set(fields);
                response.send({
                    result: "OK"
                });
            } else {
                response.sendStatus(401);
            }
        } catch (e) {
            console.error(e);
            response.send({ result: e.message });
        }

    });
});

exports.verify = functions.https.onRequest((request, response) => {
    cors(request, response, async (err) => {

        console.log(request.query);

        if (err) {
            // Denied by CORS/error with CORS configuration
            console.error("CORS blocked request -> ", err);
            response.status(403).send("Forbidden by CORS");
            return;
        }

        try {

            let ip1;

            if (!process.env.FUNCTIONS_EMULATOR) {
                let ipAddress = request.headers['x-forwarded-for'];
                ip1 = ipAddress.split(',')[0];
                console.log(`Fetching client ipAddress ${ip1}`);
            } else {
                ip1 = 'emulator';
            }

            const key = request.query.serialNumber;
            let keyFound = false;

            if (key != undefined) {
                let fields = Object.assign(request.query);
                delete fields.serialNumber;
                console.log(key);
                console.log(JSON.stringify(fields, null, 2));
                const doc = await db.doc(`/receipt/${key}`).get();
                if (doc.exists) {
                    keyFound = true;
                    const data = doc.data();
                    if (
                        (data.vaccineName == fields.vaccineName) &&
                        (data.vaccinationDate == fields.vaccinationDate) &&
                        (data.numDoses == fields.dose) &&
                        (data.organization == fields.organization)
                    ) {
                        if (request.query.responseType == 'json') {
                            console.log(`verified ${key} using camera.html`);
                            response.send({ result: 'valid' });
                        } else {
                            console.log(`verified ${key} - native`);
                            response.redirect('/valid.html');
                        }
                        return;
                    }
                }

            }

            console.warn(`potential forgery: ${request.url}, ${ip1}, keyFound = ${keyFound}`);
            if (request.query.responseType == 'json') {
                response.send({ result: 'notfound' });
            } else {
                response.redirect('/notfound.html');
            }
            return;

        } catch (e) {
            console.error(e);
            response.send({ result: e.message });
        }

    });
});


