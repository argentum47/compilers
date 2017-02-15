package scanner

import (
	"postmon/token"
	"unicode/utf8"
)

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

func Init(src []byte) *Scanner {
	return &Scanner{
		src:        src,
		ch:         ' ',
		offset:     0,
		nextOffset: 0,
	}
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

func getTokenType(ch string) token.TokenType {
	// should be replaced with map[string]Token

	switch ch {
	case "fn":
		return token.TokenFn
	default:
		return token.TokenString
	}
}

func (s *Scanner) Scan() (tok token.Token) {
	s.skipSpaces()

	pos := &token.Position{Start: s.offset}
	tok = token.Token{Cargo: string(s.ch), Typ: token.TokenEOF, Pos: pos}

	switch ch := s.ch; {
	case isAlnum(ch):
		literal := s.scanIdentfiers()

		tok.Typ = getTokenType(literal)
		tok.Cargo = literal
		tok.Pos.End = s.nextOffset
	case isOperator(ch):
		tok.Typ = token.TokenOperator
		tok.Pos.End = s.nextOffset
		s.next()
	default:
		s.next()
		tok.Pos.End = s.nextOffset

		switch ch {
		case '|':
			tok.Typ = token.TokenPipe
		case ':':
			tok.Typ = token.TokenColon
		case ';':
			tok.Typ = token.TokenSemiColon
		case ',':
			tok.Typ = token.TokenComma
		case '{':
			tok.Typ = token.TokenLBrace
		case '}':
			tok.Typ = token.TokenRBrace
		case '"':
			tok.Typ = token.TokenQuote
		}
	}

	return tok

}
