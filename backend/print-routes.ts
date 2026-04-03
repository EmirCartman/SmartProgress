// mock app.listen
const express = require('express');
const oldListen = express.application.listen;
express.application.listen = function() { console.log('Mocked listen'); return this; };

import app from "./src/app";

console.log("Programs router stack:");
const programRouterLayer = app._router.stack.find((r: any) => r.name === 'router' && r.regexp.toString().includes('programs'));

if (programRouterLayer) {
    const programRouter = programRouterLayer.handle;
    programRouter.stack.forEach((r: any, idx: number) => {
        if (r.route) {
            console.log(idx + ": " + Object.keys(r.route.methods).join(',').toUpperCase() + ' ' + r.route.path);
        } else if (r.name === 'router') {
            console.log(idx + ": Sub-router:", r.regexp);
        } else {
            console.log(idx + ": Middleware:", r.name);
        }
    });
} else {
    console.log("Programs router not found in app stack.");
}
process.exit(0);
