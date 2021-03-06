/**
 * Counterparty utilities
 */

var bigInt = require("big-integer");

var SATOSHI = 100000000;


var exports = {};

exports.createSendScriptHex = function(assetName, amountInteger, utxoId) {

    var unencoded_datachunk = buildUnencodedSendData(assetName, amountInteger);

    var datachunk_encoded = xcp_rc4(utxoId, unencoded_datachunk);

    var lengthHex = padprefix(bigInt(Math.ceil(datachunk_encoded.length / 2)).toString(16),2);
    //      \/ OP_RETURN  \/ length   \/ send data
    return "6a"         + lengthHex + datachunk_encoded;
}

exports.createIssuanceScriptHex = function(assetName, amountInteger, divisible, description, utxoId) {

    var unencoded_datachunk = buildUnencodedIssuanceData(assetName, amountInteger, divisible, description);

    var datachunk_encoded = xcp_rc4(utxoId, unencoded_datachunk);

    var lengthHex = padprefix(bigInt(Math.ceil(datachunk_encoded.length / 2)).toString(16), 2);
    //      \/ OP_RETURN  \/ length   \/ send data
    return "6a"         + lengthHex + datachunk_encoded;
}


// ------------------------------------------------------------------------

function buildUnencodedSendData(assetName, amountInteger) {

    var prefix  = "434e545250525459"; // CNTRPRTY
    var type_id = "00000000";         // send (0, 0x00)

    var asset_id_hex = padprefix(assetNameToAssetIdHex(assetName), 16);

    var amount_hex = padprefix((amountInteger).toString(16), 16);

    var data = prefix + type_id + asset_id_hex + amount_hex; 

    return data;
}

function buildUnencodedIssuanceData(assetName, amountInteger, divisible, description) {

    var prefix  = "434e545250525459"; // CNTRPRTY
    var type_id = "00000014";         // issuance (20, 0x14)

    var asset_id_hex   = padprefix(assetNameToAssetIdHex(assetName), 16);
    var quantity_hex   = padprefix((amountInteger).toString(16), 16);
    var divisible_hex  = (divisible ? '01' : '00');
    var callable_hex   = '00';
    var call_date_hex  = '00000000';
    var call_price_hex = '00000000';

    var description_length_hex = padprefix((description.length).toString(16), 2);
    var description_hex = bin2hex(description);

    var data = prefix + type_id + asset_id_hex + quantity_hex + divisible_hex + callable_hex + call_date_hex + call_price_hex + description_length_hex + description_hex;

    return data;
}



function assetNameToAssetIdHex(assetName) {
    var asset_id
    
    if (assetName == "XCP") {
        
        asset_id = bigInt(1).toString(16);
        
    } else if (assetName.substr(0, 1) == "A") {
        
        var pre_id = assetName.substr(1);
        
        // var pre_id_bigint = BigIntegerSM(pre_id);
        var pre_id_bigint = bigInt(pre_id);
        
        //asset_id = pre_id_bigint.toString(16);
        asset_id = pre_id_bigint.toString(16);
        
    } else {  
    
        var b26_digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
        var name_array = assetName.split("");
    
        // var n_bigint = BigIntegerSM(0);
        var n_bigint = bigInt(0);
    
        for (i = 0; i < name_array.length; i++) { 
            
            // n_bigint = BigIntegerSM(n_bigint).multiply(26);
            // n_bigint = BigIntegerSM(n_bigint).add(b26_digits.indexOf(name_array[i]));

            n_bigint = n_bigint.multiply(26);
            n_bigint = n_bigint.add(b26_digits.indexOf(name_array[i]));
                    
        }    
     
        //asset_id = n_bigint.toString(16);
        asset_id = n_bigint.toString(16);
    
    } 
    
    return asset_id;
}

function padprefix(str, max) {   
    str = str.toString();
    return str.length < max ? padprefix('0' + str, max) : str;   
}

function xcp_rc4(key, datachunk) {
    return bin2hex(rc4(hex2bin(key), hex2bin(datachunk)));
}

function rc4(key, str) {
    //https://gist.github.com/farhadi/2185197
    
    var s = [], j = 0, x, res = '';
    for (var i = 0; i < 256; i++) {
        s[i] = i;
    }
    for (i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
    }
    i = 0;
    j = 0;
    for (var y = 0; y < str.length; y++) {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
        res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
    return res;
    
}

function bin2hex(s) {
    // http://kevin.vanzonneveld.net
    var i, l, o = "",
            n;

    s += "";

    for (i = 0, l = s.length; i < l; i++) {
            n = s.charCodeAt(i).toString(16);
            o += n.length < 2 ? "0" + n : n;
    }

    return o;
}

function hex2bin(hex) {
    var bytes = [];
    var str;
    
    for (var i = 0; i < hex.length - 1; i += 2) {

            var ch = parseInt(hex.substr(i, 2), 16);
            bytes.push(ch);

    }

    str = String.fromCharCode.apply(String, bytes);
    return str;
}

// ------------------------------------------------------------------------
module.exports = exports;
