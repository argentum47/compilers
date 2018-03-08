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
    OPERATION: "OPERATION",
    SPECIAL:  "SPECIAL",
    STRING:   "STRING",
    NUMBER:   "NUMBER",
    SYMBOL:   "SYMBOL",
    SPACE:    "SPACE",
    FUNCTION: "FUNCTION",
    FUNCTIONCALL: "FUNCTIONCALL",
    ASSIGNMENT: "ASSIGNMENT",
    OPERATOR: "OPERATOR",
    PIPE: "PIPE"
}

const Tokens = {
    '+':  constants.OPERATOR,
    '-':  constants.OPERATOR, 
    '/':  constants.OPERATOR,
    '*':  constants.OPERATOR,
    '=>': constants.SPECIAL,
    '|>': constants.PIPE,
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
            yield {tok: constants.SPACE};
        }
        else if(["+", "-", "*", "/"].includes(cr)) { 
            yield {tok: Tokens[cr], ch: cr} 
        }
        else if(cr == "=") {
            if(ch.next() == ">") {
                ch = ch.getNext()
                yield {tok: Tokens['=>'], ch: '=>'}
            }
            else yield {tok: cr, ch: '='}
        }
        else if(['(', ')','{', '}', ';', ','].includes(cr)) { 
            yield {tok: cr , ch: cr} 
        }
        else if(['\'', '"'].includes(cr)) {
            let string = parse_quotes(ch, cr)
            yield {tok: constants.STRING, ch: string}
        }
        else if(/\d/.test(cr)) {
            let num = cr + parse_number(ch)
            yield {tok: constants.NUMBER, ch: num}
        }
        else if((/[a-z_]/i).test(cr)) {
            let sym = cr + parse_symbol(ch)
            yield { tok: constants.SYMBOL, ch: sym }
        }
        else if(cr == '|' && ch.next() == '>') {
          ch = ch.getNext();
          yield { tok: Tokens['|>'], ch: '|>' }
        }
        else {
            //console.log(cr)
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

    while(this.next.value && this.next.value.tok == constants.SPACE) {
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
    
    let { value: { tok, ch } } = this.tokens.getNext()
    //log(ch)

    if([constants.NUMBER, constants.SYMBOL, constants.STRING].includes(tok) && !prev) {
        return this.parseExpr({tok, values: ch})
    }
    
    if(tok == constants.OPERATOR) {
        let nxt = this.parseExpr();
        return this.parseExpr({ tok: constants.OPERATION, op: ch, values: prev ? [prev].concat(nxt) : [nxt] })
    }

    if(tok == '(') {
        let nxt = this.parseArgs(',', ')')
        let values = []

        if(this.tokens.next.value && this.tokens.next.value.ch == '=>') {
            this.tokens.getNext();

            if(!this.tokens.next.value) throw Error("INVALID SYNTAX");
            if(this.tokens.next.value.tok == '{') {
                this.tokens.getNext()
                let args = this.parseArgs(';', '}')
                if(!this.validateFunctionParams(nxt)) throw Error("FUNCTION PARAMS SYMBOL ONLY")
                return this.parseExpr({tok: constants.FUNCTION, values: [nxt, args]})
            }
        } else if(this.tokens.next.value && this.stops.includes(this.tokens.next.value.tok)) {
            return this.parseExpr({ tok: constants.FUNCTIONCALL, values: [prev, nxt] })
        }
        throw Error("INVALID CODE");
    }

    if(tok == constants.PIPE) {
      if(!this.tokens.next.value) throw Error("INVALID SYNTAX");
      if(this.tokens.next.value.tok != constants.SYMBOL) throw Error("PIPE ONLY TO FUNCTION")

      let params = [prev];
      let fn = this.parseExpr();
      return this.parseExpr({ tok: constants.FUNCTIONCALL, values: [fn, params] })
    }

    if(tok == '=') {
        if(prev.tok != constants.SYMBOL) throw Error("INVALID ASSIGNMENT EXPR");
        let nxt = this.parseExpr();
        return this.parseExpr({ tok: constants.ASSIGNMENT, values: [prev, nxt]})
    }
    
    else {
        throw Error("FAILED PARSING")
    }
}

Parser.prototype.validateFunctionParams = function(args) {
    return args.every(a => a.tok == constants.SYMBOL)
}

Parser.prototype.parseArgs = function(sep, end) {
    if(!this.tokens.next.value) throw Error("INVALID EXPRESSION");
    
    let args = [];
    
    if(this.tokens.next.value.tok == end) {
        this.tokens.getNext()
        return args;
    }

    let parser = new Parser(this.tokens, [sep, end])
    let tok = this.tokens.next.value.tok

    while(tok != end) {
        let p = parser.parseExpr()

        if (p) {
            args.push(p)
        }

        tok = this.tokens.next.value.tok
        this.tokens.getNext();

        if(!this.tokens.next.value) throw Error("INVALID CODE")
    }

    return args
}

function Env(parent) {
  this.parent = parent
  this.values = {}
}

Env.prototype.set = function(name, value) {
  this.values[name] = value
  return this;
}

Env.prototype.get = function(name) {
  if(this.values[name]) return this.values[name]
  else {
    if(!this.parent) return false;
    else this.parent.get(name)
  }
}

function evalExpression(expr, env) {
  switch(expr.tok) {
    case constants.ASSIGNMENT:
        let variable = expr.values[0].values;
        let value = evalExpression(expr.values[1], env)

        env.set(variable, value)
        break;
    case constants.OPERATION:
      let left = evalExpression(expr.values[0], env)
      let right = evalExpression(expr.values[1], env)

      if(left.tok != right.tok) throw Error("TYPE MISMTACH")

      return _operation(left, right, expr.op) 

    case constants.NUMBER:
      return { tok: expr.tok, values: Number(expr.values) }

    case constants.STRING:
      return { tok: expr.tok, values: expr.values }

    case constants.FUNCTION:
      let fnargs = expr.values[0]
      let body = expr.values[1]

      return { tok: "function", func: body, args: fnargs, env: new Env(env)}
      
    case constants.FUNCTIONCALL:
      return _functioncall(expr, env)

    case constants.SYMBOL:
      let env_value = env.get(expr.values)

      if(env_value) {
        return env_value
      } else {
        console.log("what shit", expr.values)
      }

      throw Error("INVALID VARIABLE")
  }
}

function makePairs(srcArr, dstArr) {
    return srcArr.map((el, i) => {
        return [el, dstArr[i]]
    })
}

function _functioncall(expr, env) {
    let fn = evalExpression(expr.values[0], env)
    let args = expr.values[1].map(exp => evalExpression(exp, env))
    
    if(fn.args.length != 0 && fn.args.length != args.length) throw Error("MISMATCH PARAMS LENGTH")

    if(fn.tok == "native") {
      return fn.func.apply(null, args.map(a => {
          return a.values
        }))
    } else if(fn.tok == "function") {
      makePairs(fn.args, args).forEach(([_var, _val]) => {
          env.set(_var.values, _val)
      })

      return fn.func.reduce((acc, f) => {
          return evalExpression(f, env)
      }, "")
    }
}

function _operation(left, right, operator) {
  if(left.tok == constants.NUMBER) {
    switch(operator) {
    case '+':
        return { tok: left.tok, values: left.values + right.values }
    case '-':
      return { tok: left.tok, values: left.values + right.values }
    case '*':
      return { tok: left.tok, values: left.values * right.values }
    case '/':
      return { tok: left.tok, values: left.values / right.values }
    }
  }
}

function importEnv(env) {
  //argslen 0 implies all
  env.set("print", { tok: "native", func: console.log.bind(console), args: [] });
}

//let expr = 'x = 2+3*5; print(x);'
//let expr = 'y = (x) => { 2 + x; }; z = y(3); print(z);'
//let expr = 'print("bla");'
//let expr = 'y = f(x);'
//let expr = 'y = (1, x) => { 2+3; };'
//let expr = 'y = (x) => { z = 5 * x; 2 + z; }; print(y(3));'
let expr = '1 |> print;'
let ch = new Char(expr);
let lex = Lexer(ch);
let env = new Env()
importEnv(env);

let parser = new Parser(new Iterator(lex));
while(parser.tokens.next.value) {
    let p = parser.parseExpr();
    //log(p)
    evalExpression(p, env)
    parser.tokens.getNext()
}
