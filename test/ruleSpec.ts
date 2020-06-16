import * as assert from "assert";

import { Rule } from "../lib/rule";

describe("Rule", () => {
    it("parse raw.Rule", () => {
        const rule = new Rule({
            expected: "vvakame",
        });

        assert(rule.pattern instanceof RegExp);
    });
    it("parse raw.Rule with expected array", () => {
        assert.throws(() => {
            new Rule({
                expected: ["vvakame", "cu39"],
            });
        }, {
                name: "Error",
            });
    });
    it("parse pattern same as patterns", () => {
        const ruleA = new Rule({
            expected: "vvakame",
            pattern: "/vvakame/i",
        });
        const ruleB = new Rule({
            expected: "vvakame",
            pattern: ["/vvakame/i"],
        });

        assert(ruleA.pattern.flags === ruleB.pattern.flags);
    });
    describe("#_patternToRegExp", () => {
        it("filled pattern from null, expected spread to alphabet, number", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: null,
            });

            assert(rule.pattern.source === "[VvＶｖ][VvＶｖ]");
            assert(rule.pattern.global === true);
        });
        it("filled pattern from null, expected spread to alphabet, number with word boundary", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: null,
                options: {
                    wordBoundary: true,
                },
            });

            assert(rule.pattern.source === "\\b[VvＶｖ][VvＶｖ]\\b");
            assert(rule.pattern.global === true);
        });
        it("filled pattern from string (not regexp style)", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: "vv",
            });

            assert(rule.pattern.source === "vv");
            assert(rule.pattern.global === true);
        });
        it("filled pattern from string (not regexp style)", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: "vv",
                options: {
                    wordBoundary: true,
                },
            });

            assert(rule.pattern.source === "\\bvv\\b");
            assert(rule.pattern.global === true);
        });

        it("filled pattern from string[], string with word boundary", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: [
                    "VV",
                    "AA",
                ],
                options: {
                    wordBoundary: true,
                },
            });

            assert(rule.pattern.source === "(?:\\bVV\\b|\\bAA\\b)");
            assert(rule.pattern.flags === "gmu");
            assert(rule.pattern.global === true);
        });
        it("filled pattern from string[] (regexp style), string with word boundary", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: [
                    "/VV/i",
                    "/AA/i",
                ],
                options: {
                    wordBoundary: true,
                },
            });

            assert(rule.pattern.source === "(?:\\bVV\\b|\\bAA\\b)");
            assert(rule.pattern.flags === "gimu");
            assert(rule.pattern.global === true);
        });
        it("filled pattern from string (regexp style)", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: "/vv/m",
            });

            assert(rule.pattern.source === "vv");
            assert(rule.pattern.global === true);
            assert(rule.pattern.multiline === true);
        });
        it("filled pattern from string[]", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: [
                    "/vv/",
                    "aa",
                ],
            });

            assert(rule.pattern.source === "(?:vv|aa)");
            assert(rule.pattern.global === true);
        });
        it("filled pattern**s** from string", () => {
            const rule = new Rule({
                expected: "vv",
                patterns: "vv",
            });

            assert(rule.pattern.source === "vv");
            assert(rule.pattern.global === true);
        });
        it("filled pattern**s** from string[]", () => {
            const rule = new Rule({
                expected: "vv",
                patterns: [
                    "/vv/",
                    "aa",
                ],
            });

            assert(rule.pattern.source === "(?:vv|aa)");
            assert(rule.pattern.global === true);
        });
        it("reject empty pattern", () => {
            try {
                new Rule({
                    expected: "vv",
                    pattern: "",
                });
            } catch (e) {
                return;
            }
            assert.fail("spec succeed unexpectedly");
        });
    });
    describe("#_shouldIgnore", () => {
        it("ignore expected only pattern", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: null,
            });

            assert(rule._shouldIgnore({ expected: "vv" }) === true);
        });
        it("ignore expected only pattern", () => {
            const rule = new Rule({
                expected: "vv",
                pattern: "vv",
            });

            assert(rule._shouldIgnore({ pattern: "/vv/gmu" }) === true);
        });
    });
    describe("#applyRule", () => {
        it("can process regexpMustEmpty", () => {
            const rule = new Rule({
                expected: "レイヤ",
                pattern: "/(プ)?レイヤー/",
                regexpMustEmpty: "$1",
                specs: [
                    {
                        from: "レイヤー",
                        to: "レイヤ",
                    },
                    {
                        from: "プレイヤー",
                        to: "プレイヤー",
                    },
                ],
            });
            const diffs = rule.applyRule("レイヤーとプレイヤー");
            assert(diffs.length === 1);
            assert(diffs[0].expected === "レイヤ");
        });
        it("can process regexpMustEmpty", () => {
            const rule = new Rule({
                expected: "Web",
            });
            const diffs = rule.applyRule("ここでWebです");
            assert(diffs.length === 0);
        });
    });
    describe("#check", () => {
        it("succeed spec", () => {
            new Rule({
                expected: "vvakame",
                specs: [{
                    from: "ＶＶＡＫＡＭＥ",
                    to: "vvakame",
                }],
            });
        });
        it("failed spec", () => {
            try {
                new Rule({
                    expected: "vvakame",
                    specs: [{
                        from: "masahiro",
                        to: "vvakame",
                    }],
                });
            } catch (e) {
                return;
            }
            assert.fail("spec succeed unexpectedly");
        });
    });
});
