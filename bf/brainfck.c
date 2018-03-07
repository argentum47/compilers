#include<stdio.h>
#include<stdlib.h>
#include<string.h>
#include<ctype.h>

#include<editline/readline.h>

#define TAPE_SIZE 1000

#define INCR '+'
#define DECR '-'
#define MOVL '<'
#define MOVR '>'
#define DUMP '.'
#define GET ','
#define JMPS '['
#define JMPE ']'

void incr(int *v) {
  ++*v;
}

void decr(int *v) {
  --*v;
}

int *movl(int *v, int *firstCell) {
  if(v > firstCell) return v - 1;
  else return v;
}

int *movr(int *v, int *lastCell) {
  if(v < lastCell) return v + 1;
  else return v;
}

int eval(char *input) {
  int PROGRAM_STACK[TAPE_SIZE] = {0}; // this is where the program stores values
  int LOOP_STACK[TAPE_SIZE] = {0}; // stores the difference of the instruction pointer and the first input code
  int sp = 0;                      // stack pointer
  int *curCell = PROGRAM_STACK;   // the pointer to the first cell
  char *ip = input;               // instruction pointer, reads each character from input

  while(*ip) {
    switch(*ip) {
    case INCR:
      incr(curCell);
      break;
    case DECR:
      decr(curCell);
      break;
    case MOVL:
      curCell = movl(curCell, PROGRAM_STACK);
      break;
    case MOVR:
      curCell = movr(curCell, &PROGRAM_STACK[TAPE_SIZE - 1]);
      break;
    case JMPS:
      if(LOOP_STACK[sp] != ip - input) {
        LOOP_STACK[++sp] = ip - input; // for [ at the start of program, 
      }

      ip++;

      if(*curCell != 0) continue;
      else {

        // skip every loop and inner loops;
        int count = 1;
        while(count > 0) {
          if(*ip == JMPS) ++count;
          else if(*ip == JMPE) --count;
          ip++;
        }

        --sp;
      }
      
      ip++;
      continue;
    case JMPE:
      ip = LOOP_STACK[sp] + input;
      continue;
      break;
    case GET:
      *curCell = getchar();
      break;
    case DUMP:
      return *curCell;
    }
    
    ip++;
  }

  return 0;
}

int main() {
  //char *input = "++++++ [ > ++++++++++ < - ] > +++++ .";
  
  char *input;
  printf("Brainfuck REPL\nUse Ctrl+C to exit");

  while(1) {
    printf("\n");
    input = readline("bf**k> ");
    add_history(input);

    int value = eval(input);

    printf("output: %d \n", value);
  }
  return 0;
}
