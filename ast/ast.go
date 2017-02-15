package ast

import "postmon/token"

type Node struct {
	token token.Token
	Left  *Node
	Right *Node
}

type (
	Identifier struct {
		IdentPos *token.Position
		Name     string
	}

	BinaryExpr struct {
		X  *Node
		Op token.Token
		Y  *Node
	}

	MapExpr struct {
		Key   *Node
		Colon token.Token
		Value *Node
	}
)
