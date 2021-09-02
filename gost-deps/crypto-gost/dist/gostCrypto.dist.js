/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (b, d) {
    "function" === typeof define && define.amd ? define(d) : "object" === typeof exports ? module.exports = d() : b.GostRandom = d()
})(this, function () {
    function b() {
    }

    var d = this.crypto || this.msCrypto, g = this.TypeMismatchError || Error, h = this.QuotaExceededError || Error,
        f = {
            seed: new Uint8Array(1024), getIndex: 0, setIndex: 0, set: function (a) {
                1024 <= this.setIndex && (this.setIndex = 0);
                this.seed[this.setIndex++] = a
            }, get: function () {
                1024 <= this.getIndex && (this.getIndex = 0);
                return this.seed[this.getIndex++]
            }
        };
    if ("undefiend" !== typeof document) {
        try {
            document.addEventListener("mousemove",
                function (a) {
                    f.set((new Date).getTime() & 255 ^ (a.clientX || a.pageX) & 255 ^ (a.clientY || a.pageY) & 255)
                }, !1)
        } catch (k) {
        }
        try {
            document.addEventListener("keydown", function (a) {
                f.set((new Date).getTime() & 255 ^ a.keyCode & 255)
            }, !1)
        } catch (l) {
        }
    }
    b.prototype.getRandomValues = function (a) {
        if (!a.byteLength) throw new g("Array is not of an integer type (Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, or Uint32Array)");
        if (65536 < a.byteLength) throw new h("Byte length of array can't be greate then 65536");
        var e = new Uint8Array(a.buffer,
            a.byteOffset, a.byteLength);
        if (d && d.getRandomValues) d.getRandomValues(e); else for (var c = 0, b = e.length; c < b; c++) e[c] = Math.floor(256 * Math.random()) & 255;
        c = 0;
        for (b = e.length; c < b; c++) e[c] ^= f.get();
        return a
    };
    return b
});
/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (y, g) {
    "function" === typeof define && define.amd ? define(["gostRandom"], g) : "object" === typeof exports ? module.exports = g(require("./gostRandom")) : y.gostCrypto = g(y.GostRandom)
})(this, function (y) {
    function g(a, c) {
        if ("string" === typeof a || a instanceof String) a = {name: a};
        var d = a.name;
        if (!d) throw new v("Algorithm name not defined");
        var e = d.split("/"), e = e[0].split("-").concat(e.slice(1)), b = {}, d = e[0].replace(/[\.\s]/g, ""),
            e = e.slice(1);
        if (0 <= d.indexOf("28147")) b = {
            name: "GOST 28147",
            version: 1989,
            mode: (a.mode ||
                ("sign" === c || "verify" === c ? "MAC" : "wrapKey" === c || "unwrapKey" === c ? "KW" : "ES")).toUpperCase(),
            length: a.length || 64
        }; else if (0 <= d.indexOf("3412")) b = {
            name: "GOST R 34.12",
            version: 2015,
            mode: (a.mode || ("sign" === c || "verify" === c ? "MAC" : "wrapKey" === c || "unwrapKey" === c ? "KW" : "ES")).toUpperCase(),
            length: a.length || 64
        }; else if (0 <= d.indexOf("3411")) b = {
            name: "GOST R 34.11",
            version: 2012,
            mode: (a.mode || ("deriveKey" === c || "deriveBits" === c ? "KDF" : "sign" === c || "verify" === c ? "HMAC" : "HASH")).toUpperCase(),
            length: a.length || 256
        }; else if (0 <=
            d.indexOf("3410")) b = {
            name: "GOST R 34.10",
            version: 2012,
            mode: (a.mode || ("deriveKey" === c || "deriveBits" === c ? "DH" : "SIGN")).toUpperCase(),
            length: a.length || 256
        }; else if (0 <= d.indexOf("SHA")) b = {
            name: "SHA",
            version: 160 === (a.length || 160) ? 1 : 2,
            mode: (a.mode || ("deriveKey" === c || "deriveBits" === c ? "KDF" : "sign" === c || "verify" === c ? "HMAC" : "HASH")).toUpperCase(),
            length: a.length || 160
        }; else if (0 <= d.indexOf("RC2")) b = {
            name: "RC2",
            version: 1,
            mode: (a.mode || ("sign" === c || "verify" === c ? "MAC" : "wrapKey" === c || "unwrapKey" === c ? "KW" : "ES")).toUpperCase(),
            length: a.length || 32
        }; else if (0 <= d.indexOf("PBKDF2")) b = g(a.hash, "digest"), b.mode = "PBKDF2"; else if (0 <= d.indexOf("PFXKDF")) b = g(a.hash, "digest"), b.mode = "PFXKDF"; else if (0 <= d.indexOf("CPKDF")) b = g(a.hash, "digest"), b.mode = "CPKDF"; else if (0 <= d.indexOf("HMAC")) b = g(a.hash, "digest"), b.mode = "HMAC"; else throw new s("Algorithm not supported");
        e.forEach(function (a) {
            a = a.toUpperCase();
            if (/^[0-9]+$/.test(a)) if (0 <= ["8", "16", "32"].indexOf(a) || "128" === b.length && "64" === a) if ("ES" === b.mode) b.shiftBits = parseInt(a); else if ("MAC" ===
                b.mode) b.macLength = parseInt(a); else throw new s("Algorithm " + b.name + " mode " + a + " not supported"); else 0 <= "89 94 01 12 15 1989 1994 2001 2012 2015".split(" ").indexOf(a) ? (a = parseInt(a), b.version = 1900 > a ? 80 > a ? 2E3 + a : 1900 + a : a) : 0 <= ["1"].indexOf(a) && "SHA" === b.name ? (b.version = 1, b.length = 160) : 0 <= ["256", "384", "512"].indexOf(a) && "SHA" === b.name ? (b.version = 2, b.length = parseInt(a)) : 0 <= ["40", "128"].indexOf(a) && "RC2" === b.name ? (b.version = 1, b.length = parseInt(a)) : 0 <= ["64", "128", "256", "512"].indexOf(a) ? b.length = parseInt(a) :
                0 <= ["1000", "2000"].indexOf(a) && (b.iterations = parseInt(a)); else if (0 <= "E-TEST E-A E-B E-C E-D E-SC E-Z D-TEST D-A D-SC".split(" ").indexOf(a)) b.sBox = a; else if (0 <= "S-TEST S-A S-B S-C S-D X-A X-B X-C".split(" ").indexOf(a)) b.namedParam = a; else if (0 <= "S-256-TEST S-256-A S-256-B S-256-C P-256 T-512-TEST T-512-A T-512-B X-256-A X-256-B T-256-TEST T-256-A T-256-B S-256-B T-256-C S-256-C".split(" ").indexOf(a)) b.namedCurve = a; else if (0 <= ["SC", "CP", "VN"].indexOf(a)) b.procreator = a; else if ("GOST 28147" === b.name ||
                "GOST R 34.12" === b.name || "RC2" === b.name) if (0 <= ["ES", "MAC", "KW", "MASK"].indexOf(a)) b.mode = a; else if (0 <= ["ECB", "CFB", "OFB", "CTR", "CBC"].indexOf(a)) b.mode = "ES", b.block = a; else if (0 <= ["CPKW", "NOKW", "SCKW"].indexOf(a)) b.mode = "KW", b.keyWrapping = a.replace("KW", ""); else if (0 <= ["ZEROPADDING", "PKCS5PADDING", "NOPADDING", "RANDOMPADDING", "BITPADDING"].indexOf(a)) b.padding = a.replace("PADDING", ""); else if (0 <= ["NOKM", "CPKM"].indexOf(a)) b.keyMeshing = a.replace("KM", ""); else throw new s("Algorithm " + b.name + " mode " +
                a + " not supported"); else if ("GOST R 34.11" === b.name || "SHA" === b.name) if (0 <= "HASH KDF HMAC PBKDF2 PFXKDF CPKDF".split(" ").indexOf(a)) b.mode = a; else throw new s("Algorithm " + b.name + " mode " + a + " not supported"); else if ("GOST R 34.10" === b.name) {
                var c = a.replace(/[\.\s]/g, "");
                if (0 <= c.indexOf("GOST") && 0 <= c.indexOf("3411")) b.hash = a; else if (["SIGN", "DH", "MASK"].indexOf(a)) b.mode = a; else throw new s("Algorithm " + b.name + " mode " + a + " not supported");
            }
        });
        b.procreator = a.procreator || b.procreator || "CP";
        switch (b.name) {
            case "GOST R 34.10":
                b.keySize =
                    b.length / (1994 === b.version ? 4 : 8);
                break;
            case "GOST R 34.11":
                b.keySize = 32;
                break;
            case "GOST 28147":
            case "GOST R 34.12":
                b.keySize = 32;
                break;
            case "RC2":
                b.keySize = Math.ceil(b.length / 8);
                break;
            case "SHA":
                b.keySize = b.length / 8
        }
        if ("ES" === b.mode && (a.block && (b.block = a.block), b.block && (b.block = b.block.toUpperCase()), a.padding && (b.padding = a.padding), b.padding && (b.padding = b.padding.toUpperCase()), a.shiftBits && (b.shiftBits = a.shiftBits), a.keyMeshing && (b.keyMeshing = a.keyMeshing), b.keyMeshing && (b.keyMeshing = b.keyMeshing.toUpperCase()),
        "importKey" !== c && "generateKey" !== c)) {
            b.block = b.block || "ECB";
            b.padding = b.padding || ("CBC" === b.block || "ECB" === b.block ? "ZERO" : "NO");
            if ("CFB" === b.block || "OFB" === b.block) b.shiftBits = b.shiftBits || b.length;
            b.keyMeshing = b.keyMeshing || "NO"
        }
        "KW" === b.mode && (a.keyWrapping && (b.keyWrapping = a.keyWrapping), b.keyWrapping && (b.keyWrapping = b.keyWrapping.toUpperCase()), "importKey" !== c && "generateKey" !== c && (b.keyWrapping = b.keyWrapping || "NO"));
        "sBox namedParam namedCurve curve param modulusLength".split(" ").forEach(function (c) {
            a[c] &&
            (b[c] = a[c])
        });
        "importKey" !== c && "generateKey" !== c && ("GOST 28147" === b.name ? b.sBox = b.sBox || ("SC" === b.procreator ? "E-SC" : "E-A") : "GOST R 34.12" === b.name && 64 === b.length ? b.sBox = "E-Z" : "GOST R 34.11" === b.name && 1994 === b.version ? b.sBox = b.sBox || ("SC" === b.procreator ? "D-SC" : "D-A") : "GOST R 34.10" === b.name && 1994 === b.version ? b.namedParam = b.namedParam || ("DH" === b.mode ? "X-A" : "S-A") : "GOST R 34.10" === b.name && 2001 === b.version ? b.namedCurve = b.namedCurve || (256 === b.length ? "SC" === b.procreator ? "P-256" : "DH" === b.mode ? "X-256-A" :
            "S-256-A" : "T-512-A" === b.mode) : "GOST R 34.10" === b.name && 2012 === b.version && (b.namedCurve = b.namedCurve || (256 === b.length ? "SC" === b.procreator ? "P-256" : "DH" === b.mode ? "X-256-A" : "S-256-A" : "T-512-A" === b.mode)));
        switch (b.mode) {
            case "DH":
                a.ukm && (b.ukm = a.ukm);
                a["public"] && (b["public"] = a["public"]);
                break;
            case "SIGN":
            case "KW":
                a.ukm && (b.ukm = a.ukm);
                break;
            case "ES":
            case "MAC":
                a.iv && (b.iv = a.iv);
                break;
            case "KDF":
                a.label && (b.label = a.label);
                a.contex && (b.context = a.contex);
                break;
            case "PBKDF2":
                a.salt && (b.salt = a.salt);
                a.iterations &&
                (b.iterations = a.iterations);
                a.diversifier && (b.diversifier = a.diversifier);
                break;
            case "PFXKDF":
                a.salt && (b.salt = a.salt);
                a.iterations && (b.iterations = a.iterations);
                a.diversifier && (b.diversifier = a.diversifier);
                break;
            case "CPKDF":
                a.salt && (b.salt = a.salt), a.iterations && (b.iterations = a.iterations)
        }
        if (c && ("ES" !== b.mode && "SIGN" !== b.mode && "MAC" !== b.mode && "HMAC" !== b.mode && "KW" !== b.mode && "DH" !== b.mode && "MASK" !== b.mode && "generateKey" === c || "ES" !== b.mode && ("encrypt" === c || "decrypt" === c) || "SIGN" !== b.mode && "MAC" !== b.mode &&
            "HMAC" !== b.mode && ("sign" === c || "verify" === c) || "HASH" !== b.mode && "digest" === c || "KW" !== b.mode && "MASK" !== b.mode && ("wrapKey" === c || "unwrapKey" === c) || "DH" !== b.mode && "PBKDF2" !== b.mode && "PFXKDF" !== b.mode && "CPKDF" !== b.mode && "KDF" !== b.mode && ("deriveKey" === c || "deriveBits" === c))) throw new s("Algorithm mode " + b.mode + " not valid for method " + c);
        a.hash && (b.hash = a.hash);
        b.hash && (("string" === typeof b.hash || b.hash instanceof String) && b.procreator && (b.hash = b.hash + "/" + b.procreator), b.hash = g(b.hash, "digest"));
        a.id && (b.id =
            a.id);
        return b
    }

    function q(a) {
        if (!k || !k.subtle || !a) return !1;
        var c = "string" === typeof a || a instanceof String ? c = a : a.name;
        if (!c) return !1;
        c = c.toUpperCase();
        return (0 <= c.indexOf("KDF") || 0 <= c.indexOf("HMAC")) && a.hash ? q(a.hash) : -1 === c.indexOf("GOST") && -1 === c.indexOf("SHA-1") && -1 === c.indexOf("RC2") && -1 === c.indexOf("?DES")
    }

    function F(a, c) {
        if (!a.algorithm) throw new v("Key algorithm not defined");
        if (!a.algorithm.name) throw new v("Key algorithm name not defined");
        var d = a.algorithm.name, e = "GOST 28147" === d || "GOST R 34.12" ===
            d || "RC2" === d, b = "GOST R 34.11" === d || "SHA" === d, h = "GOST R 34.10" === d;
        if (!e && !h && !b) throw new s("Key algorithm " + d + " is unsupproted");
        if (!a.type) throw new v("Key type not defined");
        if ((e || b) && "secret" !== a.type || h && "public" !== a.type && "private" !== a.type) throw new B("Key type " + a.type + " is not valid for algorithm " + d);
        if (!a.usages || !a.usages.indexOf) throw new v("Key usages not defined");
        d = 0;
        for (e = a.usages.length; d < e; d++) if (b = a.usages[d], ("encrypt" === b || "decrypt" === b) && "secret" !== a.type || "sign" === b && "public" ===
        a.type || "verify" === b && "private" === a.type) throw new J("Key type " + a.type + " is not valid for " + b);
        if (c && -1 === a.usages.indexOf(c)) throw new G("Key usages is not contain method " + c);
        if (!a.buffer) throw new v("Key buffer is not defined");
        d = 8 * a.buffer.byteLength;
        e = 8 * a.algorithm.keySize;
        if ("secret" === a.type && d !== (e || 256) && (0 <= a.usages.indexOf("encrypt") || 0 <= a.usages.indexOf("decrypt")) || "private" === a.type && 256 !== d && 512 !== d || "public" === a.type && 512 !== d && 1024 !== d) throw new v("Key buffer has wrong size " + d + " bit");
    }

    function n(a, c, d) {
        F(d, a);
        if (c) {
            var e;
            switch (c.mode) {
                case "ES":
                    e = ["sBox", "keyMeshing", "padding", "block"];
                    break;
                case "SIGN":
                    e = "namedCurve namedParam sBox curve param modulusLength".split(" ");
                    break;
                case "MAC":
                    e = ["sBox"];
                    break;
                case "KW":
                    e = ["keyWrapping", "ukm"];
                    break;
                case "DH":
                    e = "namedCurve namedParam sBox ukm curve param modulusLength".split(" ");
                    break;
                case "KDF":
                    e = ["context", "label"];
                    break;
                case "PBKDF2":
                    e = ["sBox", "iterations", "salt"];
                    break;
                case "PFXKDF":
                    e = ["sBox", "iterations", "salt", "diversifier"];
                    break;
                case "CPKDF":
                    e = ["sBox", "salt"]
            }
            e && e.forEach(function (a) {
                d.algorithm[a] && (c[a] = d.algorithm[a])
            })
        }
        return d.buffer
    }

    function A(a, c, d, e, b) {
        a = {
            type: b || ("GOST R 34.10" === a.name ? "private" : "secret"),
            extractable: c || "false",
            algorithm: a,
            usages: d || [],
            buffer: e
        };
        F(a);
        return a
    }

    function K(a, c, d, e, b, h) {
        if (!e || !e.indexOf) throw new v("Key usages not defined");
        var z = e.filter(function (a) {
            return "sign" !== a
        });
        e = e.filter(function (a) {
            return "verify" !== a
        });
        return {publicKey: A(a, d, z, b, "public"), privateKey: A(c, d, e, h, "private")}
    }

    function H(a) {
        a instanceof L && (a = new Uint8Array(a));
        for (var c = new Uint8Array(a.length), d = 0, e = a.length; d < e; d++) c[e - d - 1] = a[d];
        return c.buffer
    }

    function I() {
        for (var a = 0, c = arguments.length; a < c; a++) {
            var d = arguments[a].split("."), d = C + d[0] + D + "." + d[1],
                e = document.querySelector('script[src="' + d + '"]');
            e || (e = document.createElement("script"), e.setAttribute("src", d), document.head.appendChild(e))
        }
    }

    function m(a, c, d) {
        return new Promise(function (e, b) {
            try {
                if (x) {
                    var h = ++M;
                    w.push({id: h, resolve: e, reject: b});
                    x.postMessage({
                        id: h,
                        algorithm: a, method: c, args: d
                    })
                } else f.gostEngine ? e(f.gostEngine.execute(a, c, d)) : b(new E("Module gostEngine not found"))
            } catch (z) {
                b(z)
            }
        })
    }

    function t(a) {
        try {
            a()
        } catch (c) {
        }
    }

    function l() {
    }

    var f = this, k = f.crypto || f.msCrypto, v = f.SyntaxError || f.Error, B = f.DataError || f.Error,
        s = f.NotSupportedError || f.Error, E = f.OperationError || f.Error, J = f.InvalidAccessError || f.Error,
        G = f.InvalidAccessError || f.Error;
    f.Promise || (f.Promise = function () {
        function a(a) {
            return a && null === a.oncomplete && null === a.onerror ? new c(function (c, b) {
                a.oncomplete =
                    function () {
                        c(a.result)
                    };
                a.onerror = function () {
                    b(new E(a.toString()))
                }
            }) : a
        }

        function c(d) {
            function e(a) {
                try {
                    a()
                } catch (b) {
                }
            }

            var b = "pending", h, z = [], g = [];
            try {
                d(function (a) {
                    "pending" === b && (b = "fulfilled", h = a, z.forEach(e))
                }, function (a) {
                    "pending" === b && (b = "rejected", h = a, g.forEach(e))
                })
            } catch (f) {
                "pending" === b && (b = "rejected", h = f, g.forEach(e))
            }
            this.then = function (d, e) {
                return new c(function (c, f) {
                    function p() {
                        var b;
                        try {
                            b = d ? d(h) : h
                        } catch (e) {
                            f(e);
                            return
                        }
                        (b = a(b)) && b.then && b.then.call ? b.then(c, f) : c(b)
                    }

                    function k() {
                        var b;
                        try {
                            b = e ? e(h) : h
                        } catch (d) {
                            f(d);
                            return
                        }
                        (b = a(b)) && b.then && b.then.call ? b.then(c, f) : f(b)
                    }

                    "fulfilled" === b ? p() : "rejected" === b ? k() : (z.push(p), g.push(k))
                })
            };
            this["catch"] = function (a) {
                return this.then(void 0, a)
            }
        }

        c.all = function (a) {
            return new c(function (c, b) {
                function h(a) {
                    p++;
                    return function (b) {
                        g[a] = b;
                        p--;
                        0 === p && c(g)
                    }
                }

                function f(a) {
                    0 < p && b(a);
                    p = 0
                }

                for (var g = [], p = 0, k = 0, q = a.length; k < q; k++) {
                    var m = a[k];
                    m.then && m.then.call ? m.then(h(k), f) : g[k] = m
                }
                0 === p && c(g)
            })
        };
        return c
    }());
    var C = "", D = "";
    "undefined" !== typeof document &&
    function () {
        for (var a = /^(.*)gostCrypto(.*)\.js$/i, c = document.querySelectorAll("script"), d = 0, e = c.length; d < e; d++) {
            var b = c[d].getAttribute("src");
            if (b = a.exec(b)) C = b[1], D = b[2]
        }
    }();
    var x, w = [], M = 0;
    if (!f.importScripts && !f.gostEngine) try {
        x = new Worker(C + "gostEngine" + D + ".js"), x.onmessage = function (a) {
            for (var c = a.data.id, d = 0, e = w.length; d < e && w[d].id !== c; d++) ;
            d < e && (c = w[d], w.splice(d, 1), a.data.error ? c.reject(new E(a.data.error)) : c.resolve(a.data.result))
        }, x.onerror = function (a) {
            for (var c = 0, d = w.length; c < d; c++) w[c].reject(a.error);
            w = []
        }
    } catch (N) {
        x = !1
    }
    f.importScripts || (f.importScripts = I);
    x || f.gostEngine || I("gostEngine.js");
    var L = f.ArrayBuffer, u = {};
    l.prototype.encrypt = function (a, c, d) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.encrypt(a, c, d);
            a = g(a, "encrypt");
            return m(a, "encrypt", [n("encrypt", a, c), d])
        })
    };
    l.prototype.decrypt = function (a, c, d) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.decrypt(a, c, d);
            a = g(a, "decrypt");
            return m(a, "decrypt", [n("decrypt", a, c), d])
        })
    };
    l.prototype.sign = function (a, c,
                                 d) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.sign(a, c, d);
            a = g(a, "sign");
            return m(a, "sign", [n("sign", a, c), d]).then(function (c) {
                "SC" === a.procreator && "SIGN" === a.mode && (c = u.asn1.GostSignature.encode(c));
                return c
            })
        })
    };
    l.prototype.verify = function (a, c, d, e) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.verify(a, c, d, e);
            a = g(a, "verify");
            if ("SC" === a.procreator && "SIGN" === a.mode) {
                var b = u.asn1.GostSignature.decode(d);
                d = {r: b.r, s: b.s}
            }
            return m(a, "verify", [n("verify", a, c), d, e])
        })
    };
    l.prototype.digest = function (a, c) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.digest(a, c);
            a = g(a, "digest");
            return m(a, "digest", [c])
        })
    };
    l.prototype.generateKey = function (a, c, d) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.generateKey(a, c, d);
            var e = a.privateKey, b = a.publicKey;
            a = g(a, "generateKey");
            e = e ? g(e, "generateKey") : a;
            b = b ? g(b, "generateKey") : a;
            return m(a, "generateKey", []).then(function (h) {
                return h.publicKey && h.privateKey ? K(b, e, c, d, h.publicKey, h.privateKey) : A(a, c, d,
                    h)
            })
        })
    };
    l.prototype.deriveKey = function (a, c, d, e, b) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.deriveKey(a, c, d, e, b);
            a = g(a, "deriveKey");
            d = g(d, "generateKey");
            a.keySize = d.keySize;
            a["public"] && (a["public"].algorithm = g(a["public"].algorithm), a["public"] = n("deriveKey", a, a["public"]));
            return m(a, "deriveKey", [n("deriveKey", a, c)]).then(function (a) {
                return A(d, e, b, a)
            })
        })
    };
    l.prototype.deriveBits = function (a, c, d) {
        return (new Promise(t)).then(function () {
            if (q(a)) return k.subtle.deriveBits(a, c, d);
            a = g(a, "deriveBits");
            a["public"] && (a["public"] = n("deriveBits", a, a["public"]));
            return m(a, "deriveBits", [n("deriveBits", a, c), d])
        })
    };
    l.prototype.importKey = function (a, c, d, e, b) {
        var h;
        return (new Promise(t)).then(function () {
            if (q(d)) return k.subtle.importKey(a, c, d, e, b);
            if ("raw" === a) {
                d = g(d, "importKey");
                if (b && b.indexOf) {
                    var f = d.name.toUpperCase().replace(/[\.\s]/g, "");
                    0 <= f.indexOf("3410") && 0 <= b.indexOf("sign") ? h = "private" : 0 <= f.indexOf("3410") && 0 <= b.indexOf("verify") && (h = "public")
                }
                return c
            }
            var r;
            if ("pkcs8" ===
                a) r = u.asn1.GostPrivateKeyInfo.decode(c).object; else if ("spki" === a) r = u.asn1.GostSubjectPublicKeyInfo.decode(c).object; else throw new s("Key format not supported");
            d = g(r.algorithm, "importKey");
            h = r.type;
            !1 !== e && (e = e || r.extractable);
            if (b) for (f = 0; f < b.length; f++) {
                if (0 > r.usages.indexOf(b[f])) throw B("Key usage not valid for this key");
            } else b = r.usages;
            r = r.buffer;
            var p = d.keySize, l = r.byteLength;
            if ("public" === h || p === l) return r;
            if (0 < l % p) throw new B("Invalid key size");
            d.mode = "MASK";
            d.procreator = "VN";
            for (var n =
                [], f = p; f < l; f += p) n.push(function (a) {
                return function (b) {
                    return m(d, "unwrapKey", [a, b]).then(function (a) {
                        var b = n.pop();
                        if (b) return b(a);
                        delete d.mode;
                        return a
                    })
                }
            }(new Uint8Array(r, f, p)));
            return n.pop()(new Uint8Array(r, 0, p))
        }).then(function (a) {
            return A(d, e, b, a, h)
        })
    };
    l.prototype.exportKey = function (a, c) {
        return (new Promise(t)).then(function () {
            if (c && q(c.algorithm)) return k.subtle.exportKey(a, c);
            if (!c.extractable) throw new G("Key not extractable");
            var d = n(null, null, c);
            if ("raw" === a) return d;
            if ("pkcs8" === a &&
                c.algorithm && c.algorithm.id) {
                if ("VN" === c.algorithm.procreator) {
                    var e = c.algorithm, b;
                    e.mode = "MASK";
                    return m(e, "generateKey").then(function (a) {
                        b = a;
                        return m(e, "wrapKey", [b, c.buffer])
                    }).then(function (a) {
                        delete e.mode;
                        var c = new Uint8Array(a.byteLength + b.byteLength);
                        c.set(new Uint8Array(a, 0, a.byteLength));
                        c.set(new Uint8Array(b, 0, b.byteLength), a.byteLength);
                        a = c.buffer;
                        a.enclosed = !0;
                        return u.asn1.GostPrivateKeyInfo.encode({algorithm: e, buffer: a})
                    })
                }
                return u.asn1.GostPrivateKeyInfo.encode(c)
            }
            if ("spki" === a &&
                c.algorithm && c.algorithm.id) return u.asn1.GostSubjectPublicKeyInfo.encode(c);
            throw new s("Key format not supported");
        })
    };
    l.prototype.wrapKey = function (a, c, d, e) {
        return (new Promise(t)).then(function () {
            if (q(e)) return k.subtle.wrapKey(a, c, d, e);
            e = g(e, "wrapKey");
            var b = n(null, null, c);
            "SC" === e.procreator && "private" === c.type && (b = H(b));
            return m(e, "wrapKey", [n("wrapKey", e, d), b]).then(function (b) {
                if ("raw" === a) return b;
                throw new s("Key format not supported");
            })
        })
    };
    l.prototype.unwrapKey = function (a, c, d, e, b, f, l) {
        return (new Promise(t)).then(function () {
            if (q(e)) return k.subtle.unwrapKey(a,
                c, d, e, b, f, l);
            e = g(e, "unwrapKey");
            b = g(b, "importKey");
            if ("raw" !== a) throw new s("Key format not supported");
            return m(e, "unwrapKey", [n("unwrapKey", e, d), c]).then(function (a) {
                var c;
                if (b && b.name) {
                    var d = b.name.toUpperCase().replace(/[\.\s]/g, "");
                    0 <= d.indexOf("3410") && 0 <= l.indexOf("sign") ? c = "private" : 0 <= d.indexOf("3410") && 0 <= l.indexOf("verify") && (c = "public")
                }
                "SC" === e.procreator && "private" === c && (a = H(a));
                return A(b, f, l, a, c)
            })
        })
    };
    u.subtle = new l;
    u.getRandomValues = function (a) {
        var c = (y = y || f.GostRandom) ? new y : k;
        if (c.getRandomValues) c.getRandomValues(a);
        else throw new s("Random generator not found");
    };
    return u
});
/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (e, b) {
    "function" === typeof define && define.amd ? define(["gostCrypto"], b) : "object" === typeof exports ? module.exports = b(require("gostCrypto")) : e.GostSecurity = b(e.gostCrypto)
})(this, function (e) {
    function b() {
        for (var a = {}, b = 0, c = arguments.length; b < c; b++) {
            var d = arguments[b];
            if ("object" === typeof d) for (var e in d) a[e] = d[e]
        }
        return a
    }

    function h() {
    }

    var f = {
        "1.2.643.2.2": "CryptoPro",
        "1.2.643.2.2.3": "id-GostR3411-94-with-GostR3410-2001",
        "1.2.643.2.2.4": "id-GostR3411-94-with-GostR3410-94",
        "1.2.643.2.2.9": "id-GostR3411-94",
        "1.2.643.2.2.10": "id-HMACGostR3411-94",
        "1.2.643.2.2.13.0": "id-Gost28147-89-None-KeyWrap",
        "1.2.643.2.2.13.1": "id-Gost28147-89-CryptoPro-KeyWrap",
        "1.2.643.2.2.14.0": "id-Gost28147-89-None-KeyMeshing",
        "1.2.643.2.2.14.1": "id-Gost28147-89-CryptoPro-KeyMeshing",
        "1.2.643.2.2.19": "id-GostR3410-2001",
        "1.2.643.2.2.20": "id-GostR3410-94",
        "1.2.643.2.2.20.1": "id-GostR3410-94-a",
        "1.2.643.2.2.20.2": "id-GostR3410-94-aBis",
        "1.2.643.2.2.20.3": "id-GostR3410-94-b",
        "1.2.643.2.2.20.4": "id-GostR3410-94-bBis",
        "1.2.643.2.2.21": "id-Gost28147-89",
        "1.2.643.2.2.22": "id-Gost28147-89-MAC",
        "1.2.643.2.2.30.0": "id-GostR3411-94-TestParamSet",
        "1.2.643.2.2.30.1": "id-GostR3411-94-CryptoProParamSet",
        "1.2.643.2.2.30.2": "id-GostR3411-94-CryptoPro-B-ParamSet",
        "1.2.643.2.2.30.3": "id-GostR3411-94-CryptoPro-C-ParamSet",
        "1.2.643.2.2.30.4": "id-GostR3411-94-CryptoPro-D-ParamSet",
        "1.2.643.2.2.31.0": "id-Gost28147-89-TestParamSet",
        "1.2.643.2.2.31.1": "id-Gost28147-89-CryptoPro-A-ParamSet",
        "1.2.643.2.2.31.2": "id-Gost28147-89-CryptoPro-B-ParamSet",
        "1.2.643.2.2.31.3": "id-Gost28147-89-CryptoPro-C-ParamSet",
        "1.2.643.2.2.31.4": "id-Gost28147-89-CryptoPro-D-ParamSet",
        "1.2.643.2.2.31.5": "id-Gost28147-89-CryptoPro-Oscar-1-1-ParamSet",
        "1.2.643.2.2.31.6": "id-Gost28147-89-CryptoPro-Oscar-1-0-ParamSet",
        "1.2.643.2.2.31.7": "id-Gost28147-89-CryptoPro-RIC-1-ParamSet ",
        "1.2.643.2.2.31.12": "id-Gost28147-89-CryptoPro-tc26-1",
        "1.2.643.2.2.31.13": "id-Gost28147-89-CryptoPro-tc26-2",
        "1.2.643.2.2.31.14": "id-Gost28147-89-CryptoPro-tc26-3",
        "1.2.643.2.2.31.15": "id-Gost28147-89-CryptoPro-tc26-4",
        "1.2.643.2.2.31.16": "id-Gost28147-89-CryptoPro-tc26-5",
        "1.2.643.2.2.31.17": "id-Gost28147-89-CryptoPro-tc26-6",
        "1.2.643.2.2.32.0": "id-GostR3410-94-TestParamSet",
        "1.2.643.2.2.32.2": "id-GostR3410-94-CryptoPro-A-ParamSet",
        "1.2.643.2.2.32.3": "id-GostR3410-94-CryptoPro-B-ParamSet",
        "1.2.643.2.2.32.4": "id-GostR3410-94-CryptoPro-C-ParamSet",
        "1.2.643.2.2.32.5": "id-GostR3410-94-CryptoPro-D-ParamSet",
        "1.2.643.2.2.33.1": "id-GostR3410-94-CryptoPro-XchA-ParamSet",
        "1.2.643.2.2.33.2": "id-GostR3410-94-CryptoPro-XchB-ParamSet",
        "1.2.643.2.2.33.3": "id-GostR3410-94-CryptoPro-XchC-ParamSet",
        "1.2.643.2.2.34.2": "temporaryAccessToRC",
        "1.2.643.2.2.34.3": "internetContentSignature",
        "1.2.643.2.2.34.4": "adminRC",
        "1.2.643.2.2.34.5": "operatorRC",
        "1.2.643.2.2.34.6": "userRC",
        "1.2.643.2.2.34.7": "clientRC",
        "1.2.643.2.2.34.8": "serverRC",
        "1.2.643.2.2.34.9": "sysAdminRC",
        "1.2.643.2.2.34.10": "arcAdminRC",
        "1.2.643.2.2.34.11": "authorityPersonRC",
        "1.2.643.2.2.34.12": "clientCC",
        "1.2.643.2.2.34.13": "sysAdminCC",
        "1.2.643.2.2.34.14": "arcAdminCC",
        "1.2.643.2.2.34.15": "accessIPSecCA",
        "1.2.643.2.2.34.16": "auditAdminHSM",
        "1.2.643.2.2.34.21": "adminHSM",
        "1.2.643.2.2.34.22": "serverAdminHSH",
        "1.2.643.2.2.34.24": "winlogonCA",
        "1.2.643.2.2.34.25": "timestampServiceUser",
        "1.2.643.2.2.34.26": "statusServiceUser",
        "1.2.643.2.2.34.27": "arcAdminHSM",
        "1.2.643.2.2.34.28": "auditorHSM",
        "1.2.643.2.2.35.0": "id-GostR3410-2001-CryptoPro-TestParamSet",
        "1.2.643.2.2.35.1": "id-GostR3410-2001-CryptoPro-A-ParamSet",
        "1.2.643.2.2.35.2": "id-GostR3410-2001-CryptoPro-B-ParamSet",
        "1.2.643.2.2.35.3": "id-GostR3410-2001-CryptoPro-C-ParamSet",
        "1.2.643.2.2.36.0": "id-GostR3410-2001-CryptoPro-XchA-ParamSet",
        "1.2.643.2.2.36.1": "id-GostR3410-2001-CryptoPro-XchB-ParamSet",
        "1.2.643.2.2.37.1": "id-CryptoPro-GostPrivateKeys-V1",
        "1.2.643.2.2.37.2": "id-CryptoPro-GostPrivateKeys-V2",
        "1.2.643.2.2.37.2.1": "id-CryptoPro-GostPrivateKeys-V2-Full",
        "1.2.643.2.2.37.2.2": "id-CryptoPro-GostPrivateKeys-V2-PartOf",
        "1.2.643.2.2.37.3.1": "intermediateCertificates",
        "1.2.643.2.2.37.3.2": "trustedCertificatesSignature",
        "1.2.643.2.2.37.3.3": "trustedCertificatesExchange",
        "1.2.643.2.2.37.3.10": "keyValidity",
        "1.2.643.2.2.38.1": "personalBaseProlicy",
        "1.2.643.2.2.38.2": "networkBasePolicy",
        "1.2.643.2.2.47.1": "id-CryptoPro-ocsp-treats-exp-key-or-exp-cert-rev",
        "1.2.643.2.2.47.2": "id-CryptoPro-ocsp-crl-locator",
        "1.2.643.2.2.47.3": "id-CryptoPro-ocsp-instant-revocation-indicator",
        "1.2.643.2.2.47.4": "id-CryptoPro-ocsp-revocation-announcement-reference",
        "1.2.643.2.2.47.5": "id-CryptoPro-ocsp-historical-request",
        "1.2.643.2.2.49.2": "limitedLicense",
        "1.2.643.2.2.96": "id-GostR3410-2001-CryptoPro-ESDH",
        "1.2.643.2.2.97": "id-GostR3410-94-CryptoPro-ESDH",
        "1.2.643.2.2.98": "id-GostR3410-2001DH",
        "1.2.643.2.2.99": "id-GostR3410-94DH",
        "1.2.643.2.45.1.1.1": "signatureComment",
        "1.2.643.2.45.1.1.2": "resourceName",
        "1.2.643.2.45.1.1.3": "signatureUsage",
        "1.2.643.3.131.1.1": "INN",
        "1.2.643.3.141.1.1": "RNS FSS",
        "1.2.643.3.141.1.2": "KP FSS",
        "1.2.643.7.1": "tc26",
        "1.2.643.7.1.1.1.1": "id-tc26-gost3410-12-256",
        "1.2.643.7.1.1.1.2": "id-tc26-gost3410-12-512",
        "1.2.643.7.1.1.2.1": "id-tc26-gost3411-94",
        "1.2.643.7.1.1.2.2": "id-tc26-gost3411-12-256",
        "1.2.643.7.1.1.2.3": "id-tc26-gost3411-12-512",
        "1.2.643.7.1.1.3.1": "id-tc26-signwithdigest-gost3410-12-94",
        "1.2.643.7.1.1.3.2": "id-tc26-signwithdigest-gost3410-12-256",
        "1.2.643.7.1.1.3.3": "id-tc26-signwithdigest-gost3410-12-512",
        "1.2.643.7.1.1.4.1": "id-tc26-hmac-gost-3411-12-256",
        "1.2.643.7.1.1.4.2": "id-tc26-hmac-gost-3411-12-512",
        "1.2.643.7.1.1.6.1": "id-tc26-agreement-gost-3410-12-256",
        "1.2.643.7.1.1.6.2": "id-tc26-agreement-gost-3410-12-512",
        "1.2.643.7.1.2.1.1.0": "id-tc26-gost-3410-12-256-paramSetTest",
        "1.2.643.7.1.2.1.1.1": "id-tc26-gost-3410-12-256-paramSetA",
        "1.2.643.7.1.2.1.1.2": "id-tc26-gost-3410-12-256-paramSetB",
        "1.2.643.7.1.2.1.2.0": "id-tc26-gost-3410-12-512-paramSetTest",
        "1.2.643.7.1.2.1.2.1": "id-tc26-gost-3410-12-512-paramSetA",
        "1.2.643.7.1.2.1.2.2": "id-tc26-gost-3410-12-512-paramSetB",
        "1.2.643.7.1.2.1.2.3": "id-tc26-gost-3410-12-512-paramSetC",
        "1.2.643.7.1.2.1.2.4": "id-tc26-gost-3410-12-512-paramSetD",
        "1.2.643.7.1.2.5.1.1": "id-tc26-gost-28147-param-Z",
        "1.2.643.100.1": "OGRN",
        "1.2.643.100.2.1": "SMEV-person",
        "1.2.643.100.2.2": "SMEV-government",
        "1.2.643.100.3": "SNILS",
        "1.2.643.100.4": "KPP",
        "1.2.643.100.5": "OGRNIP",
        "1.2.643.100.6": "internal-government",
        "1.2.643.100.111": "subjectSignTool",
        "1.2.643.100.112": "issuerSignTool",
        "1.2.643.100.113.1": "signToolClassKC1",
        "1.2.643.100.113.2": "signToolClassKC2",
        "1.2.643.100.113.3": "signToolClassKC3",
        "1.2.643.100.113.4": "signToolClassKB1",
        "1.2.643.100.113.5": "signToolClassKB2",
        "1.2.643.100.113.6": "signToolClassKA1",
        "1.2.643.100.114.1": "issuerToolClassKC1",
        "1.2.643.100.114.2": "issuerToolClassKC2",
        "1.2.643.100.114.3": "issuerToolClassKC3",
        "1.2.643.100.114.4": "issuerToolClassKB2",
        "1.2.643.100.114.5": "issuerToolClassKB1",
        "1.2.643.100.114.6": "issuerToolClassKA1",
        "1.2.840.10040.4": "x9cm",
        "1.2.840.10040.4.1": "dsa",
        "1.2.840.10040.4.3": "dsa-with-SHA1",
        "1.2.840.10045": "ansi-x962",
        "1.2.840.10045.1": "id-fieldType",
        "1.2.840.10045.1.1": "id-prime-Field",
        "1.2.840.10045.1.2": "id-characteristic-two-field",
        "1.2.840.10045.2.1": "ecPublicKey",
        "1.2.840.10045.3.0": "characteristicTwo",
        "1.2.840.10045.3.1.1": "secp192r1",
        "1.2.840.10045.3.1.2": "prime192v2",
        "1.2.840.10045.3.1.3": "prime192v3",
        "1.2.840.10045.3.1.4": "prime239v1",
        "1.2.840.10045.3.1.5": "prime239v2",
        "1.2.840.10045.3.1.6": "prime239v3",
        "1.2.840.10045.3.1.7": "secp256r1",
        "1.2.840.10045.4": "ecdsa",
        "1.2.840.10045.4.1": "ecdsa-with-SHA1",
        "1.2.840.10045.4.2": "ecdsa-with-Recommended",
        "1.2.840.10045.4.4": "ecdsa-with-SHA2",
        "1.2.840.10045.4.4.1": "ecdsa-with-SHA224",
        "1.2.840.10045.4.4.2": "ecdsa-with-SHA256",
        "1.2.840.10045.4.4.3": "ecdsa-with-SHA384",
        "1.2.840.10045.4.4.4": "ecdsa-with-SHA512",
        "1.2.840.113533.7.66.13": "PasswordBasedMac",
        "1.3.6.1.4.1.22554.1.1.2.1.2": "pbeWithSHAAndAES128-CBC",
        "1.3.6.1.4.1.22554.1.1.2.1.22": "pbeWithSHAAndAES192-CBC",
        "1.3.6.1.4.1.22554.1.1.2.1.42": "pbeWithSHAAndAES256-CBC",
        "1.3.6.1.4.1.22554.1.2.1.2.1.2": "pbeWithSHA256AndAES128-CBC",
        "1.3.6.1.4.1.22554.1.2.1.2.1.22": "pbeWithSHA256AndAES192-CBC",
        "1.3.6.1.4.1.22554.1.2.1.2.1.42": "pbeWithSHA256AndAES256-CBC",
        "1.2.840.113549": "rsa",
        "1.2.840.113549.1.1.1": "rsaEncryption",
        "1.2.840.113549.1.1.2": "md2withRSAEncryption",
        "1.2.840.113549.1.1.3": "md4withRSAEncryption",
        "1.2.840.113549.1.1.4": "md5withRSAEncryption",
        "1.2.840.113549.1.1.5": "sha1withRSAEncryption",
        "1.2.840.113549.1.1.7": "rsaes-oaep",
        "1.2.840.113549.1.1.8": "mgf1",
        "1.2.840.113549.1.1.9": "pSpecified",
        "1.2.840.113549.1.1.10": "rsassa-pss",
        "1.2.840.113549.1.1.11": "sha256withRSAEncryption",
        "1.2.840.113549.1.1.12": "sha384withRSAEncryption",
        "1.2.840.113549.1.1.13": "sha512withRSAEncryption",
        "1.2.840.113549.1.2.7": "hmacWithSHA1",
        "1.2.840.113549.1.2.8": "hmacWithSHA224",
        "1.2.840.113549.1.2.9": "hmacWithSHA256",
        "1.2.840.113549.1.2.10": "hmacWithSHA384",
        "1.2.840.113549.1.2.11": "hmacWithSHA512",
        "1.2.840.113549.1.3.1": "dhKeyAgreement",
        "1.2.840.113549.1.5.12": "PBKDF2",
        "1.2.840.113549.1.5.13": "PBES2",
        "1.2.840.113549.1.5.14": "PBMAC1",
        "1.2.840.113549.1.7.1": "data",
        "1.2.840.113549.1.7.2": "signedData",
        "1.2.840.113549.1.7.3": "envelopedData",
        "1.2.840.113549.1.7.4": "signedAndEnvelopedData",
        "1.2.840.113549.1.7.5": "digestedData",
        "1.2.840.113549.1.7.6": "encryptedData",
        "1.2.840.113549.1.9.1": "emailAddress",
        "1.2.840.113549.1.9.2": "unstructuredName",
        "1.2.840.113549.1.9.3": "contentType",
        "1.2.840.113549.1.9.4": "messageDigest",
        "1.2.840.113549.1.9.5": "signingTime",
        "1.2.840.113549.1.9.6": "countersignature",
        "1.2.840.113549.1.9.7": "challengePassword",
        "1.2.840.113549.1.9.8": "unstructuredAddress",
        "1.2.840.113549.1.9.9": "extendedCertificateAttributes",
        "1.2.840.113549.1.9.10": "issuerAndSerialNumber",
        "1.2.840.113549.1.9.11": "passwordCheck",
        "1.2.840.113549.1.9.12": "publicKey",
        "1.2.840.113549.1.9.13": "signingDescription",
        "1.2.840.113549.1.9.14": "extensionRequest",
        "1.2.840.113549.1.9.15": "sMimeCapabilities",
        "1.2.840.113549.1.9.16": "sMimeObjectIdentifierRegistry",
        "1.2.840.113549.1.9.16.1.2": "authData",
        "1.2.840.113549.1.9.16.1.4 ": "timestampToken",
        "1.2.840.113549.1.9.16.1.17 ": "firmwareLoadReceipt",
        "1.2.840.113549.1.9.16.1.21": "encKeyWithID",
        "1.2.840.113549.1.9.16.1.23": "authEnvelopedData",
        "1.2.840.113549.1.9.16.2": "sMimeAttributes",
        "1.2.840.113549.1.9.16.2.1": "receiptRequest",
        "1.2.840.113549.1.9.16.2.12": "signingCertificate",
        "1.2.840.113549.1.9.16.2.14": "timeStampToken",
        "1.2.840.113549.1.9.16.2.2": "securityLabel",
        "1.2.840.113549.1.9.16.2.3": "mlExpansionHistory",
        "1.2.840.113549.1.9.16.2.34": "unsignedData",
        "1.2.840.113549.1.9.16.2.47": "signingCertificateV2",
        "1.2.840.113549.1.9.16.3.5": "ESDH",
        "1.2.840.113549.1.9.20": "friendlyName",
        "1.2.840.113549.1.9.21": "localKeyId",
        "1.2.840.113549.1.9.22": "certTypes",
        "1.2.840.113549.1.9.22.1": "x509Certificate",
        "1.2.840.113549.1.9.22.2": "sdsiCertificate",
        "1.2.840.113549.1.9.23": "crlTypes",
        "1.2.840.113549.1.9.23.1": "x509CRL",
        "1.2.840.113549.1.9.24": "secretTypes",
        "1.2.840.113549.1.9.24.1": "secret",
        "1.2.840.113549.1.9.25.1": "pkcs15Token",
        "1.2.840.113549.1.9.25.2": "encryptedPrivateKeyInfo",
        "1.2.840.113549.1.9.25.3": "randomNonce",
        "1.2.840.113549.1.9.25.4": "sequenceNumber",
        "1.2.840.113549.1.9.25.5": "pkcs7PDU",
        "1.2.840.113549.1.9.26.1": "pkcs9String",
        "1.2.840.113549.1.9.26.2": "signingTimeString",
        "1.2.840.113549.1.9.27.1": "caseIgnoreMatch",
        "1.2.840.113549.1.9.27.2": "signingTimeMatch",
        "1.2.840.113549.1.12.0.1": "pkcs-12",
        "1.2.840.113549.1.12.1": "pbe",
        "1.2.840.113549.1.12.1.1": "pbeWithSHAAnd128BitRC4",
        "1.2.840.113549.1.12.1.2": "pbeWithSHAAnd40BitRC4",
        "1.2.840.113549.1.12.1.3": "pbeWithSHAAnd3-KeyTripleDES-CBC",
        "1.2.840.113549.1.12.1.4": "pbeWithSHAAnd2-KeyTripleDES-CBC",
        "1.2.840.113549.1.12.1.5": "pbeWithSHAAnd128BitRC2-CBC",
        "1.2.840.113549.1.12.1.6": "pbeWithSHAAnd40BitRC2-CBC",
        "1.2.840.113549.1.12.1.80": "pbeUnknownGost",
        "1.2.840.113549.1.12.2.1": "pkcs8-key-shrouding",
        "1.2.840.113549.1.12.3.1": "keyBagId",
        "1.2.840.113549.1.12.3.2": "certAndCRLBagId",
        "1.2.840.113549.1.12.3.3": "secretBagId",
        "1.2.840.113549.1.12.3.4": "safeContentsId",
        "1.2.840.113549.1.12.3.5": "pkcs-8ShroudedKeyBagId",
        "1.2.840.113549.1.12.4.1": "x509CertCRLBagId",
        "1.2.840.113549.1.12.4.2": "pkcs-12-SDSICertBag",
        "1.2.840.113549.1.12.10.1.1": "keyBag",
        "1.2.840.113549.1.12.10.1.2": "pkcs8ShroudedKeyBag",
        "1.2.840.113549.1.12.10.1.3": "certBag",
        "1.2.840.113549.1.12.10.1.4": "crlBag",
        "1.2.840.113549.1.12.10.1.5": "secretBag",
        "1.2.840.113549.1.12.10.1.6": "safeContentsBag",
        "1.2.840.113549.2.5": "md-5",
        "1.2.840.113549.3.7": "des-EDE3-CBC",
        "1.3.132.0.34": "secp384r1",
        "1.3.132.0.35": "secp521r1",
        "1.3.132.112": "ecDH",
        "1.3.14.3.2.26": "sha1",
        "1.3.6.1.4.1.311.2.1.14": "msCertExtensions",
        "1.3.6.1.4.1.311.17.1": "keyProviderNameAttr",
        "1.3.6.1.4.1.311.17.2": "localMachineKeyset",
        "1.3.6.1.4.1.311.17.3.20": "certKeyIdentifierPropId",
        "1.3.6.1.4.1.5849": "SignalCom",
        "1.3.6.1.4.1.5849.1.1.1": "id-sc-gost28147-ecb",
        "1.3.6.1.4.1.5849.1.1.2": "id-sc-gost28147-gamma",
        "1.3.6.1.4.1.5849.1.1.3": "id-sc-gost28147-gfb",
        "1.3.6.1.4.1.5849.1.1.4": "id-sc-gost28147-mac",
        "1.3.6.1.4.1.5849.1.1.5": "id-sc-gostR3410-94",
        "1.3.6.1.4.1.5849.1.1.6.1.1.1": "id-sc-gostR3410-94-default",
        "1.3.6.1.4.1.5849.1.1.6.1.1.2": "id-sc-gostR3410-94-test",
        "1.3.6.1.4.1.5849.1.2.1": "id-sc-gostR3411-94",
        "1.3.6.1.4.1.5849.1.3.1": "id-sc-gostR3411-94-with-gostR3410-94",
        "1.3.6.1.4.1.5849.1.3.2": "id-sc-gostR3411-94-with-gostR3410-2001",
        "1.3.6.1.4.1.5849.1.4.1": "id-sc-cmsGostWrap",
        "1.3.6.1.4.1.5849.1.4.2": "id-sc-cmsGost28147Wrap",
        "1.3.6.1.4.1.5849.1.5.1": "id-sc-pbeWithGost3411AndGost28147",
        "1.3.6.1.4.1.5849.1.5.2": "id-sc-pbeWithGost3411AndGost28147CFB",
        "1.3.6.1.4.1.5849.1.6.2": "id-sc-gostR3410-2001",
        "1.3.6.1.4.1.5849.1.7.2": "id-sc-hmacWithGostR3411",
        "1.3.6.1.4.1.5849.1.8.1": "id-sc-r3410-ESDH-r3411kdf",
        "1.3.6.1.4.1.5849.1.8.3": "id-sc-ecdh-singlePass-cofactor-r3411kdf",
        "1.3.6.1.4.1.5849.2.2.1": "id-sc-gostR3410-2001-publicKey",
        "1.3.6.1.5.5.7.0.12": "attribute-cert",
        "1.3.6.1.5.5.7.1.1": "authorityInfoAccess",
        "1.3.6.1.5.5.7.1.4": "auditIdentity",
        "1.3.6.1.5.5.7.1.6": "aaControls",
        "1.3.6.1.5.5.7.1.10": "ac-proxying",
        "1.3.6.1.5.5.7.1.11": "subjectInfoAccess",
        "1.3.6.1.5.5.7.3.1": "serverAuth",
        "1.3.6.1.5.5.7.3.2": "clientAuth",
        "1.3.6.1.5.5.7.3.3": "codeSigning",
        "1.3.6.1.5.5.7.3.4": "emailProtection",
        "1.3.6.1.5.5.7.3.5": "ipsecEndSystem",
        "1.3.6.1.5.5.7.3.6": "ipsecTunnel",
        "1.3.6.1.5.5.7.3.7": "ipsecUser",
        "1.3.6.1.5.5.7.3.8": "timeStamping",
        "1.3.6.1.5.5.7.3.9": "OCSPSigning",
        "1.3.6.1.5.5.7.5.1": "regCtrl",
        "1.3.6.1.5.5.7.5.1.1": "regToken",
        "1.3.6.1.5.5.7.5.1.2": "authenticator",
        "1.3.6.1.5.5.7.5.1.3": "pkiPublicationInfo",
        "1.3.6.1.5.5.7.5.1.4": "pkiArchiveOptions",
        "1.3.6.1.5.5.7.5.1.5": "oldCertID",
        "1.3.6.1.5.5.7.5.1.6": "protocolEncrKey",
        "1.3.6.1.5.5.7.5.2": "regInfoAttr",
        "1.3.6.1.5.5.7.5.2.1": "UTF8Pairs",
        "1.3.6.1.5.5.7.5.2.2": "certReq",
        "1.3.6.1.5.5.7.6.2": "noSignature",
        "1.3.6.1.5.5.7.7.1": "statusInfo",
        "1.3.6.1.5.5.7.7.2": "identification",
        "1.3.6.1.5.5.7.7.3": "identityProof",
        "1.3.6.1.5.5.7.7.4": "dataReturn",
        "1.3.6.1.5.5.7.7.5": "transactionId",
        "1.3.6.1.5.5.7.7.6": "senderNonce",
        "1.3.6.1.5.5.7.7.7": "recipientNonce",
        "1.3.6.1.5.5.7.7.8": "addExtensions",
        "1.3.6.1.5.5.7.7.9": "encryptedPOP",
        "1.3.6.1.5.5.7.7.10": "decryptedPOP",
        "1.3.6.1.5.5.7.7.11": "lraPOPWitness",
        "1.3.6.1.5.5.7.7.15": "getCert",
        "1.3.6.1.5.5.7.7.16": "getCRL",
        "1.3.6.1.5.5.7.7.17": "revokeRequest",
        "1.3.6.1.5.5.7.7.18": "regInfo",
        "1.3.6.1.5.5.7.7.19": "responseInfo",
        "1.3.6.1.5.5.7.7.21": "queryPending",
        "1.3.6.1.5.5.7.7.22": "popLinkRandom",
        "1.3.6.1.5.5.7.7.23": "popLinkWitness",
        "1.3.6.1.5.5.7.7.24": "confirmCertAcceptance",
        "1.3.6.1.5.5.7.7.25": "statusInfoV2",
        "1.3.6.1.5.5.7.7.26": "trustedAnchors",
        "1.3.6.1.5.5.7.7.27": "authPublish",
        "1.3.6.1.5.5.7.7.28": "batchRequests",
        "1.3.6.1.5.5.7.7.29": "batchResponses",
        "1.3.6.1.5.5.7.7.30": "publishCert",
        "1.3.6.1.5.5.7.7.31": "modCertTemplate",
        "1.3.6.1.5.5.7.7.32": "controlProcessed",
        "1.3.6.1.5.5.7.7.33": "popLinkWitnessV2",
        "1.3.6.1.5.5.7.7.34": "identityProofV2",
        "1.3.6.1.5.5.7.9.1": "dateOfBirth",
        "1.3.6.1.5.5.7.9.2": "placeOfBirth",
        "1.3.6.1.5.5.7.9.3": "gender",
        "1.3.6.1.5.5.7.9.4": "countryOfCitizenship",
        "1.3.6.1.5.5.7.9.5": "countryOfResidence",
        "1.3.6.1.5.5.7.10.1": "authenticationInfo",
        "1.3.6.1.5.5.7.10.2": "accessIdentity",
        "1.3.6.1.5.5.7.10.3": "chargingIdentity",
        "1.3.6.1.5.5.7.10.4": "group",
        "1.3.6.1.5.5.7.10.6": "encAttrs",
        "1.3.6.1.5.5.7.12.2": "PKIData",
        "1.3.6.1.5.5.7.12.3": "PKIResponse",
        "1.3.6.1.5.5.7.48.1.1": "ocsp-basic",
        "1.3.6.1.5.5.7.48.1.2": "ocsp-nonce",
        "1.3.6.1.5.5.7.48.1.3": "ocsp-crl",
        "1.3.6.1.5.5.7.48.1.4": "ocsp-response",
        "1.3.6.1.5.5.7.48.1.5": "ocsp-nocheck",
        "1.3.6.1.5.5.7.48.1.6": "ocsp-archive-cutoff",
        "1.3.6.1.5.5.7.48.1.7": "ocsp-service-locator",
        "2.16.840.1.101.2.1.2.78.2": "encryptedKeyPkg",
        "2.16.840.1.101.2.1.2.78.3": "keyPackageReceipt",
        "2.16.840.1.101.2.1.2.78.5": "aKeyPackage",
        "2.16.840.1.101.2.1.2.78.6": "keyPackageError",
        "2.16.840.1.101.3.4": "nistAlgorithms",
        "2.16.840.1.101.3.4.1": "aes",
        "2.16.840.1.101.3.4.1.1": "aes128-ECB",
        "2.16.840.1.101.3.4.1.2": "aes128-CBC",
        "2.16.840.1.101.3.4.1.3": "aes128-OFB",
        "2.16.840.1.101.3.4.1.4": "aes128-CFB",
        "2.16.840.1.101.3.4.1.5": "aes128-wrap",
        "2.16.840.1.101.3.4.1.6": "aes128-GCM",
        "2.16.840.1.101.3.4.1.7": "aes128-CCM",
        "2.16.840.1.101.3.4.1.8": "aes128-wrap-pad",
        "2.16.840.1.101.3.4.1.21": "aes192-ECB",
        "2.16.840.1.101.3.4.1.22": "aes192-CBC",
        "2.16.840.1.101.3.4.1.23": "aes192-OFB",
        "2.16.840.1.101.3.4.1.24": "aes192-CFB",
        "2.16.840.1.101.3.4.1.25": "aes192-wrap",
        "2.16.840.1.101.3.4.1.26": "aes192-GCM",
        "2.16.840.1.101.3.4.1.27": "aes192-CCM",
        "2.16.840.1.101.3.4.1.28": "aes192-wrap-pad",
        "2.16.840.1.101.3.4.1.41": "aes256-ECB",
        "2.16.840.1.101.3.4.1.42": "aes256-CBC",
        "2.16.840.1.101.3.4.1.43": "aes256-OFB",
        "2.16.840.1.101.3.4.1.44": "aes256-CFB",
        "2.16.840.1.101.3.4.1.45": "aes256-wrap",
        "2.16.840.1.101.3.4.1.46": "aes256-GCM",
        "2.16.840.1.101.3.4.1.47": "aes256-CCM",
        "2.16.840.1.101.3.4.1.48": "aes256-wrap-pad",
        "2.16.840.1.101.3.4.2.1": "sha256",
        "2.16.840.1.101.3.4.2.2": "sha384",
        "2.16.840.1.101.3.4.2.3": "sha512",
        "2.16.840.1.113730.3.1.216": "userPKCS12",
        "2.5.1.5.55": "clearance",
        "2.5.4.0": "objectClass",
        "2.5.4.1": "aliasedEntryName",
        "2.5.4.2": "knowldgeinformation",
        "2.5.4.3": "commonName",
        "2.5.4.5": "serialName",
        "2.5.4.6": "countryName",
        "2.5.4.7": "localityName",
        "2.5.4.8": "stateOrProvinceName",
        "2.5.4.9": "streetAddress",
        "2.5.4.10": "organizationName",
        "2.5.4.11": "organizationalUnitName",
        "2.5.4.12": "title",
        "2.5.4.13": "description",
        "2.5.4.14": "searchGuide",
        "2.5.4.15": "businessCategory",
        "2.5.4.16": "postalAddress",
        "2.5.4.17": "postalCode",
        "2.5.4.18": "postOfficeBox",
        "2.5.4.19": "physicalDeliveryOfficeName",
        "2.5.4.20": "telephoneNumber",
        "2.5.4.21": "telexNumber",
        "2.5.4.22": "teletexTerminalIdentifier",
        "2.5.4.23": "facsimileTelephoneNumber",
        "2.5.4.24": "x121Address",
        "2.5.4.25": "internationalISDNNumber",
        "2.5.4.26": "registeredAddress",
        "2.5.4.27": "destinationIndicator",
        "2.5.4.28": "preferredDeliveryMethod",
        "2.5.4.29": "presentationAddress",
        "2.5.4.30": "supportedApplicationContext",
        "2.5.4.31": "member",
        "2.5.4.32": "owner",
        "2.5.4.33": "roleOccupant",
        "2.5.4.34": "seeAlso",
        "2.5.4.35": "userPassword",
        "2.5.4.36": "userCertificate",
        "2.5.4.37": "cACertificate",
        "2.5.4.38": "authorityRevocationList",
        "2.5.4.39": "certificateRevocationList",
        "2.5.4.40": "crossCertificatePair",
        "2.5.4.41": "name",
        "2.5.4.42": "givenName",
        "2.5.4.43": "initials",
        "2.5.4.44": "generationQualifier",
        "2.5.4.45": "uniqueIdentifier",
        "2.5.4.46": "dnQualifier",
        "2.5.4.47": "enhancedSearchGuide",
        "2.5.4.48": "protocolInformation",
        "2.5.4.49": "distinguishedName",
        "2.5.4.50": "uniqueMember",
        "2.5.4.51": "houseIdentifier",
        "2.5.4.52": "supportedAlgorithms",
        "2.5.4.53": "deltaRevocationList",
        "2.5.4.58": "attributeCertificate",
        "2.5.4.65": "pseudonym",
        "2.5.4.72": "role",
        "2.5.29.1": "authorityKeyIdentifierX",
        "2.5.29.2": "keyAttributesX",
        "2.5.29.3": "certificatePoliciesX",
        "2.5.29.4": "keyUsageRestriction",
        "2.5.29.5": "policyMapping",
        "2.5.29.6": "subtreesConstraint",
        "2.5.29.7": "subjectAltNameX",
        "2.5.29.8": "issuerAltNameX",
        "2.5.29.9": "subjectDirectoryAttributes",
        "2.5.29.10": "basicConstraintsX",
        "2.5.29.11": "nameConstraintsX",
        "2.5.29.12": "policyConstraintsX",
        "2.5.29.13": "basicConstraintsY",
        "2.5.29.14": "subjectKeyIdentifier",
        "2.5.29.15": "keyUsage",
        "2.5.29.16": "privateKeyUsagePeriod",
        "2.5.29.17": "subjectAltName",
        "2.5.29.18": "issuerAltName",
        "2.5.29.19": "basicConstraints",
        "2.5.29.20": "cRLNumber",
        "2.5.29.21": "cRLReason",
        "2.5.29.22": "expirationDate",
        "2.5.29.23": "instructionCode",
        "2.5.29.24": "invalidityDate",
        "2.5.29.25": "cRLDistributionPointsX",
        "2.5.29.26": "issuingDistributionPointX",
        "2.5.29.27": "deltaCRLIndicator",
        "2.5.29.28": "issuingDistributionPoint",
        "2.5.29.29": "certificateIssuer",
        "2.5.29.30": "nameConstraints",
        "2.5.29.31": "cRLDistributionPoints",
        "2.5.29.32": "certificatePolicies",
        "2.5.29.33": "policyMappings",
        "2.5.29.34": "policyConstraintsY",
        "2.5.29.35": "authorityKeyIdentifier",
        "2.5.29.36": "policyConstraints",
        "2.5.29.37": "extKeyUsage",
        "2.5.29.46": "freshestCRL",
        "2.5.29.54": "inhibitAnyPolicy",
        "2.5.29.55": "targetInformation",
        "2.5.29.56": "noRevAvail"
    }, k = {}, c;
    for (c in f) k[f[c]] = c;
    var a = {
        "id-GostR3411-94-with-GostR3410-2001": "GOST R 34.10-2001/GOST R 34.11-94",
        "id-GostR3411-94-with-GostR3410-94": "GOST R 34.10-94/GOST R 34.11-94",
        "id-GostR3411-94": "GOST R 34.11-94",
        "id-HMACGostR3411-94": {name: "HMAC", hash: {name: "GOST R 34.11-94"}},
        "id-Gost28147-89-None-KeyWrap": "GOST 28147-89-KW",
        "id-Gost28147-89-CryptoPro-KeyWrap": "GOST 28147-89-CPKW",
        "id-GostR3410-2001": "GOST R 34.10-2001",
        "id-GostR3410-94": "GOST R 34.10-94",
        "id-GostR3410-94-a": "GOST R 34.10-94",
        "id-GostR3410-94-aBis": "GOST R 34.10-94",
        "id-GostR3410-94-b": "GOST R 34.10-94",
        "id-GostR3410-94-bBis": "GOST R 34.10-94",
        "id-Gost28147-89": "GOST 28147-89",
        "id-Gost28147-89-MAC": "GOST 28147-89-MAC",
        "id-GostR3410-2001-CryptoPro-ESDH": "GOST R 34.10-2001-DH/GOST R 34.11-94",
        "id-GostR3410-94-CryptoPro-ESDH": "GOST R 34.10-94-DH/GOST R 34.11-94",
        "id-GostR3410-2001DH": "GOST R 34.10-2001-DH",
        "id-GostR3410-94DH": "GOST R 34.10-94-DH",
        "id-tc26-gost3410-12-256": "GOST R 34.10-256",
        "id-tc26-gost3410-12-512": "GOST R 34.10-512",
        "id-tc26-gost3411-94": "GOST R 34.11-94",
        "id-tc26-gost3411-12-256": "GOST R 34.11-256",
        "id-tc26-gost3411-12-512": "GOST R 34.11-512",
        "id-tc26-signwithdigest-gost3410-12-94": "GOST R 34.10-256/GOST R 34.11-94",
        "id-tc26-signwithdigest-gost3410-12-256": "GOST R 34.10-256/GOST R 34.11-256",
        "id-tc26-signwithdigest-gost3410-12-512": "GOST R 34.10-512/GOST R 34.11-512",
        "id-tc26-hmac-gost-3411-12-256": {name: "HMAC", hash: {name: "GOST R 34.11-256"}},
        "id-tc26-hmac-gost-3411-12-512": {name: "HMAC", hash: {name: "GOST R 34.11-512"}},
        "id-tc26-agreement-gost-3410-12-256": "GOST R 34.10-256-DH/GOST R 34.11-256",
        "id-tc26-agreement-gost-3410-12-512": "GOST R 34.10-512-DH/GOST R 34.11-256",
        "id-sc-gost28147-ecb": "GOST 28147-89-ECB/SC",
        "id-sc-gost28147-gamma": "GOST 28147-89-CTR/SC",
        "id-sc-gost28147-gfb": "GOST 28147-89-CFB/SC",
        "id-sc-gost28147-mac": "GOST 28147-89-MAC/SC",
        "id-sc-gostR3410-94": "GOST R 34.10-94/SC",
        "id-sc-gostR3410-94-default": "GOST R 34.10-94/SC",
        "id-sc-gostR3410-94-test": "GOST R 34.10-94/SC/S-TEST",
        "id-sc-gostR3411-94": "GOST R 34.11-94/SC",
        "id-sc-gostR3411-94-with-gostR3410-94": "GOST R 34.10-94/GOST R 34.11-94/SC",
        "id-sc-gostR3411-94-with-gostR3410-2001": "GOST R 34.10-2001/GOST R 34.11-94/SC",
        "id-sc-cmsGostWrap": "GOST 28147-89-SCKW/SC",
        "id-sc-cmsGost28147Wrap": "GOST 28147-89-KW/SC",
        "id-sc-pbeWithGost3411AndGost28147": {
            derivation: {name: "GOST R 34.11-94-PBKDF2/SC"},
            encryption: {name: "GOST 28147-ECB/SC"}
        },
        "id-sc-pbeWithGost3411AndGost28147CFB": {
            derivation: {name: "GOST R 34.11-94-PBKDF2/SC"},
            encryption: {name: "GOST 28147-CFB/SC"}
        },
        "id-sc-gostR3410-2001": "GOST R 34.10-2001/SC",
        "id-sc-hmacWithGostR3411": {name: "HMAC", hash: {name: "GOST R 34.11-94/SC"}},
        "id-sc-r3410-ESDH-r3411kdf": "GOST R 34.10-2001-DH/GOST R 34.11-94/SC",
        noSignature: "NONE",
        rsaEncryption: {name: "RSASSA-PKCS1-v1_5", hash: {name: "SHA-256"}},
        sha1withRSAEncryption: {name: "RSASSA-PKCS1-v1_5", hash: {name: "SHA-1"}},
        sha256withRSAEncryption: {name: "RSASSA-PKCS1-v1_5", hash: {name: "SHA-256"}},
        sha384withRSAEncryption: {name: "RSASSA-PKCS1-v1_5", hash: {name: "SHA-384"}},
        sha512withRSAEncryption: {name: "RSASSA-PKCS1-v1_5", hash: {name: "SHA-512"}},
        "rsaes-oaep": "RSA-OAEP",
        "rsassa-pss": "RSA-PSS",
        ecdsa: "ECDSA",
        "ecdsa-with-SHA1": {name: "ECDSA", hash: {name: "SHA-1"}},
        "ecdsa-with-SHA256": {name: "ECDSA", hash: {name: "SHA-256"}},
        "ecdsa-with-SHA384": {name: "ECDSA", hash: {name: "SHA-384"}},
        "ecdsa-with-SHA512": {name: "ECDSA", hash: {name: "SHA-512"}},
        "pbeWithSHAAndAES128-CBC": {
            derivation: {name: "PBKDF2", hash: {name: "SHA-1"}},
            encryption: {name: "AES-CBC", length: 128}
        },
        "pbeWithSHAAndAES192-CBC": {
            derivation: {name: "PBKDF2", hash: {name: "SHA-1"}},
            encryption: {name: "AES-CBC", length: 192}
        },
        "pbeWithSHAAndAES256-CBC": {
            derivation: {name: "PBKDF2", hash: {name: "SHA-1"}},
            encryption: {name: "AES-CBC", length: 256}
        },
        "pbeWithSHA256AndAES128-CBC": {
            derivation: {
                name: "PBKDF2",
                hash: {name: "SHA-256"}
            }, encryption: {name: "AES-CBC", length: 128}
        },
        "pbeWithSHA256AndAES192-CBC": {
            derivation: {name: "PBKDF2", hash: {name: "SHA-256"}},
            encryption: {name: "AES-CBC", length: 192}
        },
        "pbeWithSHA256AndAES256-CBC": {
            derivation: {name: "PBKDF2", hash: {name: "SHA-256"}},
            encryption: {name: "AES-CBC", length: 256}
        },
        "pbeWithSHAAnd3-KeyTripleDES-CBC": {
            derivation: {name: "PFXKDF", iterations: 2E3, hash: "SHA-1"},
            encryption: {name: "3DES", block: "CBC"}
        },
        "pbeWithSHAAnd2-KeyTripleDES-CBC": {
            derivation: {
                name: "PFXKDF", iterations: 2E3,
                hash: "SHA-1"
            }, encryption: {name: "2DES", block: "CBC"}
        },
        "pbeWithSHAAnd128BitRC2-CBC": {
            derivation: {name: "PFXKDF", iterations: 2E3, hash: "SHA-1"},
            encryption: {name: "RC2", block: "CBC", length: 128}
        },
        "pbeWithSHAAnd40BitRC2-CBC": {
            derivation: {name: "PFXKDF", iterations: 2E3, hash: "SHA-1"},
            encryption: {name: "RC2", block: "CBC", length: 40}
        },
        pbeUnknownGost: {
            derivation: {name: "PFXKDF", iterations: 2E3, hash: "GOST R 34.11-94"},
            encryption: {name: "GOST 28147-89-CFB"}
        },
        ecDH: "ECDH",
        dhKeyAgreement: "DH",
        "aes128-CBC": {name: "AES-CBC", length: 128},
        "aes128-CFB": {name: "AES-CFB-8", length: 128},
        "aes128-GCM": {name: "AES-GCM", length: 128},
        "aes128-wrap": {name: "AES-KW", length: 128},
        "aes192-CBC": {name: "AES-CBC", length: 192},
        "aes192-CFB": {name: "AES-CFB-8", length: 192},
        "aes192-GCM": {name: "AES-GCM", length: 192},
        "aes192-wrap": {name: "AES-KW", length: 192},
        "aes256-CBC": {name: "AES-CBC", length: 256},
        "aes256-CFB": {name: "AES-CFB-8", length: 256},
        "aes256-GCM": {name: "AES-GCM", length: 256},
        "aes256-wrap": {name: "AES-KW", length: 256},
        sha1: "SHA-1",
        sha256: "SHA-256",
        sha384: "SHA-384",
        sha512: "SHA-512",
        PBKDF2: "PBKDF2",
        PBES2: {derivation: {name: "PBKDF2"}, encryption: {}},
        PBMAC1: {derivation: {name: "PBKDF2"}, hmac: {}},
        hmacWithSHA1: "SHA-1-HMAC",
        hmacWithSHA256: {name: "HMAC", hash: {name: "SHA-256"}},
        hmacWithSHA384: {name: "HMAC", hash: {name: "SHA-384"}},
        hmacWithSHA512: {name: "HMAC", hash: {name: "SHA-512"}}
    };
    for (c in a) {
        var d = a[c];
        "string" === typeof d && (d = {name: d});
        d.id = c;
        a[c] = d
    }
    var g = {
        "CP-94": {
            title: "Crypto-Pro GOST R 34.10-94 Cryptographic Service Provider",
            signature: a["id-GostR3411-94-with-GostR3410-94"],
            publicKey: {id: "id-GostR3410-94", name: "GOST R 34.10-94", namedParam: "X-A"},
            privateKey: {id: "id-GostR3410-94DH", name: "GOST R 34.10-94-DH", namedParam: "X-A"},
            digest: a["id-GostR3411-94"],
            wrapping: {id: "id-Gost28147-89-CryptoPro-KeyWrap", name: "GOST 28147-89-CPKW", sBox: "E-A"},
            hmac: a["id-HMACGostR3411-94"],
            agreement: a["id-GostR3410-94-CryptoPro-ESDH"],
            encryption: {id: "id-Gost28147-89", name: "GOST 28147-89", block: "CFB", sBox: "E-A", keyMeshing: "CP"},
            derivation: {id: "PBKDF2", name: "GOST R 34.11-94-PBKDF2", iterations: 2E3}
        },
        "CP-01": {
            title: "Crypto-Pro GOST R 34.10-2001 Cryptographic Service Provider",
            signature: a["id-GostR3411-94-with-GostR3410-2001"],
            publicKey: {id: "id-GostR3410-2001", name: "GOST R 34.10-2001", namedCurve: "X-256-A"},
            privateKey: {id: "id-GostR3410-2001DH", name: "GOST R 34.10-2001-DH", namedCurve: "X-256-A"},
            digest: {id: "id-GostR3411-94", name: "GOST R 34.11-94", sBox: "D-A"},
            wrapping: {id: "id-Gost28147-89-CryptoPro-KeyWrap", name: "GOST 28147-89-CPKW", sBox: "E-A"},
            hmac: a["id-HMACGostR3411-94"],
            agreement: a["id-GostR3410-2001-CryptoPro-ESDH"],
            encryption: {id: "id-Gost28147-89", name: "GOST 28147-89-CFB-CPKM", sBox: "E-A"},
            derivation: {id: "PBKDF2", name: "GOST R 34.11-94-PBKDF2", iterations: 2E3}
        }, "TC-256": {
            title: "Crypto-Pro GOST R 34.10-2012 Cryptographic Service Provider",
            signature: a["id-tc26-signwithdigest-gost3410-12-256"],
            publicKey: {id: "id-tc26-gost3410-12-256", name: "GOST R 34.10-256", namedCurve: "X-256-A"},
            privateKey: {
                id: "id-tc26-agreement-gost-3410-12-256",
                name: "GOST R 34.10-256-DH/GOST R 34.11-256",
                namedCurve: "X-256-A"
            },
            digest: a["id-tc26-gost3411-12-256"],
            wrapping: {id: "id-Gost28147-89-CryptoPro-KeyWrap", name: "GOST 28147-89-CPKW", sBox: "E-A"},
            hmac: a["id-tc26-hmac-gost-3411-12-256"],
            agreement: a["id-tc26-agreement-gost-3410-12-256"],
            encryption: {id: "id-Gost28147-89", name: "GOST 28147-89-CFB-CPKM", sBox: "E-A"},
            derivation: {id: "PBKDF2", name: "GOST R 34.11-256-12-PBKDF2", iterations: 2E3}
        }, "TC-512": {
            title: "Crypto-Pro GOST R 34.10-2012 Strong Cryptographic Service Provider",
            signature: a["id-tc26-signwithdigest-gost3410-12-512"],
            publicKey: {
                id: "id-tc26-gost3410-12-512",
                name: "GOST R 34.10-512", namedCurve: "T-512-A"
            },
            privateKey: {
                id: "id-tc26-agreement-gost-3410-12-512",
                name: "GOST R 34.10-512-DH/GOST R 34.11-256",
                namedCurve: "T-512-A"
            },
            digest: a["id-tc26-gost3411-12-512"],
            wrapping: {id: "id-Gost28147-89-CryptoPro-KeyWrap", name: "GOST 28147-89-CPKW", sBox: "E-A"},
            hmac: a["id-tc26-hmac-gost-3411-12-512"],
            agreement: a["id-tc26-agreement-gost-3410-12-512"],
            encryption: {id: "id-Gost28147-89", name: "GOST 28147-89-CFB-CPKM", sBox: "E-A"},
            derivation: {
                id: "PBKDF2", name: "GOST R 34.11-256-PBKDF2",
                iterations: 2E3
            }
        }, "SC-94": {
            title: "Signal-COM GOST Cryptographic Provider",
            signature: a["id-sc-gostR3411-94-with-gostR3410-94"],
            publicKey: {id: "id-sc-gostR3410-94", name: "GOST R 34.10-94/SC", namedParam: "S-A"},
            privateKey: {
                id: "id-sc-gostR3410-94", name: "GOST R 34.10-94/SC", modulusLength: 1024, param: {
                    p: "0xB4E25EFB018E3C8B87505E2A67553C5EDC56C2914B7E4F89D23F03F03377E70A2903489DD60E78418D3D851EDB5317C4871E40B04228C3B7902963C4B7D85D52B9AA88F2AFDBEB28DA8869D6DF846A1D98924E925561BD69300B9DDD05D247B5922D967CBB02671881C57D10E5EF72D3E6DAD4223DC82AA1F7D0294651A480DF",
                    q: "0x972432A437178B30BD96195B773789AB2FFF15594B176DD175B63256EE5AF2CF",
                    a: "0x8FD36731237654BBE41F5F1F8453E71CA414FFC22C25D915309E5D2E62A2A26C7111F3FC79568DAFA028042FE1A52A0489805C0DE9A1A469C844C7CABBEE625C3078888C1D85EEA883F1AD5BC4E6776E8E1A0750912DF64F79956499F1E182475B0B60E2632ADCD8CF94E9C54FD1F3B109D81F00BF2AB8CB862ADF7D40B9369A"
                }
            },
            digest: a["id-sc-gostR3411-94"],
            encryption: {id: "id-sc-gost28147-gfb", name: "GOST 28147-89-CFB/SC"},
            hmac: a["id-sc-hmacWithGostR3411"],
            wrapping: ["id-sc-cmsGostWrap"],
            agreement: a["id-sc-r3410-ESDH-r3411kdf"],
            derivation: {id: "PBKDF2", name: "GOST R 34.11-94-PBKDF2/SC", iterations: 2048},
            pbes: {
                id: "id-sc-pbeWithGost3411AndGost28147CFB",
                derivation: {id: "PBKDF2", name: "GOST R 34.11-94-PBKDF2/SC", iterations: 2048},
                encryption: {
                    id: "id-sc-gost28147-gfb",
                    name: "GOST 28147-CFB/SC",
                    iv: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])
                }
            }
        }, "SC-01": {
            title: "Signal-COM ECGOST Cryptographic Provider",
            signature: a["id-sc-gostR3411-94-with-gostR3410-2001"],
            publicKey: {id: "id-sc-gostR3410-2001", name: "GOST R 34.10-2001/SC", namedCurve: "P-256"},
            privateKey: {
                id: "id-sc-gostR3410-2001",
                name: "GOST R 34.10-2001/SC",
                curve: {
                    p: "0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF",
                    a: "0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC",
                    b: "0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B",
                    x: "0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296",
                    y: "0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5",
                    q: "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"
                }
            },
            digest: a["id-sc-gostR3411-94"],
            encryption: {
                id: "id-sc-gost28147-gfb",
                name: "GOST 28147-89-CFB/SC"
            },
            hmac: a["id-sc-hmacWithGostR3411"],
            wrapping: a["id-sc-cmsGostWrap"],
            agreement: a["id-sc-r3410-ESDH-r3411kdf"],
            derivation: {id: "PBKDF2", name: "GOST R 34.11-94-PBKDF2/SC", iterations: 2048},
            pbes: {
                id: "id-sc-pbeWithGost3411AndGost28147CFB",
                derivation: {id: "PBKDF2", name: "GOST R 34.11-94-PBKDF2/SC", iterations: 2048},
                encryption: {
                    id: "id-sc-gost28147-gfb",
                    name: "GOST 28147-CFB/SC",
                    iv: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])
                }
            }
        }, "RSA-2048": {
            title: "Microsoft Strong Cryptographic Provider",
            signature: a.sha256withRSAEncryption,
            publicKey: {
                id: "rsaEncryption",
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: a.sha256
            },
            privateKey: {
                id: "rsaEncryption",
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: a.sha256
            },
            digest: a.sha256,
            encryption: a["aes256-CFB"],
            hmac: a.hmacWithSHA256
        }, "ECDSA-256": {
            title: "Microsoft Base DSS and Diffie-Hellman Cryptographic Provider",
            signature: a["ecdsa-with-SHA256"],
            publicKey: {id: "ecdsa", name: "ECDSA", namedCurve: "P-256"},
            privateKey: {
                id: "ecdsa",
                name: "ECDSA", namedCurve: "P-256"
            },
            digest: a.sha256,
            encryption: a["aes256-CFB"],
            hmac: a.hmacWithSHA256,
            agreement: a.ecDH
        }
    };
    "CP-94 CP-01 TC-256 TC-512 SC-94 SC-01".split(" ").forEach(function (a) {
        a = g[a];
        a.hmac = b(a.hmac, {hash: a.digest});
        a.derivation = b(a.derivation, {hash: a.digest, hmac: a.hmac});
        a.pbes = a.pbes || {id: "PBES2", derivation: a.derivation, encryption: a.encryption};
        a.pbmac = a.pbmac || {id: "PBMAC1", derivation: a.derivation, hmac: a.hmac};
        a.agreement = b(a.agreement, {wrapping: a.wrapping})
    });
    ["RSA-2048", "ECDSA-256"].forEach(function (a) {
        a =
            g[a];
        a.derivation = a.derivation || {id: "PBKDF2", name: "PBKDF2", iterations: 2048, hash: a.digest};
        a.pbes = a.pbes || {id: "PBES2", derivation: a.derivation, encryption: a.encryption};
        a.pbmac = a.pbmac || {id: "PBMAC1", derivation: a.derivation, hmac: a.hmac}
    });
    h.prototype = {
        names: f, identifiers: k, algorithms: a, parameters: {
            "id-GostR3410-94-TestParamSet": {namedParam: "S-TEST"},
            "id-GostR3410-94-CryptoPro-A-ParamSet": {namedParam: "S-A"},
            "id-GostR3410-94-CryptoPro-B-ParamSet": {namedParam: "S-B"},
            "id-GostR3410-94-CryptoPro-C-ParamSet": {namedParam: "S-C"},
            "id-GostR3410-94-CryptoPro-D-ParamSet": {namedParam: "S-D"},
            "id-GostR3410-94-CryptoPro-XchA-ParamSet": {namedParam: "X-A"},
            "id-GostR3410-94-CryptoPro-XchB-ParamSet": {namedParam: "X-B"},
            "id-GostR3410-94-CryptoPro-XchC-ParamSet": {namedParam: "X-C"},
            "id-GostR3410-2001-CryptoPro-TestParamSet": {namedCurve: "S-256-TEST"},
            "id-GostR3410-2001-CryptoPro-A-ParamSet": {namedCurve: "S-256-A"},
            "id-GostR3410-2001-CryptoPro-B-ParamSet": {namedCurve: "S-256-B"},
            "id-GostR3410-2001-CryptoPro-C-ParamSet": {namedCurve: "S-256-C"},
            "id-GostR3410-2001-CryptoPro-XchA-ParamSet": {namedCurve: "X-256-A"},
            "id-GostR3410-2001-CryptoPro-XchB-ParamSet": {namedCurve: "X-256-B"},
            "id-tc26-gost-3410-12-256-paramSetTest": {namedCurve: "T-256-TEST"},
            "id-tc26-gost-3410-12-256-paramSetA": {namedCurve: "T-256-A"},
            "id-tc26-gost-3410-12-256-paramSetB": {namedCurve: "T-256-B"},
            "id-tc26-gost-3410-12-512-paramSetTest": {namedCurve: "T-512-TEST"},
            "id-tc26-gost-3410-12-512-paramSetA": {namedCurve: "T-512-A"},
            "id-tc26-gost-3410-12-512-paramSetB": {namedCurve: "T-512-B"},
            "id-tc26-gost-3410-12-512-paramSetC": {namedCurve: "T-512-C"},
            "id-tc26-gost-3410-12-512-paramSetD": {namedCurve: "T-512-D"},
            secp256r1: {namedCurve: "P-256"},
            secp384r: {namedCurve: "P-384"},
            secp521r: {namedCurve: "P-521"},
            "id-GostR3411-94-TestParamSet": {sBox: "D-TEST"},
            "id-GostR3411-94-CryptoProParamSet": {sBox: "D-A"},
            "id-GostR3411-94-CryptoPro-A-ParamSet": {sBox: "D-B"},
            "id-GostR3411-94-CryptoPro-B-ParamSet": {sBox: "D-C"},
            "id-GostR3411-94-CryptoPro-C-ParamSet": {sBox: "D-D"},
            "id-Gost28147-89-TestParamSet": {
                block: "CTR",
                sBox: "E-TEST"
            },
            "id-Gost28147-89-CryptoPro-A-ParamSet": {block: "CFB", sBox: "E-A", keyMeshing: "CP"},
            "id-Gost28147-89-CryptoPro-B-ParamSet": {block: "CFB", sBox: "E-B", keyMeshing: "CP"},
            "id-Gost28147-89-CryptoPro-C-ParamSet": {block: "CFB", sBox: "E-C", keyMeshing: "CP"},
            "id-Gost28147-89-CryptoPro-D-ParamSet": {block: "CFB", sBox: "E-D", keyMeshing: "CP"},
            "id-Gost28147-89-None-KeyMeshing": {keyMeshing: "NO"},
            "id-Gost28147-89-CryptoPro-KeyMeshing": {keyMeshing: "CP"},
            "id-tc26-gost-28147-param-Z": {block: "CFB", sBox: "E-Z"}
        }, attributes: {
            sBox: {
                "D-TEST": "id-GostR3411-94-TestParamSet",
                "D-A": "id-GostR3411-94-CryptoProParamSet",
                "D-B": "id-GostR3411-94-CryptoPro-A-ParamSet",
                "D-C": "id-GostR3411-94-CryptoPro-B-ParamSet",
                "D-D": "id-GostR3411-94-CryptoPro-C-ParamSet",
                "E-TEST": "id-Gost28147-89-TestParamSet",
                "E-A": "id-Gost28147-89-CryptoPro-A-ParamSet",
                "E-B": "id-Gost28147-89-CryptoPro-B-ParamSet",
                "E-C": "id-Gost28147-89-CryptoPro-C-ParamSet",
                "E-D": "id-Gost28147-89-CryptoPro-D-ParamSet",
                "E-Z": "id-tc26-gost-28147-param-Z",
                "D-256": "id-tc26-gost3411-12-256",
                "D-512": "id-tc26-gost3411-12-512"
            },
            namedParam: {
                "S-TEST": "id-GostR3410-94-TestParamSet",
                "S-A": "id-GostR3410-94-CryptoPro-A-ParamSet",
                "S-B": "id-GostR3410-94-CryptoPro-B-ParamSet",
                "S-C": "id-GostR3410-94-CryptoPro-C-ParamSet",
                "S-D": "id-GostR3410-94-CryptoPro-D-ParamSet",
                "X-A": "id-GostR3410-94-CryptoPro-XchA-ParamSet",
                "X-B": "id-GostR3410-94-CryptoPro-XchB-ParamSet",
                "X-C": "id-GostR3410-94-CryptoPro-XchC-ParamSet"
            }, namedCurve: {
                "S-256-TEST": "id-GostR3410-2001-CryptoPro-TestParamSet",
                "S-256-A": "id-GostR3410-2001-CryptoPro-A-ParamSet",
                "S-256-B": "id-GostR3410-2001-CryptoPro-B-ParamSet",
                "S-256-C": "id-GostR3410-2001-CryptoPro-C-ParamSet",
                "X-256-A": "id-GostR3410-2001-CryptoPro-XchA-ParamSet",
                "X-256-B": "id-GostR3410-2001-CryptoPro-XchB-ParamSet",
                "P-256": "secp256r1",
                "T-256-TEST": "id-tc26-gost-3410-12-256-paramSetTest",
                "T-256-A": "id-tc26-gost-3410-12-256-paramSetA",
                "T-256-B": "id-tc26-gost-3410-12-256-paramSetB",
                "T-512-TEST": "id-tc26-gost-3410-12-512-paramSetTest",
                "T-512-A": "id-tc26-gost-3410-12-512-paramSetA",
                "T-512-B": "id-tc26-gost-3410-12-512-paramSetB"
            }
        }, providers: g
    };
    e.security = new h
});
/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (A, t) {
    "function" === typeof define && define.amd ? define(["gostCrypto"], t) : "object" === typeof exports ? module.exports = t(require("gostCrypto")) : A.GostCoding = t(A.gostCrypto)
})(this, function (A) {
    function t(e) {
        if (e instanceof y) return e;
        if (e && e.buffer && e.buffer instanceof y) return 0 === e.byteOffset && e.byteLength === e.buffer.byteLength ? e.buffer : (new Uint8Array(new Uint8Array(e, e.byteOffset, e.byteLength))).buffer;
        throw new u("CryptoOperationData required");
    }

    function s() {
    }

    var u = this.DataError || this.Error,
        y = this.ArrayBuffer, B = this.Date, C = {
            decode: function (e) {
                e = e.replace(/[^A-Za-z0-9\+\/]/g, "");
                for (var l = e.length, c = 3 * l + 1 >> 2, p = new Uint8Array(c), d, a = 0, r = 0, g = 0; g < l; g++) {
                    d = g & 3;
                    var h = e.charCodeAt(g),
                        h = 64 < h && 91 > h ? h - 65 : 96 < h && 123 > h ? h - 71 : 47 < h && 58 > h ? h + 4 : 43 === h ? 62 : 47 === h ? 63 : 0,
                        a = a | h << 18 - 6 * d;
                    if (3 === d || 1 === l - g) {
                        for (d = 0; 3 > d && r < c; d++, r++) p[r] = a >>> (16 >>> d & 24) & 255;
                        a = 0
                    }
                }
                return p.buffer
            }, encode: function (e) {
                e = new Uint8Array(t(e));
                for (var l = 2, c = "", p = e.length, d = 0, a = 0; a < p; a++) if (l = a % 3, 0 < a && 0 === 4 * a / 3 % 96 && (c += "\r\n"), d |= e[a] <<
                    (16 >>> l & 24), 2 === l || 1 === p - a) {
                    for (var r = 18; 0 <= r; r -= 6) var g = d >>> r & 63, g = 26 > g ? g + 65 : 52 > g ? g + 71 : 62 > g ? g - 4 : 62 === g ? 43 : 63 === g ? 47 : 65, c = c + String.fromCharCode(g);
                    d = 0
                }
                return c.substr(0, c.length - 2 + l) + (2 === l ? "" : 1 === l ? "=" : "==")
            }
        };
    s.prototype.Base64 = C;
    var w = function () {
        var e = {
            1026: 128,
            1027: 129,
            8218: 130,
            1107: 131,
            8222: 132,
            8230: 133,
            8224: 134,
            8225: 135,
            8364: 136,
            8240: 137,
            1033: 138,
            8249: 139,
            1034: 140,
            1036: 141,
            1035: 142,
            1039: 143,
            1106: 144,
            8216: 145,
            8217: 146,
            8220: 147,
            8221: 148,
            8226: 149,
            8211: 150,
            8212: 151,
            8482: 153,
            1113: 154,
            8250: 155,
            1114: 156,
            1116: 157,
            1115: 158,
            1119: 159,
            160: 160,
            1038: 161,
            1118: 162,
            1032: 163,
            164: 164,
            1168: 165,
            166: 166,
            167: 167,
            1025: 168,
            169: 169,
            1028: 170,
            171: 171,
            172: 172,
            173: 173,
            174: 174,
            1031: 175,
            176: 176,
            177: 177,
            1030: 178,
            1110: 179,
            1169: 180,
            181: 181,
            182: 182,
            183: 183,
            1105: 184,
            8470: 185,
            1108: 186,
            187: 187,
            1112: 188,
            1029: 189,
            1109: 190,
            1111: 191
        }, l = {}, c;
        for (c in e) l[e[c]] = c;
        return {
            decode: function (c, d) {
                d = (d || "win1251").toLowerCase().replace("-", "");
                for (var a = [], r = 0, g = c.length; r < g; r++) {
                    var h = c.charCodeAt(r);
                    if ("utf8" === d) 128 > h ? a.push(h) : (2048 > h ?
                        a.push(192 + (h >>> 6)) : (65536 > h ? a.push(224 + (h >>> 12)) : (2097152 > h ? a.push(240 + (h >>> 18)) : (67108864 > h ? a.push(248 + (h >>> 24)) : (a.push(252 + (h >>> 30)), a.push(128 + (h >>> 24 & 63))), a.push(128 + (h >>> 18 & 63))), a.push(128 + (h >>> 12 & 63))), a.push(128 + (h >>> 6 & 63))), a.push(128 + (h & 63))); else if ("unicode" === d || "ucs2" === d || "utf16" === d) if (55296 > h || 57344 <= h && 65536 >= h) a.push(h >>> 8), a.push(h & 255); else {
                        if (65536 <= h && 1114112 > h) {
                            var h = h - 65536, b = ((1047552 & h) >> 10) + 55296, h = (1023 & h) + 56320;
                            a.push(b >>> 8);
                            a.push(b & 255);
                            a.push(h >>> 8);
                            a.push(h & 255)
                        }
                    } else "utf32" ===
                    d || "ucs4" === d ? (a.push(h >>> 24 & 255), a.push(h >>> 16 & 255), a.push(h >>> 8 & 255), a.push(h & 255)) : "win1251" === d ? (128 <= h && (h = 1040 <= h && 1104 > h ? h - 848 : e[h] || 0), a.push(h)) : a.push(h & 255)
                }
                return (new Uint8Array(a)).buffer
            }, encode: function (e, d) {
                d = (d || "win1251").toLowerCase().replace("-", "");
                for (var a = [], c = new Uint8Array(t(e)), g = 0, h = c.length; g < h; g++) {
                    var b = c[g];
                    if ("utf8" === d) b = 252 <= b && 254 > b && g + 5 < h ? 1073741824 * (b - 252) + (c[++g] - 128 << 24) + (c[++g] - 128 << 18) + (c[++g] - 128 << 12) + (c[++g] - 128 << 6) + c[++g] - 128 : b >> 248 && 252 > b && g + 4 < h ? (b - 248 <<
                        24) + (c[++g] - 128 << 18) + (c[++g] - 128 << 12) + (c[++g] - 128 << 6) + c[++g] - 128 : b >> 240 && 248 > b && g + 3 < h ? (b - 240 << 18) + (c[++g] - 128 << 12) + (c[++g] - 128 << 6) + c[++g] - 128 : 224 <= b && 240 > b && g + 2 < h ? (b - 224 << 12) + (c[++g] - 128 << 6) + c[++g] - 128 : 192 <= b && 224 > b && g + 1 < h ? (b - 192 << 6) + c[++g] - 128 : b; else if ("unicode" === d || "ucs2" === d || "utf16" === d) {
                        if (b = (b << 8) + c[++g], 55296 <= b && 57344 > b) var n = b - 55296 << 10, b = c[++g],
                            b = (b << 8) + c[++g], b = n + (b - 56320) + 65536
                    } else "utf32" === d || "ucs4" === d ? (b = (b << 8) + c[++g], b = (b << 8) + c[++g], b = (b << 8) + c[++g]) : "win1251" === d && 128 <= b && (b = 192 <=
                    b && 256 > b ? b + 848 : l[b] || 0);
                    a.push(String.fromCharCode(b))
                }
                return a.join("")
            }
        }
    }();
    s.prototype.Chars = w;
    var F = {
        decode: function (e, l) {
            e = e.replace(/[^A-fa-f0-9]/g, "");
            var c = Math.ceil(e.length / 2), p = new Uint8Array(c);
            e = (0 < e.length % 2 ? "0" : "") + e;
            if (l && ("string" !== typeof l || 0 > l.toLowerCase().indexOf("little"))) for (var d = 0; d < c; d++) p[d] = parseInt(e.substr(2 * (c - d - 1), 2), 16); else for (d = 0; d < c; d++) p[d] = parseInt(e.substr(2 * d, 2), 16);
            return p.buffer
        }, encode: function (e, l) {
            var c = [], p = new Uint8Array(t(e)), d = p.length;
            if (l && ("string" !==
                typeof l || 0 > l.toLowerCase().indexOf("little"))) for (var a = 0; a < d; a++) {
                var r = d - a - 1;
                c[r] = (0 < r && 0 === r % 32 ? "\r\n" : "") + ("00" + p[a].toString(16)).slice(-2)
            } else for (a = 0; a < d; a++) c[a] = (0 < a && 0 === a % 32 ? "\r\n" : "") + ("00" + p[a].toString(16)).slice(-2);
            return c.join("")
        }
    };
    s.prototype.Hex = F;
    var D = {
        decode: function (e) {
            e = (e || "").replace(/[^\-A-fa-f0-9]/g, "");
            0 === e.length && (e = "0");
            var l = !1;
            "-" === e.charAt(0) && (l = !0, e = e.substring(1));
            for (; "0" === e.charAt(0) && 1 < e.length;) e = e.substring(1);
            e = (0 < e.length % 2 ? "0" : "") + e;
            if (!l && !/^[0-7]/.test(e) ||
                l && !/^[0-7]|8[0]+$/.test(e)) e = "00" + e;
            for (var c = e.length / 2, p = new Uint8Array(c), d = 0, c = c - 1; 0 <= c; --c) {
                var a = parseInt(e.substr(2 * c, 2), 16);
                l && 0 < a + d && (a = 256 - a - d, d = 1);
                p[c] = a
            }
            return p.buffer
        }, encode: function (e) {
            e = new Uint8Array(t(e));
            if (0 === e.length) return "0x00";
            for (var l = [], c = 127 < e[0], p = 0, d = e.length - 1; 0 <= d; --d) {
                var a = e[d];
                c && 0 < a + p && (a = 256 - a - p, p = 1);
                l[d] = ("00" + a.toString(16)).slice(-2)
            }
            for (l = l.join(""); "0" === l.charAt(0);) l = l.substring(1);
            return (c ? "-" : "") + "0x" + l
        }
    };
    s.prototype.Int16 = D;
    var E = function () {
        function e(c,
                   p, d) {
            var a = c.object;
            void 0 === a && (a = c);
            var l = c.tagClass = c.tagClass || 0;
            if (0 === l) {
                var g = c.tagNumber;
                if ("undefined" === typeof g) if ("string" === typeof a) g = "" === a ? 5 : /^\-?0x[0-9a-fA-F]+$/.test(a) ? 2 : /^(\d+\.)+\d+$/.test(a) ? 6 : /^[01]+$/.test(a) ? 3 : /^(true|false)$/.test(a) ? 1 : /^[0-9a-fA-F]+$/.test(a) ? 4 : 19; else if ("number" === typeof a) g = 2; else if ("boolean" === typeof a) g = 1; else if (a instanceof Array) g = 16; else if (a instanceof B) g = 24; else if (a instanceof y || a && a.buffer instanceof y) g = 4; else throw new u("Unrecognized type for " +
                    a);
            }
            var h = c.tagConstructed;
            "undefined" === typeof h && (h = c.tagConstructed = a instanceof Array);
            var b;
            if (a instanceof y || a && a.buffer instanceof y) b = new Uint8Array(t(a)), 3 === g && (a = new Uint8Array(t(b)), b = new Uint8Array(a.length + 1), b[0] = 0, b.set(a, 1)); else if (h) if (a instanceof Array) {
                for (var n = 0, k = [], q = 0, m = 0, f = a.length; m < f; m++) k[m] = e(a[m], p), n += k[m].length;
                17 === g && k.sort(function (a, b) {
                    for (var c = 0, d = Math.min(a.length, b.length); c < d; c++) {
                        var e = a[c] - b[c];
                        if (0 !== e) return e
                    }
                    return a.length - b.length
                });
                "CER" === p &&
                (k[f] = new Uint8Array(2), n += 2);
                b = new Uint8Array(n);
                m = 0;
                for (f = k.length; m < f; m++) b.set(k[m], q), q += k[m].length
            } else throw new u("Constracted block can't be primitive"); else switch (g) {
                case 1:
                    b = new Uint8Array(1);
                    b[0] = a ? 255 : 0;
                    break;
                case 2:
                case 10:
                    b = D.decode("number" === typeof a ? a.toString(16) : a);
                    break;
                case 3:
                    if ("string" === typeof a) for (m = 7 - (a.length + 7) % 8, f = Math.ceil(a.length / 8), b = new Uint8Array(f + 1), b[0] = m, m = 0; m < f; m++) {
                        for (n = k = 0; 8 > n; n++) var z = 8 * m + n, k = (k << 1) + (z < a.length ? "1" === a.charAt(z) ? 1 : 0 : 0);
                        b[m + 1] = k
                    }
                    break;
                case 4:
                    b = F.decode("number" === typeof a ? a.toString(16) : a);
                    break;
                case 6:
                    a = a.match(/\d+/g);
                    b = [];
                    for (m = 1; m < a.length; m++) {
                        f = +a[m];
                        k = [];
                        1 === m && (f += 40 * a[0]);
                        do k.push(f & 127), f >>>= 7; while (f);
                        for (n = k.length - 1; 0 <= n; --n) b.push(k[n] + (0 === n ? 0 : 128))
                    }
                    b = new Uint8Array(b);
                    break;
                case 12:
                    b = w.decode(a, "utf8");
                    break;
                case 18:
                case 22:
                case 19:
                case 20:
                case 21:
                case 25:
                case 26:
                case 27:
                    m = 0;
                    for (f = a.length; m < f; m++) 255 < a.charCodeAt(m) && (g = 12);
                    b = 12 === g ? w.decode(a, "utf8") : w.decode(a, "ascii");
                    break;
                case 23:
                case 24:
                    b = a.original;
                    if (!b) {
                        b =
                            new B(a);
                        b.setMinutes(b.getMinutes() + b.getTimezoneOffset());
                        for (f = 24 === g ? b.getMilliseconds().toString() : ""; 0 < f.length && "0" === f.charAt(f.length - 1);) f = f.substring(0, f.length - 1);
                        0 < f.length && (f = "." + f);
                        b = (23 === g ? b.getYear().toString().slice(-2) : b.getFullYear().toString()) + ("00" + (b.getMonth() + 1)).slice(-2) + ("00" + b.getDate()).slice(-2) + ("00" + b.getHours()).slice(-2) + ("00" + b.getMinutes()).slice(-2) + ("00" + b.getSeconds()).slice(-2) + f + "Z"
                    }
                    b = w.decode(b, "ascii");
                    break;
                case 28:
                    b = w.decode(a, "utf32");
                    break;
                case 30:
                    b =
                        w.decode(a, "utf16")
            }
            b || (b = new Uint8Array(0));
            b instanceof y && (b = new Uint8Array(b));
            if (!h && "CER" === p) switch (g) {
                case 3:
                    z = 1;
                case 4:
                case 12:
                case 18:
                case 19:
                case 20:
                case 21:
                case 22:
                case 25:
                case 26:
                case 27:
                case 28:
                case 30:
                    z = z || 0;
                    n = 0;
                    k = [];
                    q = 0;
                    m = z;
                    for (f = b.length; m < f; m += 1E3 - z) k[m] = e({
                        object: new Unit8Array(b.buffer, m, Math.min(1E3 - z, f - m)),
                        tagNumber: g,
                        tagClass: 0,
                        tagConstructed: !1
                    }, p), n += k[m].length;
                    k[f] = new Uint8Array(2);
                    b = new Uint8Array(n + 2);
                    m = 0;
                    for (f = k.length; m < f; m++) b.set(k[m], q), q += k[m].length
            }
            c.tagNumber =
                0 === l ? g : g = c.tagNumber || 0;
            c.content = b;
            if (d) return b;
            d = [];
            l = 3 === l ? 192 : 2 === l ? 128 : 1 === l ? 64 : 0;
            h && (l |= 32);
            if (31 > g) d.push(l | g & 31); else {
                l |= 31;
                d.push(l);
                f = g;
                g = [];
                do g.push(f & 127), f >>>= 7; while (f);
                for (n = g.length - 1; 0 <= n; --n) d.push(g[n] + (0 === n ? 0 : 128))
            }
            if (h && "CER" === p) d.push(128); else if (p = b.length, 127 < p) {
                h = p;
                p = [];
                do p.push(h & 255), h >>>= 8; while (h);
                d.push(p.length + 128);
                for (n = p.length - 1; 0 <= n; --n) d.push(p[n])
            } else d.push(p);
            c = c.header = new Uint8Array(d);
            p = new Uint8Array(c.length + b.length);
            p.set(c, 0);
            p.set(b, c.length);
            return p
        }

        function l(c, e) {
            var d = e || 0, a = d, r, g, h, b, n, k, q;
            if (c.object) r = c.tagNumber, g = c.tagClass, h = c.tagConstructed, d = c.content, b = c.header, n = c.object instanceof y ? new Uint8Array(c.object) : null, k = c.object instanceof Array ? c.object : null, q = n && n.length || null; else {
                b = c[d++];
                r = b & 31;
                g = b >> 6;
                h = 0 !== (b & 32);
                if (31 === r) {
                    r = 0;
                    do {
                        if (9007199254740864 < r) throw new u("Convertor not supported tag number more then (2^53 - 1) at position " + e);
                        b = c[d++];
                        r = (r << 7) + (b & 127)
                    } while (b & 128)
                }
                b = c[d++];
                q = b & 127;
                if (q !== b) {
                    if (6 < q) throw new u("Length over 48 bits not supported at position " +
                        e);
                    if (0 === q) q = null; else {
                        for (var m = b = 0; m < q; ++m) b = (b << 8) + c[d++];
                        q = b
                    }
                }
                a = d;
                k = null;
                if (h) if (k = [], null !== q) {
                    for (b = a + q; d < b;) {
                        var f = l(c, d);
                        k.push(f);
                        d += f.header.length + f.content.length
                    }
                    if (d !== b) throw new u("Content size is not correct for container starting at offset " + a);
                } else try {
                    for (; ;) {
                        f = l(c, d);
                        d += f.header.length + f.content.length;
                        if (0 === f.tagClass && 0 === f.tagNumber) break;
                        k.push(f)
                    }
                    q = d - a
                } catch (t) {
                    throw new u("Exception " + t + " while decoding undefined length content at offset " + a);
                }
                b = new Uint8Array(c.buffer,
                    e, a - e);
                n = d = new Uint8Array(c.buffer, a, q)
            }
            if (null !== k && 0 === g) {
                var v;
                switch (r) {
                    case 3:
                        v = 1;
                    case 4:
                    case 12:
                    case 18:
                    case 19:
                    case 20:
                    case 21:
                    case 22:
                    case 25:
                    case 26:
                    case 27:
                    case 28:
                    case 30:
                        v = v || 0;
                        if (0 === k.length) throw new u("No constructed encoding content of string type at offset " + a);
                        q = v;
                        for (var m = 0, x = k.length; m < x; m++) {
                            f = k[m];
                            if (f.tagClass !== g || f.tagNumber !== r || f.tagConstructed) throw new u("Invalid constructed encoding of string type at offset " + a);
                            q += f.content.length - v
                        }
                        n = new Uint8Array(q);
                        for (var m = 0,
                                 x = k.length, s = v; m < x; m++) f = k[m], 0 < v ? n.set(f.content.subarray(1), s) : n.set(f.content, s), s += f.content.length - v;
                        h = !1;
                        k = null
                }
            }
            f = "";
            if (null === k) {
                if (null === q) throw new u("Invalid tag with undefined length at offset " + a);
                if (0 === g) switch (r) {
                    case 1:
                        f = 0 !== n[0];
                        break;
                    case 2:
                    case 10:
                        if (6 < q) f = D.encode(n); else {
                            k = n[0];
                            127 < n[0] && (k -= 256);
                            for (m = 1; m < q; m++) k = 256 * k + n[m];
                            f = k
                        }
                        break;
                    case 3:
                        if (5 < q) f = (new Uint8Array(n.subarray(1))).buffer; else {
                            a = n[0];
                            f = [];
                            for (m = q - 1; 1 <= m; --m) {
                                q = n[m];
                                for (s = a; 8 > s; ++s) f.push(q >> s & 1 ? "1" : "0");
                                a = 0
                            }
                            f =
                                f.reverse().join("")
                        }
                        break;
                    case 4:
                        f = (new Uint8Array(n)).buffer;
                        break;
                    case 6:
                        f = "";
                        for (m = v = x = 0; m < q; ++m) k = n[m], x = (x << 7) + (k & 127), v += 7, k & 128 || ("" === f ? (k = 80 > x ? 40 > x ? 0 : 1 : 2, f = k + "." + (x - 40 * k)) : f += "." + x.toString(), v = x = 0);
                        if (0 < v) throw new u("Incompleted OID at offset " + a);
                        break;
                    case 16:
                    case 17:
                        f = [];
                        break;
                    case 12:
                        f = w.encode(n, "utf8");
                        break;
                    case 18:
                    case 19:
                    case 20:
                    case 21:
                    case 22:
                    case 25:
                    case 26:
                    case 27:
                        f = w.encode(n, "ascii");
                        break;
                    case 28:
                        f = w.encode(n, "utf32");
                        break;
                    case 30:
                        f = w.encode(n, "utf16");
                        break;
                    case 23:
                    case 24:
                        q =
                            23 === r;
                        f = w.encode(n, "ascii");
                        k = (q ? /^(\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/ : /^(\d\d\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/).exec(f);
                        if (!k) throw new u('Unrecognized time format "' + f + '" at offset ' + a);
                        q && (k[1] = +k[1], k[1] += 50 > k[1] ? 2E3 : 1900);
                        q = new B(k[1], +k[2] - 1, +k[3], +(k[4] || 0), +(k[5] || 0), +(k[6] || 0), +(k[7] ||
                            0));
                        a = q.getTimezoneOffset();
                        if (k[8] || 23 === r) "Z" !== k[8].toUpperCase() && k[9] && (a += parseInt(k[9])), q.setMinutes(q.getMinutes() - a);
                        q.original = f;
                        f = q
                } else f = (new Uint8Array(n)).buffer
            } else f = k;
            return {tagConstructed: h, tagClass: g, tagNumber: r, header: b, content: d, object: f}
        }

        return {
            encode: function (c, l, d) {
                return e(c, l, d).buffer
            }, decode: function (c) {
                return l(c.object ? c : new Uint8Array(t(c)), 0)
            }
        }
    }();
    s.prototype.BER = E;
    s.prototype.PEM = {
        encode: function (e, l) {
            return (l ? "-----BEGIN " + l.toUpperCase() + "-----\r\n" : "") + C.encode(e instanceof
            y ? e : E.encode(e)) + (l ? "\r\n-----END " + l.toUpperCase() + "-----" : "")
        }, decode: function (e, l, c, p) {
            var d = /([A-Za-z0-9\+\/\s\=]+)/g.exec(e);
            d[1].length !== e.length && (d = !1);
            !d && l && (d = (new RegExp("-----\\s?BEGIN " + l.toUpperCase() + "-----([A-Za-z0-9\\+\\/\\s\\=]+)-----\\s?END " + l.toUpperCase() + "-----", "g")).exec(e));
            d || (d = /-----\s?BEGIN [A-Z0-9\s]+-----([A-Za-z0-9\+\/\s\=]+)-----\s?END [A-Z0-9\s]+-----/g.exec(e));
            e = d && d[1 + (p || 0)];
            if (!e) throw new u("Not valid PEM format");
            e = C.decode(e);
            c && (e = E.decode(e));
            return e
        }
    };
    A && (A.coding = new s);
    return s
});
/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (x, w) {
    "function" === typeof define && define.amd ? define(["gostCrypto", "gostCoding", "gostSecurity"], w) : "object" === typeof exports ? module.exports = w(require("gostCrypto"), require("gostCoding"), require("gostSecurity")) : x.GostASN1 = w(x.gostCrypto, x.GostCoding, x.GostSecurity)
})(this, function (x) {
    function w() {
        for (var a = {}, c = 0, b = arguments.length; c < b; c++) {
            var d = arguments[c];
            if ("object" === typeof d) for (var e in d) a[e] = d[e]
        }
        return a
    }

    function wa(a) {
        a instanceof O && (a = new Uint8Array(a));
        for (var c = new Uint8Array(a.length),
                 b = 0, d = a.length; b < d; b++) c[d - b - 1] = a[b];
        return c.buffer
    }

    function X(a) {
        return a instanceof O || a.buffer instanceof O
    }

    function kc(a, c) {
        return a.length >= c ? a : Array(c - a.length + 1).join("0") + a
    }

    function Ja(a) {
        return 2 >= a ? a : 4 >= a ? 4 : 8 >= a ? 8 : 16 >= a ? 16 : 32 >= a ? 32 : 64 >= a ? 64 : 128 >= a ? 128 : 256 >= a ? 256 : 512 > a ? 512 : 1024 > a ? 1024 : void 0
    }

    function P(a) {
        if (a) throw Error("Invalid format");
    }

    function ha(a, c, b, d) {
        "object" !== typeof b && (b = {value: b});
        void 0 !== d && (b.enumerable = d);
        Object.defineProperty(a, c, b)
    }

    function Ka(a, c, b) {
        for (var d in c) ha(a,
            d, c[d], b)
    }

    function T(a, c, b, d, e, f) {
        P(void 0 === c);
        c = {tagNumber: b, tagClass: d || 0, tagConstructed: e || !1, object: c};
        a = a || "DER";
        if ("DER" === a || "CER" === a) c = ia.encode(c, a);
        "PEM" === a && (c = xa.encode(c, f));
        return c
    }

    function Y(a, c, b, d, e) {
        P(void 0 === a);
        "string" === typeof a && (a = xa.decode(a, e, !1));
        if (a instanceof O) try {
            a = xa.decode(lc.encode(a), e, !0)
        } catch (f) {
            a = ia.decode(a)
        }
        b = b || 0;
        d = d || !1;
        void 0 === a.tagNumber && (a = T(!0, a.object, c, b, a.object instanceof Array), a = ia.decode(a));
        P(a.tagClass !== b || a.tagNumber !== c || a.tagConstructed !==
            d);
        return 0 === b && 5 === c ? null : a.object
    }

    function t(a, c, b, d) {
        "function" !== typeof c && (d = b, b = c, c = function () {
            a.apply(this, arguments)
        });
        c.prototype = Object.create(a.prototype, {constructor: {value: c}, superclass: {value: a.prototype}});
        b && Ka(c.prototype, b);
        if (a !== Object) for (var e in a) c[e] = a[e];
        c.super = a;
        d && Ka(c, d, !0);
        return c
    }

    function La() {
    }

    var O = this.ArrayBuffer, I = x.security.algorithms, hb = x.security.names, ib = x.security.identifiers,
        ba = x.security.attributes, ca = x.security.parameters, ia = x.coding.BER, xa = x.coding.PEM,
        lc = x.coding.Chars, jb = x.coding.Hex, kb = x.coding.Int16, U = {
            encode: function (a, c) {
                return "0x" + jb.encode(a, c)
            }, decode: function (a, c, b) {
                "number" === typeof a && (a = a.toString(16));
                a = a.replace("0x", "");
                b = b || Ja(a.length);
                return jb.decode(kc(a, b), c)
            }
        }, k = t(Object, function (a) {
            this.object = a
        }, {
            _set: function (a, c, b) {
                a.property(c).set.call(this, b)
            }, _get: function (a, c) {
                return a.property(c).get.call(this)
            }, _call: function (a, c, b) {
                return a.method(c).apply(this, b)
            }, hasProperty: function (a) {
                return this.hasOwnProperty(a) || !!this.constructor.property(a)
            },
            encode: function () {
                return this.object
            }
        }, {
            decode: function (a) {
                return new this(a)
            }, property: function (a) {
                for (var c = this.prototype; c;) {
                    var b = Object.getOwnPropertyDescriptor(c, a);
                    if (b) return b;
                    c = c.superclass
                }
            }, method: function (a) {
                for (var c = this.prototype; c;) {
                    if (c[a]) return c[a];
                    c = c.superclass
                }
            }
        }), y = function (a) {
            return t(k, {
                encode: function (c) {
                    return T(c, this.object, a)
                }
            }, {
                decode: function (c) {
                    return new this(Y(c, a))
                }
            })
        }, da = y(1), ea = y(22), ya = y(18), za = y(19), mc = y(20), z = y(12), nc = y(23), A = y(24), oc = y(28),
        Ma = y(30), pa =
            t(y(5), {
                object: {
                    get: function () {
                        return null
                    }, set: function (a) {
                        P(null !== a)
                    }
                }
            }), lb = function (a) {
            function c(c) {
                return t(y(a), function (a) {
                    b.super.call(this, a)
                }, {
                    encode: function (b) {
                        return T(b, c[this.object], a)
                    }
                }, {
                    decode: function (b) {
                        b = Y(b, a);
                        for (var d in c) if (b === c[d]) return new this(d);
                        P(!0)
                    }
                })
            }

            var b = t(y(a), function (a) {
                if (this instanceof b) b.super.apply(this, arguments); else return c(a)
            });
            return b
        }, h = lb(2), mb = lb(10), g = function () {
            function a(a) {
                return a ? t(a, {
                    encode: function (c) {
                        return T(c, a.method("encode").call(this,
                            !0), 4)
                    }
                }, {
                    decode: function (c) {
                        return a.decode.call(this, Y(c, 4))
                    }
                }) : c
            }

            var c = t(y(4), function (b) {
                if (this instanceof c) c.super.apply(this, arguments); else return a(b)
            });
            return c
        }(), q = function () {
            function a(a) {
                return a ? t(a, {
                    encode: function (c) {
                        return T(c, a.method("encode").call(this, !0), 3)
                    }
                }, {
                    decode: function (c) {
                        return a.decode.call(this, Y(c, 3))
                    }
                }) : b
            }

            function c(a) {
                return t(k, function (a, c) {
                    k.call(this, a);
                    this.numbits = c || 0
                }, {
                    encode: function (c) {
                        var b = this.object, d = [];
                        if (b instanceof Array) {
                            for (var e = 0, f = b.length; e <
                            f; e++) {
                                var S = a[b[e]];
                                void 0 !== S && (d[S] = "1")
                            }
                            e = 0;
                            for (f = Math.max(d.length, this.numbits); e < f; e++) d[e] || (d[e] = "0");
                            d = d.join("")
                        } else d = "0";
                        return T(c, d, 3)
                    }
                }, {
                    decode: function (c) {
                        c = Y(c, 3);
                        var b = [], d;
                        for (d in a) "1" === c.charAt(a[d]) && b.push(d);
                        return new this(b, c.length)
                    }
                })
            }

            var b = t(y(3), function (d) {
                if (this instanceof b) b.super.apply(this, arguments); else return "object" === typeof d ? c(d) : a(d)
            });
            return b
        }(), F = function (a) {
            a.combine = function (c, b) {
                for (var d in a.prototype) a.prototype.hasOwnProperty(d) && !c.hasProperty(d) &&
                ha(c, d, function (a) {
                    return {
                        get: function () {
                            return this[b] && this[b][a]
                        }, set: function (c) {
                            this[b] || (this[b] = {});
                            this[b][a] = c
                        }, configurable: !1, enumerable: !0
                    }
                }(d))
            };
            return a
        }, e = function (a, c) {
            var b = t(k, function (a, c) {
                ha(this, "items", {writable: !0, value: {}});
                "string" === typeof a || a instanceof O ? this.decode(a) : void 0 !== a && (this.object = a, c && this.check())
            }, {
                object: {
                    get: function () {
                        return this
                    }, set: function (c) {
                        if (c instanceof b) {
                            this.items = c.items;
                            for (var d in a) {
                                var e = this.getItemClass(d, this.items);
                                e.combine && e.combine(this,
                                    d)
                            }
                        } else {
                            var f = {};
                            for (d in a) {
                                var g = c[d], e = this.getItemClass(d, f);
                                void 0 !== g ? f[d] = new e(g) : e.combine && (f[d] = new e(c));
                                e.combine && e.combine(this, d)
                            }
                            this.items = f
                        }
                    }
                }, getItemClass: function (c, b) {
                    return a[c]
                }, encode: function (b) {
                    var d = [], e = this.items, f;
                    for (f in a) if (e[f]) {
                        var S = e[f].encode(!0);
                        void 0 !== S && d.push(S)
                    }
                    return T(b, d, 16, 0, !0, c)
                }, decode: function (a) {
                    this.object = this.constructor.decode(a)
                }, check: function () {
                    this.constructor.decode(this.encode(!0))
                }
            }, {
                encode: function (a, c) {
                    return (new this(a)).encode(c)
                },
                decode: function (b) {
                    b = Y(b, 16, 0, !0, c);
                    var d = 0, e = new this, f = e.items = {}, S;
                    for (S in a) {
                        var g = e.getItemClass(S, f), h = g.decode(b[d]);
                        void 0 !== h && (f[S] = h, g.combine && g.combine(e, S), d++)
                    }
                    return e
                }
            }), d;
            for (d in a) ha(b.prototype, d, function (c) {
                return {
                    get: function () {
                        return this.items[c] && this.items[c].object
                    }, set: function (a) {
                        if (void 0 !== a) {
                            var b = this.getItemClass(c, this.items);
                            this.items[c] = new b(a)
                        } else delete this.items[c]
                    }, configurable: !1, enumerable: !a[c].combine
                }
            }(d)), a[d].combine && a[d].combine(b.prototype,
                d);
            return b
        }, J = function (a, c, b, d, f) {
            var g = e(a, f), h = function (e, f) {
                c = c || "type";
                b = b || "value";
                f = f || d || k;
                var Z = t(g, function (a) {
                    if (this instanceof Z) g.apply(this, arguments); else return h.apply(this, arguments)
                }, {
                    getItemClass: function (d, g) {
                        var h = a[d];
                        if (b === d) {
                            var Z, aa = g && g[c];
                            aa && (aa = aa.object, e && (Z = "function" === typeof e ? e(aa) : e[aa]));
                            Z = Z || f || k;
                            h = h === k ? Z : h(Z)
                        }
                        return h
                    }
                });
                ha(Z.prototype, c, {
                    get: function () {
                        return this.items[c] && this.items[c].object
                    }, set: function () {
                        P(!0)
                    }, configurable: !1, enumerable: !0
                });
                return Z
            };
            return h()
        }, l = t(k, {
            encode: function (a) {
                var c = this.object, c = /^(\d+\.)+\d+$/.test(c) ? c : ib[c];
                P(!c);
                return T(a, c, 6)
            }
        }, {
            decode: function (a) {
                a = Y(a, 6);
                return new this(hb[a] || a)
            }
        }), f = function (a) {
            a = a || k;
            return t(a, {
                encode: function (c) {
                    c = a.method("encode").call(this, c);
                    return "string" === typeof c || c instanceof O ? c : 4 === c.tagNumber || 0 !== c.tagClass || c.object instanceof Array ? {object: c.object} : {object: ia.encode(c, "DER", !0)}
                }
            }, {
                decode: function (c) {
                    "string" === typeof c || c instanceof O || (c = {
                        object: c.object, header: c.header,
                        content: c.content
                    });
                    return a.decode.call(this, c)
                }
            })
        }, p = function (a) {
            a = a || k;
            return t(a, {
                encode: function (c) {
                    c = a.method("encode").call(this, c);
                    return "string" === typeof c || c instanceof O ? c : {object: [c]}
                }
            }, {
                decode: function (c) {
                    return "string" === typeof c || c instanceof O ? a.decode.call(this, c) : a.decode.call(this, c.object[0])
                }
            })
        }, b = function (a, c) {
            return t(c, function () {
                c.apply(this, arguments)
            }, {
                encode: function (b) {
                    b = c.method("encode").call(this, b);
                    if ("string" === typeof b || b instanceof O) return b;
                    b.tagNumber = a;
                    b.tagClass =
                        2;
                    b.tagConstructed = b.object instanceof Array;
                    return b
                }
            }, {
                decode: function (b) {
                    P(void 0 !== b.tagNumber && (2 !== b.tagClass || b.tagNumber !== a));
                    return c.decode.call(this, b)
                }
            })
        }, nb = function (a) {
            return function (c, b) {
                c = c || k;
                var d = function (e, f) {
                    var g = "function" === typeof c && void 0 !== e ? c(e, f) : c;
                    if (b) {
                        var h = t(k, function (a) {
                                if (this instanceof h) ha(this, "items", {
                                    writable: !0,
                                    value: {}
                                }), k.call(this, a || {}); else return d.apply(this, arguments)
                            }, {
                                object: {
                                    get: function () {
                                        this.read();
                                        return this
                                    }, set: function (a) {
                                        if (a instanceof
                                            h) a.read(), this.items = a.items; else {
                                            var c = {}, b;
                                            for (b in a) c[b] = this.createItem(a[b], b);
                                            this.items = c
                                        }
                                        this.reset()
                                    }
                                }, createItem: function (a, c) {
                                    if (b) {
                                        var d = {};
                                        d[b.typeName] = c;
                                        d[b.valueName] = a
                                    } else d = a;
                                    return new g(d)
                                }, getItemValue: function (a) {
                                    a = this.items[a];
                                    return b ? a.object[b.valueName] : a.object
                                }, setItemValue: function (a, c) {
                                    var d = this.items[a];
                                    b ? d.object[b.valueName] = c : d.object = c
                                }, isItemType: function (a) {
                                    return b ? ib[a] : !isNaN(parseInt(a))
                                }, reset: function () {
                                    var a = this.items, c;
                                    for (c in this) this.hasOwnProperty(c) &&
                                    !this.items[c] && this.isItemType(c) && delete this[c];
                                    for (c in a) this[c] = this.getItemValue(c)
                                }, read: function () {
                                    var a = this.items, c;
                                    for (c in this) this.isItemType(c) && (this.items[c] ? this.getItemValue(c) !== this[c] && this.setItemValue(c, this[c]) : (a[c] = this.createItem(this[c], c), this[c] = this.getItemValue(c)))
                                }, encode: function (c) {
                                    this.read();
                                    var b = this.items, d = [], e;
                                    for (e in b) {
                                        var f = b[e].encode(!0);
                                        void 0 !== f && d.push(f)
                                    }
                                    return T(c, d, a, 0, !0)
                                }, decode: function (a) {
                                    this.object = this.constructor.decode(a)
                                }, check: function () {
                                    this.constructor.decode(this.encode(!0))
                                }
                            },
                            {
                                encode: function (a, c) {
                                    return (new this(a)).encode(c)
                                }, decode: function (c) {
                                    c = Y(c, a, 0, !0);
                                    for (var d = new this, e = d.items = {}, f = 0, h = c.length; f < h; f++) {
                                        var aa = g.decode(c[f]);
                                        e[b ? aa.object[b.typeName] : f] = aa
                                    }
                                    d.reset();
                                    return d
                                }
                            });
                        return h
                    }
                    var l = t(k, function (a) {
                        if (this instanceof l) Ka(this, {
                            items: {writable: !0, value: []},
                            values: {writable: !0, value: []}
                        }), k.call(this, a || []); else return d.apply(this, arguments)
                    }, {
                        object: {
                            get: function () {
                                this.read();
                                return this.values
                            }, set: function (a) {
                                if (a instanceof l) a.read(), this.items =
                                    a.items; else {
                                    for (var c = [], b = 0, d = a.length; b < d; b++) c[b] = new g(a[b]);
                                    this.items = c
                                }
                                this.reset()
                            }
                        }, encode: function (c) {
                            this.read();
                            for (var b = this.items, d = [], e = 0, f = b.length; e < f; e++) {
                                var g = b[e].encode(!0);
                                void 0 !== g && d.push(g)
                            }
                            return T(c, d, a, 0, !0)
                        }, decode: function (a) {
                            this.object = this.constructor.decode(a)
                        }, check: function () {
                            this.constructor.decode(this.encode(!0))
                        }, reset: function () {
                            for (var a = 0, c = this.items.length; a < c; a++) this.values.push(this.items[a].object)
                        }, read: function () {
                            for (var a = this.items, c = this.values,
                                     b = 0, d = c.length; b < d; b++) this.items[b] ? a[b].object !== c[b] && (a[b].object = c[b]) : (a[b] = new g(c[b]), c[b] = a[b].object)
                        }
                    }, {
                        encode: function (a, c) {
                            return (new this(a)).encode(c)
                        }, decode: function (c) {
                            c = Y(c, a, 0, !0);
                            var b = new this;
                            b.items = [];
                            for (var d = 0, e = c.length; d < e; d++) b.items.push(g.decode(c[d]));
                            b.reset();
                            return b
                        }
                    });
                    return l
                };
                return d()
            }
        }, m = nb(16), B = nb(17), Q = function (a, c) {
            if (c) {
                var b = t(k, {
                    object: {
                        get: function () {
                            if (this.item) return c.decode(this.item.object)
                        }, set: function (b) {
                            void 0 !== b ? this.item = new a(c.encode(b)) :
                                delete this.item
                        }
                    }, encode: function (a) {
                        return this.item.encode(a)
                    }
                }, {
                    decode: function (c) {
                        var b = new this;
                        b.item = a.decode(c);
                        return b
                    }
                }), d;
                for (d in a) b[d] || (b[d] = a[d]);
                return b
            }
            return a
        }, C = function (a) {
            return Q(B(a), {
                encode: function (a) {
                    return [a]
                }, decode: function (a) {
                    return a[0]
                }
            })
        }, r = function (a, c) {
            return t(k, {
                object: {
                    get: function () {
                        return this.item && this.item.object
                    }, set: function (b) {
                        if (b instanceof k) for (var d in a) if (b instanceof a[d]) {
                            this.item = b;
                            return
                        }
                        d = "function" === typeof c ? c(b) : c;
                        P(!d || !a[d]);
                        this.item =
                            b = new a[d](b)
                    }
                }, encode: function (a) {
                    return this.item.encode(a)
                }
            }, {
                decode: function (c) {
                    for (var b in a) try {
                        var d = a[b].decode(c);
                        if (void 0 !== d) return new this(d)
                    } catch (e) {
                    }
                    P(!0)
                }
            })
        }, K = function (a) {
            a = a || k;
            return t(a, {
                encode: function () {
                    return ia.encode(a.method("encode").call(this, !0))
                }
            }, {
                encode: function (a, b) {
                    return (new this(a)).encode(b)
                }, decode: function (c) {
                    return a.decode.call(this, ia.decode(c))
                }
            })
        }, V = function (a, c) {
            a = a || k;
            return t(a, {
                encode: function (b) {
                    return this.object === c ? void 0 : a.method("encode").call(this,
                        b)
                }
            }, {
                decode: function (b) {
                    if (void 0 === b) return new this(c);
                    try {
                        return a.decode.call(this, b)
                    } catch (d) {
                    }
                }
            })
        }, d = function (a) {
            a = a || k;
            return t(a, {}, {
                decode: function (c) {
                    if (void 0 !== c) try {
                        return a.decode.call(this, c)
                    } catch (b) {
                    }
                }
            })
        }, ja = r({
            teletexString: mc,
            printableString: za,
            universalString: oc,
            utf8String: z,
            bmpString: Ma,
            numericString: ya
        }, function (a) {
            return /^[A-Za-z0-9\.@\+\-\:\=\\\/\?\!\#\$\%\^\&\*\(\)\[\]\{\}\>\<\|\~]*$/.test(a) ? "printableString" : "utf8String"
        }), fa = r({utcTime: nc, generalTime: A}, function (a) {
            return 2050 <=
            a.getYear() ? "generalTime" : "utcTime"
        }), Na = J({type: l, value: k}), Oa = {typeName: "type", valueName: "value"}, ob = C(Na({
            serialName: za,
            countryName: za,
            dnQualifier: za,
            emailAddress: ea,
            domainComponent: ea,
            SNILS: ya,
            OGRN: ya,
            INN: ya
        }, ja)), pc = m(ob, Oa)(), W = r({rdnSequence: pc}, "rdnSequence"), pb = F(e({notBefore: fa, notAfter: fa})),
        qb = J({type: l, value: k}), G = B(qb, Oa), Pa = m(qb, Oa), qc = e({a: h, b: h, seed: d(q)}), rc = g(t(k, {
            encode: function () {
                var a = this.object, c = Math.max(Ja(a.x.length - 2), Ja(a.y.length - 2)) / 2,
                    b = new Uint8Array(2 * c + 1);
                b[0] = 4;
                b.set(new Uint8Array(U.decode(a.x, !1, c)), 1);
                b.set(new Uint8Array(U.decode(a.y, !1, c)), c + 1);
                return b.buffer
            }
        }, {
            decode: function (a) {
                var c = (a.byteLength - 1) / 2;
                return new this({x: U.encode(new Uint8Array(a, 1, c)), y: U.encode(new Uint8Array(a, c + 1, c))})
            }
        })), sc = e({fieldType: l, parameters: h}),
        tc = e({version: h, fieldID: sc, curve: qc, base: rc, order: h, cofactor: d(h)}),
        uc = e({publicKeyParamSet: l, digestParamSet: l, encryptionParamSet: d(l)}), vc = function (a, c) {
            a = a || k;
            return t(a, {
                encode: function (b) {
                    return this.object === c ? (new pa(null)).encode(b) :
                        a.method("encode").call(this, b)
                }
            }, {
                decode: function (b) {
                    if (void 0 !== b) {
                        if (null === b || 5 === b.tagNumber && 0 === b.tagClass) return new this(c);
                        try {
                            return a.decode.call(this, b)
                        } catch (d) {
                        }
                    }
                }
            })
        }(l, "id-GostR3411-94-CryptoProParamSet"),
        wc = r({namedParameters: l, ecParameters: tc, implicitly: d(pa)}, function (a) {
            return "string" === typeof a || a instanceof String ? "namedParameters" : "ecParameters"
        }), H = function (a, c) {
            return Q(e({algorithm: l, parameters: d(a)}), c)
        }, s = function () {
            var a = H(k), c = t(k, function (a) {
                if (this instanceof c) c.super.apply(this,
                    arguments); else return b(a)
            }, {
                encode: function (c) {
                    return (new a(this.object)).encode(c)
                }
            }, {
                decode: function (c) {
                    return new this(a.decode(c).object)
                }
            }), b = function (a) {
                return t(k, {
                    object: {
                        get: function () {
                            if (this.item) return this.item.object
                        }, set: function (c) {
                            if (c) {
                                var b = a[c.id];
                                if (!b) throw Error("Algorithm not supported");
                                this.item = new b(c)
                            } else delete this.item
                        }
                    }, encode: function (a) {
                        return this.item.encode(a)
                    }
                }, {
                    decode: function (c) {
                        "string" === typeof c && (c = xa.decode(c, void 0, !1));
                        c instanceof O && (c = ia.decode(c));
                        var b = a[hb[c.object[0].object]];
                        if (b) {
                            var d = new this;
                            d.item = b.decode(c);
                            return d
                        }
                        throw Error("Algorithm not supported");
                    }
                })
            };
            return c
        }(), Aa = H(wc, {
            encode: function (a) {
                return {
                    algorithm: a.id,
                    parameters: "string" === typeof a.namedCurve ? ba.namedCurve[a.namedCurve] : {
                        version: 1,
                        fieldID: {fieldType: "id-prime-Field", parameters: a.curve.p},
                        curve: {a: a.curve.a, b: a.curve.b},
                        base: {x: a.curve.x, y: a.curve.y},
                        order: a.curve.q,
                        cofactor: 1
                    }
                }
            }, decode: function (a) {
                var c = a.parameters;
                a = I[a.algorithm];
                if ("string" === typeof c || c instanceof
                    String) a = w(a, ca[c]); else if ("object" === typeof c) a = w(a, {
                    curve: {
                        p: c.fieldID.parameters,
                        a: c.curve.a,
                        b: c.curve.b,
                        x: c.base.x,
                        y: c.base.y,
                        q: c.order
                    }
                }); else throw new DataError("Invalid key paramters");
                return a
            }
        }), L = H(uc, {
            encode: function (a) {
                var c = a.namedCurve ? "namedCurve" : "namedParam",
                    b = 0 <= a.name.indexOf("-94") || 0 <= a.name.indexOf("-2001") || 1994 === a.version || 2001 === a.version ? a.sBox || "D-A" : 0 <= a.name.indexOf("-512") || 512 === a.length ? "D-512" : "D-256";
                return {
                    algorithm: a.id, parameters: {
                        publicKeyParamSet: ba[c][a[c]],
                        digestParamSet: ba.sBox[b],
                        encryptionParamSet: a.encParams && a.encParams.sBox ? ba.sBox[a.encParams.sBox] : void 0
                    }
                }
            }, decode: function (a) {
                var c = a.parameters;
                a = w(I[a.algorithm], ca[c.publicKeyParamSet], ca[c.digestParamSet]);
                c.encryptionParamSet && (a.encParams = ca[c.encryptionParamSet]);
                return a
            }
        }), u = H(k, {
            encode: function (a) {
                return {algorithm: a.id}
            }, decode: function (a) {
                return I[a.algorithm]
            }
        }), v = H(pa, {
            encode: function (a) {
                return {algorithm: a.id, parameters: null}
            }, decode: function (a) {
                return I[a.algorithm]
            }
        }), qa = H(vc, {
            encode: function (a) {
                return {
                    algorithm: a.id,
                    parameters: ba.sBox[a.sBox || a.hash && a.hash.sBox || "D-A"]
                }
            }, decode: function (a) {
                var c = w(I[a.algorithm]);
                a = ca[a.parameters];
                c.hash ? c.hash = w(c.hash, a) : c = w(c, a);
                return c
            }
        }), $ = s({
            ecdsa: Aa,
            noSignature: v,
            rsaEncryption: v,
            "id-sc-gostR3410-2001": Aa,
            "id-GostR3410-2001": L,
            "id-GostR3410-94": L,
            "id-GostR3410-2001DH": L,
            "id-GostR3410-94DH": L,
            "id-tc26-gost3410-12-256": L,
            "id-tc26-gost3410-12-512": L,
            "id-tc26-agreement-gost-3410-12-256": L,
            "id-tc26-agreement-gost-3410-12-512": L,
            "id-sc-gost28147-gfb": u,
            "id-Gost28147-89": u
        }),
        R = s({
            noSignature: v,
            rsaEncryption: v,
            sha1withRSAEncryption: v,
            sha256withRSAEncryption: v,
            sha384withRSAEncryption: v,
            sha512withRSAEncryption: v,
            ecdsa: u,
            "ecdsa-with-SHA1": u,
            "ecdsa-with-SHA256": u,
            "ecdsa-with-SHA384": u,
            "ecdsa-with-SHA512": u,
            "id-GostR3410-94": v,
            "id-GostR3410-2001": v,
            "id-GostR3411-94-with-GostR3410-2001": u,
            "id-GostR3411-94-with-GostR3410-94": u,
            "id-tc26-gost3410-12-256": v,
            "id-tc26-gost3410-12-512": v,
            "id-tc26-signwithdigest-gost3410-12-94": u,
            "id-tc26-signwithdigest-gost3410-12-256": u,
            "id-tc26-signwithdigest-gost3410-12-512": u,
            "id-sc-gostR3410-94": v,
            "id-sc-gostR3410-2001": v,
            "id-sc-gostR3411-94-with-gostR3410-94": v,
            "id-sc-gostR3411-94-with-gostR3410-2001": v
        }), la = s({
            sha1: u,
            sha256: v,
            sha384: v,
            sha512: v,
            "id-GostR3411-94": qa,
            "id-tc26-gost3411-94": qa,
            "id-tc26-gost3411-12-256": v,
            "id-tc26-gost3411-12-512": v,
            "id-sc-gostR3411-94": u
        }), rb = e({iv: g, encryptionParamSet: l}), xc = e({encryptionParamSet: l, ukm: d(g)}), Qa = H(rb, {
            encode: function (a) {
                return {algorithm: a.id, parameters: {iv: a.iv, encryptionParamSet: ba.sBox[a.sBox || "E-A"]}}
            }, decode: function (a) {
                var c =
                    w(I[a.algorithm], ca[a.parameters.encryptionParamSet]);
                c.iv = a.parameters.iv;
                return c
            }
        }), Ra = H(g, {
            encode: function (a) {
                return {algorithm: a.id, parameters: a.iv}
            }, decode: function (a) {
                var c = w(I[a.algorithm]);
                c.iv = a.parameters || new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
                return c
            }
        }), Ba = H(xc, {
            encode: function (a) {
                return {algorithm: a.id, parameters: {encryptionParamSet: ba.sBox[a.sBox || "E-A"], ukm: a.ukm}}
            }, decode: function (a) {
                var c = w(I[a.algorithm], ca[a.parameters.encryptionParamSet]);
                a.parameters.ukm && (c.ukm = a.parameters.ukm);
                return c
            }
        }), sb = s({"id-Gost28147-89-None-KeyWrap": Ba, "id-Gost28147-89-CryptoPro-KeyWrap": Ba}), Ca = H(sb, {
            encode: function (a) {
                return {algorithm: a.id, parameters: a.wrapping}
            }, decode: function (a) {
                var c = w(I[a.algorithm]);
                c.wrapping = a.parameters;
                return c
            }
        }), yc = s({"id-sc-gost28147-gfb": Ra, "id-Gost28147-89": Qa}), Sa = s({
            "id-Gost28147-89-MAC": rb,
            "id-HMACGostR3411-94": qa,
            "id-tc26-hmac-gost-3411-12-256": qa,
            "id-tc26-hmac-gost-3411-12-512": qa,
            hmacWithSHA1: u,
            hmacWithSHA224: u,
            hmacWithSHA256: u,
            hmacWithSHA384: u,
            hmacWithSHA512: u,
            "id-sc-gost28147-mac": u,
            "id-sc-hmacWithGostR3411": u
        }), zc = e({
            salt: r({specified: g, otherSource: s}, function (a) {
                return X(a) ? "specified" : "otherSource"
            }), iterationCount: h, keyLength: d(h), prf: Sa
        }), Ac = H(zc, {
            encode: function (a) {
                return {algorithm: a.id, parameters: {salt: a.salt, iterationCount: a.iterations, prf: a.hmac}}
            }, decode: function (a) {
                var c = w(I[a.algorithm]);
                c.salt = a.parameters.salt;
                c.iterations = a.parameters.iterationCount;
                c.hmac = a.parameters.prf;
                c.hash = c.hmac.hash;
                return c
            }
        }), Ta = s({PBKDF2: Ac}), tb = e({salt: g, iterationCount: h}),
        n = H(tb, {
            paramType: tb, encode: function (a) {
                return {algorithm: a.id, parameters: {salt: a.derivation.salt, iterationCount: a.derivation.iterations}}
            }, decode: function (a) {
                var c = w(I[a.algorithm]);
                c.derivation = w(c.derivation, {salt: a.parameters.salt, iterations: a.parameters.iterationCount});
                return c
            }
        }), Bc = e({keyDerivationFunc: Ta, encryptionScheme: yc}), Ua = H(Bc, {
            encode: function (a) {
                return {algorithm: a.id, parameters: {keyDerivationFunc: a.derivation, encryptionScheme: a.encryption}}
            }, decode: function (a) {
                var c = w(I[a.algorithm]);
                c.derivation = a.parameters.keyDerivationFunc;
                c.encryption = a.parameters.encryptionScheme;
                return c
            }
        });
    s({
        "pbeWithSHAAndAES128-CBC": n,
        "pbeWithSHAAndAES192-CBC": n,
        "pbeWithSHAAndAES256-CBC": n,
        "pbeWithSHA256AndAES128-CBC": n,
        "pbeWithSHA256AndAES192-CBC": n,
        "pbeWithSHA256AndAES256-CBC": n,
        "id-sc-pbeWithGost3411AndGost28147": n,
        "id-sc-pbeWithGost3411AndGost28147CFB": n,
        "pbeWithSHAAnd3-KeyTripleDES-CBC": n,
        "pbeWithSHAAnd2-KeyTripleDES-CBC": n,
        "pbeWithSHAAnd128BitRC2-CBC": n,
        "pbeWithSHAAnd40BitRC2-CBC": n,
        pbeUnknownGost: n,
        PBES2: Ua
    });
    var ra = s({
        ecdsa: Aa,
        rsaEncryption: v,
        "id-sc-gost28147-gfb": Ra,
        "id-Gost28147-89": Qa,
        "id-sc-gostR3410-2001": Aa,
        "id-GostR3410-2001": L,
        "id-GostR3410-94": L,
        "id-tc26-gost3410-12-256": L,
        "id-tc26-gost3410-12-512": L,
        "id-GostR3410-94-CryptoPro-ESDH": Ca,
        "id-GostR3410-2001-CryptoPro-ESDH": Ca,
        "id-tc26-agreement-gost-3410-12-256": Ca,
        "id-tc26-agreement-gost-3410-12-512": Ca,
        "id-sc-r3410-ESDH-r3411kdf": v,
        "id-Gost28147-89-None-KeyWrap": Ba,
        "id-Gost28147-89-CryptoPro-KeyWrap": Ba,
        "id-sc-cmsGostWrap": u,
        "id-sc-cmsGost28147Wrap": u,
        "pbeWithSHAAndAES128-CBC": n,
        "pbeWithSHAAndAES192-CBC": n,
        "pbeWithSHAAndAES256-CBC": n,
        "pbeWithSHA256AndAES128-CBC": n,
        "pbeWithSHA256AndAES192-CBC": n,
        "pbeWithSHA256AndAES256-CBC": n,
        "id-sc-pbeWithGost3411AndGost28147": n,
        "id-sc-pbeWithGost3411AndGost28147CFB": n,
        "pbeWithSHAAnd3-KeyTripleDES-CBC": n,
        "pbeWithSHAAnd2-KeyTripleDES-CBC": n,
        "pbeWithSHAAnd128BitRC2-CBC": n,
        "pbeWithSHAAnd40BitRC2-CBC": n,
        pbeUnknownGost: n,
        PBES2: Ua
    }), Cc = e({keyDerivationFunc: Ta, messageAuthScheme: Sa}), Dc = H(Cc, {
        encode: function (a) {
            return {
                algorithm: a.id,
                parameters: {keyDerivationFunc: a.derivation, messageAuthScheme: a.hmac}
            }
        }, decode: function (a) {
            var c = w(I[a.algorithm]);
            c.derivation = a.parameters.keyDerivationFunc;
            c.hmac = a.parameters.messageAuthScheme;
            return c
        }
    });
    s({PBMAC1: Dc});
    var Ec = s({
            "id-sc-gost28147-gfb": Ra,
            "id-Gost28147-89": Qa,
            "pbeWithSHAAndAES128-CBC": n,
            "pbeWithSHAAndAES192-CBC": n,
            "pbeWithSHAAndAES256-CBC": n,
            "pbeWithSHA256AndAES128-CBC": n,
            "pbeWithSHA256AndAES192-CBC": n,
            "pbeWithSHA256AndAES256-CBC": n,
            "id-sc-pbeWithGost3411AndGost28147": n,
            "id-sc-pbeWithGost3411AndGost28147CFB": n,
            "pbeWithSHAAnd3-KeyTripleDES-CBC": n,
            "pbeWithSHAAnd2-KeyTripleDES-CBC": n,
            "pbeWithSHAAnd128BitRC2-CBC": n,
            "pbeWithSHAAnd40BitRC2-CBC": n,
            pbeUnknownGost: n,
            PBES2: Ua
        }), ub = Q(q(K(h)), {
            encode: function (a) {
                return kb.encode(wa(a))
            }, decode: function (a) {
                return wa(kb.decode(a))
            }
        }), vb = Q(q(K(g)), {
            encode: function (a) {
                var c = new Uint8Array(a.byteLength + 1), b = wa(a);
                a = a.byteLength / 2;
                c[0] = 4;
                c.set(new Uint8Array(b, a, a), 1);
                c.set(new Uint8Array(b, 0, a), a + 1);
                return c.buffer
            }, decode: function (a) {
                P(0 === (a.byteLength & 1));
                var c = new Uint8Array(a.byteLength -
                    1), b = c.byteLength / 2;
                c.set(new Uint8Array(a, b + 1, b), 0);
                c.set(new Uint8Array(a, 1, b), b);
                return wa(c)
            }
        }), M = q(K(g)), ma = e({algorithm: $, subjectPublicKey: q}, "PUBLIC KEY"), Va = function (a) {
            return Q(J({algorithm: $, subjectPublicKey: k}, "algorithm", "subjectPublicKey")(function (c) {
                return a[c.id]
            }), {
                encode: function (a) {
                    return {algorithm: a.algorithm, subjectPublicKey: a.buffer}
                }, decode: function (a) {
                    return {
                        algorithm: a.algorithm,
                        type: "public",
                        extractable: !0,
                        usages: ["verify", "deriveKey", "deriveBits"],
                        buffer: a.subjectPublicKey
                    }
                }
            })
        }({
            "id-sc-gostR3410-2001": vb,
            "id-sc-gostR3410-94": ub,
            "id-GostR3410-2001": M,
            "id-GostR3410-94": M,
            "id-tc26-gost3410-12-256": M,
            "id-tc26-gost3410-12-512": M
        }), wb = Q(g(K(h)), {
            encode: function (a) {
                return U.encode(a, !0)
            }, decode: function (a) {
                return U.decode(a, !0)
            }
        }), Fc = e({keyValueMask: g, keyValyePublicKey: g}), ga = r({
            privateKey: g(K(r({keyValueMask: g, keyValueInfo: Fc}, function (a) {
                return X(a) ? "keyValueMask" : "keyValueInfo"
            }))), keyValueMask: g
        }, function (a) {
            return a.enclosed ? "keyValueMask" : "privateKey"
        }), Gc = function (a) {
            return J({
                version: h, privateKeyAlgorithm: $,
                privateKeyWrapped: Q(g(K(e({keyData: h, keyMac: h}))), {
                    encode: function (a) {
                        var b = a.byteLength - 4;
                        return {keyData: U.encode(new Uint8Array(a, 0, b)), keyMac: U.encode(new Uint8Array(a, b, 4))}
                    }, decode: function (a) {
                        var b = U.decode(a.keyData);
                        a = U.decode(a.keyMac);
                        var d = new Uint8Array(b.byteLength + a.byteLength);
                        d.set(new Uint8Array(b));
                        d.set(new Uint8Array(a), b.byteLength);
                        return d
                    }
                }), attributes: k
            }, "privateKeyAlgorithm", "attributes")(function (c) {
                return d(b(0, f(G({"id-sc-gostR3410-2001-publicKey": C(a[c.id])}))))
            })
        }({
            "id-sc-gostR3410-2001": vb,
            "id-sc-gostR3410-94": ub,
            "id-GostR3410-2001": M,
            "id-GostR3410-94": M,
            "id-GostR3410-2001DH": M,
            "id-GostR3410-94DH": M,
            "id-tc26-gost3410-12-256": M,
            "id-tc26-gost3410-12-512": M,
            "id-tc26-agreement-gost-3410-12-256": M,
            "id-tc26-agreement-gost-3410-12-512": M
        }), Wa = e({version: h, privateKeyAlgorithm: $, privateKey: g, attributes: d(b(0, f(G)))}, "PRIVATE KEY"), Hc = e({
            version: h,
            privateKeyAlgorithm: $,
            privateKey: g,
            attributes: d(b(0, f(G))),
            publicKey: d(b(1, f(q)))
        }), Ic = m(Hc), Jc = function (a) {
            return Q(J({
                version: h, privateKeyAlgorithm: $,
                privateKey: k, attributes: d(b(0, f(G)))
            }, "privateKeyAlgorithm", "privateKey")(function (c) {
                return a[c.id]
            }), {
                encode: function (a) {
                    return {version: 0, privateKeyAlgorithm: a.algorithm, privateKey: a.buffer}
                }, decode: function (a) {
                    return {
                        algorithm: a.privateKeyAlgorithm,
                        type: "private",
                        extractable: !0,
                        usages: ["sign", "deriveKey", "deriveBits"],
                        buffer: X(a.privateKey) ? a.privateKey : a.privateKey.keyValueMask
                    }
                }
            })
        }({
            "id-sc-gostR3410-2001": wb,
            "id-sc-gostR3410-94": wb,
            "id-GostR3410-2001": ga,
            "id-GostR3410-94": ga,
            "id-GostR3410-2001DH": ga,
            "id-GostR3410-94DH": ga,
            "id-tc26-gost3410-12-256": ga,
            "id-tc26-gost3410-12-512": ga,
            "id-tc26-agreement-gost-3410-12-256": ga,
            "id-tc26-agreement-gost-3410-12-512": ga
        }), xb = e({encryptionAlgorithm: ra, encryptedData: g}, "ENCRYPTED PRIVATE KEY"),
        Kc = e({cA: V(da, !1), pathLenConstraint: d(h)}), Lc = q({
            digitalSignature: 0,
            nonRepudiation: 1,
            keyEncipherment: 2,
            dataEncipherment: 3,
            keyAgreement: 4,
            keyCertSign: 5,
            cRLSign: 6,
            encipherOnly: 7,
            decipherOnly: 8
        }), Mc = m(l), Nc = e({type: l, value: b(0, p(k))}), Oc = e({
            nameAssigner: d(b(0, f(ja))), partyName: d(b(1,
            f(ja)))
        }), Pc = e({}), D = r({
            otherName: b(0, f(Nc)),
            rfc822Name: b(1, f(ja)),
            dNSName: b(2, f(ja)),
            x400Address: b(3, f(Pc)),
            directoryName: b(4, p(W)),
            ediPartyName: b(5, f(Oc)),
            uniformResourceIdentifier: b(6, f(ja)),
            iPAddress: b(7, f(g)),
            registeredID: b(8, f(l))
        }, function (a) {
            return "string" === typeof a || a instanceof String ? 0 <= a.indexOf("@") ? "rfc822Name" : "dNSName" : X(a) ? "iPAddress" : "directoryName"
        }), E = m(D), Xa = e({
            keyIdentifier: d(b(0, f(g))),
            authorityCertIssuer: d(b(1, f(E))),
            authorityCertSerialNumber: d(b(2, f(h)))
        }), Qc = e({
            notBefore: d(b(0,
                f(A))), notAfter: d(b(1, f(A)))
        }), Rc = e({policyQualifierId: l, qualifier: k}), Sc = e({policyIdentifier: l, policyQualifiers: d(m(Rc))}),
        Tc = e({issuerDomainPolicy: l, subjectDomainPolicy: l}),
        Uc = e({base: D, minimum: V(b(0, f(h)), 0), maximum: d(b(1, f(h)))}), yb = m(Uc),
        Vc = e({permittedSubtrees: d(b(0, f(yb))), excludedSubtrees: d(b(1, f(yb)))}),
        Wc = e({requireExplicitPolicy: d(b(0, f(h))), inhibitPolicyMapping: d(b(1, f(h)))}), Ya = q({
            unused: 0,
            keyCompromise: 1,
            cACompromise: 2,
            affiliationChanged: 3,
            superseded: 4,
            cessationOfOperation: 5,
            certificateHold: 6,
            privilegeWithdrawn: 7,
            aACompromise: 8
        }), zb = r({fullName: b(0, f(E)), nameRelativeToCRLIssuer: b(1, f(ob))}, function (a) {
            return a instanceof Array ? "fullName" : "nameRelativeToCRLIssuer"
        }), Xc = e({distributionPoint: d(b(0, p(zb))), reasons: d(b(1, f(Ya))), cRLIssuer: d(b(2, f(E)))}), Da = m(Xc),
        Za = e({accessMethod: l, accessLocation: D}), Ab = function (a, b) {
            var d = J({
                extnID: l, critical: V(da, !1), extnValue: function (a) {
                    return g(K(a))
                }
            }, "extnID", "extnValue"), e = t(d(a), {
                object: {
                    get: function () {
                        var a = this._get(e.super, "object");
                        a && "object" ===
                        typeof a.extnValue && this.defineValue(a.extnValue);
                        return a
                    }, set: function (a) {
                        this._set(e.super, "object", a);
                        a && a.extnValue && (void 0 !== a.extnValue.critical ? this.critical = a.extnValue.critical : void 0 === this.critical && b && (this.critical = b(this.extnID, a.extnValue)))
                    }
                }, extnValue: {
                    get: function () {
                        var a = this._get(e.super, "extnValue");
                        "object" === typeof a && this.defineValue(a);
                        return a
                    }, set: function (a) {
                        this._set(e.super, "extnValue", a);
                        a && (void 0 !== a.critical ? this.critical = a.critical : void 0 === this.critical && b && (this.critical =
                            b(this.extnID, a)))
                    }
                }, defineValue: function (a) {
                    if ("object" === typeof a && !Object.getOwnPropertyDescriptor(a, "critical")) {
                        var b = this;
                        ha(a, "critical", {
                            get: function () {
                                return b.critical
                            }, set: function (a) {
                                b.critical = a
                            }, enumerable: !0, configurable: !1
                        })
                    }
                }
            });
            return e
        }, Yc = e({signTool: z, cATool: z, signToolCert: z, cAToolCert: z}),
        na = m(Ab, {typeName: "extnID", valueName: "extnValue"}), Ea = na({
            authorityKeyIdentifier: Xa,
            subjectKeyIdentifier: g,
            keyUsage: Lc,
            privateKeyUsagePeriod: Qc,
            certificatePolicies: m(Sc),
            policyMappings: m(Tc),
            subjectAltName: E,
            issuerAltName: E,
            subjectDirectoryAttributes: Pa,
            basicConstraints: Kc,
            nameConstraints: Vc,
            policyConstraints: Wc,
            extKeyUsage: Mc,
            cRLDistributionPoints: Da,
            inhibitAnyPolicy: h,
            freshestCRL: Da,
            authorityInfoAccess: m(Za),
            subjectInfoAccess: m(Za),
            subjectSignTool: z,
            issuerSignTool: Yc
        }, function (a, b) {
            return "keyUsage" === a || "basicConstraints" === a && void 0 === b.pathLenConstraint
        }), Zc = e({r: h, s: h}), Bb = F(e({
            version: b(0, p(h)),
            serialNumber: h,
            signature: R,
            issuer: W,
            validity: pb,
            subject: W,
            subjectPublicKeyInfo: ma,
            issuerUniqueID: d(b(1,
                f(q))),
            subjectUniqueID: d(b(2, f(q))),
            extensions: d(b(3, p(Ea)))
        })), ka = e({tbsCertificate: Bb, signatureAlgorithm: R, signatureValue: q}, "CERTIFICATE"), $c = G({
            challengePassword: C(ja),
            extensionRequest: C(Ea),
            msCertExtensions: C(Ea),
            extendedCertificateAttributes: C(G)
        }), Cb = F(e({version: h, subject: W, subjectPublicKeyInfo: ma, attributes: b(0, f($c))})),
        Db = e({requestInfo: Cb, signatureAlgorithm: R, signatureValue: q}, "CERTIFICATE REQUEST"), Eb = mb({
            unspecified: 0, keyCompromise: 1, cACompromise: 2, affiliationChanged: 3, superseded: 4,
            cessationOfOperation: 5, certificateHold: 6, removeFromCRL: 8, privilegeWithdrawn: 9, aACompromise: 10
        }), ad = e({
            distributionPoint: d(b(0, p(zb))),
            onlyContainsUserCerts: V(b(1, f(da)), !1),
            onlyContainsCACerts: V(b(2, f(da)), !1),
            onlySomeReasons: d(b(3, f(Ya))),
            indirectCRL: V(b(4, f(da)), !1),
            onlyContainsAttributeCerts: V(b(5, f(da)), !1)
        }), bd = na({
            authorityKeyIdentifier: Xa,
            issuerAltName: E,
            cRLNumber: h,
            deltaCRLIndicator: h,
            issuingDistributionPoint: ad,
            freshestCRL: Da
        }, function (a) {
            return "cRLNumber" === a
        }), cd = na({
            cRLReason: Eb, instructionCode: l,
            invalidityDate: A, certificateIssuer: E
        }), Fb = F(e({
            version: d(h),
            signature: R,
            issuer: W,
            thisUpdate: fa,
            nextUpdate: d(fa),
            revokedCertificates: d(m(e({userCertificate: h, revocationDate: fa, crlEntryExtensions: d(cd)}))),
            crlExtensions: d(b(0, p(bd)))
        })), $a = e({tbsCertList: Fb, signatureAlgorithm: R, signatureValue: q}, "CRL"), ab = e({
            digestedObjectType: mb({publicKey: 0, publicKeyCert: 1, otherObjectTypes: 2}),
            otherObjectTypeID: d(l),
            digestAlgorithm: la,
            objectDigest: q
        }), Fa = e({issuer: E, serial: h, issuerUID: d(q)}), dd = e({
            issuerName: d(E),
            baseCertificateID: d(b(0, f(Fa))), objectDigestInfo: d(b(1, f(ab)))
        }), ed = e({targetCertificate: Fa, targetName: d(D), certDigestInfo: d(ab)}),
        fd = r({targetName: b(0, p(D)), targetGroup: b(1, p(D)), targetCert: b(2, f(ed))}), gd = m(fd), hd = na({
            auditIdentity: g,
            targetInformation: gd,
            authorityKeyIdentifier: Xa,
            authorityInfoAccess: m(Za),
            cRLDistributionPoints: Da,
            noRevAvail: pa
        }, function (a) {
            return "auditIdentity" === a || "targetInformation" === a
        }), id = e({baseCertificateID: d(b(0, f(Fa))), entityName: d(b(1, f(E))), objectDigestInfo: d(b(2, f(ab)))}),
        jd = r({v1Form: E, v2Form: b(0, f(dd))}, "v2Form"), Gb = e({notBeforeTime: A, notAfterTime: A}),
        Hb = e({service: D, ident: D, authInfo: d(g)}), kd = e({roleAuthority: d(b(0, f(E))), roleName: b(1, p(D))}),
        ld = q({unmarked: 0, unclassified: 1, restricted: 2, confidential: 3, secret: 4, topSecret: 5}),
        md = e({type: b(0, f(l)), value: b(1, f(k))}), nd = e({
            policyId: b(0, f(l)),
            classList: V(b(1, f(ld)), ["unclassified"]),
            securityCategories: d(b(2, f(B(md))))
        }), Ib = e({
            policyAuthority: d(b(0, f(E))), values: m(r({octets: g, oid: l, string: z}, function (a) {
                return X ? "octets" :
                    getIdentifier(a) ? "oid" : "string"
            }))
        }), Jb = F(e({
            version: h,
            holder: id,
            issuer: jd,
            signature: R,
            serialNumber: h,
            attrCertValidityPeriod: Gb,
            attributes: Pa({
                authenticationInfo: B(Hb),
                accessIdentity: B(Hb),
                chargingIdentity: C(Ib),
                group: C(Ib),
                role: B(kd),
                clearance: B(nd)
            }),
            issuerUniqueID: d(q),
            extensions: d(hd)
        })), Kb = e({acinfo: Jb, signatureAlgorithm: R, signatureValue: q}, "ATTRIBUTE CERTIFICATE"), oa = g, sa = g;
    e({keyInfo: sb, entityUInfo: d(b(0, p(g))), suppPubInfo: b(2, p(g))});
    var N = Q(e({encryptedKey: g, maskKey: d(b(0, f(g))), macKey: g}),
        {
            encode: function (a) {
                var b = (new Uint8Array(new Uint8Array(a, 0, 32))).buffer;
                a = (new Uint8Array(new Uint8Array(a, 32, 4))).buffer;
                return {encryptedKey: b, macKey: a}
            }, decode: function (a) {
                var b = a.encryptedKey, d = a.maskKey;
                a = a.macKey;
                if (d) for (var d = new Int32Array(d), e = new Int32Array(b), f = 0, g = d.length / e.length; f < g; f++) for (var h = 0, k = e.length; h < k; h++) e[h] = e[h] + d[k * f + h] & 4294967295;
                d = new Uint8Array(b.byteLength + a.byteLength);
                d.set(new Uint8Array(b), 0);
                d.set(new Uint8Array(a), 32);
                return d.buffer
            }
        }), od = e({
            encryptionParamSet: l,
            ephemeralPublicKey: d(b(0, f(Va))), ukm: g
        }), Ga = Q(e({sessionEncryptedKey: N, transportParameters: d(b(0, f(od)))}), {
            encode: function (a) {
                var b = a.algorithm;
                return {
                    sessionEncryptedKey: a.sessionEncryptedKey,
                    transportParameters: {
                        encryptionParamSet: ba.sBox[b.wrapping.sBox || "E-A"],
                        ephemeralPublicKey: b["public"],
                        ukm: b.ukm
                    }
                }
            }, decode: function (a) {
                return {
                    algorithm: {
                        wrapping: ca[a.transportParameters.encryptionParamSet],
                        ukm: a.transportParameters.ukm,
                        "public": a.transportParameters.ephemeralPublicKey
                    }, sessionEncryptedKey: a.sessionEncryptedKey
                }
            }
        }),
        Lb = Q(e({
            sessionEncryptedKey: N,
            ukm: e({ephemeralPublicKey: Va, addedukm: d(b(0, p(g)))})
        }), {
            encode: function (a) {
                var b = a.algorithm;
                return {
                    sessionEncryptedKey: a.sessionEncryptedKey,
                    ukm: {ephemeralPublicKey: b["public"], addedukm: b.ukm}
                }
            }, decode: function (a) {
                return {
                    algorithm: {ukm: a.ukm.addedukm, "public": a.ukm.ephemeralPublicKey},
                    sessionEncryptedKey: a.sessionEncryptedKey
                }
            }
        }), pd = function (a) {
            return function (b) {
                return (b = a[b.id]) ? K(b) : k
            }
        }({
            "id-sc-gostR3410-2001": Lb,
            "id-sc-gostR3410-94": Lb,
            "id-GostR3410-2001": Ga,
            "id-GostR3410-94": Ga,
            "id-tc26-gost3410-12-256": Ga,
            "id-tc26-gost3410-12-512": Ga,
            "id-GostR3410-94-CryptoPro-ESDH": N,
            "id-GostR3410-2001-CryptoPro-ESDH": N,
            "id-tc26-agreement-gost-3410-12-256": N,
            "id-tc26-agreement-gost-3410-12-512": N,
            "id-sc-r3410-ESDH-r3411kdf": N,
            "id-Gost28147-89-None-KeyWrap": N,
            "id-Gost28147-89-CryptoPro-KeyWrap": N,
            "id-sc-cmsGostWrap": N,
            "id-sc-cmsGost28147Wrap": N
        }), qd = q({kccaSoftPassword: 0, kccaReservePrimary: 1, kccaPrimaryKeyAbsent: 2, kccaFKCShared: 3}), rd = q({
            pkaExportable: 0, pkaUserProtect: 1, pkaExchange: 2, pkaEphemeral: 3,
            pkaNonCachable: 4, pkaDhAllowed: 5
        }), Mb = e({attributes: d(rd), privateKeyAlgorithm: d(b(0, f($)))}), Nb = e({path: ea, hmac: g}), sd = e({
            containerAlgoritmIdentifier: d(b(0, f(s))),
            containerName: d(ea),
            attributes: qd,
            primaryPrivateKeyParameters: Mb,
            hmacPassword: d(b(2, f(g))),
            secondaryEncryptedPrivateKey: d(b(3, f(N))),
            secondaryPrivateKeyParameters: d(b(4, f(Mb))),
            primaryCertificate: d(b(5, f(g(K(ka))))),
            secondaryCertificate: d(b(6, f(g(K(ka))))),
            encryptionContainerName: d(b(7, f(ea))),
            primaryCertificateLink: d(b(8, f(Nb))),
            secondaryCertificateLink: d(b(9,
                f(Nb))),
            primaryFP: d(b(10, f(g))),
            secondaryFP: d(b(11, f(g))),
            passwordPolicy: d(s),
            containerSecurityLevel: d(h),
            extensions: d(b(12, f(na({keyValidity: e({notBefore: d(b(0, f(A))), notAfter: d(b(1, f(A)))})})))),
            secondaryEncryptionContainerName: d(b(13, f(ea)))
        }), td = e({keyContainerContent: sd, hmacKeyContainerContent: g}), ud = e({containerName: ea, extElem1: d(k)}),
        vd = e({primaryKey: g, secondaryKey: d(g), hmacKey: d(g)}), wd = e({mask: g, randomStatus: g, hmacRandom: g}),
        Ob = e({
            keyClass: h,
            keyType: h,
            algorithm: d(b(0, p($))),
            serialNumber: d(b(1,
                p(g))),
            addSerialNumber: d(b(2, p(g))),
            certSerialNumber: d(b(3, p(g))),
            subjectUID: d(b(4, p(g))),
            recipientUID: d(b(5, p(g))),
            validity: d(b(6, p(r({
                validity: pb,
                keyValidity: e({notBefore: d(b(0, f(A))), notAfter: d(b(1, f(A)))})
            }, function () {
                return "keyValidity"
            })))),
            keyUID: d(b(7, p(q))),
            flags: d(b(10, p(h)))
        }),
        xd = e({version: h, keyInfo: Ob, defenceKeyInfo: Ob, certificate: d(b(0, p(ka))), publicKey: d(b(1, p(g)))}),
        ta = l, sa = g, bb = m(h), yd = e({bodyPartPath: bb, identifier: l, content: k}),
        Ha = G({contentType: C(ta), signingTime: C(fa), messageDigest: C(g)}),
        Pb = G(function (a) {
            return {countersignature: B(zd), unsignedData: B(yd)}[a]
        }), ua = e({issuer: W, serialNumber: h}),
        Ad = r({issuerAndSerialNumber: ua, subjectKeyIdentifier: b(0, f(sa))}, function (a) {
            return X(a) ? "subjectKeyIdentifier" : "issuerAndSerialNumber"
        }), Qb = e({
            version: h,
            sid: Ad,
            digestAlgorithm: la,
            signedAttrs: d(b(0, f(Ha))),
            signatureAlgorithm: R,
            signatureValue: g,
            unsignedAttrs: d(b(1, f(Pb)))
        }), zd = Qb, Bd = B(Qb), Cd = B(la), Dd = F(e({version: h, certificate: ka, attributes: G})), Ed = e({
            extendedCertificateInfo: Dd, signatureAlgorithm: R,
            signatureValue: q
        }), Fd = e({otherCertFormat: l, otherCert: k}), Gd = F(e({
            version: h,
            subject: r({baseCertificateID: b(0, f(Fa)), subjectName: b(1, f(E))}, function (a) {
                return a.issuer ? "baseCertificateID" : "subjectName"
            }),
            issuer: E,
            signature: R,
            serialNumber: h,
            attCertValidityPeriod: Gb,
            attributes: Pa,
            issuerUniqueID: d(q),
            extensions: d(Ea)
        })), Hd = e({acInfo: Gd, signatureAlgorithm: R, signatureValue: q}),
        cb = e({eContentType: ta, eContent: d(b(0, p(g)))}), Id = r({
            certificate: ka, extendedCertificate: b(0, f(Ed)), v1AttrCert: b(1, f(Hd)), v2AttrCert: b(2,
            f(Kb)), other: b(3, f(Fd))
        }, function (a) {
            return a.holder ? "AttributeCertificateV2" : a.certificate ? "ExtendedCertificate" : a.otherCertFormat ? "other" : "certificate"
        }), Jd = e({otherRevInfoFormat: l, otherRevInfo: k}), Kd = r({crl: $a, other: b(1, f(Jd))}, function (a) {
            return a.otherRevInfoFormat ? "other" : "crl"
        }), Rb = B(Id), Sb = B(Kd), Ld = e({
            version: h,
            digestAlgorithms: Cd,
            encapContentInfo: cb,
            certificates: d(b(0, f(Rb))),
            crls: d(b(1, f(Sb))),
            signerInfos: Bd
        }), Md = r({issuerAndSerialNumber: ua, subjectKeyIdentifier: b(0, f(sa))}, function (a) {
            return X(a) ?
                "subjectKeyIdentifier" : "issuerAndSerialNumber"
        }), Nd = e({version: h, rid: Md, keyEncryptionAlgorithm: ra, encryptedKey: oa}),
        Tb = e({keyAttrId: l, keyAttr: d(k)}), Od = e({subjectKeyIdentifier: sa, date: d(A), other: d(Tb)}),
        Pd = r({issuerAndSerialNumber: ua, rKeyId: b(0, f(Od))}, function (a) {
            return X(a) ? "rKeyId" : "issuerAndSerialNumber"
        }), Qd = e({rid: Pd, encryptedKey: oa}), Rd = m(Qd), Ub = e({algorithm: $, publicKey: q});
    e({ephemeralPublicKey: Ub, addedukm: d(b(0, p(g)))});
    var Sd = r({
            issuerAndSerialNumber: ua, subjectKeyIdentifier: b(0, f(sa)), originatorKey: b(1,
            f(Ub))
        }, function (a) {
            return X(a) ? "subjectKeyIdentifier" : a.algorithm ? "originatorKey" : "issuerAndSerialNumber"
        }), Td = e({
            version: h,
            originator: b(0, p(Sd)),
            ukm: d(b(1, p(g))),
            keyEncryptionAlgorithm: ra,
            recipientEncryptedKeys: Rd
        }), Ud = e({keyIdentifier: g, date: d(A), other: d(Tb)}),
        Vd = e({version: h, kekid: Ud, keyEncryptionAlgorithm: ra, encryptedKey: oa}),
        Wd = e({version: h, friendlyName: d(b(0, f(Ta))), keyEncryptionAlgorithm: ra, encryptedKey: oa}),
        Xd = e({oriType: l, oriValue: k}), Yd = r({
            ktri: Nd, kari: b(1, f(Td)), kekri: b(2, f(Vd)), pwri: b(3,
            f(Wd)), ori: b(4, f(Xd))
        }, function (a) {
            return a.rid ? "ktri" : a.originator ? "kari" : a.kekid ? "kekri" : a.oriType ? "ori" : "pwri"
        }), db = e({certs: d(b(0, f(Rb))), crls: d(b(1, f(Sb)))}), eb = B(Yd),
        fb = e({contentType: ta, contentEncryptionAlgorithm: Ec, encryptedContent: d(b(0, f(g)))}), Ia = e({
            version: h,
            originatorInfo: d(b(0, f(db))),
            recipientInfos: eb,
            encryptedContentInfo: fb,
            unprotectedAttrs: d(b(1, f(G)))
        }), Zd = e({version: h, digestAlgorithm: la, encapContentInfo: cb, digest: g}), Vb = e({
            version: h, encryptedContentInfo: fb, unprotectedAttrs: d(b(1,
            f(G)))
        }), $d = e({
            version: h,
            originatorInfo: d(b(0, f(db))),
            recipientInfos: eb,
            macAlgorithm: Sa,
            digestAlgorithm: d(b(1, la)),
            encapContentInfo: cb,
            authAttrs: d(b(2, f(Ha))),
            mac: g,
            unauthAttrs: d(b(3, f(G)))
        }), ae = e({
            version: h,
            originatorInfo: d(b(0, f(db))),
            recipientInfos: eb,
            authEncryptedContentInfo: fb,
            authAttrs: d(b(1, f(Ha))),
            mac: g,
            unauthAttrs: d(b(2, f(G)))
        }), be = r({encrypted: Vb, enveloped: b(0, f(Ia)), authEnveloped: b(1, f(ae))}, function (a) {
            return a.encryptedContentInfo ? a.recipientInfos ? "enveloped" : "encrypted" : "authEnveloped"
        }),
        ta = l, va = J({
            contentType: ta, content: function (a) {
                return b(0, p(a))
            }
        }, "contentType", "content", void 0, "CMS")({
            data: g,
            signedData: F(Ld),
            envelopedData: F(Ia),
            digestedData: F(Zd),
            encryptedData: F(Vb),
            authData: F($d),
            encryptedKeyPkg: F(be),
            aKeyPackage: F(Ic)
        }), ce = e({digestAlgorithm: la, digest: g}),
        de = G({friendlyName: C(Ma), keyProviderNameAttr: C(Ma), localKeyId: C(g), certKeyIdentifierPropId: C(g)}),
        ee = J({
            certId: l, certValue: function (a) {
                return b(0, p(a))
            }
        }, "certId", "certValue")({x509Certificate: g(K(ka)), sdsiCertificate: ea},
            g), fe = J({
            crlId: l, crlValue: function (a) {
                return b(0, p(a))
            }
        }, "crlId", "crlValue")({x509CRL: g(K($a))}, g), ge = J({
            secretTypeId: l, secretValue: function (a) {
                return b(0, p(a))
            }
        }, "secretTypeId", "secretValue")({secret: g}, g), he = J({
            bagId: l, bagValue: function (a) {
                return b(0, p(a))
            }, bagAttributes: d(de)
        }, "bagId", "bagValue")(function (a) {
            return {keyBag: Wa, pkcs8ShroudedKeyBag: xb, certBag: ee, crlBag: fe, secretBag: ge, safeContentsBag: Wb}[a]
        }), Wb = m(he), ie = m(va), je = e({mac: ce, macSalt: g, iterations: V(h, 1)}), ke = e({
            version: h, authSafe: va,
            macData: d(je)
        }, "PFX"), le = e({issuer: D, serialNumber: h}), me = e({
            intendedAlg: d(b(0, f(s))),
            symmAlg: d(b(1, f(s))),
            encSymmKey: d(b(2, f(q))),
            keyAlg: d(b(3, f(s))),
            valueHint: d(b(4, f(g))),
            encValue: q
        }), oa = r({encryptedValue: me, envelopedData: b(0, f(Ia))}, function (a) {
            return a.encryptedContentInfo ? "envelopedData" : "encryptedValue"
        }), ne = r({encryptedPrivKey: b(0, oa), keyGenParameters: b(1, f(g)), archiveRemGenPrivKey: b(2, f(da))}),
        oe = e({pubMethod: h({dontCare: 0, x500: 1, web: 2, ldap: 3}), pubLocation: d(D)}), Xb = e({
            action: h({
                dontPublish: 0,
                pleasePublish: 1
            }), pubInfos: d(m(oe))
        }), pe = h({encrCert: 0, challengeResp: 1}), Zb = r({
            thisMessage: b(0, f(q)),
            subsequentMessage: b(1, f(pe)),
            dhMAC: b(2, f(q)),
            agreeMAC: b(3, f(Yb)),
            encryptedKey: b(4, f(Ia))
        });
    e({salt: g, owf: s, iterationCount: h, mac: s});
    var Yb = e({algId: s, value: q}), qe = e({authInfo: r({sender: b(0, p(D)), publicKeyMAC: Yb}), publicKey: ma}),
        re = e({poposkInput: d(b(0, qe)), algorithmIdentifier: s, signature: q}), se = r({
            raVerified: b(0, f(pa)),
            signature: b(1, f(re)),
            keyEncipherment: b(2, f(Zb)),
            keyAgreement: b(3, f(Zb))
        }), te = m(Na({
            regToken: z,
            authenticator: z, pkiPublicationInfo: Xb, pkiArchiveOptions: ne, oldCertID: le, protocolEncrKey: ma
        })), ue = e({notBefore: d(b(0, f(fa))), notAfter: d(b(1, f(fa)))}), $b = e({
            version: d(b(0, f(h))),
            serialNumber: d(b(1, f(h))),
            signingAlg: d(b(2, f(s))),
            issuer: d(b(3, f(W))),
            validity: d(b(4, f(ue))),
            subject: d(b(5, f(W))),
            publicKey: d(b(6, f(ma))),
            issuerUID: d(b(7, f(q))),
            subjectUID: d(b(8, f(q))),
            extensions: d(b(9, f(na)))
        }), ac = e({certReqId: h, certTemplate: $b, controls: d(te)}), ve = e({
            privateKey: Wa, identifier: d(r({string: z, generalName: D}, function (a) {
                return "string" ===
                typeof a || a instanceof String ? "string" : "generalName"
            }))
        }), bc = e({certReq: ac, popo: d(se), regInfo: d(m(Na({utf8Pairs: z, certReq: ac, encKeyWithID: ve})))});
    m(bc);
    var cc = e({pendToken: g, pendTime: A}),
        dc = h({success: 0, failed: 2, pending: 3, noSupport: 4, confirmRequired: 5, popRequired: 6, partial: 7}),
        ec = h({
            badAlg: 0,
            badMessageCheck: 1,
            badRequest: 2,
            badTime: 3,
            badCertId: 4,
            unsupportedExt: 5,
            mustArchiveKeys: 6,
            badIdentity: 7,
            popRequired: 8,
            popFailed: 9,
            noKeyReuse: 10,
            internalCAError: 11,
            tryLater: 12,
            authDataFail: 13
        }), we = e({
            cMCStatus: dc,
            bodyList: m(h), statusString: d(z), otherInfo: d(r({failInfo: ec, pendInfo: cc}))
        }), xe = e({pkiDataReference: h, certReferences: m(h), extensions: m(Ab)}),
        ye = e({pkiDataBodyid: h, bodyIds: m(h)}), ze = e({issuerName: D, serialNumber: h}),
        Ae = e({issuerName: W, cRLName: d(D), time: d(A), reasons: d(Ya)}),
        Be = e({issuerName: W, serialNumber: h, reason: Eb, invalidityDate: d(A), passphrase: d(g), comment: d(z)}),
        Ce = e({bodyPartID: h, thePOPAlgID: s, thePOP: g}), fc = r({bodyPartID: h, bodyPartPath: bb}), De = e({
            cMCStatus: dc, bodyList: m(fc), statusString: d(z), otherInfo: d(r({
                failInfo: ec,
                pendInfo: cc, extendedFailInfo: e({failInfoOID: l, failInfoValue: k})
            }))
        }), Ee = e({seqNumber: h, hashAlgorithm: s, anchorHashes: m(g)}), gb = m(h),
        Fe = e({hashAlg: s, certHashes: m(g), pubInfo: Xb}),
        Ge = e({pkiDataReference: bb, certReferences: gb, replace: V(da, !0), certTemplate: $b}),
        He = e({bodyList: m(fc)}), Ie = e({proofAlgID: s, macAlgId: s, witness: g}),
        Je = e({keyGenAlgorithm: s, macAlgorithm: s, witness: g}), Ke = e({bodyPartID: h, certificationRequest: Db}),
        gc = e({bodyPartID: h, contentInfo: va}), hc = e({bodyPartID: h, otherMsgType: l, otherMsgValue: k}),
        ic = r({
            tcr: b(0, f(Ke)),
            crm: b(1, f(bc)),
            orm: b(2, f(e({bodyPartID: h, requestMessageType: l, requestMessageValue: k})))
        }), Le = e({request: ic, cms: va, thePOPAlgID: s, witnessAlgID: s, witness: g}), jc = J({
            bodyPartID: h, attrType: l, attrValues: function (a) {
                return B(a)
            }
        }, "attrType", "attrValues", k)({
            statusInfo: we,
            identification: z,
            identityProof: g,
            dataReturn: g,
            transactionId: h,
            senderNonce: g,
            recipientNonce: g,
            addExtensions: xe,
            encryptedPOP: Le,
            decryptedPOP: Ce,
            lraPOPWitness: ye,
            getCert: ze,
            getCRL: Ae,
            revokeRequest: Be,
            regInfo: g,
            responseInfo: g,
            queryPending: g,
            popLinkRandom: g,
            popLinkWitness: g,
            confirmCertAcceptance: ua,
            statusInfoV2: De,
            trustedAnchors: Ee,
            authPublish: h,
            batchRequests: gb,
            batchResponses: gb,
            publishCert: Fe,
            modCertTemplate: Ge,
            controlProcessed: He,
            popLinkWitnessV2: Je,
            identityProofV2: Ie
        }), Me = e({
            controlSequence: m(jc),
            reqSequence: m(ic),
            cmsSequence: m(gc),
            otherMsgSequence: m(hc)
        }, "PKI REQUEST"), Ne = e({controlSequence: m(jc), cmsSequence: m(gc), otherMsgSequence: m(hc)}, "PKI RESPONSE");
    La.prototype = {
        GostPrivateKeyInfo: Jc,
        GostSubjectPublicKeyInfo: Va,
        GostKeyContainer: td,
        GostKeyContainerName: ud,
        GostPrivateKeys: vd,
        GostPrivateMasks: wd,
        ViPNetInfo: xd,
        GostSignature: Zc,
        GostEncryptedKey: pd,
        GostWrappedPrivateKey: Gc,
        PrivateKeyInfo: Wa,
        EncryptedPrivateKeyInfo: xb,
        SubjectPublicKeyInfo: ma,
        TBSCertificate: Bb,
        Certificate: ka,
        CertificationRequestInfo: Cb,
        CertificationRequest: Db,
        TBSCertList: Fb,
        CertificateList: $a,
        AttributeCertificateInfo: Jb,
        AttributeCertificate: Kb,
        SignedAttributes: Ha,
        UnsignedAttributes: Pb,
        ContentInfo: va,
        SafeContents: Wb,
        AuthenticatedSafe: ie,
        PFX: ke,
        PKIData: Me,
        PKIResponse: Ne
    };
    x.asn1 = new La;
    return La
});
/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (m, v) {
    "function" === typeof define && define.amd ? define(["gostCrypto", "gostASN1"], v) : "object" === typeof exports ? module.exports = v(require("gostCrypto"), require("gostASN1")) : m.GostCert = v(m.gostCrypto, m.GostASN1)
})(this, function (m) {
    function v(a) {
        for (var b = 1, c = arguments.length; b < c; b++) {
            var d = arguments[b];
            if ("object" === typeof d) for (var e in d) d.hasOwnProperty(e) && (a[e] = d[e])
        }
        return a
    }

    function t(a) {
        var b = function () {
        };
        b.prototype = a.prototype;
        for (var b = [new b], c = 1; c < arguments.length; c++) b.push(arguments[c]);
        return v.apply(this, b)
    }

    function w(a) {
        var b = new O;
        b.setHours(0, 0, 0, 0);
        a && b.setDate(b.getDate() + a);
        return b
    }

    function q(a) {
        try {
            a()
        } catch (b) {
        }
    }

    function P() {
        var a = new Uint8Array(4);
        m.getRandomValues(a);
        a[0] &= 127;
        return Q.Int16.encode(a)
    }

    function B(a, b) {
        for (var c in a) if (a[c] !== b[c]) return !1;
        for (c in b) if (a[c] !== b[c]) return !1;
        return !0
    }

    function x(a, b) {
        var c = a.extensions && a.extensions.subjectKeyIdentifier, d;
        if ((d = a && b && (!b.issuer || B(a.issuer, b.issuer)) && (!b.serialNumber || G(a.serialNumber, b.serialNumber))) &&
            !(d = !b.subjectKeyIdentifier)) a:if (d = b.subjectKeyIdentifier, c = new Uint8Array(c), d = new Uint8Array(d), c.length !== d.length) d = !1; else {
            for (var e = 0, f = c.length; e < f; e++) if (c[e] !== d[e]) {
                d = !1;
                break a
            }
            d = !0
        }
        return d && (!b.subject || B(a.subject, b.subject)) && (!b.date || a.notBefore.getTime() <= b.date.getTime() && a.notAfter.getTime() > b.date.getTime())
    }

    function C(a, b, c) {
        a = {subject: a.issuer, date: c};
        if (b = b && b.authorityKeyIdentifier) a.subjectKeyIdentifier = b.keyIdentifier, b.authorityCertIssuer && b.authorityCertIssuer[0] && b.authorityCertSerialNumber &&
        (a.issuer = b.authorityCertIssuer[0], a.serialNumber = b.authorityCertSerialNumber);
        return a
    }

    function A(a, b) {
        for (var c = [], d = 0, e = a.length; d < e; d++) x(a[d], b) && c.push(a[d]);
        return c
    }

    function H(a, b) {
        return (!b.issuer || B(a.issuer, b.issuer)) && (!b.date || a.thisUpdate.getTime() < b.date.getTime())
    }

    function I(a, b) {
        for (var c = [], d = 0, e = a.length; d < e; d++) H(a[d], b) && c.push(a[d]);
        return c
    }

    function E(a) {
        a = a.id;
        for (var b in s) {
            var c = s[b];
            if (c.publicKey.id === a) return c
        }
    }

    function J(a, b, c) {
        for (var d in b) {
            var e = a, f = d, g = b[d];
            "object" !==
            typeof g && (g = {value: g});
            void 0 !== c && (g.enumerable = c);
            y.defineProperty(e, f, g)
        }
    }

    function t(a, b, c, d) {
        "function" !== typeof b && (d = c, c = b, b = function () {
            a.apply(this, arguments)
        });
        b.prototype = y.create(a.prototype, {constructor: {value: b}, superclass: {value: a.prototype}});
        c && J(b.prototype, c, !0);
        if (a !== y) for (var e in a) b[e] = a[e];
        b.super = a;
        d && J(b, d, !0);
        return b
    }

    function r() {
    }

    function K(a) {
        try {
            h.CertificationRequest.call(this, a, !0)
        } catch (b) {
            a = a || {}, h.CertificationRequest.call(this, {
                version: 0,
                subject: a.subject || l.subject,
                subjectPublicKeyInfo: a.subjectPublicKeyInfo || {
                    algorithm: {id: "noSignature"},
                    subjectPublicKey: new D(0)
                },
                attributes: a.attributes || {
                    extensionRequest: {
                        keyUsage: l.userKeyUsage,
                        extKeyUsage: l.userExtKeyUsage
                    }
                },
                signatureAlgorithm: {id: "noSignature"},
                signatureValue: new D(0)
            })
        }
    }

    function L(a, b) {
        this.certificates = a || [];
        this.crls = b || []
    }

    function M(a) {
        this.certStore = a
    }

    function F() {
    }

    function N(a, b, c) {
        this.trustedCACerts = a || [];
        this.requireCRL = b || !1;
        this.requireCA = c || !0
    }

    var n = this.Promise, y = this.Object, D = this.ArrayBuffer,
        O = this.Date, k = m.subtle, Q = m.coding, h = m.asn1, s = m.security.providers, G = function () {
            var a = function (a) {
                var b = typeof a;
                return "undefined" === b || "" === a ? "0" : "number" === b || a instanceof Number ? a.toString(16).toLowerCase() : a.replace("0x", "").toLowerCase()
            }, b = function (a, b) {
                return (Array(b + 1).join("0") + a).slice(-b)
            };
            return function (c, d) {
                c = a(c);
                d = a(d);
                var e = Math.max(c.length, d.length);
                return b(c, e) === b(d, e)
            }
        }(), l = {
            providerName: "CP-01",
            subject: {countryName: "RU", commonName: "Anonymous"},
            caKeyUsage: "digitalSignature nonRepudiation keyEncipherment dataEncipherment keyAgreement keyCertSign cRLSign".split(" "),
            caExtKeyUsage: "serverAuth clientAuth codeSigning emailProtection ipsecEndSystem ipsecTunnel ipsecUser timeStamping OCSPSigning".split(" "),
            userKeyUsage: ["digitalSignature", "nonRepudiation", "keyEncipherment", "dataEncipherment", "keyAgreement"],
            userExtKeyUsage: ["clientAuth", "emailProtection"],
            days: 7305
        };
    r.prototype.options = l;
    var u = function (a) {
        try {
            h.Certificate.call(this, a, !0)
        } catch (b) {
            try {
                a = new h.CertificationRequest(a, !0)
            } catch (c) {
            }
            a = a || {};
            h.Certificate.call(this, {
                version: 2,
                serialNumber: a.serialNumber ||
                    P(),
                signature: a.signature || {id: "noSignature"},
                issuer: a.subject || l.subject,
                notBefore: a.notBefore || w(),
                notAfter: a.notAfter || w(a.days || l.days),
                subject: a.subject || l.subject,
                subjectPublicKeyInfo: a.subjectPublicKeyInfo || {
                    algorithm: {id: "noSignature"},
                    subjectPublicKey: new D(0)
                },
                extensions: a.attributes && (a.attributes.extensionRequest || a.attributes.msCertExtensions) || a.extensions,
                signatureAlgorithm: {id: "noSignature"},
                signatureValue: new D(0)
            })
        }
    };
    t(h.Certificate, u, {
        sign: function (a, b) {
            var c = this, d = c.subjectPublicKeyInfo;
            return (new n(q)).then(function () {
                if (!d || !d.algorithm || "noSignature" === d.algorithm) throw Error("Key pair was not generated for the certificate");
                if (!a) throw Error("The private key of the issuer is not defined");
                b = b || c;
                return k.digest("SHA-1", d.subjectPublicKey)
            }).then(function (d) {
                var f = b.getProvider() || s[l.providerName];
                c.signature && "noSignature" !== c.signature.id || (c.signature = f.signature);
                c.signatureAlgorithm = c.signature;
                c.issuer = b.subject;
                c.extensions || (c.extensions = {});
                var f = c.extensions, g = b.extensions;
                if (c === b) f.keyUsage = f.keyUsage || l.caKeyUsage, f.extKeyUsage = f.extKeyUsage || l.caExtKeyUsage, f.basicConstraints = f.basicConstraints || {cA: !0}; else {
                    if (!b.checkUsage("keyCertSign", c.notBefore)) throw Error("The issuer's certificate is not valid for signing a certificate");
                    f.keyUsage = f.keyUsage || l.userKeyUsage;
                    f.extKeyUsage = f.extKeyUsage || l.userExtKeyUsage;
                    f.basicConstraints = f.basicConstraints || {cA: 0 <= f.keyUsage.indexOf("keyCertSign")};
                    if (f.basicConstraints.cA) {
                        var h = g && g.basicConstraints && g.pathLenConstraint;
                        if (void 0 !== h) if (0 < h) f.basicConstraints.pathLenConstraint = h - 1; else throw Error("Path length constraint exceeded");
                    }
                }
                f.subjectKeyIdentifier = d;
                g && g.subjectKeyIdentifier && (f.authorityKeyIdentifier = {
                    keyIdentifier: g.subjectKeyIdentifier,
                    authorityCertIssuer: [b.issuer],
                    authorityCertSerialNumber: b.serialNumber
                });
                return k.importKey("pkcs8", a.encode(), a.privateKeyAlgorithm, !1, ["sign"])
            }).then(function (a) {
                return k.sign(c.signatureAlgorithm, a, c.tbsCertificate.encode())
            }).then(function (a) {
                c.signatureValue = a;
                return c
            })
        },
        generate: function (a) {
            var b = this, c, d;
            (d = a ? s[a] : this.getProvider() || s[l.providerName]) && (a = v(d.publicKey, {privateKey: d.privateKey}));
            return (new n(q)).then(function () {
                return k.generateKey(a, "true", ["sign", "verify"])
            }).then(function (a) {
                c = a.privateKey;
                return k.exportKey("spki", a.publicKey)
            }).then(function (a) {
                b.subjectPublicKeyInfo = new h.SubjectPublicKeyInfo(a);
                return k.exportKey("pkcs8", c)
            }).then(function (a) {
                return new h.PrivateKeyInfo(a)
            })
        }, getPublicKey: function () {
            var a = this.subjectPublicKeyInfo, b = "rsaEncryption" ===
            a.algorithm.id ? ["verify"] : ["verify", "deriveKey", "deriveBits"];
            return k.importKey("spki", a.encode(), a.algorithm, "false", b)
        }, getProvider: function () {
            return E(this.subjectPublicKeyInfo.algorithm)
        }, verify: function (a, b, c) {
            var d = this, e = d.extensions;
            return (new n(q)).then(function () {
                c = c || w();
                if (d.notBefore.getTime() > c.getTime() || d.notAfter.getTime() <= c.getTime()) throw Error("The certificate has not yet started or expired");
                for (var b in e) if (e[b].critical && 0 > "authorityKeyIdentifier subjectKeyIdentifier keyUsage certificatePolicies policyMappings basicConstraints nameConstraints policyConstraints extKeyUsage".split(" ").indexOf(b)) throw Error("The critical extension '" +
                    b + "' is unrecognized");
                b = C(d, e, d.notBefore);
                !a && x(d, b) && (a = d);
                if (a) {
                    if (!x(a, b) || !a.checkUsage("keyCertSign", d.notBefore)) throw Error("The issuer's certificate is not valid");
                    return a.verifySignature(d.tbsCertificate.encode(), d.signatureValue, d.signatureAlgorithm)
                }
                return !0
            }).then(function (a) {
                if (!a) throw Error("The certificate has invalid signature");
                if (b) {
                    if (!H(b, {issuer: d.issuer, date: c})) throw Error("The issuer's CRL is not valid");
                    if (b.isRevoked(d.serialNumber)) throw Error("The certificate is revoked");
                }
                return d
            })
        }, verifySignature: function (a, b, c) {
            return this.getPublicKey().then(function (d) {
                return k.verify(c, d, b, a)
            })
        }, checkUsage: function (a, b) {
            var c = this.extensions;
            b = b || w();
            return this.notBefore.getTime() <= b.getTime() && this.notAfter.getTime() > b.getTime() && (!c || !(0 < ["keyCertSign", "cRLSign"].indexOf(a) && c.basicConstraints && !c.basicConstraints.cA || c.keyUsage && 0 > c.keyUsage.indexOf(a) && c.extKeyUsage && 0 > c.extKeyUsage.indexOf(a)))
        }
    });
    r.prototype.X509 = u;
    var z = function (a) {
        z.super.call(this, a);
        this.version ||
        (this.version = 1);
        this.revokedCertificates || (this.revokedCertificates = []);
        this.thisUpdate || (this.thisUpdate = w())
    };
    t(h.CertificateList, z, {
        sign: function (a, b) {
            var c = this;
            return (new n(q)).then(function () {
                if (!a) throw Error("The issuer's private key is not defined");
                if (!b) throw Error("The issuer's certificate is not defined");
                if (!c.issuer) c.issuer = b.issuer; else if (!B(c.issuer, b.issuer)) throw Error("The CRL prototype and authority certificate have different issuers");
                if (!b.checkUsage("cRLSign", c.thisUpdate)) throw Error("The issuer's certificate is not valid for signing a CRL");
                var d = b.getProvider() || s[l.providerName];
                c.signature || (c.signature = d.signature);
                c.signatureAlgorithm = c.signature;
                c.issuer = b.subject;
                c.crlExtensions || (c.crlExtensions = {});
                var d = c.crlExtensions, e = b.extensions;
                e && e.subjectKeyIdentifier && (d.authorityKeyIdentifier = {
                    keyIdentifier: e.subjectKeyIdentifier,
                    authorityCertIssuer: [b.issuer],
                    authorityCertSerialNumber: b.serialNumber
                });
                d.cRLNumber = d.cRLNumber || 0;
                return k.importKey("pkcs8", a.encode(), a.privateKeyAlgorithm, !1, ["sign"])
            }).then(function (a) {
                return k.sign(c.signatureAlgorithm,
                    a, c.tbsCertList.encode())
            }).then(function (a) {
                c.signatureValue = a;
                return c
            })
        }, verify: function (a, b) {
            var c = this, d = c.crlExtensions;
            return (new n(q)).then(function () {
                b = b || w();
                if (!c.thisUpdate.getTime() > b.getTime()) throw Error("The CRL has not yet started");
                if (a) {
                    if (!x(a, C(c, d, c.thisUpdate)) || !a.checkUsage("cRLSign", c.thisUpdate)) throw Error("The issuer's certificate is not valid");
                    if (!c.signatureValue || !c.signatureAlgorithm) throw Error("The has no signature");
                    return a.verifySignature(c.tbsCertList.encode(),
                        c.signatureValue, c.signatureAlgorithm)
                }
            }).then(function (a) {
                if (!a) throw Error("The CRL has invalid signature");
                return c
            })
        }, isRevoked: function (a, b) {
            var c = this.revokedCertificates;
            b = b || w();
            for (var d = 0; d < c.length; d++) if (b.getTime() >= c[d].revocationDate.getTime() && G(c[d].userCertificate, a)) return !0;
            return !1
        }
    });
    r.prototype.CRL = z;
    t(h.CertificationRequest, K, {
        generate: function (a) {
            var b = this, c, d;
            (d = a ? s[a] : this.getProvider() || s[l.providerName]) && (a = v(d.publicKey, {privateKey: d.privateKey}));
            return (new n(q)).then(function () {
                return k.generateKey(a,
                    "true", ["sign", "verify"])
            }).then(function (a) {
                c = a.privateKey;
                return k.exportKey("spki", a.publicKey)
            }).then(function (a) {
                b.subjectPublicKeyInfo = new h.SubjectPublicKeyInfo(a);
                return k.exportKey("pkcs8", c)
            }).then(function (a) {
                c = new h.PrivateKeyInfo(a);
                return b.sign(c)
            }).then(function () {
                return c
            })
        }, getProvider: function () {
            return E(this.subjectPublicKeyInfo.algorithm)
        }, sign: function (a) {
            var b = this, c = b.subjectPublicKeyInfo;
            return (new n(q)).then(function () {
                if (!c || !c.algorithm || "noSignature" === c.algorithm) throw Error("Key pair was not generated for the certificate");
                if (!a) throw Error("The private key is not defined");
                var d = E(c.algorithm) || s[l.providerName];
                b.signatureAlgorithm = d.signature;
                return k.importKey("pkcs8", a.encode(), a.privateKeyAlgorithm, !1, ["sign"])
            }).then(function (a) {
                return k.sign(b.signatureAlgorithm, a, b.requestInfo.encode())
            }).then(function (a) {
                b.signatureValue = a;
                return b
            })
        }, verify: function () {
            var a = this, b = a.subjectPublicKeyInfo;
            return (new n(q)).then(function () {
                return k.importKey("spki", b.encode(), b.algorithm, "false", ["verify"])
            }).then(function (b) {
                return k.verify(a.signatureAlgorithm,
                    b, a.signatureValue, a.requestInfo.encode())
            }).then(function (b) {
                if (!b) throw Error("The certification request has invalid signature");
                return a
            })
        }
    });
    r.prototype.Request = K;
    t(y, L, {
        getCertificates: function (a) {
            return A(this.certificates, a)
        }, getCRLs: function (a) {
            return I(this.certificates, a)
        }, load: function (a) {
            var b = new h.ContentInfo(a);
            a = b.certificates;
            for (var b = b.crls, c = 0; c < a.length; c++) this.certificates.push(new u(a[c]));
            for (c = 0; c < b.length; c++) this.crls.push(new z(b[c]));
            return this
        }, store: function () {
            return new h.ContentInfo({
                contentType: "signedData",
                version: 0,
                digestAlgorithms: [],
                encapContentInfo: {contentType: "data"},
                certificates: this.certs,
                crls: this.crls,
                signerInfos: []
            })
        }
    });
    r.prototype.CertStore = L;
    t(y, M, {
        build: function (a, b) {
            var c = this;
            return (new n(q)).then(function () {
                for (var d = new u(a), e = [], f = !1, g = []; d;) {
                    var h = [], k = [];
                    e.push(d);
                    if (!f) {
                        var h = c.certStore.getCRLs({issuer: d.issuer, date: b}), l = C(d, d.extensions, d.notBefore);
                        x(d, l) ? f = !0 : k = c.certStore.getCertificates(l)
                    }
                    k = 0 < k.length && new u(k[0]);
                    (h = 0 < h.length && new z(h[0])) && g.push(h.verify(k, b));
                    g.push(d.verify(k,
                        h, b));
                    d = k
                }
                if (!f) throw Error("Root certificate is not found");
                return n.all(g).then(function (a) {
                    for (var b = 0; b < a; b++) if (!a[b]) throw Error("Certification path is not validated");
                    return e
                })
            })
        }
    });
    r.prototype.CertPath = M;
    t(y, F, {
        getValidCertificate: function (a, b, c) {
        }
    });
    r.prototype.CertificateTrustPolicy = F;
    t(F, N, {
        getValidCertificate: function (a, b, c, d) {
            var e = this, f;
            return (new n(q)).then(function () {
                b = b || [];
                c = c || [];
                var g = A(e.trustedCACerts, a);
                if (0 < g.length) return new u(g[0]);
                g = A(b, a);
                if (0 !== g.length) {
                    var g = new u(g[0]),
                        h = !1, k = [];
                    for (f = []; g;) {
                        var l = [], p = [];
                        f.push(g);
                        if (!h) {
                            l = I(c, {issuer: g.issuer, date: d});
                            if (0 === l.length && e.requireCRL) return;
                            a = C(g, g.extensions, g.notBefore);
                            p = A(e.trustedCACerts, a);
                            if (0 === p.length) {
                                if (!x(g, a)) if (p = A(b, a), 0 < p.length) {
                                    var m = p[0].extensions;
                                    if (e.requireCA && (!m || !m.basicConstraints || !m.basicConstraints.cA || void 0 !== m.basicConstraints.pathLenConstraint && m.basicConstraints.pathLenConstraint < f.length - 1)) return
                                } else return
                            } else h = !0
                        }
                        p = 0 < p.length && new u(p[0]);
                        (l = 0 < l.length && new z(l[0])) && k.push(l.verify(p,
                            d));
                        k.push(g.verify(p, l, d));
                        g = p
                    }
                    if (!h) throw Error("Trusted root certificate is not found");
                    return n.all(k).then(function (a) {
                        for (var b = 0; b < a; b++) if (!a[b]) throw Error("Certification path is not validated");
                        return f[0]
                    })
                }
            })
        }
    });
    r.prototype.TrustedCAPolicy = N;
    m.cert = new r;
    return r
});
/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (p, k) {
    "function" === typeof define && define.amd ? define(["gostCrypto", "gostASN1", "gostCert"], k) : "object" === typeof exports ? module.exports = k(require("gostCrypto"), require("gostASN1"), require("gostCert")) : p.GostCMS = k(p.gostCrypto, p.GostASN1, p.GostCert)
})(this, function (p) {
    function k() {
        for (var a = {}, b = 0, c = arguments.length; b < c; b++) {
            var d = arguments[b];
            if ("object" === typeof d) for (var e in d) d.hasOwnProperty(e) && (a[e] = d[e])
        }
        return a
    }

    function P(a, b, c) {
        for (var d in b) {
            var e = a, f = d, g = b[d];
            "object" !== typeof g &&
            (g = {value: g});
            void 0 !== c && (g.enumerable = c);
            D.defineProperty(e, f, g)
        }
    }

    function y(a, b, c, d) {
        "function" !== typeof b && (d = c, c = b, b = function () {
            a.apply(this, arguments)
        });
        b.prototype = D.create(a.prototype, {constructor: {value: b}, superclass: {value: a.prototype}});
        c && P(b.prototype, c, !0);
        if (a !== D) for (var e in a) b[e] = a[e];
        b.super = a;
        d && P(b, d, !0);
        return b
    }

    function l(a) {
        try {
            a()
        } catch (b) {
        }
    }

    function E(a, b) {
        var c = new Uint8Array(a), d = new Uint8Array(b);
        if (c.length !== d.length) return !1;
        for (var e = 0, f = c.length; e < f; e++) if (c[e] !==
            d[e]) return !1;
        return !0
    }

    function F(a, b) {
        for (var c in a) if (a[c] !== b[c]) return !1;
        for (c in b) if (a[c] !== b[c]) return !1;
        return !0
    }

    function G(a, b, c) {
        for (var d = !1, e = 0, f = a.length; e < f; e++) if (c(a[e], b)) {
            d = !0;
            break
        }
        d || a.push(b)
    }

    function H(a, b) {
        var c = a.content;
        switch (a.contentType) {
            case "data":
                a.content = b.content;
                break;
            case "digestedData":
            case "signedData":
            case "authData":
                c.encapContentInfo = {eContentType: b.contentType, eContent: b.content};
                break;
            case "envelopedData":
            case "encryptedData":
                c.encryptedContentInfo = {
                    contentType: b.contentType,
                    encryptedContent: b.content
                }
        }
    }

    function Q(a) {
        var b = a.content;
        switch (a.contentType) {
            case "data":
                return {contentType: a.contentType, content: a.content};
            case "digestedData":
            case "signedData":
            case "authData":
                return a = b.encapContentInfo, {contentType: a.eContentType, content: a.eContent};
            case "envelopedData":
            case "encryptedData":
                return a = b.encryptedContentInfo, {contentType: a.contentType, content: a.encryptedContent}
        }
    }

    function I(a) {
        var b;
        if (a) {
            if ("string" === typeof a) try {
                a = A.PEM.decode(a)
            } catch (c) {
                a = A.Chars.decode(a)
            }
            if (a instanceof
                w) try {
                a = t.ContentInfo.decode(a)
            } catch (d) {
                a = {contentType: "data", content: a}
            }
            b = a.contentType;
            if (!b) throw Error("Invalid content object");
            a = a.content;
            a instanceof w || (a = a.encode());
            return {contentType: b, content: a}
        }
        return a = {contentType: "data"}
    }

    function z(a) {
        try {
            a = new t.ContentInfo(a.content, !0)
        } catch (b) {
        }
        switch (a.contentType) {
            case "data":
                return new q(a);
            case "digestedData":
                return new J(a);
            case "signedData":
                return new K(a);
            case "encryptedData":
                return new L(a);
            case "envelopedData":
                return new M(a);
            default:
                return new t.ContentInfo(a)
        }
    }

    function B(a, b) {
        return a instanceof w ? b.extensions && E(a, b.extensions.subjectKeyIdentifier) : F(b.issuer, a.issuer) && N(b.serialNumber, a.serialNumber)
    }

    function C(a) {
        a = new Uint8Array(a);
        p.getRandomValues(a);
        return a.buffer
    }

    function T(a) {
        switch (a.id) {
            case "pbeWithSHAAnd40BitRC2-CBC":
            case "pbeWithSHAAnd128BitRC2-CBC":
                return 8;
            case "pbeUnknownGost":
                return 16;
            case "sha1":
                return 20;
            default:
                return 32
        }
    }

    function R(a, b) {
        if (!b) return new w(0);
        if (b instanceof w) return b;
        if ("string" !== typeof b) throw Error("The password must be string or raw data type");
        if (0 <= a.name.indexOf("CPKDF")) {
            for (var c = [], d = 0; d < b.length; d++) {
                var e = b.charCodeAt(d);
                c.push(e & 255);
                c.push(e >>> 8 & 255);
                c.push(0);
                c.push(0)
            }
            return (new Uint8Array(c)).buffer
        }
        return 0 <= a.name.indexOf("PFXKDF") ? A.Chars.decode(b + "\x00", "unicode") : A.Chars.decode(b, "utf8")
    }

    function x() {
    }

    function q(a, b) {
        t.ContentInfo.call(this, a || b || {contentType: "data"});
        if (b && this.contentType !== (b.contentType || "data")) throw Error("Invalid content type");
    }

    function J(a) {
        q.call(this, a, {
            contentType: "digestedData", version: 0, digestAlgorithm: v[r.providerName].digest,
            encapContentInfo: {eContentType: "data"}, digest: new w(0)
        })
    }

    function K(a) {
        q.call(this, a, {
            contentType: "signedData",
            version: 1,
            digestAlgorithms: [],
            encapContentInfo: {eContentType: "data"},
            signerInfos: []
        })
    }

    function L(a) {
        q.call(this, a, {
            contentType: "encryptedData",
            version: 0,
            encryptedContentInfo: {contentType: "data", contentEncryptionAlgorithm: v[r.providerName].encryption}
        })
    }

    function M(a) {
        q.call(this, a, {
            contentType: "envelopedData",
            version: 0,
            recipientInfos: [],
            encryptedContentInfo: {contentType: "data", contentEncryptionAlgorithm: v[r.providerName].encryption}
        })
    }

    var m = this.Promise, D = this.Object, w = this.ArrayBuffer, U = this.Date, h = p.subtle, t = p.asn1, A = p.coding,
        V = p.cert, v = p.security.providers, N = function () {
            var a = function (a) {
                var b = typeof a;
                return "undefined" === b || "" === a ? "0" : "number" === b || a instanceof Number ? a.toString(16).toLowerCase() : a.replace("0x", "").toLowerCase()
            }, b = function (a, b) {
                return (Array(b + 1).join("0") + a).slice(-b)
            };
            return function (c, d) {
                c = a(c);
                d = a(d);
                var e = Math.max(c.length, d.length);
                return b(c, e) === b(d, e)
            }
        }(), r = {providerName: "CP-01", autoAddCert: !1, useKeyIdentifier: !1};
    x.prototype.options = r;
    y(t.ContentInfo, q, {
        isDetached: {value: !1, enumerable: !0, writable: !0}, writeDetached: function (a) {
            this.isDetached = a
        }, encode: function (a) {
            if (this.isDetached) {
                var b = Q(this);
                H(this, {contentType: b.contentType});
                a = t.ContentInfo.method("encode").call(this, a);
                H(this, b);
                return a
            }
            return t.ContentInfo.method("encode").call(this, a)
        }, encloseContent: function (a) {
            var b = this;
            return (new m(l)).then(function () {
                b.setEnclosed(a);
                return b
            })
        }, setEnclosed: function (a) {
            H(this, I(a))
        }, getEnclosed: function () {
            return z(Q(this))
        }
    });
    x.prototype.DataContentInfo = q;
    y(q, J, {
        encloseContent: function (a, b) {
            var c = this;
            return (new m(l)).then(function () {
                c.setEnclosed(a);
                if (b) {
                    var d = v[b];
                    c.digestAlgorithm = d && d.digest || b
                }
                return h.digest(c.digestAlgorithm, c.encapContentInfo.eContent)
            }).then(function (a) {
                c.digest = a
            })
        }, verify: function (a) {
            var b = this;
            return (new m(l)).then(function () {
                a && b.setEnclosed(a);
                if (!b.encapContentInfo || !b.encapContentInfo.eContent) throw Error("Detached content is not found");
                return h.digest(b.digestAlgorithm, b.encapContentInfo.eContent)
            }).then(function (a) {
                if (!E(a,
                    b.digest)) throw Error("Message digest is not verified");
                return z({contentType: b.encapContentInfo.eContentType, content: b.encapContentInfo.eContent})
            })
        }
    });
    x.prototype.DigestedDataContentInfo = J;
    y(q, K, {
        addSignature: function (a, b, c, d) {
            var e = this, f, g, n;
            return (new m(l)).then(function () {
                if (!a || !b) throw Error("Signer key or certificate is not defined");
                b instanceof Array ? (n = b, b = n[0]) : n = [b];
                var s = b.getProvider() || v[r.providerName],
                    S = r.useKeyIdentifier && b.extensions && b.extensions.subjectKeyIdentifier;
                g = e.encapContentInfo.eContent;
                f = {
                    version: S ? 2 : 0,
                    sid: S ? b.extensions.subjectKeyIdentifier : {issuer: b.issuer, serialNumber: b.serialNumber},
                    digestAlgorithm: s.digest,
                    signatureAlgorithm: b.subjectPublicKeyInfo.algorithm
                };
                d && (f.unsignedAttrs = d);
                if (c) return "object" !== typeof c && (c = {}), h.digest(f.digestAlgorithm, g)
            }).then(function (b) {
                b && (c.contentType = e.encapContentInfo.eContentType, c.messageDigest = b, c.signingTime = new U, f.signedAttrs = c, g = t.SignedAttributes.encode(f.signedAttrs));
                return h.importKey("pkcs8", t.PrivateKeyInfo.encode(a), a.privateKeyAlgorithm,
                    !1, ["sign"])
            }).then(function (a) {
                var b = k(f.signatureAlgorithm, {hash: f.digestAlgorithm});
                return h.sign(b, a, g)
            }).then(function (a) {
                f.signatureValue = a;
                G(e.digestAlgorithms, f.digestAlgorithm, function (a, b) {
                    return a.id === b.id
                });
                if (r.autoAddCert) {
                    e.certificates || (e.certificates = []);
                    a = 0;
                    for (var b = n.length; a < b; a++) G(e.certificates, n[a], function (a, b) {
                        return F(a.issuer, b.issuer) && N(a.serialNumber, b.serialNumber)
                    })
                }
                e.signerInfos.push(f)
            })
        }, isDegenerate: {
            get: function () {
                return !(this.signerInfos && 0 < this.signerInfos.length)
            }
        },
        verify: function (a, b) {
            var c = this, d;
            return (new m(l)).then(function () {
                b && c.setEnclosed(b);
                if (!c.signerInfos || 0 === c.signerInfos.length) throw Error("No signatures found");
                return m.all(c.signerInfos.map(function (b, d) {
                    var g = b.sid, g = g instanceof w ? {subjectKeyIdentifier: g} : {
                        issuer: g.issuer,
                        serialNumber: g.serialNumber
                    }, h;
                    b.signedAttrs && b.signedAttrs.signingTime && (h = b.signedAttrs.signingTime);
                    return a.getValidCertificate(g, c.certificates, c.crls, h).catch(function () {
                    })
                }))
            }).then(function (a) {
                var b = [];
                a.forEach(function (a) {
                    a &&
                    b.push(c.verifySignature(a).then(function (a) {
                        d = a
                    }, function () {
                    }))
                });
                if (0 === b.length) throw Error("Valid verification path not found");
                return m.all(b)
            }).then(function () {
                if (!d) throw Error("Verification path found but no valid signature");
                return d
            })
        }, verifySignature: function (a, b) {
            var c = this, d, e, f;
            return (new m(l)).then(function () {
                b && c.setEnclosed(b);
                e = c.encapContentInfo && c.encapContentInfo.eContent;
                if (!e) throw Error("Detached content is not found");
                for (var g = 0; g < c.signerInfos.length; g++) if (B(c.signerInfos[g].sid,
                    a)) {
                    d = c.signerInfos[g];
                    break
                }
                if (!d) throw Error("Signature not found for the certificate");
                if (d.signedAttrs) {
                    f = d.signedAttrs.messageDigest;
                    if (!f) throw Error("Message digest must present in signed attributes");
                    e = d.signedAttrs.encode()
                }
                if (!e) throw Error("Data for verification not found");
                g = k(d.signatureAlgorithm, {hash: d.digestAlgorithm});
                return a.verifySignature(e, d.signatureValue, g)
            }).then(function (a) {
                if (!a) throw Error("Signature not verified");
                if (d.signedAttrs) return h.digest(d.digestAlgorithm, c.encapContentInfo.eContent)
            }).then(function (a) {
                if (a &&
                    !E(a, f)) throw Error("Message digest not verified");
                return z({contentType: c.encapContentInfo.eContentType, content: c.encapContentInfo.eContent})
            })
        }
    });
    x.prototype.SignedDataContentInfo = K;
    y(q, L, {
        encloseContent: function (a, b, c) {
            var d = this, e, f;
            return (new m(l)).then(function () {
                a = I(a);
                if (!a.content) throw Error("Content for encryption must be specified");
                var d = "string" === typeof b ? "pbes" : "encryption";
                if (c) {
                    var n = v[c];
                    c = n && n[d] || c
                } else c = v[r.providerName][d];
                if (c.derivation) {
                    f = k(c.derivation);
                    e = k(c.encryption);
                    f.salt = C(T(c));
                    var s;
                    return h.importKey("raw", R(f, b), f, !1, ["deriveKey", "deriveBits"]).then(function (a) {
                        s = a;
                        if (0 <= f.name.indexOf("PFXKDF")) return f.diversifier = 2, h.deriveBits(f, s, 64)
                    }).then(function (a) {
                        a && (e.iv = a);
                        f.diversifier = 1;
                        return h.deriveKey(f, s, e, !1, ["encrypt"])
                    }).then(function (a) {
                        return a
                    })
                }
                e = k(c);
                if (b instanceof w) return h.importKey("raw", b, e, !1, ["encrypt"]);
                if ("secret" === b.type) return b;
                throw Error("Content encryption key must be raw data or secret key type");
            }).then(function (b) {
                e.iv || (e.iv =
                    C(8));
                return h.encrypt(e, b, a.content)
            }).then(function (b) {
                c.derivation ? (delete f.diversifier, c = k(c, {derivation: f, encryption: e})) : c = e;
                d.encryptedContentInfo = {
                    contentType: a.contentType,
                    contentEncryptionAlgorithm: c,
                    encryptedContent: b
                };
                return d
            })
        }, getEnclosed: function (a, b) {
            var c = this, d, e, f;
            return (new m(l)).then(function () {
                b && c.setEnclosed(b);
                f = c.encryptedContentInfo.encryptedContent;
                if (!f) throw Error("Encrypted content must be specified");
                d = k(c.encryptedContentInfo.contentEncryptionAlgorithm);
                if (d.derivation) {
                    e =
                        k(d.derivation);
                    d = k(d.encryption);
                    var g;
                    return h.importKey("raw", R(e, a), e, !1, ["deriveKey", "deriveBits"]).then(function (a) {
                        g = a;
                        if (0 <= e.name.indexOf("PFXKDF")) return e.diversifier = 2, h.deriveBits(e, g, 64)
                    }).then(function (a) {
                        a && (d.iv = a);
                        e.diversifier = 1;
                        return h.deriveKey(e, g, d, !1, ["decrypt"])
                    })
                }
                if (a instanceof w) return h.importKey("raw", a, d, !1, ["decrypt"]);
                if ("secret" === a.type) return a;
                throw Error("Decryption key must be raw data or secret key type");
            }).then(function (a) {
                return h.decrypt(d, a, f)
            }).then(function (a) {
                return z({
                    contentType: c.encryptedContentInfo.contentType,
                    content: a
                })
            })
        }
    });
    x.prototype.EncryptedDataContentInfo = L;
    y(q, M, {
        encloseContent: function (a, b) {
            var c = this;
            return (new m(l)).then(function () {
                a = I(a);
                if (!a.content) throw Error("Content for encryption must be specified");
                if (b) {
                    var c = v[b];
                    b = c && c.encryption || b
                } else b = v[r.providerName].encryption;
                return h.generateKey(b, !0, ["encrypt"])
            }).then(function (d) {
                c.contentEncryptionKey = d;
                b.iv || (b.iv = C(8));
                return h.encrypt(b, d, a.content)
            }).then(function (d) {
                c.encryptedContentInfo = {
                    contentType: a.contentType, contentEncryptionAlgorithm: b,
                    encryptedContent: d
                };
                return c
            })
        }, addRecipient: function (a, b, c, d) {
            var e = this, f, g, n, s;
            return (new m(l)).then(function () {
                a = new V.X509(a);
                b && "string" !== typeof b && !b.algorithm && (d = c, c = b, b = void 0);
                g = b ? v[b] : a.getProvider();
                if (!e.contentEncryptionKey) throw Error("The content encryption key is not assigned");
                if (d) {
                    var f;
                    d instanceof Array ? (f = d, d = f[0]) : f = [d];
                    if (r.autoAddCert) {
                        e.originatorInfo ? e.originatorInfo.certs || (e.originatorInfo.certs = []) : e.originatorInfo = {certs: []};
                        for (var O = 0, n = f.length; O < n; O++) G(e.originatorInfo.certs,
                            f[O], function (a, b) {
                                return F(a.issuer, b.issuer) && N(a.serialNumber, b.serialNumber)
                            })
                    }
                    g ? b = k(g.agreement) : g = a.getProvider();
                    if (a.subjectPublicKeyInfo.algorithm.namedCurve !== d.subjectPublicKeyInfo.algorithm.namedCurve) throw Error("The sender and the recipient have different public key algorithms");
                    return h.importKey("pkcs8", c.encode(), c.privateKeyAlgorithm, !1, ["deriveKey"])
                }
                g ? b = k(a.subjectPublicKeyInfo.algorithm) : g = a.getProvider();
                return h.generateKey(b, !0, ["deriveKey"]).then(function (a) {
                    b["public"] = a.publicKey;
                    return a.privateKey
                })
            }).then(function (b) {
                f = b;
                return h.importKey("spki", a.subjectPublicKeyInfo.encode(), a.subjectPublicKeyInfo.algorithm, !1, ["deriveKey", "deriveBits"])
            }).then(function (a) {
                b.ukm = C(8);
                n = k(g.agreement, {sBox: b.sBox, ukm: b.ukm, "public": a});
                s = k(b.wrapping || g.wrapping, {ukm: b.ukm});
                return h.deriveKey(n, f, s, !0, ["wrapKey"])
            }).then(function (a) {
                b.wrapping = s;
                return h.wrapKey("raw", e.contentEncryptionKey, a, s)
            }).then(function (c) {
                var f = r.useKeyIdentifier && a.extensions && a.extensions.subjectKeyIdentifier ?
                    a.extensions.subjectKeyIdentifier : {issuer: a.issuer, serialNumber: a.serialNumber};
                if (d) {
                    var g = d.subjectPublicKeyInfo;
                    c = {
                        version: 3,
                        originator: {algorithm: g.algorithm, publicKey: g.subjectPublicKey},
                        ukm: b.ukm,
                        keyEncryptionAlgorithm: b,
                        recipientEncryptedKeys: [{rid: f, encryptedKey: t.GostEncryptedKey(b).encode(c)}]
                    }
                } else c = {
                    version: 0,
                    rid: f,
                    keyEncryptionAlgorithm: b,
                    encryptedKey: t.GostEncryptedKey(b).encode({algorithm: b, sessionEncryptedKey: c})
                };
                e.recipientInfos.push(c);
                return e
            })
        }, getEnclosed: function (a, b, c, d) {
            var e =
                this, f, g, n, s, p;
            return (new m(l)).then(function () {
                var a = b.getProvider();
                c && e.setEnclosed(c);
                g = e.encryptedContentInfo.encryptedContent;
                if (!g) throw Error("Encrypted content must be specified");
                p = e.encryptedContentInfo.contentEncryptionAlgorithm;
                for (var m = 0; m < e.recipientInfos.length; m++) {
                    var l = e.recipientInfos[m], u = k(l.keyEncryptionAlgorithm);
                    if (l.rid) {
                        if (B(l.rid, b)) return m = t.GostEncryptedKey(u).decode(l.encryptedKey).object, f = m.sessionEncryptedKey, u = k(u, m.algorithm), n = k(a.agreement, {
                            ukm: u.ukm,
                            sBox: u.sBox
                        }),
                            s = k(a.wrapping, u.wrapping, {ukm: u.ukm}), u["public"]
                    } else {
                        var q = l.recipientEncryptedKeys;
                        if (q) for (var r = 0; r < q.length; r++) if (B(q[r].rid, b)) {
                            u = k(a.agreement, u, {ukm: l.ukm});
                            f = t.GostEncryptedKey(u).decode(q[r].encryptedKey).object;
                            n = u;
                            s = k(u.wrapping || a.wrapping, {ukm: l.ukm});
                            a = l.originator;
                            if (a.algorithm) return a = new t.SubjectPublicKeyInfo({
                                algorithm: a.algorithm,
                                subjectPublicKey: a.publicKey
                            }), h.importKey("spki", a.encode(), a.algorithm, !1, ["deriveKey", "deriveBits"]);
                            if (d && B(a, d)) return importKey("pkcs", d.subjectPublicKeyInfo.encode(),
                                d.subjectPublicKeyInfo.algorithm, !1, ["deriveKey", "deriveBits"]);
                            throw Error("Originator certificate not specified or not valid");
                        }
                    }
                }
                throw Error("Recipient not found or format not supported");
            }).then(function (b) {
                n["public"] = b;
                return h.importKey("pkcs8", a.encode(), a.privateKeyAlgorithm, !1, ["deriveKey", "deriveBits"])
            }).then(function (a) {
                return h.deriveKey(n, a, s, !0, ["unwrapKey"])
            }).then(function (a) {
                return h.unwrapKey("raw", f, a, s, p, !1, ["decrypt"])
            }).then(function (a) {
                return h.decrypt(p, a, g)
            }).then(function (a) {
                return z({
                    contentType: e.encryptedContentInfo.contentType,
                    content: a
                })
            })
        }
    });
    x.prototype.EnvelopedDataContentInfo = M;
    p.cms = new x;
    return x
});
/*
 2014-2016, Rudolf Nickolaev. All rights reserved.
*/
(function (u, r) {
    "function" === typeof define && define.amd ? define(["gostCrypto", "gostASN1", "gostCert", "gostCMS"], r) : "object" === typeof exports ? module.exports = r(require("gostCrypto"), require("gostASN1"), require("gostCert"), require("gostCMS")) : u.GostKeys = r(u.gostCrypto, u.GostASN1, u.GostCert, u.GostCMS)
})(this, function (u) {
    function r() {
        for (var a = {}, b = 0, c = arguments.length; b < c; b++) {
            var d = arguments[b];
            if ("object" === typeof d) for (var e in d) d.hasOwnProperty(e) && (a[e] = d[e])
        }
        return a
    }

    function L(a, b, c) {
        for (var d in b) {
            var e =
                a, h = d, f = b[d];
            "object" !== typeof f && (f = {value: f});
            void 0 !== c && (f.enumerable = c);
            D.defineProperty(e, h, f)
        }
    }

    function A(a, b, c, d) {
        "function" !== typeof b && (d = c, c = b, b = function () {
            a.apply(this, arguments)
        });
        b.prototype = D.create(a.prototype, {constructor: {value: b}, superclass: {value: a.prototype}});
        c && L(b.prototype, c, !0);
        if (a !== D) for (var e in a) b[e] = a[e];
        b.super = a;
        d && L(b, d, !0);
        return b
    }

    function B(a) {
        a = new Uint8Array(a);
        u.getRandomValues(a);
        return a.buffer
    }

    function p(a) {
        try {
            a()
        } catch (b) {
        }
    }

    function M(a) {
        if (a instanceof
            E) return a;
        if (a && a.buffer && a.buffer instanceof E) return 0 === a.byteOffset && a.byteLength === a.buffer.byteLength ? a.buffer : (new Uint8Array(new Uint8Array(a, a.byteOffset, a.byteLength))).buffer;
        throw new DataError("CryptoOperationData required");
    }

    function N(a) {
        var b = new U;
        a && b.setDate(b.getDate() + a);
        return b
    }

    function Q(a) {
        a = N(a);
        a.setHours(0, 0, 0, 0);
        return a
    }

    function y(a, b) {
        var c = new Uint8Array(a), d = new Uint8Array(b);
        if (c.length !== d.length) return !1;
        for (var e = 0, h = c.length; e < h; e++) if (c[e] !== d[e]) return !1;
        return !0
    }

    function G(a, b) {
        var c = new Uint8Array(a, b, 4);
        return c[3] << 24 | c[2] << 16 | c[1] << 8 | c[0]
    }

    function I(a, b, c) {
        a = new Uint8Array(a, b, 4);
        a[3] = c >>> 24;
        a[2] = c >>> 16 & 255;
        a[1] = c >>> 8 & 255;
        a[0] = c & 255;
        return a
    }

    function V(a) {
        switch (a.id) {
            case "pbeWithSHAAnd40BitRC2-CBC":
            case "pbeWithSHAAnd128BitRC2-CBC":
                return 8;
            case "pbeUnknownGost":
                return 16;
            case "sha1":
                return 20;
            default:
                return 32
        }
    }

    function R(a, b) {
        if (!b) return new E(0);
        if (0 <= a.name.indexOf("CPKDF")) {
            for (var c = [], d = 0; d < b.length; d++) {
                var e = b.charCodeAt(d);
                c.push(e & 255);
                c.push(e >>> 8 & 255);
                c.push(0);
                c.push(0)
            }
            return (new Uint8Array(c)).buffer
        }
        return 0 <= a.name.indexOf("PFXKDF") ? w.Chars.decode(b + "\x00", "unicode") : w.Chars.decode(b, "utf8")
    }

    function x() {
    }

    function v(a) {
        m.PrivateKeyInfo.call(this, a)
    }

    function F(a) {
        m.EncryptedPrivateKeyInfo.call(this, a)
    }

    function J(a) {
        if (a) {
            var b = this;
            ["mk.db3", "masks.db3", "kek.opq", "rand.opq"].forEach(function (c) {
                b[c] = a[c]
            })
        }
    }

    function O(a, b) {
        m.GostWrappedPrivateKey.call(this, a);
        J.call(this, b)
    }

    function S(a) {
        a && (this.header = m.GostKeyContainer.decode(a.header),
            this.name = m.GostKeyContainerName.decode(a.name), this.primary = m.GostPrivateKeys.decode(a.primary), this.masks = m.GostPrivateMasks.decode(a.masks), a.primary2 && a.masks2 && (this.primary2 = m.GostPrivateKeys.decode(a.primary2), this.masks2 = m.GostPrivateMasks.decode(a.masks2)))
    }

    function H(a) {
        m.ViPNetInfo.call(this, a || {
            version: 3,
            keyInfo: {keyClass: 1, keyType: 43556, flags: 1},
            defenceKeyInfo: {keyClass: 1024, keyType: 24622, keyUID: B(32), flags: -2147483648}
        })
    }

    function P(a) {
        a && (a instanceof E || a.buffer instanceof E || "string" ===
            typeof a) ? this.decode(a) : (a = a || {}, this.fileType = a.fileType || "ITCS", this.fileVersion = a.fileVersion || 16, a.applicationHeader && (this.applicationHeader = a.applicationHeader), this.entries = a.entries || [])
    }

    function K(a) {
        m.PFX.call(this, a || {version: 3, authSafe: {contentType: "data"}})
    }

    function T(a) {
        this.entries = {};
        if (a) for (var b in a) this.setEntry(b, a[b])
    }

    var k = this.Promise, D = this.Object, E = this.ArrayBuffer, U = this.Date, g = u.subtle, m = u.asn1, w = u.coding,
        s = u.security.providers, q = u.cert, z = u.cms, C = {
            providerName: "CP-01",
            days: 7305
        };
    x.prototype.options = C;
    A(m.PrivateKeyInfo, v, {
        getPrivateKey: function () {
            var a = "rsaEncryption" === this.privateKeyAlgorithm.id ? ["sign"] : ["sign", "deriveKey", "deriveBits"];
            return g.importKey("pkcs8", this.encode(), this.privateKeyAlgorithm, "true", a)
        }, setPrivateKey: function (a) {
            var b = this;
            return g.exportKey("pkcs8", a).then(function (a) {
                m.PrivateKeyInfo.call(b, a);
                return b
            })
        }, generate: function (a, b) {
            var c = this;
            return (new k(p)).then(function () {
                a instanceof q.Request || (a = new q.Request(a));
                return a.generate(b)
            }).then(function (b) {
                m.PrivateKeyInfo.call(c,
                    b);
                return a
            })
        }
    });
    x.prototype.PKCS8 = v;
    A(m.EncryptedPrivateKeyInfo, F, {
        getKey: function (a) {
            var b = this, c;
            return (new k(p)).then(function () {
                c = new z.EncryptedDataContentInfo({
                    contentType: "encryptedData",
                    version: 0,
                    encryptedContentInfo: {
                        contentType: "data",
                        contentEncryptionAlgorithm: b.encryptionAlgorithm,
                        encryptedContent: b.encryptedData
                    }
                });
                return c.getEnclosed(a)
            }).then(function (a) {
                return v.decode(a.content)
            })
        }, getPrivateKey: function (a) {
            return this.getKey(a).then(function (a) {
                return a.getPrivateKey()
            })
        }, setKey: function (a,
                             b, c) {
            var d = this, e;
            return (new k(p)).then(function () {
                a = new v(a);
                e = new z.EncryptedDataContentInfo;
                return e.encloseContent(a.encode(), b, c || C.providerName)
            }).then(function () {
                d.encryptionAlgorithm = e.encryptedContentInfo.contentEncryptionAlgorithm;
                d.encryptedData = e.encryptedContentInfo.encryptedContent;
                return d
            })
        }, setPrivateKey: function (a, b, c) {
            var d = this;
            return (new v).setPrivateKey(a).then(function (a) {
                return d.setKey(a, b, c)
            })
        }, generate: function (a, b, c, d) {
            var e = this;
            return (new k(p)).then(function () {
                a instanceof
                q.Request || (a = new q.Request(a));
                return a.generate(c)
            }).then(function (a) {
                return e.setKey(a, b, d)
            }).then(function () {
                return a
            })
        }
    });
    x.prototype.PKCS8Encrypted = F;
    A(D, J, {
        getEncryptionKey: function (a) {
            var b = s["SC-01"].wrapping, c = s["SC-01"].encryption, d = s["SC-01"].derivation, e = this["masks.db3"],
                h = this["mk.db3"], f = this["kek.opq"];
            return (new k(p)).then(function () {
                if (!e || !h || !f) throw Error("Not enougth key container files");
                if (32 < e.byteLength) {
                    if (a) return g.importKey("raw", w.Chars.decode(a, "utf8"), d, !1, ["deriveKey",
                        "deriveBits"]).then(function (a) {
                        return g.deriveKey(r(d, {salt: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])}), a, c, !1, ["decrypt"])
                    }).then(function (a) {
                        return (new z.EncryptedDataContentInfo(e)).getEnclosed(a)
                    }).then(function (a) {
                        return a.verify()
                    }).then(function (a) {
                        return a.content
                    });
                    throw Error("Key password is required");
                }
                if (a) throw Error("Key password is not required");
                return e
            }).then(function (a) {
                e = a;
                a = new Uint8Array(h.byteLength + e.byteLength);
                a.set(new Uint8Array(h), 0);
                a.set(new Uint8Array(e), h.byteLength);
                return g.importKey("raw",
                    a.buffer, b, !1, ["unwrapKey"])
            }).then(function (a) {
                return g.unwrapKey("raw", f, a, b, c, !1, ["wrapKey", "unwrapKey"])
            })
        }, generateContainer: function (a) {
            var b = this, c = s["SC-01"].wrapping, d = s["SC-01"].encryption, e = s["SC-01"].derivation,
                h = s["SC-01"].digest, f, l;
            return (new k(p)).then(function () {
                return g.generateKey(c, !0, ["wrapKey"])
            }).then(function (c) {
                l = c;
                c = l.buffer.byteLength;
                b["mk.db3"] = (new Uint8Array(new Uint8Array(l.buffer, 0, c - 32))).buffer;
                c = (new Uint8Array(new Uint8Array(l.buffer, c - 32, 32))).buffer;
                if (a) {
                    var f =
                        new z.EncryptedDataContentInfo, k = new z.DigestedDataContentInfo;
                    return k.encloseContent(c, h).then(function () {
                        k = {contentType: "digestedData", content: k.encode()};
                        return g.importKey("raw", w.Chars.decode(a, "utf8"), e, !1, ["deriveKey", "deriveBits"])
                    }).then(function (a) {
                        return g.deriveKey(r(e, {salt: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])}), a, d, !1, ["encrypt"])
                    }).then(function (a) {
                        return f.encloseContent(k, a, d)
                    }).then(function () {
                        return f.encode()
                    })
                }
                return c
            }).then(function (a) {
                b["masks.db3"] = a;
                return g.generateKey(d,
                    !1, ["wrapKey", "unwrapKey"])
            }).then(function (a) {
                f = a;
                return g.wrapKey("raw", a, l, c)
            }).then(function (a) {
                b["kek.opq"] = a;
                return g.generateKey(d, !1, ["wrapKey", "unwrapKey"])
            }).then(function (a) {
                return g.wrapKey("raw", a, l, c)
            }).then(function (a) {
                b["rand.opq"] = a;
                return f
            })
        }
    });
    x.prototype.SignalComKeyContainer = J;
    A(m.GostWrappedPrivateKey, O, {
        getKey: function (a) {
            return this.getPrivateKey(a).then(function (a) {
                return (new v).setPrivateKey(a)
            })
        }, getPrivateKey: function (a) {
            var b = this, c = s["SC-01"].wrapping, d;
            return (new k(p)).then(function () {
                return b.getEncryptionKey(a,
                    !0)
            }).then(function (a) {
                return g.unwrapKey("raw", b.privateKeyWrapped, a, c, b.privateKeyAlgorithm, !0, ["sign", "deriveKey", "deriveBits"])
            }).then(function (a) {
                return (d = b.attributes && b.attributes["id-sc-gostR3410-2001-publicKey"]) ? g.generateKey(r(a.algorithm, {ukm: a.buffer}), a.extractable, a.usages) : {privateKey: a}
            }).then(function (a) {
                if (d && !y(a.publicKey.buffer, d)) throw Error("Check public key failed");
                return a.privateKey
            })
        }, setKey: function (a, b) {
            var c = this;
            return (new v(a)).getPrivateKey().then(function (a) {
                return c.setPrivateKey(a,
                    b)
            })
        }, setPrivateKey: function (a, b) {
            var c = this, d = s["SC-01"].wrapping, e;
            return (new k(p)).then(function () {
                return c.getEncryptionKey(b)["catch"](function () {
                    return c.generateContainer(b)
                })
            }).then(function (c) {
                return g.wrapKey("raw", a, c, d)
            }).then(function (c) {
                e = c;
                return g.generateKey(r(a.algorithm, {ukm: a.buffer}), !0, ["sign", "verify"])
            }).then(function (b) {
                c.object = {
                    version: 0,
                    privateKeyAlgorithm: a.algorithm,
                    privateKeyWrapped: e,
                    attributes: {"id-sc-gostR3410-2001-publicKey": b.publicKey.buffer}
                };
                return c
            })
        }, changePassword: function (a,
                                     b) {
            var c = this;
            return c.getPrivateKey(a).then(function (a) {
                return c.setPrivateKey(a, b)
            })
        }, generate: function (a, b, c) {
            var d = this, e;
            return (new k(p)).then(function () {
                a instanceof q.Request || (a = new q.Request(a));
                return a.generate(c)
            }).then(function (a) {
                e = a;
                return d.setKey(e, b)
            }).then(function () {
                return a
            })
        }
    });
    L(O.prototype, J.prototype);
    x.prototype.SignalComPrivateKeyInfo = O;
    A(D, S, function () {
        function a(a) {
            return !(0 <= a.name.indexOf("-94") || 0 <= a.name.indexOf("-2001") || 1994 === a.version || 2001 === a.version)
        }

        function b(c,
                   b, d) {
            var e = {
                name: "CPKDF",
                hash: a(c) ? "GOST R 34.11-256" : "GOST R 34.11-94/" + (c.sBox || "D-A"),
                salt: d,
                iterations: b ? 2E3 : 2
            };
            return g.importKey("raw", R(e, b), e, !1, ["deriveKey", "deriveBits"]).then(function (a) {
                return g.deriveKey(e, a, "GOST 28147", !1, ["sign", "verify", "encrypt", "decrypt"])
            })
        }

        function c(a, c, d) {
            var e = r({name: "GOST 28147-MAC"}, a.encParams);
            return b(a, c, d).then(function (a) {
                return g.sign(e, a, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
            })
        }

        function d(a, c) {
            var b = r({name: "GOST 28147-MAC"}, a.encParams),
                d = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            return g.importKey("raw", d, b, !1, ["sign"]).then(function (a) {
                return g.sign(b, a, c.encode())
            })
        }

        function e(a, c, b) {
            var d = r({name: "GOST 28147-MAC"}, a.encParams);
            a = 64 === c.byteLength ? (new Uint8Array(new Uint8Array(c, 32, 32))).buffer : c;
            return g.importKey("raw", a, d, !1, ["sign"]).then(function (a) {
                return g.sign(d, a, b)
            })
        }

        function h(a) {
            var c = r(a, {mode: "MASK"}), b, d = B(12);
            c.name = c.name.replace("-DH", "");
            return g.generateKey(c, !0, ["wrapKey",
                "unwrapKey"]).then(function (a) {
                return g.exportKey("raw", a)
            }).then(function (c) {
                b = c;
                return e(a, b, d)
            }).then(function (a) {
                return new m.GostPrivateMasks({mask: b, randomStatus: d, hmacRandom: a})
            })
        }

        function f(a) {
            return g.generateKey(r(a.algorithm, {ukm: a.buffer}), !0, ["sign", "verify"]).then(function (a) {
                return (new Uint8Array(new Uint8Array(a.publicKey.buffer, 0, 8))).buffer
            })
        }

        function l(a, c, b, d, e) {
            var h = {name: "GOST 28147-ECB", sBox: a.encParams && a.encParams.sBox}, l = r(a, {mode: "MASK"}), n;
            l.name = l.name.replace("-DH",
                "");
            var k;
            return g.decrypt(h, c, b).then(function (a) {
                k = a;
                return g.importKey("raw", d, l, "false", ["sign", "unwrapKey"])
            }).then(function (c) {
                return g.unwrapKey("raw", k, c, l, a, "true", ["sign"])
            }).then(function (a) {
                n = a;
                return f(n)
            }).then(function (a) {
                if (!y(a, e)) throw Error("Incorrect fp");
                return n
            })
        }

        function t(a, c, b, d) {
            var e = {name: "GOST 28147-ECB", sBox: a.encParams && a.encParams.sBox}, f = r(a, {mode: "MASK"});
            f.name = f.name.replace("-DH", "");
            return g.importKey("raw", d, f, !1, ["sign", "wrapKey"]).then(function (a) {
                return g.wrapKey("raw",
                    b, a, f)
            }).then(function (a) {
                return g.encrypt(e, c, a)
            })
        }

        function n(a, c, d, f, h) {
            var g = a.primaryPrivateKeyParameters.privateKeyAlgorithm;
            return (new k(p)).then(function () {
                if (c.hmacKey) throw Error("Old key format");
                if (12 > d.randomStatus.byteLength) throw Error("Invalid random status length");
                return e(g, d.mask, d.randomStatus)
            }).then(function (a) {
                if (!y(a, d.hmacRandom)) throw Error("Imita for mask is invalid");
                return b(g, f, new Uint8Array(d.randomStatus, 0, 12))
            }).then(function (b) {
                return h && c.secondaryKey ? l(a.secondaryPrivateKeyParameters.privateKeyAlgorithm,
                    b, c.secondaryKey, d.mask, a.secondaryFP) : l(g, b, c.primaryKey, d.mask, a.primaryFP)
            })
        }

        function W(a, c, d, e, f, h) {
            return b(a, e, new Uint8Array(d.randomStatus, 0, 12)).then(function (c) {
                return t(a, c, h, d.mask)
            }).then(function (a) {
                c || (c = new m.GostPrivateKeys);
                f ? c.secondaryKey = a : c.primaryKey = a;
                return c
            })
        }

        return {
            getKey: function (a, c) {
                return this.getPrivateKey(a, c).then(function (a) {
                    return (new v).setPrivateKey(a)
                })
            }, getPrivateKey: function (a, c) {
                var b = this, d = b.header.keyContainerContent;
                return n(d, b.primary, b.masks, a, c)["catch"](function (e) {
                    if (b.primary2 &&
                        b.masks2) return n(d, b.primary2, b.masks2, a, c);
                    throw e;
                })
            }, getCertificate: function (a) {
                var c = this.header.keyContainerContent;
                return (new k(p)).then(function () {
                    return a ? new q.X509(c.secondaryCertificate) : new q.X509(c.primaryCertificate)
                })
            }, getContainerName: function () {
                return this.name.containerName
            }, setKey: function (a, c, b, d) {
                var e = this;
                return (new v(a)).getPrivateKey().then(function (a) {
                    return e.setPrivateKey(a, c, b, d)
                })
            }, setPrivateKey: function (a, b, e, l) {
                var g = this, n, t;
                return (new k(p)).then(function () {
                    g.header =
                        g.header || new m.GostKeyContainer({
                            keyContainerContent: {
                                containerAlgoritmIdentifier: {algorithm: "id-CryptoPro-GostPrivateKeys-V2-Full"},
                                attributes: ["kccaReservePrimary", "kccaPrimaryKeyAbsent"],
                                extensions: {keyValidity: {notAfter: N(l || C.days)}}
                            }
                        });
                    n = g.header.keyContainerContent;
                    var c = e ? n.secondaryPrivateKeyParameters : n.primaryPrivateKeyParameters;
                    if (c) t = c.privateKeyAlgorithm; else if (t = r(a.algorithm, {
                        sBox: "D-A",
                        encParams: {block: "CFB", sBox: "E-A", keyMeshing: "CP"}
                    }), c = {
                        attributes: ["pkaExportable", "pkaExchange",
                            "pkaDhAllowed"], privateKeyAlgorithm: t
                    }, e) {
                        if (!n.primaryPrivateKeyParameters) throw Error("Primary key must be defined first");
                        n.secondaryPrivateKeyParameters = c
                    } else n.primaryPrivateKeyParameters = c, c = n.attributes.indexOf("kccaPrimaryKeyAbsent"), 0 <= c && n.attributes.splice(c, 1);
                    var b = [];
                    [0, 1].forEach(function (a) {
                        var c = "masks" + (0 < a ? "2" : "");
                        g[c] || b.push(h(t).then(function (a) {
                            g[c] = a
                        }))
                    });
                    return k.all(b)
                }).then(function () {
                    var c = [];
                    [0, 1].forEach(function (d) {
                        var f = "primary" + (0 < d ? "2" : "");
                        c.push(W(t, g[f], g["masks" +
                        (0 < d ? "2" : "")], b, e, a).then(function (a) {
                            g[f] = a
                        }))
                    });
                    return k.all(c)
                }).then(function () {
                    return f(a).then(function (a) {
                        e ? n.secondaryFP = a : n.primaryFP = a
                    })
                }).then(function () {
                    var a = n.attributes.indexOf("kccaSoftPassword");
                    if (b) return 0 > a && n.attributes.push("kccaSoftPassword"), c(t, b, n.primaryFP);
                    0 <= a && n.attributes.splice(a, 1)
                }).then(function (a) {
                    a && (n.hmacPassword = a);
                    return d(t, n)
                }).then(function (a) {
                    g.header.hmacKeyContainerContent = a;
                    return g
                })
            }, setCertificate: function (a, c, b) {
                var e = this, f, h;
                return (new k(p)).then(function () {
                    e.header =
                        e.header || new m.GostKeyContainer({
                            keyContainerContent: {
                                containerAlgoritmIdentifier: {algorithm: "id-CryptoPro-GostPrivateKeys-V2-Full"},
                                attributes: ["kccaReservePrimary", "kccaPrimaryKeyAbsent"],
                                extensions: {keyValidity: {notAfter: N(b || C.days)}}
                            }
                        });
                    f = e.header.keyContainerContent;
                    a = new q.X509(a);
                    h = f.primaryPrivateKeyParameters && f.primaryPrivateKeyParameters.privateKeyAlgorithm || r(a.subjectPublicKeyInfo.algorithm, {
                        sBox: "D-A",
                        encParams: {block: "CFB", sBox: "E-A", keyMeshing: "CP"}
                    });
                    return a.getPublicKey()
                }).then(function (b) {
                    if (c) {
                        if (f.secondaryFP &&
                            !y(f.secondaryFP, new Uint8Array(b.buffer, 0, f.secondaryFP.byteLength))) throw Error("The public key of the certificate does not match the private key");
                        f.secondaryCertificate = a
                    } else {
                        if (f.primaryFP && !y(f.primaryFP, new Uint8Array(b.buffer, 0, f.primaryFP.byteLength))) throw Error("The public key of the certificate does not match the private key");
                        f.primaryCertificate = a
                    }
                    return d(h, f)
                }).then(function (a) {
                    e.header.hmacKeyContainerContent = a;
                    return e
                })
            }, setContainerName: function (a) {
                this.name = new m.GostKeyContainerName({containerName: a})
            },
            verify: function (a) {
                var b = this, e, f;
                return (new k(p)).then(function () {
                    e = b.header.keyContainerContent;
                    f = e.primaryPrivateKeyParameters.privateKeyAlgorithm;
                    return d(f, e)
                }).then(function (d) {
                    if (!y(d, b.header.hmacKeyContainerContent)) throw Error("Container is not valid.");
                    d = 0 <= e.attributes.indexOf("kccaSoftPassword");
                    if (!a && d) throw Error("Password is required");
                    if (a && !d) throw Error("Password is not reqiured.");
                    return a ? c(f, a, e.primaryFP).then(function (a) {
                        if (!y(a, e.hmacPassword)) throw Error("Password is not valid.");
                        return b
                    }) : b
                })
            }, changePassword: function (a, c) {
                var b = this, d;
                return (new k(p)).then(function () {
                    d = b.header.keyContainerContent;
                    if (!d.primaryPrivateKeyParameters) throw Error("Private key not yet defined");
                    return b.getPrivateKey(a).then(function (a) {
                        return b.setPrivateKey(a, c)
                    })
                }).then(function () {
                    return d.secondaryPrivateKeyParameters ? b.getPrivateKey(a, !0).then(function (a) {
                        return b.setPrivateKey(a, c, !0)
                    }) : b
                })
            }, generate: function (a, c, b) {
                var d = this, e, f;
                return (new k(p)).then(function () {
                    a instanceof q.Request ||
                    (a = new q.Request(a));
                    return a.generate(b)
                }).then(function (a) {
                    f = a;
                    return d.setKey(f, c)
                }).then(function () {
                    e = new q.X509(a);
                    return e.sign(f)
                }).then(function () {
                    return d.setCertificate(e)
                }).then(function () {
                    return a
                })
            }, encode: function (a) {
                return {
                    header: this.header.encode(a),
                    name: this.name.encode(a),
                    masks: this.masks.encode(a),
                    primary: this.primary.encode(a),
                    masks2: this.masks2.encode(a),
                    primary2: this.primary2.encode(a)
                }
            }
        }
    }());
    x.prototype.CryptoProKeyContainer = S;
    A(m.ViPNetInfo, H, function () {
        function a(a) {
            void 0 ===
            a && (a = "");
            var c = w.Chars.decode(a, "win1251"), d;
            return g.digest("GOST R 34.11-94", c).then(function (a) {
                d = a;
                a = new Uint8Array(c.byteLength + d.byteLength);
                a.set(new Uint8Array(c), 0);
                a.set(new Uint8Array(d), c.byteLength);
                return g.digest("GOST R 34.11-94", a)
            }).then(function (a) {
                return g.importKey("raw", a, "GOST 28147", !1, ["unwrapKey"])
            }).then(function (a) {
                return g.unwrapKey("raw", d, a, "GOST 28147-MASK/VN", "GOST 28147-89", "false", ["encrypt", "decrypt", "sign", "verify"])
            })
        }

        return {
            getPrivateKey: function (b) {
                var c = this,
                    d, e;
                return (new k(p)).then(function () {
                    return b && "string" !== typeof b ? b : a(b)
                }).then(function (a) {
                    b = a;
                    d = c.keyPart;
                    e = new Uint8Array(d, 0, d.byteLength - 4 - 8);
                    a = new Uint8Array(d, e.byteLength, 4);
                    var f = c.keyInfo.encode(), l = new Uint8Array(e.byteLength + f.byteLength);
                    l.set(new Uint8Array(e), 0);
                    l.set(new Uint8Array(f), e.byteLength);
                    return g.verify({name: "GOST 28147-89-MAC"}, b, a, l)
                }).then(function (a) {
                    if (!a) throw Error("Invalid key password");
                    a = new Uint8Array(d, d.byteLength - 8, 8);
                    return g.decrypt({
                        name: "GOST 28147-89-CFB",
                        iv: a
                    }, b, e)
                }).then(function (a) {
                    var b = a.byteLength / 2;
                    if (c.keyInfo.keyClass & 0) return g.importKey("raw", new Int32Array(a, b, b), "GOST 28147", !1, ["unwrapKey"]).then(function (c) {
                        return g.unwrapKey("raw", new Int32Array(a, 0, b), c, "GOST 28147-MASK/VN", "GOST 28147-89", "false", ["encrypt", "decrypt", "sign", "verify"])
                    });
                    var d = c.keyInfo.algorithm || c.certificate && c.certificate.subjectPublicKeyInfo.algorithm;
                    if (!d) throw Error("Algorithm is not specified");
                    var e = r(d, {mode: "MASK", procreator: "VN"});
                    e.name = e.name.replace("-DH",
                        "");
                    var n = new Uint8Array(a, 0, b), k = new Uint8Array(a, b, b);
                    return g.importKey("raw", k, e, "false", ["sign", "unwrapKey"]).then(function (a) {
                        return g.unwrapKey("raw", n, a, e, d, "true", ["sign", "deriveBits", "deriveKey"])
                    }).then(function (a) {
                        return c.publicKey ? g.generateKey(r(a.algorithm, {ukm: a.buffer}), a.extractable, a.usages) : {privateKey: a}
                    }).then(function (a) {
                        if (c.publicKey && !y(a.publicKey.buffer, c.publicKey)) throw Error("Check public key failed");
                        return a.privateKey
                    })
                })
            }, setPrivateKey: function (b, c, d) {
                var e = this,
                    h, f, l, t;
                return (new k(p)).then(function () {
                    return c && "string" !== typeof c ? c : a(c)
                }).then(function (a) {
                    c = a;
                    a = b.algorithm;
                    e.keyInfo.algorithm = a;
                    e.keyInfo.serialNumber = B(16);
                    e.keyInfo.keyUID = B(8);
                    e.keyInfo.validity = {notBefore: Q(), notAfter: Q(d || C.days)};
                    if ("private" === b.type) return h = r(a, {
                        mode: "MASK",
                        procreator: "VN"
                    }), h.name = h.name.replace("-DH", ""), e.keyInfo.keyClass = 1, e.keyInfo.keyType = 43556, g.generateKey(r(a, {ukm: b.buffer}), !0, ["sign", "verify"]).then(function (a) {
                        e.publicKey = a.publicKey.buffer;
                        if (e.certificate) return a =
                            e.certificate.subjectPublicKeyInfo, g.importKey("spki", a.encode(), a.algorithm, !0, ["verify"])
                    }).then(function (a) {
                        a && !y(a.buffer, e.publicKey) && delete e.certificate
                    });
                    if ("secret" === b.type) h = "GOST 28147/MASK/VN", delete e.certificate, delete e.publicKey, e.keyInfo.keyClass = 64, e.keyInfo.keyType = 24622; else throw Error("Invalid key type");
                }).then(function () {
                    return g.generateKey(h, !0, ["wrapKey", "unwrapKey"])
                }).then(function (a) {
                    f = a;
                    return g.wrapKey("raw", b, f, h)
                }).then(function (a) {
                    l = new Uint8Array(2 * a.byteLength);
                    l.set(new Uint8Array(a));
                    return g.exportKey("raw", f)
                }).then(function (a) {
                    l.set(new Uint8Array(a), a.byteLength);
                    t = new Uint8Array(l.byteLength + 12);
                    a = {name: "GOST 28147-CFB", iv: B(8)};
                    t.set(new Uint8Array(a.iv), t.byteLength - 8);
                    return g.encrypt(a, c, l)
                }).then(function (a) {
                    t.set(new Uint8Array(a));
                    var b = e.keyInfo.encode(), d = new Uint8Array(a.byteLength + b.byteLength);
                    d.set(new Uint8Array(a), 0);
                    d.set(new Uint8Array(b), a.byteLength);
                    return g.sign({name: "GOST 28147-89-MAC"}, c, d)
                }).then(function (a) {
                    t.set(new Uint8Array(a),
                        t.byteLength - 12);
                    e.keyPart = t.buffer;
                    return e
                })
            }, encode: function (a) {
                var c = m.ViPNetInfo.method("encode").call(this),
                    d = new Uint8Array(8 + c.byteLength + this.keyPart.byteLength);
                I(d.buffer, 0, 4 + c.byteLength + this.keyPart.byteLength);
                d.set(new Uint8Array(c), 4);
                I(d.buffer, 4 + c.byteLength, this.keyPart.byteLength);
                d.set(new Uint8Array(this.keyPart), 8 + c.byteLength);
                return "PEM" === a ? w.Base64.encode(d.buffer) : d.buffer
            }
        }
    }(), {
        decode: function (a) {
            "string" === typeof a && (a = w.Base64.decode(a));
            a = M(a);
            var b = G(a, 0);
            if (a.byteLength !==
                b + 4) throw Error("Invalid container entry size");
            var c = w.BER.decode(new Uint8Array(a, 4, b)), b = m.ViPNetInfo.decode.call(this, c),
                c = c.header.byteLength + c.content.byteLength, d = G(a, 4 + c);
            if (a.byteLength !== c + d + 8) throw Error("Invalid container key part size");
            b.keyPart = (new Uint8Array(new Uint8Array(a, c + 8, d))).buffer;
            return b
        }
    });
    x.prototype.ViPNetContainerEntry = H;
    A(D, P, {
        getCertificate: function (a) {
            var b = this;
            return (new k(p)).then(function () {
                var c = b.entries[a || 0];
                if (!c) throw Error("Entry not defined");
                if (c.certificate) return new q.X509(c.certificate)
            })
        },
        getKey: function (a, b) {
            return this.getPrivateKey(a, b).then(function (a) {
                return (new v).setPrivateKey(a)
            })
        }, getPrivateKey: function (a, b) {
            var c = this;
            return (new k(p)).then(function () {
                var d = c.entries[b || 0];
                if (!d) throw Error("Entry not defined");
                return d.getPrivateKey(a)
            })
        }, setCertificate: function (a, b) {
            var c = this, d;
            return (new k(p)).then(function () {
                d = c.entries[b || 0] || (c.entries[b || 0] = new H);
                a = new q.X509(a);
                if (d.publicKey) return a.getPublicKey()
            }).then(function (b) {
                if (b && !y(d.publicKey, b.buffer)) throw Error("Invalid certificate for private key");
                d.certificate = a;
                return c
            })
        }, setKey: function (a, b, c, d) {
            var e = this;
            return (new v(a)).getPrivateKey().then(function (a) {
                return e.setPrivateKey(a, b, c, d)
            })
        }, setPrivateKey: function (a, b, c, d) {
            var e = this;
            return (new k(p)).then(function () {
                return (e.entries[c || 0] || (e.entries[c || 0] = new H)).setPrivateKey(a, b, d)
            }).then(function () {
                return e
            })
        }, changePassword: function (a, b) {
            var c = this;
            return (new k(p)).then(function () {
                return c.getPrivateKey(a).then(function (a) {
                    return c.setPrivateKey(a, b)
                })
            })
        }, generate: function (a, b, c) {
            var d =
                this, e, h;
            return (new k(p)).then(function () {
                a instanceof q.Request || (a = new q.Request(a));
                return a.generate(c)
            }).then(function (a) {
                h = a;
                return d.setKey(h, b)
            }).then(function () {
                e = new q.X509(a);
                return e.sign(h)
            }).then(function () {
                return d.setCertificate(e)
            }).then(function () {
                return a
            })
        }, encode: function (a) {
            var b = [], c = 0;
            this.entries.forEach(function (a) {
                a = a.encode();
                c += a.byteLength;
                b.push(a)
            });
            var d = this.applicationHeader ? this.applicationHeader.byteLength : 0, e = new Uint8Array(12 + d + c);
            e.set(new Uint8Array(w.Chars.decode(this.fileType,
                "ascii")));
            I(e.buffer, 4, this.fileVersion);
            I(e.buffer, 8, d);
            0 < d && e.set(new Uint8Array(this.applicationHeader), 12);
            var h = 12 + d;
            b.forEach(function (a) {
                e.set(new Uint8Array(a), h);
                h += a.byteLength
            });
            return "PEM" === a ? w.Base64.encode(e.buffer) : e.buffer
        }, decode: function (a) {
            a = this.constructor.decode(a);
            this.fileType = a.fileType;
            this.fileVersion = a.fileVersion;
            a.applicationHeader && (this.applicationHeader = a.applicationHeader);
            this.entries = a.entries
        }
    }, {
        encode: function (a, b) {
            return (new this(a)).encode(b)
        }, decode: function (a) {
            "string" ===
            typeof a && (a = w.Base64.decode(a));
            a = M(a);
            var b = w.Chars.encode(new Uint8Array(a, 0, 4), "ascii");
            if ("ITCS" !== b && "PKEY" !== b && "_CCK" !== b && "_LCK" !== b) throw Error("Unsupported ViPNet container type");
            var c = G(a, 4), d = c >>> 16;
            if (0 !== d && 1 !== d || 255 < (c & 65535)) throw Error("Unsupported ViPNet container version");
            var d = G(a, 8), e;
            0 < d && (e = M(new Uint8Array(a, 12, d)));
            for (var d = 12 + d, h = []; d < a.byteLength;) {
                var f = G(a, d);
                h.push(H.decode(new Uint8Array(a, d, f + 4)));
                d = d + f + 4
            }
            return new P({
                fileType: b, fileVersion: c, applicationHeader: e,
                entries: h
            })
        }
    });
    x.prototype.ViPNetContainer = P;
    A(m.PFX, K, function () {
        function a(a, b, e) {
            var h = {name: "HMAC", hash: a.hash};
            return g.importKey("raw", R(a, b), a, !1, ["deriveKey"]).then(function (b) {
                return g.deriveKey(a, b, h, !1, ["sign"])
            }).then(function (a) {
                return g.sign(h, a, e)
            })
        }

        function b(c, b, e, h) {
            return a(c, b, h).then(function (a) {
                if (!y(e, a)) throw Error("Invalid password, MAC is not verified");
            })
        }

        return {
            sign: function (c, b) {
                var e = this;
                return (new k(p)).then(function () {
                    if (c) {
                        var h, f, l;
                        b ? l = s[b] : b = s[C.providerName].digest;
                        l ? (h = l.digest, f = l.derivation) : (h = b, f = {name: "PFXKDF", hash: h, iterations: 2E3});
                        f = r(f, {salt: B(V(h)), diversifier: 3});
                        return a(f, c, e.authSafe.content).then(function (a) {
                            e.macData = {
                                mac: {digestAlgorithm: h, digest: a},
                                macSalt: f.salt,
                                iterations: f.iterations
                            };
                            return e
                        })
                    }
                    return e
                })
            }, verify: function (a) {
                var d = this, e = d.authSafe, h;
                return (new k(p)).then(function () {
                    if ("data" === e.contentType) {
                        if (d.macData) {
                            if (!a) throw Error("Password must be defined for the MAC verification");
                            h = {
                                name: "PFXKDF", hash: d.macData.mac.digestAlgorithm,
                                salt: d.macData.macSalt, iterations: d.macData.iterations, diversifier: 3
                            };
                            var f = d.authSafe.content, l = d.macData.mac.digest;
                            return b(h, a, l, f)["catch"](function () {
                                h.name = "PBKDF2";
                                return b(h, a, l, f)
                            })
                        }
                    } else throw Error("Unsupported format");
                }).then(function () {
                    return d
                })
            }
        }
    }());
    x.prototype.PKCS12 = K;
    A(D, T, {
        aliases: function () {
            var a = [], b;
            for (b in this.entries) a.push(b);
            return a
        }, containsAlias: function (a) {
            return !!this.entries[a]
        }, deleteEntry: function (a) {
            delete this.entries[a]
        }, setEntry: function (a, b) {
            var c = {};
            if (b.key) try {
                c.key =
                    new v(b.key, !0)
            } catch (d) {
                try {
                    c.key = new F(b.key, !0)
                } catch (e) {
                    if (b.key instanceof E) c.key = b.key; else throw Error("Unknown Key format");
                }
            }
            if (b.certs) {
                for (var h = b.certs instanceof Array ? b.certs : [b.certs], f = 0; f < h.length; f++) try {
                    h[f] = new q.X509(h[f])
                } catch (l) {
                }
                c.certs = h
            }
            if (b.crls) {
                h = b.crls instanceof Array ? b.crls : [b.crls];
                for (f = 0; f < h.length; f++) try {
                    h[f] = new q.CRL(h[f])
                } catch (g) {
                }
                c.crls = h
            }
            this.entries[a] = c
        }, getEntry: function (a) {
            return this.entries[a]
        }, load: function (a, b) {
            var c = this;
            return (new k(p)).then(function () {
                a =
                    new K(a);
                return a.verify(b)
            }).then(function () {
                if ("data" !== a.authSafe.contentType) throw Error("Unsupported PFX format");
                var c = [];
                m.AuthenticatedSafe.decode(a.authSafe.content).object.forEach(function (a) {
                    if ("data" === a.contentType) c.push(new z.DataContentInfo(a)); else if ("encryptedData" === a.contentType) c.push((new z.EncryptedDataContentInfo(a)).getEnclosed(b)); else throw Error("Unsupported PFX format");
                });
                return k.all(c)
            }).then(function (a) {
                var c = {};
                a.forEach(function (a) {
                    m.SafeContents.decode(a.content).object.forEach(function (a) {
                        var b =
                                w.Hex.encode(a.bagAttributes && a.bagAttributes.localKeyId || B(4), !0),
                            b = c[b] || (c[b] = {});
                        switch (a.bagId) {
                            case "keyBag":
                                b.key = new v(a.bagValue);
                                break;
                            case "pkcs8ShroudedKeyBag":
                                b.key = new F(a.bagValue);
                                break;
                            case "secretBag":
                                "secret" === a.bagValue.secretTypeId && (b.key = a.bagValue.secretValue);
                                break;
                            case "certBag":
                                var d = b.certs || (b.certs = []);
                                "x509Certificate" === a.bagValue.certId && d.push(new q.X509(a.bagValue.certValue));
                                break;
                            case "crlBag":
                                d = b.crls || (b.crls = []), "x509CRL" === a.bagValue.crlId && d.push(new q.CRL(a.bagValue.crlValue))
                        }
                        a.bagAttributes &&
                        a.bagAttributes.friendlyName && (b.friendlyName = a.bagAttributes.friendlyName)
                    })
                });
                a = [];
                for (var h in c) a.push(function (a) {
                    return a.key instanceof F ? a.key.getKey(b).then(function (b) {
                        a.key = b;
                        return a
                    })["catch"](function () {
                        return a
                    }) : a
                }(c[h]));
                return k.all(a)
            }).then(function (a) {
                a.forEach(function (a) {
                    var b = a.friendlyName;
                    if (b) delete a.friendlyName, c.entries[b] = a; else {
                        var b = c.entries, d;
                        d = new Uint8Array(B(16));
                        for (var g = "", k = 0; 16 > k; k++) g += ("00" + d[k].toString(16)).slice(-2);
                        d = g.substr(0, 8) + "-" + g.substr(8, 4) +
                            "-4" + g.substr(13, 3) + "-9" + g.substr(17, 3) + "-" + g.substr(20, 12);
                        b[d] = a
                    }
                });
                return c
            })
        }, store: function (a, b, c) {
            var d = this, e = [], g = [], f = [];
            return (new k(p)).then(function () {
                c = c ? s[c] ? s[c].pbes : c : b ? s[b] ? s[b].pbes : s[C.providerName].pbes : s[C.providerName].pbes;
                for (var f in d.entries) {
                    var m = new Uint32Array([1]), n = d.entries[f];
                    n.key && function (b, d) {
                        b instanceof E ? g.push({
                            bagId: "secretBag",
                            bagValue: {secretTypeId: "secret", secretValue: b, bagAttributes: d}
                        }) : b instanceof v ? c && a ? e.push((new F).setKey(b, a, c).then(function (a) {
                            return {
                                bagId: "pkcs8ShroudedKeyBag",
                                bagValue: a, bagAttributes: d
                            }
                        })) : e.push({
                            bagId: "keyBag",
                            bagValue: b,
                            bagAttributes: d
                        }) : b instanceof F && e.push({bagId: "pkcs8ShroudedKeyBag", bagValue: b, bagAttributes: d})
                    }(n.key, {localKeyId: m, friendlyName: f});
                    n.certs && n.certs.forEach(function (a) {
                        var b = {localKeyId: m};
                        a instanceof q.X509 && g.push({
                            bagId: "certBag",
                            bagValue: {certId: "x509Certificate", certValue: a},
                            bagAttributes: b
                        })
                    });
                    n.crls && n.crls.forEach(function (a) {
                        var b = {localKeyId: m};
                        a instanceof q.CRL && g.push({
                            bagId: "crlBag", bagValue: {crlId: "x509CRL", crlValue: a},
                            bagAttributes: b
                        })
                    })
                }
                if (0 < e.length) return k.all(e)
            }).then(function (b) {
                b && (b = m.SafeContents.encode(b), f.push(new z.DataContentInfo({contentType: "data", content: b})));
                if (0 < g.length) return g = m.SafeContents.encode(g), c && a ? (new z.EncryptedDataContentInfo).encloseContent(g, a, c) : (new z.DataContentInfo).encloseContent(g)
            }).then(function (c) {
                f.push(c);
                f = new m.AuthenticatedSafe(f);
                c = new K;
                c.authSafe = {contentType: "data", content: f.encode()};
                return c.sign(a, b)
            })
        }
    });
    x.prototype.KeyStore = T;
    u.keys = new x;
    return x
});
