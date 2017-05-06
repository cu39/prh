import * as fs from "fs";

import { equals } from "./utils/regexp";

import * as raw from "./raw";
import { Target } from "./target";
import { Rule } from "./rule";
import { makeChangeSet, ChangeSet } from "./changeset";

export class Engine {
    version: number;
    targets: Target[];
    rules: Rule[];

    constructor(src: raw.Config) {
        if (!src) {
            throw new Error("src is requried");
        }
        this.version = +src.version || 1;
        this.targets = (src.targets || []).map(target => new Target(target));
        this.rules = (src.rules || []).map(rule => new Rule(rule));
    }

    merge(other: Engine) {
        if (!other) {
            throw new Error("other is required");
        }
        if (this.version !== other.version) {
            throw new Error("version mismatch!");
        }
        other.targets.forEach(otherTarget => {
            const exists = this.targets.filter(target => equals(target.file, otherTarget.file)).length !== 0;
            if (!exists) {
                this.targets.push(otherTarget);
            }
        });
        // NOTE https://github.com/vvakame/prh/issues/18#issuecomment-222524140
        const reqRules = other.rules.filter(otherRule => {
            return this.rules.filter(rule => rule.expected === otherRule.expected).length === 0;
        });
        this.rules = this.rules.concat(reqRules);
    }

    makeChangeSet(filePath: string, contentArg?: string): ChangeSet {
        const content: string = contentArg != null ? contentArg : fs.readFileSync(filePath, { encoding: "utf8" });
        const diffs = this.rules.map(rule => rule.applyRule(content)).reduce((p, c) => p.concat(c), []);
        let changeSet = new ChangeSet({ filePath, content, diffs });

        let includes: ChangeSet | null = null;
        let excludes: ChangeSet | null = null;
        this.targets.forEach(target => {
            target.reset();
            if (!target.file.test(filePath)) {
                return;
            }
            if (target.includes.length !== 0) {
                // .ts の // の後や /* */ の内部だけ対象にしたい場合のための機能
                target.includes.forEach(include => {
                    const intersect = makeChangeSet(filePath, content, include.pattern);
                    if (includes) {
                        includes = includes.concat(intersect);
                    } else {
                        includes = intersect;
                    }
                });
            }
            if (target.excludes.length !== 0) {
                // .re の #@ の後を対象にしたくない場合のための機能
                target.excludes.forEach(exclude => {
                    const subsract = makeChangeSet(filePath, content, exclude.pattern);
                    if (excludes) {
                        excludes = excludes.concat(subsract);
                    } else {
                        excludes = subsract;
                    }
                });
            }
        });

        if (includes) {
            changeSet = changeSet.intersect(includes);
        }
        if (excludes) {
            changeSet = changeSet.subtract(excludes);
        }

        return changeSet;
    }

    replaceByRule(filePath: string, content?: string) {
        if (content == null) {
            content = fs.readFileSync(filePath, { encoding: "utf8" });
        }
        const changeSet = this.makeChangeSet(filePath, content);
        return changeSet.applyChangeSets(content);
    }
}
