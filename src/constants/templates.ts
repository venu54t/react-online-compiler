export const templates: Record<string, string> = {


    python: `color = input("enter color: ")
print("Your favorite color is:", color)`,

    javascript: `const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
readline.question("enter color: ", color => {
  console.log("Your favorite color is:", color);
  readline.close();
  process.exit(0);
});`,

    c: `#include <stdio.h>
int main() {
    char color[100];
    printf("enter color: ");
    scanf("%s", color);
    printf("Your favorite color is: %s", color);
    return 0;
}`,

    cpp: `#include <iostream>
using namespace std;
int main() {
    string color;
    cout << "enter color: ";
    cin >> color;
    cout << "Your favorite color is: " << color;
    return 0;
}`,

    java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("enter color: ");
        String color = sc.nextLine();
        System.out.println("Your favorite color is: " + color);
    }
}`,
    go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    fmt.Print("enter color: ")
    color, _ := reader.ReadString('\\n')
    fmt.Printf("Your favorite color is: %s", color)
}`,
    ruby: `print "enter color: "
STDOUT.flush
color = gets.chomp
puts "Your favorite color is: #{color}"
`,
};