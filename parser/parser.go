package parser

import (
	"postmon/scanner"
	"postmon/token"
)

type Parser struct {
	Scanner *scanner.Scanner
	token   token.Token
}

// for error cases store the position of the text
// and exit

func (p *Parser) next() {
	p.token = p.Scanner.Scan()
}

func (p *Parser) parseArguments() {
	for {
		if p.token.Typ == token.TokenString {
			p.next()

			if p.token.Cargo == ")" {
				return
			}

			if p.token.Cargo != "," {
				panic("Function arguments to be comma separated")
			}
		} else {
			panic("Invalid function signature")
		}

		p.next()
	}
}

func (p *Parser) parseBody() {
	//whatever unless its not a string..kaboom

	for {
		if p.token.Typ == token.TokenString || p.token.Typ == token.TokenSemiColon || p.token.Typ == token.TokenOperator {
			// need to validate other statements, possibly call the .Parse
			// function, which is a recursive call in the end.
			// bla bla
		} else if p.token.Cargo == "}" {
			return
		} else {
			panic("You entered something alien in function body")
		}

		p.next()
	}
}

func (p *Parser) parseFunc() {
	p.next()
	// look for a start paren
	// look for closing paren
	// look for open brace
	// look for statements, statements end in semicolons
	// look for close brace
	if p.token.Typ != token.TokenString {
		panic("Function should have a name")
	}

	p.next()
	if p.token.Cargo != "(" {
		panic("Function should have a ( after name")
	}

	p.next()
	if p.token.Cargo != ")" {
		p.parseArguments()
	}

	if p.token.Cargo != ")" {
		panic("Function should have a )")
	}

	p.next()
	if p.token.Cargo != "{" {
		panic("Function body should start with {")
	}

	p.next()
	if p.token.Cargo != "}" {
		p.parseBody()
	}

	if p.token.Cargo != "}" {
		panic("Function body should end with }")
	}
}

func (p *Parser) parseQuotedString() {
	if p.token.Typ != token.TokenQuote {
		panic("Missing start of quote")
	}

	p.next()
	if p.token.Typ != token.TokenString {
		panic("Missing content")
	}

	p.next()

	if p.token.Typ != token.TokenQuote {
		panic("Missing end quote")
	}

	p.next()
}

func (p *Parser) parseKeyValues() {
	for {
		p.parseQuotedString()

		if p.token.Typ != token.TokenColon {
			panic("Syntax error for map, need :")
		}

		p.next()
		p.parseQuotedString()

		if p.token.Typ == token.TokenRBrace {
			return
		}

		if p.token.Cargo == "," {
			p.next()
			p.parseKeyValues()
			return
		}
	}
}

func (p *Parser) parseMap() {
	p.next()

	if p.token.Typ != token.TokenRBrace {
		p.parseKeyValues()
	}

	if p.token.Typ != token.TokenRBrace {
		panic("Missing closing } for map")
	}
}

func (p *Parser) Parse() bool {
	p.next()
	tok := p.token

	for {
		if tok.Typ == token.TokenEOF {
			return true
		}

		if tok.Typ == token.TokenFn {
			p.parseFunc()
			return true
		}

		if tok.Typ == token.TokenLBrace {
			p.parseMap()
			return true
		}
		return false
	}
}
