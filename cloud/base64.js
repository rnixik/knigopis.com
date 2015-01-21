var utf8 = require("cloud/utf8.js").utf8;

// Base64 Module
//
// Cleaner, modularized and properly scoped base64 encoding and decoding module for strings.
//
// copyright: MIT
// author: Nijiko Yonskai, @nijikokun, nijikokun@gmail.com
(function(name, definition, context, dependencies) {
    if (typeof context['module'] !== 'undefined' && context['module']['exports']) {
        if (dependencies && context['require']) {
            for (var i = 0; i < dependencies.length; i++)
                context[dependencies[i]] = context['require'](dependencies[i]);
        }
        context['module']['exports'] = definition.apply(context);
    }
    else if (typeof context['define'] !== 'undefined' && context['define'] === 'function' && context['define']['amd']) {
        define(name, (dependencies || []), definition);
    }
    else {
        context[name] = definition();
    }
})('base64', function() {
    var $this = this;
    var $utf8 = utf8 || this.utf8;
    var map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    return {
        encode: function(input) {
            if (typeof $utf8 === 'undefined') 
                throw {error: "MissingMethod", message: "UTF8 Module is missing."};
            if (typeof input !== 'string')
                return input;
            else
                input = $utf8.encode(input);
            var output = "", a, b, c, d, e, f, g, i = 0;

            while (i < input.length) {
                a = input.charCodeAt(i++);
                b = input.charCodeAt(i++);
                c = input.charCodeAt(i++);
                d = a >> 2;
                e = ((a & 3) << 4) | (b >> 4);
                f = ((b & 15) << 2) | (c >> 6);
                g = c & 63;

                if (isNaN(b))
                    f = g = 64;
                else if (isNaN(c))
                    g = 64;

                output += map.charAt(d) + map.charAt(e) + map.charAt(f) + map.charAt(g);
            }

            return output;
        },
        decode: function(input) {
            if (typeof $utf8 === 'undefined')
                throw {error: "MissingMethod", message: "UTF8 Module is missing."};
            if (typeof input !== 'string')
                return input;
            else
                input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            var output = "", a, b, c, d, e, f, g, i = 0;

            while (i < input.length) {
                d = map.indexOf(input.charAt(i++));
                e = map.indexOf(input.charAt(i++));
                f = map.indexOf(input.charAt(i++));
                g = map.indexOf(input.charAt(i++));

                a = (d << 2) | (e >> 4);
                b = ((e & 15) << 4) | (f >> 2);
                c = ((f & 3) << 6) | g;

                output += String.fromCharCode(a);
                if (f != 64)
                    output += String.fromCharCode(b);
                if (g != 64)
                    output += String.fromCharCode(c);
            }

            return $utf8.decode(output);
        }
    }
}, this);
