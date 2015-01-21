// UTF8 Module
//
// Cleaner and modularized utf-8 encoding and decoding library for javascript.
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
        context[name] = definition.apply(context);
    }
})('utf8', function() {
    return {
        encode: function(string) {
            if (typeof string !== 'string')
                return string;
            else
                string = string.replace(/\r\n/g, "\n");
            var output = "", i = 0, charCode;

            for (i; i < string.length; i++) {
                charCode = string.charCodeAt(i);

                if (charCode < 128)
                    output += String.fromCharCode(charCode);
                else if ((charCode > 127) && (charCode < 2048))
                    output += String.fromCharCode((charCode >> 6) | 192),
                            output += String.fromCharCode((charCode & 63) | 128);
                else
                    output += String.fromCharCode((charCode >> 12) | 224),
                            output += String.fromCharCode(((charCode >> 6) & 63) | 128),
                            output += String.fromCharCode((charCode & 63) | 128);
            }

            return output;
        },
        decode: function(string) {
            if (typeof string !== 'string')
                return string;
            var output = "", i = 0, charCode = 0;

            while (i < string.length) {
                charCode = string.charCodeAt(i);

                if (charCode < 128)
                    output += String.fromCharCode(charCode),
                            i++;
                else if ((charCode > 191) && (charCode < 224))
                    output += String.fromCharCode(((charCode & 31) << 6) | (string.charCodeAt(i + 1) & 63)),
                            i += 2;
                else
                    output += String.fromCharCode(((charCode & 15) << 12) | ((string.charCodeAt(i + 1) & 63) << 6) | (string.charCodeAt(i + 2) & 63)),
                            i += 3;
            }

            return output;
        }
    };
}, exports);
