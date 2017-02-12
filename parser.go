package main

import (
	"fmt"
	"unicode/utf8"
)

type tokenType int

const (
	tokenError     tokenType = iota
	tokenFn                  // fn
	tokenOperator            // for operator
	tokenColon               // for map
	tokenPipe                // for pipe
	tokenComma               // for comma
	tokenSemiColon           // for semicolon
	tokenString              // quoted string
	tokenEOF                 // eof
)

type Token struct {
	cargo string
	typ   tokenType
}

type Scanner struct {
	src        []byte
	ch         rune
	offset     int
	nextOffset int
	insertSemi bool
}

func isWhiteSpace(ch rune) bool {
	return ch == ' ' || ch == '\t' || ch == '\n'
}

func isAlnum(ch rune) bool {
	// I should remove the underscore. haha, that way u can't have
	// camlecase variable.
	return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_' || ch == '$'
}

func isOperator(ch rune) bool {
	return (ch == '+' || ch == '-' || ch == '*' || ch == '/')
}

func (s *Scanner) next() {
	if s.nextOffset < len(s.src) {
		s.offset = s.nextOffset
		r, w := rune(s.src[s.offset]), 1

		if r >= utf8.RuneSelf {
			r, w = utf8.DecodeRune(s.src[s.offset:])
		}
		// handle no character decoding errors right now.

		s.nextOffset += w
		s.ch = r
	} else {
		s.offset = len(s.src)
		s.ch = -1
	}
}

func (s *Scanner) skipSpaces() {
	for isWhiteSpace(s.ch) {
		s.next()
	}
}

func (s *Scanner) scanIdentfiers() string {
	offs := s.offset

	for isAlnum(s.ch) {
		s.next()
	}

	return string(s.src[offs:s.offset])
}

func getTokenType(ch string) tokenType {
	// should be replaced with map[string]Token

	switch ch {
	case "fn":
		return tokenFn
	default:
		return tokenString
	}
}

func (s *Scanner) Scan() (tok Token) {
	s.skipSpaces()

	token := Token{cargo: string(s.ch), typ: tokenEOF}

	switch ch := s.ch; {
	case isAlnum(ch):
		literal := s.scanIdentfiers()

		token.typ = getTokenType(literal)
		token.cargo = literal
	case isOperator(ch):
		token.typ = tokenOperator
		token.cargo = string(ch)
		s.next()
	default:
		s.next()

		switch ch {
		case '|':
			token.typ = tokenPipe
			token.cargo = string(ch)
		case ':':
			token.typ = tokenColon
			token.cargo = string(ch)
		case ';':
			token.typ = tokenSemiColon
			token.cargo = string(ch)
		case ',':
			token.typ = tokenComma
			token.cargo = string(ch)
		}
	}

	return token

}

type Parser struct {
	scanner *Scanner
	token   Token
}

// for error cases store the position of the text
// and exit

func (p *Parser) next() {
	p.token = p.scanner.Scan()
}

func (p *Parser) parseArguments() {
	for {
		if p.token.typ == tokenString {
			p.next()

			if p.token.cargo == ")" {
				return
			}

			if p.token.cargo != "," {
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
		if p.token.typ == tokenString || p.token.typ == tokenSemiColon || p.token.typ == tokenOperator {
			// need to validate other statements, possibly call the .Parse
			// function, which is a recursive call in the end.
			// bla bla
			fmt.Println(p.token.cargo)
		} else if p.token.cargo == "}" {
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
	if p.token.typ != tokenString {
		panic("Function should have a name")
	}

	p.next()
	if p.token.cargo != "(" {
		panic("Function should have a ( after name")
	}

	p.next()
	fmt.Printf("parse %q\n", p.token.cargo)
	if p.token.cargo != ")" {
		p.parseArguments()
	}

	if p.token.cargo != ")" {
		panic("Function should have a )")
	}

	p.next()
	if p.token.cargo != "{" {
		panic("Function body should start with {")
	}

	p.next()
	if p.token.cargo != "}" {
		p.parseBody()
	}

	if p.token.cargo != "}" {
		panic("Function body should end with }")
	}
}

func (p *Parser) Parse() bool {
	p.next()
	token := p.token

	for {
		if token.typ == tokenEOF {
			return true
		}

		if token.typ == tokenFn {
			p.parseFunc()
			return true
		}
		return false
	}
}

func main() {
	program3 := []byte("fn func3(a, b) { return a + b; }")
	program4 := []byte("fn func1() ")

	scanner3 := &Scanner{src: program3, ch: ' ', offset: 0, nextOffset: 0}
	parser3 := &Parser{scanner: scanner3}

	scanner4 := &Scanner{src: program4, ch: ' ', offset: 0, nextOffset: 0}
	parser4 := &Parser{scanner: scanner4}

	if parser3.Parse() {
		fmt.Println("ok")
	}

	if parser4.Parse() {
		fmt.Println("not ok")
	}

}
