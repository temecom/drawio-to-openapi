// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	/**
	 * The a meta class to describe a class
	 */
	class ClassDefinition {
		name: string;
		id: number; 
		stereotype: string;
		constructor(id:number, name:string,  stereotype:string) {
			this.name = name; 
			this.id = id;
			this.stereotype = stereotype; 
		} 
	}

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "drawio-uml" is now active!');

	// Welcome Message
	let disposable = vscode.commands.registerCommand('drawio-uml.welcome', () => {
		vscode.window.showInformationMessage('Welcome to drawio-uml!');
	});
	context.subscriptions.push(disposable);

	// File conversion
	disposable = vscode.commands.registerCommand('drawio-uml.convert', () => {
		
			// Get the active text editor
			const editor = vscode.window.activeTextEditor;
			var classDefinition:ClassDefinition; 
			if (editor) {
				const document = editor.document;
				
				var lineCount = document.lineCount;
				for (var lineNumber:number=0; lineNumber < lineCount; lineNumber++) {
					var line = document.lineAt(lineNumber);
					//Look for class
					var matches = line.text.match(/<mxCell\s?id="(\d*)"\s?value=".*(class|interface|enum)&amp;gt;&amp;gt;&lt;br&gt;&lt;b&gt;(\w*).*parent="(\d*)"/i);
					if (matches) {
						// Found one
						let id = Number.parseInt(matches[1]);
						let name = matches[2];
						let stereotype = matches[3]; 
						classDefinition = new ClassDefinition(id,name,stereotype); 
					}
				}
				
			}
		vscode.window.showInformationMessage('File Converted Successfully!');
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
