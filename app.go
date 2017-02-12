package main

import (
	"fmt"
	"postmon/parser"
	"postmon/scanner"
)

func main() {
	program3 := []byte("fn abc(a, b) {}")
	program4 := []byte(`{"key": "vzl", "key2": "val" }`)

	parser3 := &parser.Parser{Scanner: scanner.Init(program3)}
	parser4 := &parser.Parser{Scanner: scanner.Init(program4)}

	if parser3.Parse() {
		fmt.Println("ok")
	}
	if parser4.Parse() {
		fmt.Println("ok")
	}

}
