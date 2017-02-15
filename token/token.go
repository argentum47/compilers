package token

type TokenType int

const (
	TokenError     TokenType = iota
	TokenFn                  // fn
	TokenOperator            // for operator
	TokenColon               // for map
	TokenPipe                // for pipe
	TokenComma               // for comma
	TokenSemiColon           // for semicolon
	TokenQuote               // for quotes
	TokenLBrace
	TokenRBrace // for left and right braces
	TokenString // quoted string
	TokenEOF    // eof
)

type Position struct {
	Start int
	End   int
}

type Token struct {
	Cargo string
	Typ   TokenType
	Pos   *Position
}
