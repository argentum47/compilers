// grammer
// Numbers 12, 4.2
// Strings
// Symbols (variables)
// Operators (+ - =)
// Special puncs () {} =>


// utility.js

function display(lex) {
    for(let l of lex) {
        console.log(l)
    }    
}

function log(obj) {
    console.log(JSON.stringify(obj, null, 2))
}

// producer.js

function Char(string = "") {
    this.string = string
    this.strlen = string.length
    this.index = -1
    this.char = ""
}

Char.prototype.next = function() {
    return (this.string[this.index + 1])
}

Char.prototype.getNext = function() {
    this.index += 1
    this.char = this.string[this.index]
    return this
}


// lexer.js
const constants = {
    OPERATOR: "OPERATOR",
    SPECIAL:  "SPECIAL",
    STRING:   "STRING",
    NUMBER:   "NUMBER",
    SYMBOL:   "SYMBOL",
    SPACE:    "SPACE",
    FUNCTION: "FUNCTION",
    FUNCTIONCALL: "FUNCTIONCALL"
}

const Tokens = {
    '+':  constants.OPERATOR,
    '-':  constants.OPERATOR, 
    '/':  constants.OPERATOR,
    '*':  constants.OPERATOR,
    '=>': constants.SPECIAL,
}

function parse_quotes(ch, delim) {
    let ret = "";
    
    while(ch.next() != delim) {
        ch = ch.getNext();
        
        if(ch.index == ch.strlen) {
            throw Error("INVALID CODE")
        }
        ret += ch.char;
    }
    
    ch.getNext();
    return ret;
}

function parse_number(ch) {
    let num = "";
    
    while(ch.next() && /\d/.test(ch.next())) {
        ch= ch.getNext()
        
        if(ch.index == ch.strlen) {
            throw Error("INVALID CODE")
        }
        
        num += ch.char;
    }
    
    return num;
}

function parse_symbol(ch) {
    let sym = ""
    
    while(ch.next() && /\w/.test(ch.next())) {
        ch = ch.getNext();
        
        if(ch.index == ch.strlen) {
            throw Error("INVALID CODE")
        }
        sym += ch.char;        
    }
    
    return sym;
}

function* Lexer(ch) {
    while(ch.next()) {
        ch = ch.getNext()
        let cr = ch.char;
        
        if(["\n", " ", "\t"].includes(cr)) {
            yield {op: constants.SPACE};
        }
        else if(["+", "-", "*", "/"].includes(cr)) { 
            yield {op: Tokens[cr], ch: cr} 
        }
        else if(cr == "=") {
            if(ch.next() == ">") {
                ch = ch.getNext()
                yield {op: Tokens['=>'], ch: '=>'}
            }
            else yield {op: cr, ch: '='}
        }
        else if(['(', ')','{', '}', ';'].includes(cr)) { 
            yield {op: cr , ch: cr} 
        }
        else if(['\'', '"'].includes(cr)) {
            let string = parse_quotes(ch, cr)
            yield {op: constants.STRING, ch: string}
        }
        else if(/\d/.test(cr)) {
            let num = cr + parse_number(ch)
            yield {op: constants.NUMBER, ch: num}
        }
        else if((/[a-z_]/i).test(cr)) {
            let sym = cr + parse_symbol(ch)
            yield { op: constants.SYMBOL, ch: sym }
        } else {
            throw Error("INVALID CODE")
        }
    }
}


function Iterator(ch) {
    this._ch     = ch;
    this.next   = this._ch.next()
}

Iterator.prototype.getNext = function() {
    // next: () => {
    //     if(!this.tokens[this.index + 1]) {
    //         let token = this._ch.next()
    //         this.tokens.push(token)
    //     }
    
    //     return this.tokens[this.index + 1]
    //     return this.token
    // },
    
    // getNext: function () {
    // if(!this.tokens[this.index + 1]) {
    //     this.next()
    // }
    
    // this.token = this.tokens[++this.index]
    // return this
    let token = this.next;
    this.next = this._ch.next()

    while(this.next.value && this.next.value.op == constants.SPACE) {
        this.next = this._ch.next()
    }

    return token;
}

function Parser(tokens, stops = [";"]) {
    this.tokens = tokens;
    this.stops = stops
}

Parser.prototype.parseExpr = function (prev) {
    if(this.tokens.next.done) throw Error("INVALID EXPRESSION")
    
    if(this.stops.includes(this.tokens.next.value.ch)) {
        return prev
    }
    
    let { value: { op, ch } } = this.tokens.getNext()
    //log(ch)

    if([constants.NUMBER, constants.SYMBOL, constants.STRING].includes(op) && !prev) {
        return this.parseExpr({op, values: ch})
    }
    
    if(op == constants.OPERATOR) {
        let nxt = this.parseExpr();
        return this.parseExpr({ op: op, values: prev ? [nxt].concat(prev) : [nxt] })
    }

    if(op == '(') {
        let nxt = this.parseArgs(',', ')')
        let values = []

        if(this.tokens.next.value && this.tokens.next.value.ch == '=>') {
            this.tokens.getNext();

            if(!this.tokens.next.value) throw Error("INVALID SYNTAX");
            if(this.tokens.next.value.op == '{') {
                this.tokens.getNext()
                let args = this.parseArgs(';', '}')
                return this.parseExpr({op: constants.FUNCTION, values: [nxt, args]})
            }
        } else if(this.tokens.next.value && this.tokens.next.value.op == ';') {
            return this.parseExpr({ op: constants.FUNCTIONCALL, values: [prev, nxt] })
        }
    }

    if(op == '=') {
        if(prev.op != constants.SYMBOL) throw Error("INVALID ASSIGNMENT EXPR");
        let nxt = this.parseExpr();
        return this.parseExpr({ op: op, values: [prev, nxt]})
    }
    
    else {
        throw Error("FAILED PARSING")
    }
}

// parse args
// args := []
// if next token value is undefined, throw error
// while(this.token.next.value)
// op, ch := getNext()
// if op == ')': return
// elif op == ',': getNext()
// elif op == symbol: args.push({op, ch})
// else throw Error invalid code

Parser.prototype.parseArgs = function(sep, end) {
    if(!this.tokens.next.value) throw Error("INVALID EXPRESSION");
    
    let args = [];
    
    if(this.tokens.next.value.op == end) {
        this.tokens.getNext()
        return args;
    }

    let parser = new Parser(this.tokens, [sep, end])
    let op = this.tokens.next.value.op

    while(op != end) {
        let p = parser.parseExpr()

        if (p) {
            args.push(p)
        }

        op = this.tokens.next.value.op
        this.tokens.getNext();
        if(!this.tokens.next.value) throw Error("INVALID CODE")
    }

    return args
}

//let expr = 'x = 2+3*5;'
//let expr = 'y = (x) => { 2 + 3; };'
//let expr = 'print("bla");'
let expr = 'y = f(x);'
let ch = new Char(expr);
let lex = Lexer(ch);

let parser = new Parser(new Iterator(lex));
while(parser.tokens.next.value) {
    let p = parser.parseExpr();
    log(p)
    parser.tokens.getNext()
}