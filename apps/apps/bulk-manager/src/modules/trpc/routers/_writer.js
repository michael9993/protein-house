const fs = require("fs");
const BT = String.fromCharCode(96);
const DQ = String.fromCharCode(34);

let c = "";

function a(s) { c += s + "
"; }
function abt(before, tpl, after) { c += before + BT + tpl + BT + after + "
"; }
