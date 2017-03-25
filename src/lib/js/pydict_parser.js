'use strict';

export default class PyDictParser
{
    constructor() {
        this._init();
    }

    _init() {
        this.at = 0;
        this.ch = ' ';
        this.escapee = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: 'b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t'
        };
        this.text = "";
    }

    _error(m) {
        throw {
            name: 'SyntaxError',
            message: m,
            at: this['at'],
            text: this['text']
        };
    }

    _next() {
        this['ch'] = this['text'].charAt(this['at']);
        this['at'] += 1;
        return this['ch'];
    }

    _nextIf(c) {
        if (c && c !== this['ch']) {
            this._error("Expected '" + c + "' instead of '" + this['ch'] + "'");
        }
        return this._next();
    }

    _skipSpace() {
       while (this['ch'] && this['ch'] <= ' ') {
          this._next();
       }
    }

    _parseString() {
        let string = '';
        let uffff;
        let quote;

        if (this['ch'] === '"' || this['ch'] === "'") {
            quote = this['ch'];
            while (this._next()) {
                // end of string
                if (this['ch'] === quote) {
                    this._next();
                    return string;
                }
                // escape character
                else if (this['ch'] === '\\') {
                    this._next();
                    // parse unicode
                    if (this['ch'] === 'u') {
                        uffff = 0;
                        for (let i = 0; i < 4; ++i) {
                            hex = parseInt(this._next(), 16);
                            if (!isFinite(hex)){
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    }
                    // parse escape character
                    else if (typeof escapee[this['ch']] === 'string') {
                        string += escapee[this['ch']];
                    }
                    else {
                        break;
                    }
                }
                else {
                    string += this['ch'];
                }
            }
        }
        this._error("Bad string");
    }

    _parseValue() {
        this._skipSpace();

        switch (this['ch']) {
            case '{':
                return this._parseObject();
            case '(':
                return this._parseList();
            case '"':
            case '\'':
                return this._parseString();
            case '-':
                return this._parseNumber();
            default:
                return this['ch'] >= '0' && this['ch'] <= '9' ? this._parseNumber() : this._parseWord();
        }
    }

    _parseNumber() {
        let number;
        let string = '';

        // '-'
        if (this['ch'] === '-') {
            string = '-';
            this._next('-');
        }
        // '0' - '9'
        while (this['ch'] >= '0' && this['ch'] <= '9') {
            string += this['ch'];
            this._next();
        }
        // '.XXXX'
        if (this['ch'] === '.') {
            string += '.';
            while (this._skipSpace() && this['ch'] >= '0' && this['ch'] <= '9') {
                string += this['ch'];
            }
        }
        // 'e' or 'E'
        if (this['ch'] === 'e' || this['ch'] === 'E') {
            string += this['ch'];
            this._next();
            if (this['ch'] === '-' || this['ch'] === '+') {
                string += this['ch'];
                this._next();
            }
            while (this['ch'] >= '0' && this['ch'] <= '9') {
                string += this['ch'];
                this._next();
            }
        }

        number = +string;
        if (isNaN(number)) {
            this._error("Bad number");
        }
        else {
            return number;
        }
    }

    _parseWord() {
        switch (this['ch']) {
            case 't':
                this._next('t');
                this._next('r');
                this._next('u');
                this._next('e');
                return true;
            case 'f':
                this._next('f');
                this._next('a');
                this._next('l');
                this._next('s');
                this._next('e');
                return false;
            case 'n':
                this._next('n');
                this._next('u');
                this._next('l');
                this._next('l');
                return null;
        }
        this._error("Unexpected '" + this['ch'] + "'");
    }

    _parseList() {
        let list = [];

        if (this['ch'] === '(') {
            this._nextIf('(');
            this._skipSpace();
            if (this['ch'] === ')') {
                this._nextIf(')');
                return list;
            }
            while (this['ch']) {
                list.push(this._parseValue());
                this._skipSpace();
                if (this['ch'] === ')') {
                    this._nextIf(')');
                    return list;
                }
                this._nextIf(',');
                this._skipSpace();
            }
        }
        this._error("Bad list");
    }

    _parseObject() {
        let key;
        let obj = {};

        if (this['ch'] === '{') {
            this._nextIf('{');
            this._skipSpace();
            if (this['ch'] === '}') {
                this._nextIf('}');
                return obj;
            }
            while (this['ch']) {
                key = this._parseString();
                this._skipSpace();
                this._nextIf(':');
                obj[key] = this._parseValue();
                this._skipSpace();
                if (this['ch'] === '}') {
                    this._nextIf('}');
                    return obj;
                }
                this._next(',');
                this._skipSpace();
                if (this['ch'] === '}') {
                    this._nextIf('}');
                    return obj;
                }
            }
        }
        this._error("Bad object");

        return {};
    }

    parse(text) {
        this._init();
        this['text'] = text;
        this._skipSpace();

        switch (this['ch']) {
            case '{':
                return this._parseObject();
            case '(':
                return this._parseList();
            case '"':
                return this._parseString();
            case '-':
                return this._parseNumber();
            default:
                return this['ch'] >= '0' && this['ch'] <= '9' ? this._parseNumber() : this._parseWord();
        }
    }
}
