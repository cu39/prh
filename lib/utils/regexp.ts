const regexpRegexp = /^\/(.*)\/([gimy]*)$/;

const hankakuAlphaNum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const zenkakuAlphaNum = "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ０１２３４５６７８９";

// http://www.tamasoft.co.jp/ja/general-info/unicode.html
export const jpHira = /[ぁ-ゖ]/;
export const jpKana = /[ァ-ヺ]/;
// http://tama-san.com/?p=196
export const jpKanji = /(?:[々〇〻\u3400-\u9FFF\uF900-\uFAFF]|[\uD840-\uD87F][\uDC00-\uDFFF])/;
export const jpChar = combine(jpHira, jpKana, jpKanji);

const regexpSpecialChars = "¥*+.?{}()[]^$-|/".split("");

export function concat(...args: (string | RegExp)[]): RegExp {
    const result = args.reduce<string>((p, c) => {
        if (typeof c === "string") {
            return p + c;
        } else if (c instanceof RegExp) {
            return p + c.source;
        } else {
            throw new Error(`unknown type: ${c}`);
        }
    }, "");
    return new RegExp(result);
}

export function combine(...args: (string | RegExp)[]): RegExp {
    const result = args.map(arg => {
        if (typeof arg === "string") {
            return arg;
        } else if (arg instanceof RegExp) {
            return arg.source;
        } else {
            throw new Error(`unknown type: ${arg}`);
        }
    }).join("|");
    return concat("(?:", result, ")");
}

export function addBoundary(arg: string | RegExp): RegExp {
    let result: string;
    if (typeof arg === "string") {
        result = arg;
    } else if (arg instanceof RegExp) {
        result = arg.source;
    } else {
        throw new Error(`unknown type: ${arg}`);
    }
    return concat("\\b", result, "\\b");
}

export function parseRegExpString(str: string): RegExp | null {
    const result = str.match(regexpRegexp);
    if (!result) {
        return null;
    }
    return new RegExp(result[1], result[2]);
}

export function spreadAlphaNum(str: string): RegExp {
    const result = str.split("").map(v => {
        const tmpIdx1 = hankakuAlphaNum.indexOf(v.toUpperCase());
        const tmpIdx2 = hankakuAlphaNum.indexOf(v.toLowerCase());
        if (tmpIdx1 === -1 && tmpIdx2 === -1) {
            // not alpha num
            return v;
        } else if (tmpIdx1 === tmpIdx2) {
            // num
            return `[${v}${zenkakuAlphaNum.charAt(tmpIdx1)}]`;
        } else {
            return `[${v.toUpperCase()}${v.toLowerCase()}${zenkakuAlphaNum.charAt(tmpIdx1)}${zenkakuAlphaNum.charAt(tmpIdx2)}]`;
        }
    }).join("");
    return new RegExp(result);
}

export function addDefaultFlags(regexp: RegExp) {
    let flags = "gm";
    if (regexp.ignoreCase) {
        flags += "i";
    }
    return new RegExp(regexp.source, flags);
}

export function escapeSpecialChars(str: string): string {
    regexpSpecialChars.forEach(char => {
        str = str.replace(new RegExp(`\\${char}g`), `\\${char}`);
    });
    return str;
}

export function collectAll(regexp: RegExp, src: string) {
    if (!regexp.global) {
        throw new Error("g flag is required");
    }
    const resultList: RegExpExecArray[] = [];
    let result: RegExpExecArray | null;
    do {
        result = regexp.exec(src);
        if (result) {
            resultList.push(result);
        }
    } while (result);

    return resultList;
}

export function equals(a: RegExp, b: RegExp) {
    if (a.source !== b.source) {
        return false;
    }
    if (a.global !== b.global) {
        return false;
    }
    if (a.ignoreCase !== b.ignoreCase) {
        return false;
    }
    if (a.multiline !== b.multiline) {
        return false;
    }

    return true;
}
