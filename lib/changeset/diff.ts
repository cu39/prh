import { Rule } from "../rule";

export interface DiffParams {
    pattern: RegExp;
    expected?: string | string[]; // replaceが必要ないパターンの時渡されない場合がある
    index: number;
    matches: string[];
    rule?: Rule;
}

export class Diff {
    pattern: RegExp;
    expected?: string | string[];
    index: number;
    matches: string[];
    /** @internal */
    _newText?: string;
    _options?: string[];
    rule?: Rule;

    constructor(params: DiffParams) {
        this.pattern = params.pattern;
        this.expected = params.expected;
        this.index = params.index;
        this.matches = params.matches;
        this.rule = params.rule;
    }

    get tailIndex() {
        return this.index + this.matches[0].length;
    }

    get newText(): string | null {
        if (this._newText != null) {
            return this._newText;
        }

        if (this.expected == null) {
            return null;
        }

        if (this.expected instanceof Array) {
            return null;
        }

        const result = this.expected.replace(/\$([0-9]{1,2})/g, (match: string, g1: string) => {
            const index = parseInt(g1, 10);
            if (index === 0 || (this.matches.length - 1) < index) {
                return match;
            }
            return this.matches[index] || "";
        });
        this._newText = result;
        return this._newText;
    }

    get options(): string[] {
        if (this._newText != null) {
            return [this._newText];
        }

        if (this._options != null) {
            return this._options;
        }

        if (typeof this.expected === "string") {
            return this.newText ? [this.newText] : [];
        }

        if (Array.isArray(this.expected)) {
            const result = this.expected.map((exp) => {
                return exp.replace(/\$([0-9]{1,2})/g, (match: string, g1: string) => {
                    const index = parseInt(g1, 10);
                    if (index === 0 || (this.matches.length - 1) < index) {
                        return match;
                    }
                    return this.matches[index] || "";
                });
            });
            this._options = result;
            return this._options;
        } else {
            throw new TypeError();
        }
    }

    /**
     * Diffの結果を元の文章に反映する
     * @param content 置き換えたいコンテンツ
     * @param delta diffの処理対象の地点がいくつズレているか 複数diffを順次適用する場合に必要
     */
    apply(content: string, delta = 0): { replaced: string; newDelta: number; } | null {
        if (this.newText == null) {
            return null;
        }
        content = content.slice(0, this.index + delta) + this.newText + content.slice(this.index + delta + this.matches[0].length);
        delta += this.newText.length - this.matches[0].length;

        return {
            replaced: content,
            newDelta: delta,
        };
    }

    isEncloser(other: { index: number; tailIndex: number; }) {
        return this.index < other.index && other.tailIndex < this.tailIndex;
    }

    isCollide(other: { index: number; tailIndex: number; }) {
        if (other.index < this.index && this.index < other.tailIndex) {
            return true;
        }
        if (this.index < other.index && other.index < this.tailIndex) {
            return true;
        }
        return false;
    }

    isBefore(other: { index: number; }) {
        return this.index < other.index;
    }

    toJSON() {
        const result: any = {};
        Object.keys(this).forEach(key => {
            if (key[0] === "_") {
                return;
            }
            const value = (this as any)[key];
            if (value instanceof RegExp) {
                result[key] = `/${value.source}/${value.flags}`;
            } else {
                result[key] = value;
            }
        });
        return result;
    }
}
