'use strict';

// external modules
import * as LangES from 'lang/lang-es';

// own modules
import Logger from 'logger';
const logger = new Logger();

export default class BlamTranslations
{
    constructor() {
        this['dict'] = { "Default (English)": {} };
        this['currentLang'] = "Default (English)";

        this._buildDict();
    }

    _buildDict() {
        for (let key in LangES.langESDict) {
            this['dict'][key] = LangES.langESDict[key];
        }
    }

    supportedLanguages() {
        let langs = []
        for (let key in this['dict']) {
            langs.push(key);
        }
        return langs;
    }

    setLanguage(lang) {
        let supported = this.supportedLanguages();
        for (let i = 0; i < supported.length; ++i) {
            if (supported[i] == lang) {
                this['currentLang'] = lang;
                return true;
            }
        }

        return false;   // not supported
    }

    translate(key) {
        let lang = this['currentLang'];

        if (this['dict'][lang][key] === undefined) {
            return key;
        }

        return this['dict'][lang][key];
    }
}
